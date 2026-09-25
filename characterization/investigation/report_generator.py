import json
import re
from dataclasses import dataclass
from datetime import datetime
from typing import Dict, Any, List, Optional

from .origin_zones import ProbableOriginZones
from .ranking_engine import RankedInvestigationResult
from .coastal_warning import CoastalRiskAnalysis

# Regex matching any Unicode emojis or pictographs
EMOJI_PATTERN = re.compile(
    r"[\U00010000-\U0010ffff]|[\u2600-\u27bf]|[\u2300-\u23ff]|[\u2b50-\u2b55]|[\u200d]|[\ufe0f]",
    flags=re.UNICODE,
)


def strip_emojis(text: str) -> str:
    """
    Strips all emojis from text to guarantee clean, formal, official reports.
    """
    if not text:
        return ""
    replacements = {
        "⚠️": "[ALERT]",
        "🚨": "[WARNING]",
        "⚓": "[VESSEL]",
        "🛰️": "[SATELLITE]",
        "🎯": "[ORIGIN]",
        "📌": "[NOTE]",
        "📍": "[LOCATION]",
        "⚡": "[AIS GAP]",
        "🚢": "[VESSEL]",
    }
    for k, v in replacements.items():
        text = text.replace(k, v)
    text = EMOJI_PATTERN.sub("", text)
    return re.sub(r" +", " ", text).strip()


from .sources_models import MultiSourceEvidenceComparison


@dataclass
class InvestigationPriorityReport:
    report_id: str
    spill_id: str
    generated_at: str
    origin_analysis: ProbableOriginZones
    vessel_investigation: RankedInvestigationResult
    coastal_warning: CoastalRiskAnalysis
    markdown_content: str
    multi_source_comparison: Optional[MultiSourceEvidenceComparison] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "report_id": self.report_id,
            "spill_id": self.spill_id,
            "generated_at": self.generated_at,
            "origin_analysis": self.origin_analysis.to_dict(),
            "vessel_investigation": self.vessel_investigation.to_dict(),
            "coastal_warning": self.coastal_warning.to_dict(),
            "multi_source_comparison": self.multi_source_comparison.to_dict() if self.multi_source_comparison else None,
            "markdown_content": self.markdown_content,
        }


