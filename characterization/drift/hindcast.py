from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Any, Dict, List
import numpy as np

from .particle_model import LagrangianParticleModel, Particle
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

        for step in range(total_steps):
            self.model.step_particles(particles, u_oil_mps, v_oil_mps, dt_seconds, backward=True)

        final_lons = np.array([p.lon for p in particles])
        final_lats = np.array([p.lat for p in particles])

        dispersion = DispersionAnalyzer.calculate_dispersion(final_lons, final_lats, base_confidence=0.82)

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
        sampled_trajectories = [p.trajectory for p in particles[::sample_step]]

        return HindcastResult(
            origin={"lat": dispersion.centroid_lat, "lon": dispersion.centroid_lon},
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
            origin_uncertainty_geojson=dispersion.uncertainty_circle_geojson,
            description="Probable origin reconstructed via backward Lagrangian particle advection with turbulent diffusion.",
            is_simulation=is_simulation,
            mode_label=mode_label,
        )
