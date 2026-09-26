from dataclasses import dataclass, field
from enum import Enum
from typing import Dict, List, Optional, Any


class SourceType(str, Enum):
    VESSEL = "vessel"
    PORT = "port"
    PIPELINE = "pipeline"
    PLATFORM = "platform"
    INDUSTRIAL = "industrial"
    NATURAL_SEEP = "natural_seep"


class SourceCategoryGroup(str, Enum):
    VESSEL_RELATED = "Vessel-related"
    LAND_INFRASTRUCTURE = "Land / Infrastructure"
    NATURAL_SEEP = "Natural Seep"


@dataclass
class CounterfactualDriftMatch:
    """
    Results of forward Lagrangian drift simulation assuming hypothetical release from candidate.
    Simulated slick polygon is compared against the satellite-observed Sentinel-1/2 slick.
    """
    iou: float  # Intersection over Union (0.0 to 1.0)
    centroid_error_km: float  # Distance between simulated slick centroid and observed slick centroid
    arrival_error_hours: float  # Difference between simulated arrival time and observation time
    area_difference_pct: float  # Percentage difference in slick area
    shape_similarity_pct: float  # Trajectory / shape contour similarity (0 to 100)
    consistency_score: float  # Normalized physical consistency score (0 to 100)
    simulated_slick_polygon: Optional[Dict[str, Any]] = None  # GeoJSON Polygon / MultiPolygon
    notes: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return {
            "iou": round(self.iou, 2),
            "centroid_error_km": round(self.centroid_error_km, 2),
            "arrival_error_hours": round(self.arrival_error_hours, 1),
            "area_difference_pct": round(self.area_difference_pct, 1),
            "shape_similarity_pct": round(self.shape_similarity_pct, 1),
            "consistency_score": round(self.consistency_score, 1),
            "simulated_slick_polygon": self.simulated_slick_polygon,
            "notes": self.notes,
        }


@dataclass
class PlausibleSourceCandidate:
    """
    Unified candidate source representation for all marine & coastal source hypotheses.
    """
    source_id: str
    name: str
    source_type: str  # 'vessel' | 'port' | 'pipeline' | 'platform' | 'industrial' | 'natural_seep'
    category_group: str  # 'Vessel-related' | 'Land / Infrastructure' | 'Natural Seep'
    lat: float
    lon: float
    geometry: Optional[Dict[str, Any]] = None  # GeoJSON Point, LineString (pipeline), or Polygon (seep field/terminal)
    buffer_radius_km: float = 2.0

    # Distance & Spatial Relationship to Probable Origin
    distance_to_origin_km: float = 999.0
    distance_score: float = 0.0  # 0 to 100 based on configurable distance decay
    origin_overlap: bool = False
    origin_overlap_score: float = 0.0  # 0 to 100 based on overlap with origin uncertainty zones
    
    # Hydrodynamic & Transport Compatibility
    transport_compatibility_score: float = 0.0  # 0 to 100 (up-current / upwind alignment with drift)
    is_upwind_upcurrent: bool = False
    drift_relative_angle_deg: float = 0.0

    # Historical / Persistence Evidence
    historical_persistence_score: float = 0.0  # 0 to 100
    recurrence_observations_count: int = 0
    historical_spill_records: List[str] = field(default_factory=list)

    # Vessel-Specific Factors (if source_type == 'vessel')
    time_compatibility_score: float = 0.0
    trajectory_compatibility_score: float = 0.0
    counterfactual_drift_score: float = 0.0
    behavioural_consistency_score: float = 0.0
    counterfactual_simulation: Optional[CounterfactualDriftMatch] = None
    vessel_metadata: Optional[Dict[str, Any]] = None  # MMSI, IMO, Flag, Type, Speed, Course, Gaps

    # Explainable Component Scores & Final Synthesis
    component_scores: Dict[str, float] = field(default_factory=dict)
    raw_evidence_score: float = 0.0  # 0 to 100
    relative_evidence_pct: float = 0.0  # Relative percentage across all evaluated sources
    rank: int = 1
    explainability_reasons: List[str] = field(default_factory=list)

    # Scientific Safeguard Labeling
    scientific_status: str = "Hypothesis"  # 'Observed' | 'Modelled' | 'Hypothesis' | 'Uncertainty'
    source_specific_details: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "source_id": self.source_id,
            "name": self.name,
            "source_type": self.source_type,
            "category_group": self.category_group,
            "lat": self.lat,
            "lon": self.lon,
            "geometry": self.geometry,
            "buffer_radius_km": self.buffer_radius_km,
            "distance_to_origin_km": round(self.distance_to_origin_km, 2),
            "distance_score": round(self.distance_score, 1),
            "origin_overlap": self.origin_overlap,
            "origin_overlap_score": round(self.origin_overlap_score, 1),
            "transport_compatibility_score": round(self.transport_compatibility_score, 1),
            "is_upwind_upcurrent": self.is_upwind_upcurrent,
            "drift_relative_angle_deg": round(self.drift_relative_angle_deg, 1),
            "historical_persistence_score": round(self.historical_persistence_score, 1),
            "recurrence_observations_count": self.recurrence_observations_count,
            "historical_spill_records": self.historical_spill_records,
            "time_compatibility_score": round(self.time_compatibility_score, 1),
            "trajectory_compatibility_score": round(self.trajectory_compatibility_score, 1),
            "counterfactual_drift_score": round(self.counterfactual_drift_score, 1),
            "behavioural_consistency_score": round(self.behavioural_consistency_score, 1),
            "counterfactual_simulation": self.counterfactual_simulation.to_dict() if self.counterfactual_simulation else None,
            "vessel_metadata": self.vessel_metadata,
            "component_scores": {k: round(v, 1) for k, v in self.component_scores.items()},
            "raw_evidence_score": round(self.raw_evidence_score, 1),
            "relative_evidence_pct": round(self.relative_evidence_pct, 1),
            "rank": self.rank,
            "explainability_reasons": self.explainability_reasons,
            "scientific_status": self.scientific_status,
            "source_specific_details": self.source_specific_details,
        }


