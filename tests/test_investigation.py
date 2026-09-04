import pytest
from characterization.investigation.origin_zones import OriginZoneEngine
from characterization.investigation.vessel_models import InvestigationCategory
from characterization.investigation.gfw_provider import GFWMaritimeDataProvider
from characterization.investigation.ranking_engine import VesselRankingEngine
from characterization.investigation.coastal_warning import CoastalEarlyWarningEngine
from characterization.investigation.orchestrator import InvestigationOrchestrator


def test_origin_zones_generation():
    engine = OriginZoneEngine()
    zones = engine.generate_origin_zones(
        centroid_lat=-20.438119,
        centroid_lon=57.744631,
        base_uncertainty_radius_km=6.5,
        observation_time="2020-08-10T01:37:00Z",
        hours_back=48,
    )
    d = zones.to_dict()

    assert "centroid" in d
    assert "time_window" in d
    assert d["time_window"]["window_duration_hours"] == 7.0
    assert "zones" in d
    assert "high" in d["zones"]
    assert "medium" in d["zones"]
    assert "low" in d["zones"]

    # Verify increasing radial hierarchy: High < Medium < Low
    assert d["zones"]["high"]["radius_km"] < d["zones"]["medium"]["radius_km"]
    assert d["zones"]["medium"]["radius_km"] < d["zones"]["low"]["radius_km"]

    # Verify GeoJSON polygon types
    assert d["zones"]["high"]["polygon"]["type"] == "Polygon"
    assert len(d["zones"]["high"]["polygon"]["coordinates"][0]) >= 3


def test_gfw_maritime_data_provider():
    origin_eng = OriginZoneEngine()
    zones = origin_eng.generate_origin_zones(
        centroid_lat=-20.438119,
        centroid_lon=57.744631,
        base_uncertainty_radius_km=5.0,
        observation_time="2020-08-10T01:37:00Z",
        hours_back=48,
    )

    provider = GFWMaritimeDataProvider()
    candidates = provider.fetch_maritime_intelligence(zones, hours_back=48)

    assert len(candidates) >= 4

    categories = [c.category for c in candidates]
    assert InvestigationCategory.CATEGORY_A_AIS.value in categories
    assert InvestigationCategory.CATEGORY_B_SAR_CORRELATED.value in categories
    assert InvestigationCategory.CATEGORY_C_SAR_UNMATCHED.value in categories

    # Check that AIS-unmatched SAR candidate has SAR detection but no MMSI
    unmatched = [c for c in candidates if c.category == InvestigationCategory.CATEGORY_C_SAR_UNMATCHED.value]
    assert len(unmatched) >= 1
    assert unmatched[0].mmsi is None
    assert len(unmatched[0].sar_detections) > 0
    assert unmatched[0].sar_detections[0].is_ais_matched is False


def test_vessel_ranking_engine():
    origin_eng = OriginZoneEngine()
    zones = origin_eng.generate_origin_zones(
        centroid_lat=-20.438119,
        centroid_lon=57.744631,
        base_uncertainty_radius_km=5.0,
        observation_time="2020-08-10T01:37:00Z",
        hours_back=48,
    )

    provider = GFWMaritimeDataProvider()
    candidates = provider.fetch_maritime_intelligence(zones, hours_back=48)

    ranking_eng = VesselRankingEngine()
    result = ranking_eng.rank_candidates(candidates, zones)

    assert result.total_evaluated == len(candidates)
    assert result.top_score > 70.0
    assert result.candidates[0].investigation_rank == 1

    # Verify scores are strictly ordered descending
    scores = [c.total_score for c in result.candidates]
    assert scores == sorted(scores, reverse=True)

    # Verify explainability reasons exist for all candidates
    for c in result.candidates:
        assert len(c.explainability_reasons) >= 3
        assert 0.0 <= c.total_score <= 100.0


def test_coastal_warning_engine():
    warning_eng = CoastalEarlyWarningEngine()
    coastal_analysis = warning_eng.evaluate_coastal_risk(
        slick_lat=-20.438119,
        slick_lon=57.744631,
        drift_speed_mps=0.48,
        drift_direction_deg=315.0,  # Drifting NW towards Pointe d'Esny / Blue Bay lagoon
        observation_time="2020-08-10T01:37:00Z",
    )
    d = coastal_analysis.to_dict()

    assert d["overall_risk_level"] in ["HIGH", "MODERATE", "LOW"]
    assert d["active_alerts_count"] > 0
    assert len(d["alerts"]) > 0
    assert len(d["receptors"]) > 0

    # High-risk alert checks
    high_alerts = [a for a in d["alerts"] if a["risk_level"] == "HIGH"]
    if high_alerts:
        alert = high_alerts[0]
        assert "Hours" in alert["eta_label"]
        assert len(alert["recommended_actions"]) >= 2
        assert "Boom" in alert["recommended_actions"][0] or "Alert" in alert["recommended_actions"][0]


def test_investigation_orchestrator_end_to_end():
    orchestrator = InvestigationOrchestrator()
    report = orchestrator.run_investigation(
        spill_id="wakashio",
        hindcast_origin={"lat": -20.438119, "lon": 57.744631},
        base_uncertainty_radius_km=5.5,
        observation_time="2020-08-10T01:37:00Z",
        hours_back=48,
        slick_centroid={"lat": -20.438119, "lon": 57.744631},
        drift_speed_mps=0.45,
        drift_direction_deg=310.0,
    )

    d = report.to_dict()
    assert d["spill_id"] == "wakashio"
    assert "report_id" in d
    assert "origin_analysis" in d
    assert "vessel_investigation" in d
    assert "coastal_warning" in d
    assert "markdown_content" in d
    assert "# TARANG MARITIME INVESTIGATION" in d["markdown_content"]
    assert "Candidate Vessel Investigation Priority List" in d["markdown_content"]


def test_investigation_api_endpoints():
    from api import (
        get_spill_probable_origin,
        get_spill_vessels,
        get_spill_coastal_risk,
        get_spill_investigation_report,
        get_spill_investigation_report_pdf,
    )

    # 1. Test Probable Origin endpoint
    origin_data = get_spill_probable_origin("wakashio")
    assert origin_data["spill_id"] == "wakashio"
    assert "origin_zones" in origin_data
    assert "high" in origin_data["origin_zones"]["zones"]

    # 2. Test Vessels endpoint
    vessels_data = get_spill_vessels("wakashio")
    assert "investigation" in vessels_data
    assert len(vessels_data["investigation"]["candidates"]) > 0

    # 3. Test Coastal Risk endpoint
    coastal_data = get_spill_coastal_risk("wakashio")
    assert "coastal_risk" in coastal_data
    assert coastal_data["coastal_risk"]["overall_risk_level"] in ["HIGH", "MODERATE", "LOW"]

    # 4. Test Full Investigation Report endpoint
    report_data = get_spill_investigation_report("wakashio")
    assert report_data["spill_id"] == "wakashio"
    assert "markdown_content" in report_data
    assert "report_id" in report_data

    # 5. Test PDF export endpoint and strict emoji absence
    from characterization.investigation.report_generator import EMOJI_PATTERN
    emojis = EMOJI_PATTERN.findall(report_data["markdown_content"])
    assert len(emojis) == 0, f"Found emojis in markdown report: {emojis}"

    pdf_response = get_spill_investigation_report_pdf("wakashio")
    assert pdf_response.media_type == "application/pdf"
    assert len(pdf_response.body) > 5000
    assert pdf_response.body.startswith(b"%PDF")
