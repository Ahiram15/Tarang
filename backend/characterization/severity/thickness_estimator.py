from dataclasses import dataclass
from typing import Dict, List, Any


@dataclass
class SpillSeverityResult:
    severity_class: str  # "Very Thin", "Thin", "Medium", "Thick", "Very Thick"
    confidence: float
    type: str  # "model_based_estimate"
    calibrated: bool  # False
    features_used: Dict[str, Any]
    description: str


class ThicknessEstimator:
    """
    Model-based thickness and severity classification engine.
    Labels results explicitly as model estimates unless a laboratory-calibrated radiometer dataset is active.
    """

    def estimate(
        self,
        spill_area_km2: float,
        confidence_score: float,
        fai_index: float = 0.084,
        wind_speed_mps: float = 6.0,
    ) -> SpillSeverityResult:
        # Features used for classification
        features = {
            "spill_area_km2": spill_area_km2,
            "unet_confidence_pct": confidence_score,
            "optical_fai_index": fai_index,
            "ambient_wind_speed_mps": wind_speed_mps,
        }

        # Multi-feature heuristic model:
        # High optical FAI (> 0.06) + high radar confidence (> 85%) + significant area (> 10 km2) indicates Thick emulsion
        score = 0
        if fai_index > 0.07:
            score += 2
        elif fai_index > 0.035:
            score += 1

        if confidence_score > 90.0:
            score += 2
        elif confidence_score > 75.0:
            score += 1

        if spill_area_km2 > 15.0:
            score += 2
        elif spill_area_km2 > 5.0:
            score += 1

        if score >= 5:
            severity_class = "Very Thick"
            desc = "Heavy emulsified petroleum layer with strong wave damping and pronounced NIR reflectance."
            conf = min(0.95, round(0.75 + (confidence_score / 400.0), 2))
        elif score >= 4:
            severity_class = "Thick"
            desc = "Continuous crude/fuel oil slick with high microwave backscatter contrast."
            conf = min(0.90, round(0.70 + (confidence_score / 400.0), 2))
        elif score >= 2:
            severity_class = "Medium"
            desc = "Moderate sheen and crude oil patches with partial sea surface damping."
            conf = min(0.85, round(0.65 + (confidence_score / 400.0), 2))
        elif score >= 1:
            severity_class = "Thin"
            desc = "Thin petroleum sheen with moderate surface tension reduction."
            conf = 0.72
        else:
            severity_class = "Very Thin"
            desc = "Rainbow/silvery micro-sheen on water boundary."
            conf = 0.65

        return SpillSeverityResult(
            severity_class=severity_class,
            confidence=conf,
            type="model_based_estimate",
            calibrated=False,
            features_used=features,
            description=desc,
        )
