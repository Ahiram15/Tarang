import math
from typing import List, Dict, Any, Optional
from shapely.geometry import Point, Polygon, LineString, shape

from .origin_zones import ProbableOriginZones
from .sources_models import (
    SourceType,
    SourceCategoryGroup,
    PlausibleSourceCandidate,
    EvidenceWeightConfig,
    MultiSourceEvidenceComparison,
)


class MultiSourceRankingEngine:
    """
    Computes explainable, transparent relative evidence scores for all plausible source hypotheses:
    - Candidate AIS / Dark Vessels
    - Ports and Terminals
    - Pipelines
    - Offshore Platforms
    - Coastal Industrial Facilities
    - Natural Seeps

    Formula for Vessels:
      Vessel Score = w1 × Spatial Proximity + w2 × Time Compatibility + w3 × Trajectory Compatibility + w4 × Counterfactual Drift Match + w5 × Behavioural Consistency

    Formula for Non-Vessel Infrastructure:
      Infrastructure Score = w1 × Spatial Proximity + w2 × Origin-Region Overlap + w3 × Transport Compatibility + w4 × Historical / Persistence Evidence

    Formula for Natural Seeps:
      Seep Score = w1 × Spatial Proximity + w2 × Origin-Region Overlap + w3 × Transport Compatibility + w4 × Historical / Persistence Evidence

    All component scores are strictly normalized to 0–100 before weighting.
    """

    def rank_sources(
        self,
        candidates: List[PlausibleSourceCandidate],
        origin_zones: ProbableOriginZones,
        weights_config: Optional[EvidenceWeightConfig] = None,
        drift_direction_deg: float = 45.0,
    ) -> MultiSourceEvidenceComparison:
        cfg = weights_config or EvidenceWeightConfig()
        c_lat = origin_zones.centroid["lat"]
        c_lon = origin_zones.centroid["lon"]
        poly_high = shape(origin_zones.high_probability_zone.polygon_geojson)
        poly_med = shape(origin_zones.medium_probability_zone.polygon_geojson)
        poly_low = shape(origin_zones.low_probability_zone.polygon_geojson)

        # 1. Evaluate every candidate source
        for src in candidates:
            # Component: Distance Score (0 - 100)
            d = src.distance_to_origin_km
            if d <= cfg.dist_very_strong_km:
                # 0 to 5 km -> 90 to 100
                d_score = 100.0 - (d / max(0.1, cfg.dist_very_strong_km)) * 10.0
            elif d <= cfg.dist_strong_km:
                # 5 to 10 km -> 70 to 89
                ratio = (d - cfg.dist_very_strong_km) / max(0.1, cfg.dist_strong_km - cfg.dist_very_strong_km)
                d_score = 89.0 - ratio * 19.0
            elif d <= cfg.dist_moderate_km:
                # 10 to 25 km -> 40 to 69
                ratio = (d - cfg.dist_strong_km) / max(0.1, cfg.dist_moderate_km - cfg.dist_strong_km)
                d_score = 69.0 - ratio * 29.0
            elif d <= cfg.dist_weak_km:
                # 25 to 50 km -> 15 to 39
                ratio = (d - cfg.dist_moderate_km) / max(0.1, cfg.dist_weak_km - cfg.dist_moderate_km)
                d_score = 39.0 - ratio * 24.0
            else:
                # > 50 km -> 0 to 14
                d_score = max(2.0, 14.0 - ((d - cfg.dist_weak_km) / 50.0) * 12.0)
            
            src.distance_score = round(max(0.0, min(100.0, d_score)), 1)

            # Check overlap with origin zones
            pt = Point(src.lon, src.lat)
            if poly_high.contains(pt):
                src.origin_overlap = True
                src.origin_overlap_score = 95.0
            elif poly_med.contains(pt):
                src.origin_overlap = True
                src.origin_overlap_score = 75.0
            elif poly_low.contains(pt):
                src.origin_overlap = True
                src.origin_overlap_score = 50.0
            else:
                src.origin_overlap = (d <= origin_zones.low_probability_zone.radius_km)
                src.origin_overlap_score = max(5.0, 50.0 - (d - origin_zones.low_probability_zone.radius_km) * 2.0)

            # 2. Calculate Final Raw Evidence Score by Source Type
            reasons = []
            comp_scores = {}

            if src.source_type == SourceType.VESSEL.value:
                # Vessel formula
                w1 = cfg.vessel_w_spatial
                w2 = cfg.vessel_w_temporal
                w3 = cfg.vessel_w_trajectory
                w4 = cfg.vessel_w_counterfactual
                w5 = cfg.vessel_w_behavioural
                total_w = max(0.001, w1 + w2 + w3 + w4 + w5)

                s1 = src.distance_score
                s2 = src.time_compatibility_score
                s3 = src.trajectory_compatibility_score
                s4 = src.counterfactual_drift_score
                s5 = src.behavioural_consistency_score

                raw_score = (w1 * s1 + w2 * s2 + w3 * s3 + w4 * s4 + w5 * s5) / total_w

                comp_scores = {
                    "Distance": s1,
                    "Time Match": s2,
                    "Trajectory": s3,
                    "Drift Match": s4,
                    "Behaviour": s5,
                }

                reasons.append(f"Spatial proximity to hindcast origin: {src.distance_to_origin_km:.1f} km ({s1:.0f}/100)")
                reasons.append(f"Release window time compatibility: {s2:.0f}/100")
                reasons.append(f"Trajectory alignment with Lagrangian dispersion: {s3:.0f}/100")
                if src.counterfactual_simulation:
                    cf = src.counterfactual_simulation
                    reasons.append(f"Counterfactual forward simulation match: IoU={cf.iou:.2f}, Centroid error={cf.centroid_error_km:.1f}km ({s4:.0f}/100)")
                if src.behavioural_consistency_score > 70:
                    reasons.append(f"Behavioral anomalies detected (speed drop / AIS blackout): {s5:.0f}/100")

            elif src.source_type == SourceType.NATURAL_SEEP.value:
                # Natural Seep formula
                w1 = cfg.seep_w_spatial
                w2 = cfg.seep_w_origin_overlap
                w3 = cfg.seep_w_transport
                w4 = cfg.seep_w_persistence
                total_w = max(0.001, w1 + w2 + w3 + w4)

                s1 = src.distance_score
                s2 = src.origin_overlap_score
                s3 = src.transport_compatibility_score
                s4 = src.historical_persistence_score

                raw_score = (w1 * s1 + w2 * s2 + w3 * s3 + w4 * s4) / total_w

                comp_scores = {
                    "Distance": s1,
                    "Origin Overlap": s2,
                    "Transport Match": s3,
                    "Persistence": s4,
                }

                reasons.append(f"Distance to known seep field: {src.distance_to_origin_km:.1f} km ({s1:.0f}/100)")
                reasons.append(f"Overlap with origin uncertainty zone: {s2:.0f}/100")
                reasons.append(f"Hydrodynamic transport compatibility: {s3:.0f}/100")
                reasons.append(f"Historical SAR recurrence & persistence: {s4:.0f}/100")
                reasons.append("Note: Natural seep presence constitutes supporting environmental evidence, not conclusive cause.")

            else:
                # Land / Infrastructure formula (Ports, Pipelines, Platforms, Refineries)
                w1 = cfg.infrastructure_w_spatial
                w2 = cfg.infrastructure_w_origin_overlap
                w3 = cfg.infrastructure_w_transport
                w4 = cfg.infrastructure_w_persistence
                total_w = max(0.001, w1 + w2 + w3 + w4)

                s1 = src.distance_score
                s2 = src.origin_overlap_score
                s3 = src.transport_compatibility_score
                s4 = src.historical_persistence_score

                raw_score = (w1 * s1 + w2 * s2 + w3 * s3 + w4 * s4) / total_w

                comp_scores = {
                    "Distance": s1,
                    "Origin Overlap": s2,
                    "Transport Match": s3,
                    "Persistence": s4,
                }

                reasons.append(f"Distance from infrastructure to origin: {src.distance_to_origin_km:.1f} km ({s1:.0f}/100)")
                reasons.append(f"Origin uncertainty region buffer intersection: {s2:.0f}/100")
                reasons.append(f"Hydrodynamic up-current/upwind transport relationship: {s3:.0f}/100")
                reasons.append(f"Historical maintenance & spill persistence evidence: {s4:.0f}/100")
                reasons.append("Note: Coastal infrastructure proximity does not automatically imply a land-based release.")

            src.component_scores = comp_scores
            src.raw_evidence_score = round(max(1.0, min(99.0, raw_score)), 1)
            src.explainability_reasons = reasons

        # 3. Sort candidates by raw evidence score descending
        candidates.sort(key=lambda x: x.raw_evidence_score, reverse=True)

        # 4. Compute Relative Evidence Percentages (Normalized so top candidate is reference or relative evidence scale)
        max_score = max((c.raw_evidence_score for c in candidates), default=1.0)
        for rank_idx, src in enumerate(candidates, start=1):
            src.rank = rank_idx
            # Relative percentage based on raw score (displayed as relative evidence index 0-100%)
            src.relative_evidence_pct = round(src.raw_evidence_score, 1)

        # 5. Compute Category Group Summary
        cat_scores: Dict[str, List[float]] = {
            SourceCategoryGroup.VESSEL_RELATED.value: [],
            SourceCategoryGroup.LAND_INFRASTRUCTURE.value: [],
            SourceCategoryGroup.NATURAL_SEEP.value: [],
        }
        for src in candidates:
            if src.category_group in cat_scores:
                cat_scores[src.category_group].append(src.raw_evidence_score)

        category_summary = {
            SourceCategoryGroup.VESSEL_RELATED.value: max(cat_scores[SourceCategoryGroup.VESSEL_RELATED.value], default=0.0),
            SourceCategoryGroup.LAND_INFRASTRUCTURE.value: max(cat_scores[SourceCategoryGroup.LAND_INFRASTRUCTURE.value], default=0.0),
            SourceCategoryGroup.NATURAL_SEEP.value: max(cat_scores[SourceCategoryGroup.NATURAL_SEEP.value], default=0.0),
        }

        # 6. Formulate Objective Scientific Interpretation & Competing Hypotheses Check
        top_cand = candidates[0] if candidates else None
        second_cand = candidates[1] if len(candidates) > 1 else None

        score_diff = (top_cand.raw_evidence_score - second_cand.raw_evidence_score) if (top_cand and second_cand) else 99.0
        
        competing_hypotheses = False
        uncertainty_level = "LOW"

        if not top_cand or top_cand.raw_evidence_score < 35.0:
            interpretation = "Inconclusive — available remote sensing and hydrodynamic evidence does not sufficiently distinguish any specific source hypothesis."
            uncertainty_level = "HIGH"
        elif score_diff < 10.0 and top_cand.raw_evidence_score >= 40.0:
            competing_hypotheses = True
            uncertainty_level = "HIGH"
            interpretation = f"Multiple competing hypotheses — high source uncertainty between {top_cand.name} ({top_cand.raw_evidence_score:.0f}%) and {second_cand.name} ({second_cand.raw_evidence_score:.0f}%). Independent environmental sampling or radar verification required."
        elif top_cand.raw_evidence_score >= 70.0:
            uncertainty_level = "LOW"
            interpretation = f"Interpretation: {top_cand.name} shows the strongest consistency ({top_cand.raw_evidence_score:.0f}%) with the currently simulated backward hindcast and counterfactual transport evidence, but this result is a relative likelihood metric, not legal proof of responsibility."
        else:
            uncertainty_level = "MODERATE"
            interpretation = f"Interpretation: {top_cand.name} exhibits moderate spatial-temporal compatibility ({top_cand.raw_evidence_score:.0f}%), with secondary competing hypotheses present. Further AIS and satellite verification recommended."

        # 7. Generate Clean Official Summary Markdown
        lines = [
            "### SOURCE EVIDENCE COMPARISON",
            "**Relative evidence score — not a probability of source responsibility.**",
            "",
            "| Rank | Source Candidate | Type | Distance | Evidence Score | Primary Physical Factors |",
            "| :---: | :--- | :---: | :---: | :---: | :--- |",
        ]
        for c in candidates:
            lines.append(f"| #{c.rank} | **{c.name}** | `{c.source_type}` | {c.distance_to_origin_km:.1f} km | **{c.raw_evidence_score:.0f}%** | {', '.join(c.explainability_reasons[:2])} |")

        lines.append("")
        lines.append(f"**Scientific Assessment**: {interpretation}")

        summary_md = "\n".join(lines)

        return MultiSourceEvidenceComparison(
            candidates=candidates,
            total_sources_evaluated=len(candidates),
            category_summary=category_summary,
            top_candidate=top_cand.to_dict() if top_cand else {},
            scientific_interpretation=interpretation,
            uncertainty_level=uncertainty_level,
            competing_hypotheses_flag=competing_hypotheses,
            weights_config=cfg,
            summary_markdown=summary_md,
        )
