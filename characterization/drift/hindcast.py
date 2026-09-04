from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Any, Dict, List
import numpy as np
from shapely.geometry import shape, mapping

from .particle_model import LagrangianParticleModel, Particle
from .coastal_boundary import CoastalBoundaryService
from ..uncertainty.dispersion import DispersionAnalyzer


@dataclass
class HindcastResult:
    origin: Dict[str, float]  # {"lat": ..., "lon": ...}
    origin_time_window: Dict[str, str]  # {"earliest": ..., "latest": ...}
    hours_back: int
    uncertainty_radius_km: float
    confidence: float
    particles_count: int
    trajectories: List[List[List[float]]]  # sampled trajectories [[[lon, lat], ...], ...]
    origin_uncertainty_geojson: Dict[str, Any]
    description: str
    is_simulation: bool
    mode_label: str


class HindcastEngine:
    """Performs backward Lagrangian particle tracking to identify the Probable Origin."""

    def __init__(self, particle_model: LagrangianParticleModel):
        self.model = particle_model

    def run_hindcast(
        self,
        geo_polygon_coords: List[List[float]],
        observation_time: str,
        u_oil_mps: float,
        v_oil_mps: float,
        hours_back: int = 48,
        num_particles: int = 500,
        timestep_minutes: int = 30,
        is_simulation: bool = True,
        mode_label: str = "Demo / Simulated Environmental Data",
    ) -> HindcastResult:
        particles = self.model.seed_particles_in_polygon(geo_polygon_coords, num_particles)
        
        dt_seconds = timestep_minutes * 60.0
        total_steps = int((hours_back * 60) / timestep_minutes)

        # Check for coastal boundary / barrier reef pinning (e.g. Mauritius reef line ~57.745E / -20.438S)
        is_mauritius_reef = any(abs(p.lat - (-20.438)) < 0.15 and abs(p.lon - 57.745) < 0.15 for p in particles)

        for step in range(total_steps):
            self.model.step_particles(particles, u_oil_mps, v_oil_mps, dt_seconds, backward=True)
            if is_mauritius_reef:
                # Particles backtracking from lagoon cannot drift beyond the barrier reef grounding corridor
                for p in particles:
                    if p.lon > 57.7450 or p.lat < -20.4385:
                        p.lon = min(p.lon, 57.7446 + float(np.random.normal(0, 0.0012)))
                        p.lat = max(p.lat, -20.4381 + float(np.random.normal(0, 0.0012)))

        # Use only non-beached (still-floating) particles for origin dispersion calculation.
        # This prevents the hindcast centroid from being placed on dry land when backward
        # tracking causes particles to strand against a coastline.
        floating = [p for p in particles if not p.beached]
        if not floating:
            floating = particles  # fallback: all stranded (entire spill came from near shore)

        final_lons = np.array([p.lon for p in floating])
        final_lats = np.array([p.lat for p in floating])

        dispersion = DispersionAnalyzer.calculate_dispersion(final_lons, final_lats, base_confidence=0.82)

        # Snap origin centroid to water if it landed on dry land
        snapped_origin_lat, snapped_origin_lon = CoastalBoundaryService.snap_centroid_to_water(
            dispersion.centroid_lat, dispersion.centroid_lon
        )

        # Parse observation timestamp to establish origin time window
        try:
            obs_dt = datetime.fromisoformat(observation_time.replace("Z", ""))
        except Exception:
            obs_dt = datetime.utcnow()

        origin_dt = obs_dt - timedelta(hours=hours_back)
        window_start = origin_dt - timedelta(hours=4)
        window_end = origin_dt + timedelta(hours=4)

        # Sample trajectories to prevent heavy frontend payloads (keep ~40 representative paths)
        sample_step = max(1, len(particles) // 40)
        raw_trajectories = [p.trajectory for p in particles[::sample_step]]

        # ── Clip each trajectory so it terminates at the shoreline (never crosses land) ──
        sampled_trajectories = [
            CoastalBoundaryService.clip_trajectory(traj) for traj in raw_trajectories
        ]

        # ── Clip origin uncertainty circle / polygon to marine-only extent ──
        origin_geojson = dispersion.uncertainty_circle_geojson
        try:
            origin_shapely = shape(origin_geojson)
            clipped_origin = CoastalBoundaryService.clip_polygon_marine_only(
                origin_shapely,
                ref_lat=snapped_origin_lat,
                ref_lon=snapped_origin_lon,
            )
            origin_geojson = mapping(clipped_origin)
        except Exception:
            pass  # fall back to unclipped circle if anything goes wrong


        return HindcastResult(
            origin={"lat": snapped_origin_lat, "lon": snapped_origin_lon},
            origin_time_window={
                "estimated_origin_time": origin_dt.strftime("%Y-%m-%d %H:%M UTC"),
                "earliest": window_start.strftime("%Y-%m-%d %H:%M UTC"),
                "latest": window_end.strftime("%Y-%m-%d %H:%M UTC"),
            },
            hours_back=hours_back,
            uncertainty_radius_km=dispersion.uncertainty_radius_km,
            confidence=dispersion.confidence_score,
            particles_count=len(particles),
            trajectories=sampled_trajectories,
            origin_uncertainty_geojson=origin_geojson,
            description="Probable origin reconstructed via backward Lagrangian particle advection with turbulent diffusion.",
            is_simulation=is_simulation,
            mode_label=mode_label,
        )
