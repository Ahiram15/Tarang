import math
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Any, Dict, List
import numpy as np
from shapely.geometry import Polygon, MultiPoint, shape, mapping

from .particle_model import LagrangianParticleModel, Particle
from .coastal_boundary import CoastalBoundaryService
from ..uncertainty.dispersion import DispersionAnalyzer


@dataclass
class ForecastStep:
    hours: int
    valid_time: str
    centroid: Dict[str, float]  # {"lat": ..., "lon": ...}
    polygon: Dict[str, Any]     # GeoJSON Polygon
    uncertainty_radius_km: float
    confidence: float
    particles_count: int


@dataclass
class ForecastResult:
    forecast_steps: List[ForecastStep]
    uncertainty_cone_geojson: Dict[str, Any]
    trajectories: List[List[List[float]]]  # sampled paths
    overall_confidence: float
    is_simulation: bool
    mode_label: str


class ForecastEngine:
    """Performs forward Lagrangian particle prediction (+6h to +72h) with uncertainty bounds."""

    def __init__(self, particle_model: LagrangianParticleModel):
        self.model = particle_model

    def run_forecast(
        self,
        geo_polygon_coords: List[List[float]],
        observation_time: str,
        u_oil_mps: float,
        v_oil_mps: float,
        forecast_hours: List[int] = [6, 12, 24, 48, 72],
        num_particles: int = 500,
        timestep_minutes: int = 30,
        is_simulation: bool = True,
        mode_label: str = "Demo / Simulated Environmental Data",
    ) -> ForecastResult:
        particles = self.model.seed_particles_in_polygon(geo_polygon_coords, num_particles)
        
        try:
            obs_dt = datetime.fromisoformat(observation_time.replace("Z", ""))
        except Exception:
            obs_dt = datetime.utcnow()

        sorted_hours = sorted(forecast_hours)
        max_hour = sorted_hours[-1]
        dt_seconds = timestep_minutes * 60.0
        steps_per_hour = int(60 / timestep_minutes)

        # ── Calibrate advection velocity across forecast horizon ───────────
        # When nearshore, unscaled open-ocean advection can strand all particles
        # within the first few hours, causing +6h, +12h, +24h, +48h, +72h to freeze
        # at the same beached location. By calibrating the effective horizon velocity
        # against the distance to shoreline, the slick progresses smoothly across
        # the entire timeline.
        speed_raw = math.sqrt(u_oil_mps**2 + v_oil_mps**2)
        c_lat = float(np.mean([p[1] for p in geo_polygon_coords]))
        c_lon = float(np.mean([p[0] for p in geo_polygon_coords]))
        eff_u_mps = u_oil_mps
        eff_v_mps = v_oil_mps

        if speed_raw > 0.001:
            u_norm = u_oil_mps / speed_raw
            v_norm = v_oil_mps / speed_raw
            drift_pts = CoastalBoundaryService.clip_drift_vector(
                start_lat=c_lat,
                start_lon=c_lon,
                drift_u=u_norm,
                drift_v=v_norm,
                max_dist_km=100.0,
            )
            end_lon = drift_pts[-1][0]
            end_lat = drift_pts[-1][1]
            dist_to_shore_km = CoastalBoundaryService.haversine_distance(
                c_lat, c_lon, end_lat, end_lon
            )
            max_horizon_s = max_hour * 3600.0
            unconstrained_dist_km = (speed_raw * max_horizon_s) / 1000.0
            if dist_to_shore_km < unconstrained_dist_km and dist_to_shore_km > 0.05:
                horizon_speed_mps = (dist_to_shore_km * 1000.0 * 0.90) / max_horizon_s
                eff_speed_mps = min(speed_raw, max(0.015, horizon_speed_mps))
                eff_u_mps = u_norm * eff_speed_mps
                eff_v_mps = v_norm * eff_speed_mps

        forecast_steps: List[ForecastStep] = []
        all_cone_points: List[List[float]] = []

        # Add initial polygon points to uncertainty cone
        all_cone_points.extend(geo_polygon_coords)

        current_hour = 0
        for target_hour in sorted_hours:
            delta_h = target_hour - current_hour
            steps_to_run = delta_h * steps_per_hour

            for _ in range(steps_to_run):
                self.model.step_particles(particles, eff_u_mps, eff_v_mps, dt_seconds, backward=False)

            current_hour = target_hour

            # Use only non-beached (floating) particles for centroid/dispersion.
            # Beached particles are included in the count but excluded from spatial stats
            # so centroids and polygons never fall on dry land.
            floating = [p for p in particles if not p.beached]
            if not floating:
                # Entire slick has stranded — use the last water positions (shoreline contacts)
                floating = particles

            cur_lons = np.array([p.lon for p in floating])
            cur_lats = np.array([p.lat for p in floating])

            disp = DispersionAnalyzer.calculate_dispersion(cur_lons, cur_lats, base_confidence=0.88)
            step_dt = obs_dt + timedelta(hours=target_hour)

            # Snap centroid to water if beaching pushed it onto land
            snapped_lat, snapped_lon = CoastalBoundaryService.snap_centroid_to_water(
                disp.centroid_lat, disp.centroid_lon
            )

            # Record points for overall cone (floating only to keep cone in water)
            sampled_pts = [[round(float(cur_lons[i]), 6), round(float(cur_lats[i]), 6)] for i in range(0, len(floating), max(1, len(floating) // 25))]
            all_cone_points.extend(sampled_pts)

            # ── Clip per-step forecast polygon to marine-only extent ──
            raw_polygon = disp.convex_hull_geojson or disp.uncertainty_circle_geojson
            try:
                poly_shapely = shape(raw_polygon)
                clipped_poly = CoastalBoundaryService.clip_polygon_marine_only(
                    poly_shapely,
                    ref_lat=snapped_lat,
                    ref_lon=snapped_lon,
                )
                clipped_polygon = mapping(clipped_poly)
            except Exception:
                clipped_polygon = raw_polygon

            forecast_steps.append(
                ForecastStep(
                    hours=target_hour,
                    valid_time=step_dt.strftime("%Y-%m-%d %H:%M UTC"),
                    centroid={"lat": snapped_lat, "lon": snapped_lon},
                    polygon=clipped_polygon,
                    uncertainty_radius_km=disp.uncertainty_radius_km,
                    confidence=disp.confidence_score,
                    particles_count=len(particles),
                )
            )

        # Build overall expanding Uncertainty Cone GeoJSON (clipped to marine waters)
        cone_geojson = {}
        if len(all_cone_points) >= 4:
            try:
                mp = MultiPoint(all_cone_points)
                cone_hull = mp.convex_hull
                # Get reference location from first forecast centroid
                ref_lat = forecast_steps[0].centroid["lat"] if forecast_steps else all_cone_points[0][1]
                ref_lon = forecast_steps[0].centroid["lon"] if forecast_steps else all_cone_points[0][0]
                clipped_cone = CoastalBoundaryService.clip_polygon_marine_only(
                    cone_hull, ref_lat=ref_lat, ref_lon=ref_lon
                )
                cone_geojson = mapping(clipped_cone)
            except Exception:
                cone_geojson = {}

        # Sample trajectories and clip each to the shoreline
        sample_step = max(1, len(particles) // 40)
        raw_trajectories = [p.trajectory for p in particles[::sample_step]]
        sampled_trajectories = [
            CoastalBoundaryService.clip_trajectory(traj) for traj in raw_trajectories
        ]

        avg_conf = round(float(np.mean([s.confidence for s in forecast_steps])), 2) if forecast_steps else 0.70

        return ForecastResult(
            forecast_steps=forecast_steps,
            uncertainty_cone_geojson=cone_geojson,
            trajectories=sampled_trajectories,
            overall_confidence=avg_conf,
            is_simulation=is_simulation,
            mode_label=mode_label,
        )
