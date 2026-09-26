import math
from dataclasses import dataclass
from typing import Dict, Any


@dataclass
class VectorField:
    u_mps: float
    v_mps: float
    speed_mps: float
    direction_deg: float
    cardinal: str
    source: str


@dataclass
class EnvironmentalConditions:
    wind: VectorField
    current: VectorField
    is_simulation: bool
    mode_label: str
    timestamp: str


def uv_to_speed_dir(u: float, v: float) -> tuple[float, float, str]:
    """Converts U/V Cartesian velocity components to speed (m/s) and meteorological direction (deg)."""
    speed = math.sqrt(u * u + v * v)
    # Direction in meteorological degrees (where it's going)
    deg = (math.degrees(math.atan2(u, v)) + 360.0) % 360.0

    cardinals = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"]
    idx = int((deg + 11.25) / 22.5) % 16
    return round(speed, 2), round(deg, 1), cardinals[idx]


class EnvironmentalProvider:
    """Base provider interface for environmental forcing fields (wind and ocean currents)."""

    def get_conditions(self, lat: float, lon: float, timestamp: str) -> EnvironmentalConditions:
        raise NotImplementedError


class DemoEnvironmentalProvider(EnvironmentalProvider):
    """
    High-fidelity deterministic simulation environmental provider for Mauritius / Indian Ocean
    and Arabian Sea maritime corridors.
    """

    def get_conditions(self, lat: float, lon: float, timestamp: str) -> EnvironmentalConditions:
        # Realistic seasonal trade winds and South Equatorial ocean currents
        # For Mauritius region (lat ~ -20.44, lon ~ 57.75): Southeasterly trade winds blowing towards NW
        if lat < 0:  # Southern Hemisphere / Mauritius
            wind_u = -5.8  # Westward (m/s)
            wind_v = 4.6   # Northward (m/s)
            curr_u = -0.24 # South Equatorial Current westward drift (m/s)
            curr_v = 0.12  # Northward drift (m/s)
        else:  # Northern Hemisphere / Arabian Sea
            wind_u = 4.2
            wind_v = 3.5
            curr_u = 0.18
            curr_v = 0.10

        w_speed, w_dir, w_card = uv_to_speed_dir(wind_u, wind_v)
        c_speed, c_dir, c_card = uv_to_speed_dir(curr_u, curr_v)

        return EnvironmentalConditions(
            wind=VectorField(
                u_mps=wind_u,
                v_mps=wind_v,
                speed_mps=w_speed,
                direction_deg=w_dir,
                cardinal=w_card,
                source="Simulated Trade-Wind Environmental Field",
            ),
            current=VectorField(
                u_mps=curr_u,
                v_mps=curr_v,
                speed_mps=c_speed,
                direction_deg=c_dir,
                cardinal=c_card,
                source="Simulated South Equatorial Marine Current",
            ),
            is_simulation=True,
            mode_label="Demo / Simulated Environmental Data",
            timestamp=timestamp,
        )
