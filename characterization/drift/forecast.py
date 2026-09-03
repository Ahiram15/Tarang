from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Any, Dict, List
import numpy as np
from shapely.geometry import Polygon, MultiPoint, mapping

from .particle_model import LagrangianParticleModel, Particle
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

        forecast_steps: List[ForecastStep] = []
        all_cone_points: List[List[float]] = []

        # Add initial polygon points to uncertainty cone
        all_cone_points.extend(geo_polygon_coords)

        current_hour = 0
        for target_hour in sorted_hours:
            delta_h = target_hour - current_hour
            steps_to_run = delta_h * steps_per_hour

            for _ in range(steps_to_run):
                self.model.step_particles(particles, u_oil_mps, v_oil_mps, dt_seconds, backward=False)

            current_hour = target_hour

            cur_lons = np.array([p.lon for p in particles])
            cur_lats = np.array([p.lat for p in particles])

            disp = DispersionAnalyzer.calculate_dispersion(cur_lons, cur_lats, base_confidence=0.88)
            step_dt = obs_dt + timedelta(hours=target_hour)

            # Record points for overall cone
            sampled_pts = [[round(float(cur_lons[i]), 6), round(float(cur_lats[i]), 6)] for i in range(0, len(particles), max(1, len(particles) // 25))]
            all_cone_points.extend(sampled_pts)

            forecast_steps.append(
                ForecastStep(
                    hours=target_hour,
                    valid_time=step_dt.strftime("%Y-%m-%d %H:%M UTC"),
                    centroid={"lat": disp.centroid_lat, "lon": disp.centroid_lon},
                    polygon=disp.convex_hull_geojson or disp.uncertainty_circle_geojson,
                    uncertainty_radius_km=disp.uncertainty_radius_km,
                    confidence=disp.confidence_score,
                    particles_count=len(particles),
                )
            )

        # Build overall expanding Uncertainty Cone GeoJSON
        cone_geojson = {}
        if len(all_cone_points) >= 4:
            try:
                mp = MultiPoint(all_cone_points)
                cone_hull = mp.convex_hull
                cone_geojson = mapping(cone_hull)
            except Exception:
                cone_geojson = {}

        # Sample trajectories
        sample_step = max(1, len(particles) // 40)
        sampled_trajectories = [p.trajectory for p in particles[::sample_step]]

        avg_conf = round(float(np.mean([s.confidence for s in forecast_steps])), 2) if forecast_steps else 0.70

        return ForecastResult(
            forecast_steps=forecast_steps,
            uncertainty_cone_geojson=cone_geojson,
            trajectories=sampled_trajectories,
            overall_confidence=avg_conf,
            is_simulation=is_simulation,
            mode_label=mode_label,
        )
