import os
from dataclasses import dataclass, field
from typing import List


@dataclass
class CharacterizationConfig:
    # Physical drift coefficients
    wind_drift_factor: float = field(
        default_factory=lambda: float(os.getenv("WIND_DRIFT_FACTOR", "0.03"))
    )  # Standard 3.0% wind leeway
    wind_deflection_angle_deg: float = field(
        default_factory=lambda: float(os.getenv("WIND_DEFLECTION_ANGLE_DEG", "0.0"))
    )  # Coriolis angle
    horizontal_diffusion_coeff: float = field(
        default_factory=lambda: float(os.getenv("HORIZONTAL_DIFFUSION_COEFF", "2.5"))
    )  # m^2/s

    # Particle simulation parameters
    default_particle_count: int = field(
        default_factory=lambda: int(os.getenv("DEFAULT_PARTICLE_COUNT", "500"))
    )
    default_timestep_minutes: int = field(
        default_factory=lambda: int(os.getenv("DEFAULT_TIMESTEP_MINUTES", "30"))
    )
    forecast_hours: List[int] = field(
        default_factory=lambda: [6, 12, 24, 48, 72]
    )
    hindcast_hours: int = field(
        default_factory=lambda: int(os.getenv("HINDCAST_HOURS", "48"))
    )

    # Pixel spatial resolution in meters (approx. 20m for standard downsampled SAR window)
    pixel_resolution_meters: float = field(
        default_factory=lambda: float(os.getenv("PIXEL_RESOLUTION_METERS", "20.0"))
    )

    # Provider Mode
    use_live_environmental_data: bool = field(
        default_factory=lambda: os.getenv("USE_LIVE_ENV_DATA", "false").lower() == "true"
    )
