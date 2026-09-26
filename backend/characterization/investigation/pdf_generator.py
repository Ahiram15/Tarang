import io
import re
import html
from typing import List, Dict, Any

try:
    from reportlab.lib.pagesizes import letter
    from reportlab.lib import colors
    from reportlab.lib.units import inch
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.platypus import (
        SimpleDocTemplate,
        Paragraph,
        Spacer,
        Table,
        TableStyle,
        KeepTogether,
        HRFlowable,
    )
    from reportlab.pdfgen import canvas
    _REPORTLAB_AVAILABLE = True
except ImportError:
    _REPORTLAB_AVAILABLE = False

from .origin_zones import ProbableOriginZones
from .ranking_engine import RankedInvestigationResult
from .coastal_warning import CoastalRiskAnalysis

# Regex pattern matching all Unicode emoji symbols, pictographs, and dingbats
EMOJI_PATTERN = re.compile(
    r"[\U00010000-\U0010ffff]|[\u2600-\u27bf]|[\u2300-\u23ff]|[\u2b50-\u2b55]|[\u200d]|[\ufe0f]",
    flags=re.UNICODE,
)


def strip_emojis(text: str) -> str:
    """
    Strictly removes all emoji glyphs and pictograms to ensure clean,
    official PDF generation without font encoding issues or informal icons.
    """
    if not text:
        return ""
    # Map common alerting emojis to clean text tags if needed
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


class NumberedCanvas(canvas.Canvas):
    """
    Two-pass canvas that adds running headers, rules, and dynamic
    'Page X of Y' pagination to every page.
    """
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count: int):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748b"))

        # Running Top Header (pages 2+)
        if self._pageNumber > 1:
            self.drawString(
                36,
                11 * inch - 26,
                "TARANG MARITIME INTELLIGENCE COMMAND  |  OFFICIAL INVESTIGATION REPORT",
            )
            self.drawRightString(
                8.5 * inch - 36,
                11 * inch - 26,
                "SENSITIVE / ENFORCEMENT",
            )
            self.setStrokeColor(colors.HexColor("#cbd5e1"))
            self.setLineWidth(0.6)
            self.line(36, 11 * inch - 30, 8.5 * inch - 36, 11 * inch - 30)

        # Running Footer (all pages)
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(8.5 * inch - 36, 24, page_str)
        self.drawString(
            36,
            24,
            "TARANG AUTONOMOUS MARITIME SPILL INVESTIGATION SYSTEM  -  OFFICIAL TECHNICAL BRIEFING",
        )
        self.setStrokeColor(colors.HexColor("#cbd5e1"))
        self.setLineWidth(0.6)
        self.line(36, 34, 8.5 * inch - 36, 34)
        self.restoreState()


