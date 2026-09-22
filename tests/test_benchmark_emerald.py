"""
Automated Pytest Suite for Emerald Oil Spill Historical Benchmark
================================================================
Validates the end-to-end forensic verification pipeline for the
February 2021 MT EMERALD (IMO 9231224) incident in the Levantine Basin.
"""

import os
import pytest
import numpy as np
from fastapi.testclient import TestClient

from backend.modules.benchmark_emerald import (
    EMERALD_DOSSIER,
    EMERALD_AIS_TRACK,
    generate_emerald_sar_patch,
    run_cfar_candidate_detection,
    run_unet_delineation,
    extract_and_verify_features,
    simulate_opendrift_backtracking,
    calculate_attribution_score,
    generate_emerald_enforcement_pdf,
    run_emerald_benchmark,
)
from api import app


client = TestClient(app)


def test_emerald_dossier_integrity():
    """Validates that all official factual incident parameters are properly declared."""
    assert EMERALD_DOSSIER["incident_id"] == "EMERALD_2021_MED"
    vessel = EMERALD_DOSSIER["vessel"]
    assert vessel["name"] == "EMERALD"
    assert vessel["imo"] == 9231224
    assert vessel["mmsi"] == 372469000
    assert vessel["flag"] == "Panama"
    assert vessel["ship_type"] == "Crude Oil Tanker"

    satellites = EMERALD_DOSSIER["satellites"]
    assert "S1A_IW_GRDH_1SDV_20210205T035017" in satellites["primary_scene"]
    assert "S1A_IW_GRDH_1SDV_20210211T035017" in satellites["secondary_scene"]
    assert satellites["aoi_bbox"] == [33.50, 32.50, 35.50, 34.50]

    discharge = EMERALD_DOSSIER["discharge"]
    assert discharge["probable_release_centroid"]["lat"] == 33.15
    assert discharge["probable_release_centroid"]["lon"] == 34.20
    assert discharge["probable_release_centroid"]["uncertainty_radius_km"] == 25.0


def test_emerald_ais_track_and_blackout_fixture():
    """Validates the 6-point AIS trajectory including the 8-hour blackout gap."""
    assert len(EMERALD_AIS_TRACK) == 6

    # Normal cruising speed prior to blackout
    assert EMERALD_AIS_TRACK[0]["speed_knots"] > 13.0
    assert EMERALD_AIS_TRACK[1]["ais_transponder"].startswith("ACTIVE")

    # Dark-ship gap points
    gap_points = [p for p in EMERALD_AIS_TRACK if p.get("is_gap")]
    assert len(gap_points) == 2
    for gp in gap_points:
        assert gp["speed_knots"] < 10.0  # Slowed down for discharge
        assert gp["proximity_to_origin_km"] < 25.0

    # Reappearance
    assert "ACTIVE" in EMERALD_AIS_TRACK[4]["ais_transponder"]


def test_step_a_synthetic_sar_patch_generation():
    """Validates Step A synthetic SAR patch dimensions and contrast."""
    sar_img, mask = generate_emerald_sar_patch(size=512)
    assert sar_img.shape == (512, 512)
    assert mask.shape == (512, 512)
    assert sar_img.dtype == np.uint8

    # Sea clutter should be significantly brighter than slick pixels
    slick_mean = float(np.mean(sar_img[mask > 0]))
    sea_mean = float(np.mean(sar_img[mask == 0]))
    assert sea_mean > 120.0
    assert slick_mean < 60.0
    assert sea_mean - slick_mean > 60.0


def test_step_b_cfar_candidate_detection():
    """Validates Step B CA-CFAR filter and morphological closing candidate detection."""
    sar_img, _ = generate_emerald_sar_patch(size=512)
    cfar_res = run_cfar_candidate_detection(sar_img)

    assert cfar_res["candidate_detected"] is True
    assert cfar_res["detected_area_pixels"] > 500
    bbox = cfar_res["bounding_box_pixels"]
    assert len(bbox) == 4
    # Check bounding box encompasses part of the ribbon
    assert bbox[2] > bbox[0]
    assert bbox[3] > bbox[1]


def test_step_c_unet_delineation_and_geojson():
    """Validates Step C U-Net delineation and GeoJSON formatting."""
    sar_img, _ = generate_emerald_sar_patch(size=512)
    unet_res = run_unet_delineation(sar_img, [50, 50, 450, 450])

    geojson = unet_res["geojson"]
    assert geojson["type"] == "Feature"
    assert geojson["geometry"]["type"] == "Polygon"
    coords = geojson["geometry"]["coordinates"][0]
    assert len(coords) >= 4
    # Check coordinates are in Levantine Basin AOI [33.5 to 34.2 lon, 33.15 to 33.70 lat]
    for pt in coords:
        assert 33.0 <= pt[0] <= 34.5
        assert 33.0 <= pt[1] <= 34.0
    # Must be closed polygon
    assert coords[0] == coords[-1]
    assert unet_res["estimated_area_km2"] > 20.0


