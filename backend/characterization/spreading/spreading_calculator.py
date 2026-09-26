from dataclasses import dataclass
from datetime import datetime
from typing import Any, Dict, List, Optional


@dataclass
class TemporalObservation:
    timestamp: str  # ISO string or YYYY-MM-DD HH:MM
    area_km2: float


@dataclass
class SpreadingInterval:
    from_time: str
    to_time: str
    delta_hours: float
    delta_area_km2: float
    spread_rate_km2_per_hour: float


@dataclass
class SpillSpreadingResult:
    status: str  # "calculated" or "insufficient_temporal_data"
    observations_count: int
    observations: List[Dict[str, Any]]
    average_spread_rate_km2_per_hour: Optional[float] = None
    intervals: Optional[List[Dict[str, Any]]] = None
    message: Optional[str] = None


class SpreadingCalculator:
    """Calculates multi-temporal spreading rate (dA/dt) across satellite passes."""

    def calculate(self, observations: List[TemporalObservation]) -> SpillSpreadingResult:
        if not observations or len(observations) < 2:
            return SpillSpreadingResult(
                status="insufficient_temporal_data",
                observations_count=len(observations) if observations else 0,
                observations=[{"timestamp": o.timestamp, "area_km2": o.area_km2} for o in (observations or [])],
                average_spread_rate_km2_per_hour=None,
                intervals=[],
                message="Multiple temporal observations (at least 2 satellite passes) are required to calculate observed spreading rate.",
            )

        # Sort observations by timestamp
        def parse_ts(ts: str) -> datetime:
            for fmt in ("%Y-%m-%dT%H:%M:%SZ", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%d %H:%M:%S", "%Y-%m-%d %H:%M", "%Y-%m-%d"):
                try:
                    return datetime.strptime(ts, fmt)
                except ValueError:
                    continue
            return datetime.utcnow()

        sorted_obs = sorted(observations, key=lambda o: parse_ts(o.timestamp))
        intervals: List[Dict[str, Any]] = []
        total_rate = 0.0

        for i in range(len(sorted_obs) - 1):
            t1 = parse_ts(sorted_obs[i].timestamp)
            t2 = parse_ts(sorted_obs[i + 1].timestamp)
            delta_seconds = (t2 - t1).total_seconds()
            delta_hours = max(0.01, delta_seconds / 3600.0)

            delta_area = sorted_obs[i + 1].area_km2 - sorted_obs[i].area_km2
            rate = round(delta_area / delta_hours, 3)
            total_rate += rate

            intervals.append({
                "from_time": sorted_obs[i].timestamp,
                "to_time": sorted_obs[i + 1].timestamp,
                "delta_hours": round(delta_hours, 2),
                "delta_area_km2": round(delta_area, 3),
                "spread_rate_km2_per_hour": rate,
            })

        avg_rate = round(total_rate / len(intervals), 3)

        return SpillSpreadingResult(
            status="calculated",
            observations_count=len(sorted_obs),
            observations=[{"timestamp": o.timestamp, "area_km2": o.area_km2} for o in sorted_obs],
            average_spread_rate_km2_per_hour=avg_rate,
            intervals=intervals,
            message="Multi-temporal spreading rate successfully computed from satellite observation series.",
        )