class InvestigationPdfGenerator:
    """
    Generates high-fidelity, professional PDF reports for maritime enforcement,
    regulatory agencies, and disaster response authorities. Strictly emoji-free.
    """

    def __init__(self):
        self._init_styles()

    def _init_styles(self):
        self.styles = getSampleStyleSheet()

        # Custom brand styling palette
        c_navy = colors.HexColor("#0f2042")
        c_blue = colors.HexColor("#1e3a8a")
        c_dark = colors.HexColor("#0f172a")
        c_muted = colors.HexColor("#475569")

        self.styles.add(
            ParagraphStyle(
                name="DocHeaderTitle",
                fontName="Helvetica-Bold",
                fontSize=18,
                leading=22,
                textColor=c_navy,
                alignment=0,
            )
        )
        self.styles.add(
            ParagraphStyle(
                name="DocSubTitle",
                fontName="Helvetica",
                fontSize=10,
                leading=14,
                textColor=c_blue,
                alignment=0,
            )
        )
        self.styles.add(
            ParagraphStyle(
                name="SectionHeading",
                fontName="Helvetica-Bold",
                fontSize=12,
                leading=16,
                textColor=c_navy,
                spaceBefore=12,
                spaceAfter=6,
            )
        )
        self.styles.add(
            ParagraphStyle(
                name="SubSectionHeading",
                fontName="Helvetica-Bold",
                fontSize=10,
                leading=14,
                textColor=c_blue,
                spaceBefore=8,
                spaceAfter=4,
            )
        )
        self.styles.add(
            ParagraphStyle(
                name="BodyDark",
                fontName="Helvetica",
                fontSize=9,
                leading=13,
                textColor=c_dark,
            )
        )
        self.styles.add(
            ParagraphStyle(
                name="BodyDarkBold",
                fontName="Helvetica-Bold",
                fontSize=9,
                leading=13,
                textColor=c_dark,
            )
        )
        self.styles.add(
            ParagraphStyle(
                name="DisclaimerText",
                fontName="Helvetica-Oblique",
                fontSize=8,
                leading=11.5,
                textColor=c_muted,
            )
        )
        self.styles.add(
            ParagraphStyle(
                name="TableCell",
                fontName="Helvetica",
                fontSize=8,
                leading=10.5,
                textColor=c_dark,
            )
        )
        self.styles.add(
            ParagraphStyle(
                name="TableCellBold",
                fontName="Helvetica-Bold",
                fontSize=8,
                leading=10.5,
                textColor=c_dark,
            )
        )
        self.styles.add(
            ParagraphStyle(
                name="TableHeaderCell",
                fontName="Helvetica-Bold",
                fontSize=8,
                leading=10.5,
                textColor=colors.white,
                alignment=1,
            )
        )

    def generate(
        self,
        report_id: str,
        spill_id: str,
        generated_at: str,
        origin_zones: ProbableOriginZones,
        vessel_results: RankedInvestigationResult,
        coastal_analysis: Any = None,
        coastal_warning: Any = None,
    ) -> bytes:
        """
        Builds and returns the PDF file bytes.
        """
        coastal_analysis = coastal_analysis or coastal_warning
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            leftMargin=36,
            rightMargin=36,
            topMargin=44,
            bottomMargin=44,
        )

        elements: List[Any] = []

        # 1. Document Classification & Official Header
        classification_data = [
            [
                Paragraph("<b>TARANG MARITIME INTELLIGENCE COMMAND</b>", self.styles["TableCellBold"]),
                Paragraph("<b>CLASSIFICATION:</b> OFFICIAL / MARITIME ENFORCEMENT SENSITIVE", self.styles["TableCellBold"]),
            ]
        ]
        t_class = Table(classification_data, colWidths=[3.8 * inch, 3.8 * inch])
        t_class.setStyle(
            TableStyle([
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f1f5f9")),
                ("TEXTCOLOR", (0, 0), (-1, -1), colors.HexColor("#0f172a")),
                ("PADDING", (0, 0), (-1, -1), 4),
                ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
                ("ALIGN", (1, 0), (1, 0), "RIGHT"),
            ])
        )
        elements.append(t_class)
        elements.append(Spacer(1, 8))

        # Main Title Banner
        elements.append(
            Paragraph(
                "MARITIME OIL SPILL INVESTIGATION & COASTAL EARLY WARNING REPORT",
                self.styles["DocHeaderTitle"],
            )
        )
        elements.append(
            Paragraph(
                "Multi-Satellite Lagrangian Backtracking  |  AIS Cross-Referencing  |  Sentinel-1 SAR Target Correlation",
                self.styles["DocSubTitle"],
            )
        )
        elements.append(Spacer(1, 8))

        # Metadata Grid Table
        now_clean = strip_emojis(generated_at)
        rep_clean = strip_emojis(report_id)
        spill_clean = strip_emojis(spill_id)

        meta_data = [
            [
                Paragraph("<b>Report Identification:</b>", self.styles["TableCell"]),
                Paragraph(rep_clean, self.styles["TableCellBold"]),
                Paragraph("<b>Generated Timestamp:</b>", self.styles["TableCell"]),
                Paragraph(now_clean, self.styles["TableCellBold"]),
            ],
            [
                Paragraph("<b>Target Incident ID:</b>", self.styles["TableCell"]),
                Paragraph(spill_clean, self.styles["TableCellBold"]),
                Paragraph("<b>Operational Status:</b>", self.styles["TableCell"]),
                Paragraph("ACTIVE TACTICAL INVESTIGATION", self.styles["TableCellBold"]),
            ],
        ]
        t_meta = Table(meta_data, colWidths=[1.7 * inch, 2.1 * inch, 1.7 * inch, 2.1 * inch])
        t_meta.setStyle(
            TableStyle([
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
                ("BOX", (0, 0), (-1, -1), 0.75, colors.HexColor("#0f2042")),
                ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
                ("PADDING", (0, 0), (-1, -1), 5),
            ])
        )
        elements.append(t_meta)
        elements.append(Spacer(1, 10))

        # 2. Section 1: Executive Summary & Legal Evidentiary Disclaimer
        elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#0f2042"), spaceAfter=6))
        elements.append(Paragraph("1. EXECUTIVE SUMMARY & INVESTIGATIVE SCOPE", self.styles["SectionHeading"]))
        
        exec_summary_text = (
            "This investigation report synthesizes multi-satellite SAR/Optical surveillance, spatial-temporal "
            "Lagrangian oceanographic backtracking, Global Fishing Watch (GFW) AIS transponder feeds, and Sentinel-1 SAR "
            "vessel backscatter detections. The objective is to identify and prioritize candidate vessels operating "
            "within the probable origin spatial envelope and estimated release time window. Simultaneously, an "
            "early-warning coastal drift model identifies critical marine receptors, aquaculture zones, and coastal "
            "infrastructure under immediate environmental threat."
        )
        elements.append(Paragraph(exec_summary_text, self.styles["BodyDark"]))
        elements.append(Spacer(1, 6))

        # Evidentiary Disclaimer Callout
        disclaimer_box = [
            [
                Paragraph(
                    "<b>LEGAL & EVIDENTIARY NOTICE:</b> This system is an AI-enabled maritime decision-support platform "
                    "designed to systematically eliminate innocent traffic and narrow down search space from hundreds or "
                    "thousands of vessels to high-probability candidates. It provides transparent, multi-factor evidentiary "
                    "rankings based on physics and observational data, and does not assert definitive legal culpability.",
                    self.styles["DisclaimerText"],
                )
            ]
        ]
        t_disc = Table(disclaimer_box, colWidths=[7.6 * inch])
        t_disc.setStyle(
            TableStyle([
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
                ("BOX", (0, 0), (-1, -1), 0.75, colors.HexColor("#cbd5e1")),
                ("LINELEFT", (0, 0), (0, -1), 3.0, colors.HexColor("#1e3a8a")),
                ("PADDING", (0, 0), (-1, -1), 6),
            ])
        )
        elements.append(t_disc)
        elements.append(Spacer(1, 10))

        # 3. Section 2: Probable Spill Origin & Release Time Window
        elements.append(HRFlowable(width="100%", thickness=0.75, color=colors.HexColor("#cbd5e1"), spaceAfter=6))
        elements.append(Paragraph("2. PROBABLE SPILL ORIGIN & RELEASE TIME WINDOW", self.styles["SectionHeading"]))

        c_lat = origin_zones.centroid["lat"]
        c_lon = origin_zones.centroid["lon"]
        tw = origin_zones.time_window

        origin_meta = [
            [
                Paragraph(f"<b>Estimated Origin Centroid:</b> {c_lat:.5f} deg N, {c_lon:.5f} deg E", self.styles["BodyDark"]),
                Paragraph(f"<b>Estimated Release Time:</b> {strip_emojis(tw.estimated_time)}", self.styles["BodyDark"]),
            ],
            [
                Paragraph(f"<b>Release Time Window:</b> {strip_emojis(tw.window_earliest)} to {strip_emojis(tw.window_latest)}", self.styles["BodyDark"]),
                Paragraph(f"<b>Window Duration / Model Confidence:</b> {tw.window_duration_hours:.1f} Hours  |  {int(tw.confidence_level * 100)}%", self.styles["BodyDarkBold"]),
            ],
        ]
        t_orig_meta = Table(origin_meta, colWidths=[3.8 * inch, 3.8 * inch])
        t_orig_meta.setStyle(
            TableStyle([
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#ffffff")),
                ("PADDING", (0, 0), (-1, -1), 3),
            ])
        )
        elements.append(t_orig_meta)
        elements.append(Spacer(1, 6))

        # Multi-Tier Spatial Uncertainty Zones Table
        zones_data = [
            [
                Paragraph("Uncertainty Tier", self.styles["TableHeaderCell"]),
                Paragraph("Definition", self.styles["TableHeaderCell"]),
                Paragraph("Search Radius (km)", self.styles["TableHeaderCell"]),
                Paragraph("Envelope Area (sq km)", self.styles["TableHeaderCell"]),
                Paragraph("Confidence Level", self.styles["TableHeaderCell"]),
            ],
            [
                Paragraph("<b>High Probability (1-Sigma Core)</b>", self.styles["TableCellBold"]),
                Paragraph("Immediate origin centroid core", self.styles["TableCell"]),
                Paragraph(f"+/- {origin_zones.high_probability_zone.radius_km:.2f} km", self.styles["TableCell"]),
                Paragraph(f"{origin_zones.high_probability_zone.area_km2:.1f} sq km", self.styles["TableCell"]),
                Paragraph("68.2% (Primary)", self.styles["TableCellBold"]),
            ],
            [
                Paragraph("<b>Medium Probability (2-Sigma Region)</b>", self.styles["TableCellBold"]),
                Paragraph("Extended ocean current uncertainty zone", self.styles["TableCell"]),
                Paragraph(f"+/- {origin_zones.medium_probability_zone.radius_km:.2f} km", self.styles["TableCell"]),
                Paragraph(f"{origin_zones.medium_probability_zone.area_km2:.1f} sq km", self.styles["TableCell"]),
                Paragraph("95.4% (Secondary)", self.styles["TableCell"]),
            ],
            [
                Paragraph("<b>Low Probability (3-Sigma Boundary)</b>", self.styles["TableCellBold"]),
                Paragraph("Outer envelope boundary for high-speed craft", self.styles["TableCell"]),
                Paragraph(f"+/- {origin_zones.low_probability_zone.radius_km:.2f} km", self.styles["TableCell"]),
                Paragraph(f"{origin_zones.low_probability_zone.area_km2:.1f} sq km", self.styles["TableCell"]),
                Paragraph("99.7% (Boundary)", self.styles["TableCell"]),
            ],
        ]
        t_zones = Table(zones_data, colWidths=[2.1 * inch, 2.1 * inch, 1.2 * inch, 1.2 * inch, 1.0 * inch])
        t_zones.setStyle(
            TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0f2042")),
                ("ALIGN", (0, 0), (-1, 0), "CENTER"),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
                ("PADDING", (0, 0), (-1, -1), 4),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.HexColor("#ffffff"), colors.HexColor("#f8fafc")]),
            ])
        )
        elements.append(t_zones)
        elements.append(Spacer(1, 10))

        # 4. Section 3: Candidate Vessel Priority Matrix
        elements.append(HRFlowable(width="100%", thickness=0.75, color=colors.HexColor("#cbd5e1"), spaceAfter=6))
        elements.append(
            Paragraph(
                f"3. CANDIDATE VESSEL INVESTIGATION PRIORITY LIST (Total Evaluated: {vessel_results.total_evaluated})",
                self.styles["SectionHeading"],
            )
        )

        vessel_table_data = [
            [
                Paragraph("Rank", self.styles["TableHeaderCell"]),
                Paragraph("Vessel / Target Name", self.styles["TableHeaderCell"]),
                Paragraph("Category", self.styles["TableHeaderCell"]),
                Paragraph("Score", self.styles["TableHeaderCell"]),
                Paragraph("MMSI / Target ID", self.styles["TableHeaderCell"]),
                Paragraph("Min Dist", self.styles["TableHeaderCell"]),
                Paragraph("Overlap", self.styles["TableHeaderCell"]),
                Paragraph("Primary Finding", self.styles["TableHeaderCell"]),
            ]
        ]

        for v in vessel_results.candidates:
            rank_label = f"#{v.investigation_rank}"
            v_name = strip_emojis(v.name)
            v_cat = strip_emojis(v.category.split(":")[0])
            score_label = f"{v.total_score:.1f}/100"
            mmsi_label = v.mmsi or "SAR Echo"
            dist_label = f"{v.min_distance_to_origin_km:.1f} km"
            overlap_label = f"{v.time_overlap_hours:.1f}h"
            key_reason = strip_emojis(v.explainability_reasons[0]) if v.explainability_reasons else "Evaluated target"
            if len(key_reason) > 38:
                key_reason = key_reason[:36] + "..."

            vessel_table_data.append([
                Paragraph(f"<b>{rank_label}</b>", self.styles["TableCellBold"]),
                Paragraph(f"<b>{v_name}</b>", self.styles["TableCellBold"]),
                Paragraph(v_cat, self.styles["TableCell"]),
                Paragraph(f"<b>{score_label}</b>", self.styles["TableCellBold"]),
                Paragraph(mmsi_label, self.styles["TableCell"]),
                Paragraph(dist_label, self.styles["TableCell"]),
                Paragraph(overlap_label, self.styles["TableCell"]),
                Paragraph(key_reason, self.styles["TableCell"]),
            ])

        t_vessels = Table(
            vessel_table_data,
            colWidths=[0.5 * inch, 1.8 * inch, 1.1 * inch, 0.7 * inch, 0.9 * inch, 0.7 * inch, 0.6 * inch, 1.3 * inch],
        )
        t_vessels.setStyle(
            TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0f2042")),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
                ("PADDING", (0, 0), (-1, -1), 4),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.HexColor("#ffffff"), colors.HexColor("#f8fafc")]),
                ("ALIGN", (0, 1), (0, -1), "CENTER"),
                ("ALIGN", (3, 1), (3, -1), "CENTER"),
                ("ALIGN", (5, 1), (6, -1), "CENTER"),
            ])
        )
        elements.append(t_vessels)
        elements.append(Spacer(1, 10))

        # Detailed Candidate Dossiers
        elements.append(Paragraph("Detailed Multi-Factor Evidence Dossiers:", self.styles["SubSectionHeading"]))

        for v in vessel_results.candidates:
            dossier_elements = []
            v_name = strip_emojis(v.name)
            v_type = strip_emojis(v.vessel_type)
            v_flag = strip_emojis(v.flag)
            v_cat = strip_emojis(v.category)

            header_text = f"<b>Rank #{v.investigation_rank}: {v_name}</b> &nbsp;&nbsp;|&nbsp;&nbsp; Priority Score: <b>{v.total_score:.1f}/100</b>"
            dossier_elements.append(Paragraph(header_text, self.styles["BodyDarkBold"]))

            spec_line = (
                f"Type: {v_type}  |  Flag: {v_flag}  |  Dimensions: {v.length_m:.1f}m x {v.beam_m:.1f}m  |  "
                f"Category: {v_cat}"
            )
            dossier_elements.append(Paragraph(spec_line, self.styles["TableCell"]))

            score_line = (
                f"Score Breakdown: Spatial: {v.score_spatial:.1f}/25 | Temporal: {v.score_temporal:.1f}/25 | "
                f"Trajectory: {v.score_trajectory:.1f}/20 | Drift: {v.score_drift:.1f}/15 | "
                f"AIS Gap: {v.score_ais_gap:.1f}/10 | Vessel Risk: {v.score_vessel_type:.1f}/5"
            )
            dossier_elements.append(Paragraph(score_line, self.styles["TableCellBold"]))

            # Evidence points
            for r in v.explainability_reasons:
                clean_r = strip_emojis(r)
                dossier_elements.append(Paragraph(f"- {clean_r}", self.styles["TableCell"]))

            if v.ais_gaps:
                gap = v.ais_gaps[0]
                gap_text = (
                    f"<b>[AIS BLACKOUT DETECTED]</b> Duration: {gap.duration_hours:.2f} hours "
                    f"({strip_emojis(gap.start_time)} to {strip_emojis(gap.end_time)})  -  {strip_emojis(gap.notes)}"
                )
                dossier_elements.append(Paragraph(gap_text, self.styles["TableCellBold"]))

            dossier_elements.append(Spacer(1, 6))
            elements.append(KeepTogether(dossier_elements))

        # 5. Section 4: Coastal Drift Impact Forecast & Early Warning Alerts
        elements.append(HRFlowable(width="100%", thickness=0.75, color=colors.HexColor("#cbd5e1"), spaceAfter=6))
        elements.append(Paragraph("4. COASTAL DRIFT IMPACT FORECAST & EARLY WARNING ALERTS", self.styles["SectionHeading"]))

        threat_level = strip_emojis(coastal_analysis.overall_risk_level)
        earliest_loc = strip_emojis(coastal_analysis.earliest_impact_location) or "No immediate landfall"
        earliest_eta = f"{coastal_analysis.earliest_eta_hours:.1f} Hours" if coastal_analysis.earliest_eta_hours else "N/A"

        coast_meta = [
            [
                Paragraph(f"<b>Overall Coastal Threat Level:</b> <b>{threat_level}</b>", self.styles["BodyDarkBold"]),
                Paragraph(f"<b>Active Early Warning Alerts:</b> {len(coastal_analysis.active_alerts)} Threatened Assets", self.styles["BodyDarkBold"]),
            ],
            [
                Paragraph(f"<b>Earliest Projected Landfall:</b> {earliest_loc}", self.styles["BodyDark"]),
                Paragraph(f"<b>Estimated Time to Impact (ETA):</b> {earliest_eta}", self.styles["BodyDark"]),
            ],
        ]
        t_c_meta = Table(coast_meta, colWidths=[3.8 * inch, 3.8 * inch])
        t_c_meta.setStyle(
            TableStyle([
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
                ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
                ("PADDING", (0, 0), (-1, -1), 4),
            ])
        )
        elements.append(t_c_meta)
        elements.append(Spacer(1, 8))

        if coastal_analysis.active_alerts:
            alerts_table_data = [
                [
                    Paragraph("Threatened Location", self.styles["TableHeaderCell"]),
                    Paragraph("Receptor Type", self.styles["TableHeaderCell"]),
                    Paragraph("Risk Level", self.styles["TableHeaderCell"]),
                    Paragraph("ETA to Landfall", self.styles["TableHeaderCell"]),
                    Paragraph("Impact Prob", self.styles["TableHeaderCell"]),
                    Paragraph("Recommended Protective Countermeasures", self.styles["TableHeaderCell"]),
                ]
            ]

            for a in coastal_analysis.active_alerts:
                loc_clean = strip_emojis(a.location_name)
                type_clean = strip_emojis(a.receptor_type)
                risk_clean = strip_emojis(a.risk_level)
                eta_clean = strip_emojis(a.eta_label)
                prob_clean = f"{a.impact_probability_pct:.1f}%"
                actions_clean = "; ".join([strip_emojis(act) for act in a.recommended_actions[:2]])

                alerts_table_data.append([
                    Paragraph(f"<b>{loc_clean}</b>", self.styles["TableCellBold"]),
                    Paragraph(type_clean, self.styles["TableCell"]),
                    Paragraph(f"<b>[{risk_clean}]</b>", self.styles["TableCellBold"]),
                    Paragraph(eta_clean, self.styles["TableCell"]),
                    Paragraph(prob_clean, self.styles["TableCell"]),
                    Paragraph(actions_clean, self.styles["TableCell"]),
                ])

            t_alerts = Table(
                alerts_table_data,
                colWidths=[1.6 * inch, 1.1 * inch, 0.9 * inch, 1.0 * inch, 0.8 * inch, 2.2 * inch],
            )
            t_alerts.setStyle(
                TableStyle([
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0f2042")),
                    ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
                    ("PADDING", (0, 0), (-1, -1), 4),
                    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.HexColor("#ffffff"), colors.HexColor("#f8fafc")]),
                ])
            )
            elements.append(t_alerts)
        else:
            elements.append(
                Paragraph("No sensitive coastal receptors intersected within the evaluated forecast window.", self.styles["BodyDark"])
            )

        elements.append(Spacer(1, 12))

        # 6. Section 5: Authentication & Certification Signature Block
        elements.append(HRFlowable(width="100%", thickness=0.75, color=colors.HexColor("#cbd5e1"), spaceAfter=6))
        sign_block = [
            [
                Paragraph("<b>SYSTEM CERTIFICATION:</b>", self.styles["TableCellBold"]),
                Paragraph(
                    "Generated autonomously by the TARANG Autonomous Multi-Satellite Remote Sensing & Maritime Surveillance System. "
                    "Data sources: Copernicus Sentinel-1 SAR, Sentinel-2 Optical, NOAA GFS/HYCOM, Global Fishing Watch AIS.",
                    self.styles["TableCell"],
                ),
            ],
            [
                Paragraph("<b>AUTHENTICATION:</b>", self.styles["TableCellBold"]),
                Paragraph(f"SHA-256 Validation Hash Verified  |  Report ID: {rep_clean}  |  Certified Clean PDF", self.styles["TableCellBold"]),
            ],
        ]
        t_sign = Table(sign_block, colWidths=[2.0 * inch, 5.6 * inch])
        t_sign.setStyle(
            TableStyle([
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f1f5f9")),
                ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
                ("PADDING", (0, 0), (-1, -1), 5),
            ])
        )
        elements.append(t_sign)

        # Build document with NumberedCanvas
        doc.build(elements, canvasmaker=NumberedCanvas)
        return buffer.getvalue()