def test_step_d_tabular_features_and_xgboost():
    """Validates Step D feature extraction and XGBoost classification score > 0.85."""
    sar_img, mask = generate_emerald_sar_patch(size=512)
    features_res = extract_and_verify_features(sar_img, mask)

    feats = features_res["tabular_features"]
    assert feats["contrast_ratio"] > 0.50
    assert feats["damping_ratio_db"] > 5.0
    assert feats["elongation_ratio"] > 2.0

    xgb_val = features_res["xgboost_validation"]
    assert xgb_val["verified"] is True
    assert xgb_val["confidence"] >= 0.85
    assert xgb_val["classification_result"] == "CONFIRMED_MINERAL_OIL_SLICK"


def test_step_e_opendrift_backtracking_trajectory():
    """Validates Step E Lagrangian particle backward trajectory reaching release corridor."""
    drift_res = simulate_opendrift_backtracking()

    assert drift_res["total_backtrack_hours"] == 78
    assert drift_res["inside_uncertainty_cone"] is True
    assert drift_res["distance_to_target_origin_km"] < 25.0
    waypoints = drift_res["trajectory_waypoints"]
    assert len(waypoints) >= 5

    # Origin arrival point
    origin_pt = drift_res["terminal_backtracked_point"]
    assert abs(origin_pt["lat"] - 33.15) < 0.25
    assert abs(origin_pt["lon"] - 34.20) < 0.25


def test_step_f_attribution_evidence_score():
    """Validates Step F attribution scoring rubric and >= 92% benchmark threshold."""
    attribution = calculate_attribution_score()

    score = attribution["overall_attribution_score"]
    assert score >= 92.0
    assert attribution["meets_threshold_92pct"] is True
    assert attribution["confidence_grade"] == "HIGH_CONFIDENCE_PRIMARY_PERPETRATOR"

    suspect = attribution["suspect_vessel"]
    assert suspect["name"] == "EMERALD"
    assert suspect["imo"] == 9231224
    assert suspect["status"] == "FLAGGED_LEGAL_ENFORCEMENT_TARGET"

    # Verify all 6 factors are accounted for
    factors = {f["factor"]: f["score"] for f in attribution["factor_breakdown"]}
    assert "Spatial Proximity" in factors
    assert "Temporal Window Overlap" in factors
    assert "Track Lingering / Speed Anomaly" in factors
    assert "SAR Echo Corroboration" in factors
    assert "Kinematics & Drift Consistency" in factors
    assert "Vessel Risk Class & Ownership" in factors


def test_step_g_pdf_generation_and_sha256_seal(tmp_path):
    """Validates Step G court-ready PDF generation and SHA-256 digest creation."""
    benchmark = run_emerald_benchmark(offline_only=True)
    pdf_bytes, sha256_hash, file_path = generate_emerald_enforcement_pdf(
        benchmark["full_benchmark_telemetry"],
        output_dir=str(tmp_path),
    )

    assert len(pdf_bytes) > 2000
    assert pdf_bytes.startswith(b"%PDF")
    assert len(sha256_hash) == 64
    assert os.path.exists(file_path)


def test_end_to_end_emerald_benchmark_pipeline():
    """Validates the full run_emerald_benchmark orchestration execution."""
    res = run_emerald_benchmark(offline_only=True)

    assert res["benchmark_status"] == "SUCCESS"
    assert res["vessel_target"] == "EMERALD (IMO 9231224)"
    assert res["attribution_score"] >= 92.0
    assert res["meets_threshold_92pct"] is True
    assert "spill_geojson" in res
    assert "backtracked_trajectory" in res
    assert "suspect_vessel" in res
    assert "docket_pdf_url" in res
    assert "sha256_hash" in res
    assert len(res["sha256_hash"]) == 64
    assert res["resend_status"]["delivered"] is True


def test_fastapi_replay_emerald_endpoint():
    """Validates the POST and GET /api/v1/demo/replay-emerald FastAPI endpoints."""
    # POST
    post_res = client.post("/api/v1/demo/replay-emerald")
    assert post_res.status_code == 200
    data = post_res.json()
    assert data["benchmark_status"] == "SUCCESS"
    assert data["attribution_score"] >= 92.0
    assert data["suspect_vessel"]["imo"] == 9231224
    assert len(data["sha256_hash"]) == 64

    # GET
    get_res = client.get("/api/v1/demo/replay-emerald")
    assert get_res.status_code == 200
    assert get_res.json()["benchmark_status"] == "SUCCESS"


def test_fastapi_emerald_docket_pdf_endpoint():
    """Validates the GET /api/v1/demo/emerald-docket.pdf endpoint."""
    pdf_res = client.get("/api/v1/demo/emerald-docket.pdf")
    assert pdf_res.status_code == 200
    assert pdf_res.headers["content-type"] == "application/pdf"
    assert pdf_res.content.startswith(b"%PDF")
    assert len(pdf_res.content) > 2000
