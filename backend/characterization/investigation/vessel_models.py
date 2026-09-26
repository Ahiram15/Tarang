from dataclasses import dataclass, field
from enum import Enum
from typing import Dict, List, Optional, Any


class InvestigationCategory(str, Enum):
    CATEGORY_A_AIS = "Category A: AIS-Visible Vessel"
    CATEGORY_B_SAR_CORRELATED = "Category B: SAR-Detected AIS-Correlated Vessel"
    CATEGORY_C_SAR_UNMATCHED = "Category C: AIS-Unmatched SAR Detection"


@dataclass
class VesselWaypoint:
    lat: float
    lon: float
    timestamp: str
    speed_knots: float
    course_deg: float


@dataclass
class AISGap:
    start_time: str
    end_time: str
    duration_hours: float
    last_known_pos: Dict[str, float]  # {"lat": ..., "lon": ...}
    first_known_pos: Dict[str, float] # {"lat": ..., "lon": ...}
    distance_during_gap_km: float
    overlaps_release_window: bool
    notes: str


@dataclass
class SARVesselDetection:
    detection_id: str
    timestamp: str
    lat: float
    lon: float
    estimated_length_m: float
    estimated_width_m: float
    confidence: float
    is_ais_matched: bool
    matched_mmsi: Optional[str] = None
    sensor: str = "Sentinel-1 SAR C-Band"
    notes: str = ""


@dataclass
class CandidateVessel:
    vessel_id: str
    name: str
    mmsi: Optional[str]
    imo: Optional[str]
    callsign: Optional[str]
    flag: str
    vessel_type: str
    category: str
    length_m: float
    beam_m: float
    trajectory: List[VesselWaypoint] = field(default_factory=list)
    ais_gaps: List[AISGap] = field(default_factory=list)
    sar_detections: List[SARVesselDetection] = field(default_factory=list)
    
    # Analysis & Ranking Metrics
    min_distance_to_origin_km: float = 999.0
    entered_origin_zone: bool = False
    origin_zone_tier: str = "none"  # "high", "medium", "low", "none"
    time_overlap_hours: float = 0.0
    trajectory_intersects_origin: bool = False
    drift_alignment_cosine: float = 0.0
    
    # Multi-Factor Score Breakdown (0 - 100)
    score_spatial: float = 0.0
    score_temporal: float = 0.0
    score_trajectory: float = 0.0
    score_drift: float = 0.0
    score_ais_gap: float = 0.0
    score_vessel_type: float = 0.0
    total_score: float = 0.0
    investigation_rank: int = 0
    
    explainability_reasons: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "vessel_id": self.vessel_id,
            "name": self.name,
            "mmsi": self.mmsi,
            "imo": self.imo,
            "callsign": self.callsign,
            "flag": self.flag,
            "vessel_type": self.vessel_type,
            "category": self.category,
            "length_m": self.length_m,
            "beam_m": self.beam_m,
            "trajectory": [
                {
                    "lat": wp.lat,
                    "lon": wp.lon,
                    "timestamp": wp.timestamp,
                    "speed_knots": wp.speed_knots,
                    "course_deg": wp.course_deg,
                }
                for wp in self.trajectory
            ],
            "ais_gaps": [
                {
                    "start_time": g.start_time,
                    "end_time": g.end_time,
                    "duration_hours": g.duration_hours,
                    "last_known_pos": g.last_known_pos,
                    "first_known_pos": g.first_known_pos,
                    "distance_during_gap_km": g.distance_during_gap_km,
                    "overlaps_release_window": g.overlaps_release_window,
                    "notes": g.notes,
                }
                for g in self.ais_gaps
            ],
            "sar_detections": [
                {
                    "detection_id": s.detection_id,
                    "timestamp": s.timestamp,
                    "lat": s.lat,
                    "lon": s.lon,
                    "estimated_length_m": s.estimated_length_m,
                    "estimated_width_m": s.estimated_width_m,
                    "confidence": s.confidence,
                    "is_ais_matched": s.is_ais_matched,
                    "matched_mmsi": s.matched_mmsi,
                    "sensor": s.sensor,
                    "notes": s.notes,
                }
                for s in self.sar_detections
            ],
            "min_distance_to_origin_km": round(self.min_distance_to_origin_km, 2),
            "entered_origin_zone": self.entered_origin_zone,
            "origin_zone_tier": self.origin_zone_tier,
            "time_overlap_hours": round(self.time_overlap_hours, 2),
            "trajectory_intersects_origin": self.trajectory_intersects_origin,
            "drift_alignment_cosine": round(self.drift_alignment_cosine, 3),
            "score_breakdown": {
                "spatial": round(self.score_spatial, 1),
                "temporal": round(self.score_temporal, 1),
                "trajectory": round(self.score_trajectory, 1),
                "drift": round(self.score_drift, 1),
                "ais_gap": round(self.score_ais_gap, 1),
                "vessel_type": round(self.score_vessel_type, 1),
            },
            "total_score": round(self.total_score, 1),
            "investigation_rank": self.investigation_rank,
            "explainability_reasons": self.explainability_reasons,
        }
