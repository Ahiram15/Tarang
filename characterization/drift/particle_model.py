import math
from dataclasses import dataclass, field
from typing import List, Tuple
import numpy as np
from shapely.geometry import Point, Polygon


@dataclass
class Particle:
    id: int
    lon: float
    lat: float
    trajectory: List[List[float]] = field(default_factory=list)  # [[lon, lat], ...]

    def record_step(self):
        self.trajectory.append([round(self.lon, 6), round(self.lat, 6)])


class LagrangianParticleModel:
    """
    Simulates Lagrangian particle advection and turbulent horizontal diffusion
    for marine oil slicks in spherical geographic coordinates.
    """

    def __init__(
        self,
        wind_drift_factor: float = 0.03,
        horizontal_diffusion_coeff: float = 2.5,  # m^2/s
    ):
        self.wind_drift_factor = wind_drift_factor
        self.K_h = horizontal_diffusion_coeff

    def seed_particles_in_polygon(
        self,
        geo_polygon_coords: List[List[float]],
        num_particles: int = 500,
        seed: int = 42,
    ) -> List[Particle]:
        """Uniformly seeds virtual particles inside the spill boundary polygon."""
        np.random.seed(seed)
        poly = Polygon(geo_polygon_coords)
        if not poly.is_valid:
            poly = poly.buffer(0)

        min_lon, min_lat, max_lon, max_lat = poly.bounds
        particles: List[Particle] = []
        p_id = 0
        max_attempts = num_particles * 20
        attempts = 0

        while len(particles) < num_particles and attempts < max_attempts:
            attempts += 1
            rand_lon = np.random.uniform(min_lon, max_lon)
            rand_lat = np.random.uniform(min_lat, max_lat)
            point = Point(rand_lon, rand_lat)

            if poly.contains(point) or poly.touches(point):
                p = Particle(id=p_id, lon=rand_lon, lat=rand_lat)
                p.record_step()
                particles.append(p)
                p_id += 1

        # Fallback if complex concave polygon: seed around centroid
        if len(particles) < num_particles:
            c_lon, c_lat = poly.centroid.x, poly.centroid.y
            while len(particles) < num_particles:
                jitter_lon = c_lon + np.random.normal(0, 0.002)
                jitter_lat = c_lat + np.random.normal(0, 0.002)
                p = Particle(id=p_id, lon=jitter_lon, lat=jitter_lat)
                p.record_step()
                particles.append(p)
                p_id += 1

        return particles

    def step_particles(
        self,
        particles: List[Particle],
        u_mps: float,
        v_mps: float,
        dt_seconds: float,
        backward: bool = False,
    ):
        """Advances or back-tracks all particles by dt_seconds using advection and diffusion."""
        sign = -1.0 if backward else 1.0

        # Advective displacement in meters
        dx_adv = sign * u_mps * dt_seconds
        dy_adv = sign * v_mps * dt_seconds

        # Turbulent diffusion displacement (Brownian random walk)
        diff_sigma = math.sqrt(max(0.0, 2.0 * self.K_h * abs(dt_seconds)))

        for p in particles:
            zx = np.random.normal(0, 1)
            zy = np.random.normal(0, 1)

            dx = dx_adv + diff_sigma * zx
            dy = dy_adv + diff_sigma * zy

            # Convert displacement meters to geographic delta degrees
            lat_rad = math.radians(p.lat)
            m_per_deg_lat = 111320.0
            m_per_deg_lon = max(1000.0, 111320.0 * math.cos(lat_rad))

            dlat = dy / m_per_deg_lat
            dlon = dx / m_per_deg_lon

            p.lat += dlat
            p.lon += dlon
            p.record_step()