@dataclass
class EvidenceWeightConfig:
    """
    Transparent, user-configurable weighting parameters for multi-source evidence calculation.
    """
    # Vessel Hypothesis Weights (must sum to 1.0 or normalized)
    vessel_w_spatial: float = 0.25
    vessel_w_temporal: float = 0.20
    vessel_w_trajectory: float = 0.20
    vessel_w_counterfactual: float = 0.20
    vessel_w_behavioural: float = 0.15

    # Non-Vessel Infrastructure & Seep Weights (must sum to 1.0 or normalized)
    infrastructure_w_spatial: float = 0.35
    infrastructure_w_origin_overlap: float = 0.25
    infrastructure_w_transport: float = 0.25
    infrastructure_w_persistence: float = 0.15

    seep_w_spatial: float = 0.35
    seep_w_origin_overlap: float = 0.25
    seep_w_transport: float = 0.20
    seep_w_persistence: float = 0.20

    # Distance Thresholds (km)
    dist_very_strong_km: float = 5.0
    dist_strong_km: float = 10.0
    dist_moderate_km: float = 25.0
    dist_weak_km: float = 50.0

    def to_dict(self) -> Dict[str, Any]:
        return {
            "vessel_weights": {
                "w1_spatial": self.vessel_w_spatial,
                "w2_temporal": self.vessel_w_temporal,
                "w3_trajectory": self.vessel_w_trajectory,
                "w4_counterfactual": self.vessel_w_counterfactual,
                "w5_behavioural": self.vessel_w_behavioural,
            },
            "infrastructure_weights": {
                "w1_spatial": self.infrastructure_w_spatial,
                "w2_origin_overlap": self.infrastructure_w_origin_overlap,
                "w3_transport": self.infrastructure_w_transport,
                "w4_persistence": self.infrastructure_w_persistence,
            },
            "seep_weights": {
                "w1_spatial": self.seep_w_spatial,
                "w2_origin_overlap": self.seep_w_origin_overlap,
                "w3_transport": self.seep_w_transport,
                "w4_persistence": self.seep_w_persistence,
            },
            "distance_thresholds_km": {
                "very_strong": self.dist_very_strong_km,
                "strong": self.dist_strong_km,
                "moderate": self.dist_moderate_km,
                "weak": self.dist_weak_km,
            },
        }


@dataclass
class MultiSourceEvidenceComparison:
    """
    Consolidated comparative evidence ranking across all source hypotheses around probable origin.
    """
    candidates: List[PlausibleSourceCandidate]
    total_sources_evaluated: int
    category_summary: Dict[str, float]  # {'Vessel-related': 78.0, 'Land / Infrastructure': 51.0, 'Natural Seep': 39.0}
    top_candidate: Dict[str, Any]
    scientific_interpretation: str
    uncertainty_level: str  # "HIGH", "MODERATE", "LOW"
    competing_hypotheses_flag: bool
    weights_config: EvidenceWeightConfig
    summary_markdown: str

    def to_dict(self) -> Dict[str, Any]:
        return {
            "candidates": [c.to_dict() for c in self.candidates],
            "total_sources_evaluated": self.total_sources_evaluated,
            "category_summary": {k: round(v, 1) for k, v in self.category_summary.items()},
            "top_candidate": self.top_candidate,
            "scientific_interpretation": self.scientific_interpretation,
            "uncertainty_level": self.uncertainty_level,
            "competing_hypotheses_flag": self.competing_hypotheses_flag,
            "weights_config": self.weights_config.to_dict(),
            "summary": self.summary_markdown,
        }