class InvestigationReportGenerator:
    """
    Synthesizes the complete Explainable Maritime Oil Spill Investigation Priority
    and Coastal Early Warning Report. Clean and strictly emoji-free.
    """

    def generate_report(
        self,
        spill_id: str,
        origin_zones: ProbableOriginZones,
        vessel_results: RankedInvestigationResult,
        coastal_analysis: CoastalRiskAnalysis,
        multi_source_comparison: Optional[MultiSourceEvidenceComparison] = None,
    ) -> InvestigationPriorityReport:
        now_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
        clean_spill = strip_emojis(spill_id).upper()
        report_id = f"IR-TARANG-{clean_spill}-{datetime.utcnow().strftime('%Y%m%d%H%M')}"

        # Build clean formatted official Markdown briefing (zero emojis)
        lines = []
        lines.append(f"# TARANG MARITIME INVESTIGATION & COASTAL EARLY WARNING REPORT")
        lines.append(f"**Report ID**: `{report_id}` | **Generated**: {now_str} | **Spill ID**: `{spill_id}`")
        lines.append("\n---\n")

        # Section 1: Executive Summary
        lines.append("## 1. Executive Summary")
        lines.append(
            "This investigation report combines multi-satellite SAR/Optical surveillance, spatial-temporal Lagrangian "
            "backtracking, Global Fishing Watch (GFW) AIS records, and Sentinel-1 SAR vessel detection intelligence. "
            "It generates an **explainable investigation priority ranking** of candidate vessels and evaluates immediate "
            "threats to coastal ecosystems and marine infrastructure."
        )
        lines.append(
            "\n> **Legal & Evidentiary Disclaimer**: *This system is an AI decision-support platform designed to narrow down "
            "investigative search space from thousands of vessels to high-probability candidates. It does NOT assert definitive "
            "legal culpability, but provides transparent evidentiary weighting for maritime law enforcement.*"
        )
        lines.append("\n---\n")

        # Section 2: Probable Spill Origin & Release Time Window
        lines.append("## 2. Probable Spill Origin & Release Time Window")
        lines.append(f"- **Origin Centroid**: `{origin_zones.centroid['lat']:.5f}°N, {origin_zones.centroid['lon']:.5f}°E`")
        lines.append(f"- **Estimated Release Time**: `{strip_emojis(origin_zones.time_window.estimated_time)}`")
        lines.append(f"- **Probable Release Window**: `{strip_emojis(origin_zones.time_window.window_earliest)}` – `{strip_emojis(origin_zones.time_window.window_latest)}` ({origin_zones.time_window.window_duration_hours:.1f} Hours Duration)")
        lines.append(f"- **Uncertainty Confidence**: `{int(origin_zones.time_window.confidence_level * 100)}%`")
        lines.append("\n### Spatial Uncertainty Zones:")
        lines.append(f"1. **High Probability Zone (1σ Core)**: Radius `±{origin_zones.high_probability_zone.radius_km:.2f} km` (Area: `{origin_zones.high_probability_zone.area_km2:.1f} km²`)")
        lines.append(f"2. **Medium Probability Zone (2σ Region)**: Radius `±{origin_zones.medium_probability_zone.radius_km:.2f} km` (Area: `{origin_zones.medium_probability_zone.area_km2:.1f} km²`)")
        lines.append(f"3. **Low Probability Zone (3σ Boundary)**: Radius `±{origin_zones.low_probability_zone.radius_km:.2f} km` (Area: `{origin_zones.low_probability_zone.area_km2:.1f} km²`)")
        lines.append("\n---\n")

        # Section 3: Ranked Candidate Vessels & SAR Detections
        lines.append("## 3. Candidate Vessel Investigation Priority List")
        lines.append(f"Total Evaluated Objects: **{vessel_results.total_evaluated}**")
        lines.append("")
        lines.append("| Rank | Vessel / Target Name | Category | Score | MMSI / ID | Min Dist (km) | Time Overlap | Key Finding |")
        lines.append("| :---: | :--- | :--- | :---: | :---: | :---: | :---: | :--- |")

        for v in vessel_results.candidates:
            key_reason = strip_emojis(v.explainability_reasons[0]) if v.explainability_reasons else "Evaluated"
            v_name = strip_emojis(v.name)
            mmsi_disp = v.mmsi or "None (SAR Echo)"
            lines.append(
                f"| **#{v.investigation_rank}** | **{v_name}** | `{v.category.split(':')[0]}` | **{v.total_score:.1f}/100** | `{mmsi_disp}` | {v.min_distance_to_origin_km:.1f} | {v.time_overlap_hours:.1f}h | {key_reason} |"
            )

        lines.append("\n### Detailed Explainable Evidence Breakdowns:\n")
        for v in vessel_results.candidates:
            v_name = strip_emojis(v.name)
            lines.append(f"#### Rank #{v.investigation_rank} — {v_name} ({v.total_score:.1f}/100)")
            lines.append(f"- **Vessel Type**: {strip_emojis(v.vessel_type)} | **Flag**: {strip_emojis(v.flag)} | **Length**: {v.length_m:.1f}m")
            lines.append(f"- **Category**: `{strip_emojis(v.category)}`")
            lines.append(f"- **Score Breakdown**: Spatial: `{v.score_spatial:.1f}/25` | Temporal: `{v.score_temporal:.1f}/25` | Trajectory: `{v.score_trajectory:.1f}/20` | Drift: `{v.score_drift:.1f}/15` | AIS Gap: `{v.score_ais_gap:.1f}/10` | Risk Profile: `{v.score_vessel_type:.1f}/5`")
            lines.append("- **Investigative Evidence**:")
            for r in v.explainability_reasons:
                lines.append(f"  * {strip_emojis(r)}")
            if v.ais_gaps:
                gap = v.ais_gaps[0]
                lines.append(f"  * [AIS Blackout Segment]: `{strip_emojis(gap.start_time)}` to `{strip_emojis(gap.end_time)}` ({gap.duration_hours:.2f}h) — {strip_emojis(gap.notes)}")
            lines.append("")

        lines.append("---\n")

        # Section 4: Coastal Early Warning Alerts
        lines.append("## 4. Coastal Drift Impact Forecast & Early Warning Alerts")
        lines.append(f"- **Overall Threat Level**: **{strip_emojis(coastal_analysis.overall_risk_level)}**")
        lines.append(f"- **Active Coastal Alerts**: `{len(coastal_analysis.active_alerts)}`")
        if coastal_analysis.earliest_impact_location:
            lines.append(f"- **Earliest Impact**: `{strip_emojis(coastal_analysis.earliest_impact_location)}` in approximately **{coastal_analysis.earliest_eta_hours:.1f} Hours**")
        lines.append("")

        for alert in coastal_analysis.active_alerts:
            loc_clean = strip_emojis(alert.location_name)
            risk_clean = strip_emojis(alert.risk_level)
            lines.append(f"### [{risk_clean} RISK] {loc_clean}")
            lines.append(f"- **Receptor Type**: {strip_emojis(alert.receptor_type)}")
            lines.append(f"- **Estimated Time of Possible Impact (ETA)**: **{strip_emojis(alert.eta_label)}** (Probability: `{alert.impact_probability_pct:.1f}%`)")
            lines.append(f"- **Potential Threat**: {strip_emojis(alert.potential_threat)}")
            lines.append("- **Recommended Actions**:")
            for action in alert.recommended_actions:
                lines.append(f"  * [ ] {strip_emojis(action)}")
            lines.append("")

        lines.append("---\n")
        lines.append("*Report generated by TARANG Autonomous Satellite Remote Sensing & Maritime Surveillance System.*")

        md_text = "\n".join(lines)

        return InvestigationPriorityReport(
            report_id=report_id,
            spill_id=spill_id,
            generated_at=now_str,
            origin_analysis=origin_zones,
            vessel_investigation=vessel_results,
            coastal_warning=coastal_analysis,
            markdown_content=md_text,
            multi_source_comparison=multi_source_comparison,
        )

    def generate_pdf(self, report: InvestigationPriorityReport) -> bytes:
        """
        Builds and returns the PDF bytes for the given InvestigationPriorityReport.
        Strictly zero emojis.
        """
        from .pdf_generator import InvestigationPdfGenerator
        generator = InvestigationPdfGenerator()
        return generator.generate(
            report_id=report.report_id,
            spill_id=report.spill_id,
            generated_at=report.generated_at,
            origin_zones=report.origin_analysis,
            vessel_results=report.vessel_investigation,
            coastal_warning=report.coastal_warning,
        )
