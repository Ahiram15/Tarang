from dataclasses import dataclass
from typing import Dict, Any
from .environmental_provider import EnvironmentalConditions, uv_to_speed_dir


@dataclass
class SpillMovementResult:
    direction_deg: float
    direction: str  # e.g. "NW", "NE"
    speed_mps: float
    speed_kmh: float
    speed_knots: float
    wind_contribution_pct: float
    current_contribution_pct: float
    wind: Dict[str, Any]
    current: Dict[str, Any]
    u_oil_mps: float
    v_oil_mps: float
    wind_drift_factor: float
    is_simulation: bool
    mode_label: str


class DriftVectorCalculator:
    """Calculates net oil slick drift velocity based on physical hydrodynamic coupling."""

    def __init__(self, wind_drift_factor: float = 0.03):
        self.wind_drift_factor = wind_drift_factor

    def calculate_drift(self, env: EnvironmentalConditions) -> SpillMovementResult:
        # Net Oil Velocity Vector: v_oil = v_current + C_wind * v_wind
        u_wind_drift = self.wind_drift_factor * env.wind.u_mps
        v_wind_drift = self.wind_drift_factor * env.wind.v_mps

        u_oil = env.current.u_mps + u_wind_drift
        v_oil = env.current.v_mps + v_wind_drift

        speed_mps, dir_deg, cardinal = uv_to_speed_dir(u_oil, v_oil)
        speed_kmh = round(speed_mps * 3.6, 2)
        speed_knots = round(speed_mps * 1.94384, 2)

        # Contribution ratios
        wind_mag = math_mag(u_wind_drift, v_wind_drift)
        curr_mag = math_mag(env.current.u_mps, env.current.v_mps)
        total_mag = wind_mag + curr_mag

        if total_mag > 0:
            wind_pct = round((wind_mag / total_mag) * 100.0, 1)
            curr_pct = round((curr_mag / total_mag) * 100.0, 1)
        else:
            wind_pct = 50.0
            curr_pct = 50.0

        return SpillMovementResult(
            direction_deg=dir_deg,
            direction=cardinal,
            speed_mps=speed_mps,
            speed_kmh=speed_kmh,
            speed_knots=speed_knots,
            wind_contribution_pct=wind_pct,
            current_contribution_pct=curr_pct,
            wind={
                "u_mps": env.wind.u_mps,
                "v_mps": env.wind.v_mps,
                "speed_mps": env.wind.speed_mps,
                "direction_deg": env.wind.direction_deg,
                "cardinal": env.wind.cardinal,
                "source": env.wind.source,
            },
            current={
                "u_mps": env.current.u_mps,
                "v_mps": env.current.v_mps,
                "speed_mps": env.current.speed_mps,
                "direction_deg": env.current.direction_deg,
                "cardinal": env.current.cardinal,
                "source": env.current.source,
            },
            u_oil_mps=round(u_oil, 4),
            v_oil_mps=round(v_oil, 4),
            wind_drift_factor=self.wind_drift_factor,
            is_simulation=env.is_simulation,
            mode_label=env.mode_label,
        )


def math_mag(x: float, y: float) -> float:
    import math
    return math.sqrt(x * x + y * y)
