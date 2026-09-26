import pytest
import numpy as np
from characterization.config import CharacterizationConfig
from characterization.geometry.geometry_extractor import GeometryExtractor
from characterization.movement.environmental_provider import DemoEnvironmentalProvider, uv_to_speed_dir
from characterization.movement.drift_vector import DriftVectorCalculator
from characterization.spreading.spreading_calculator import SpreadingCalculator, TemporalObservation
from characterization.severity.thickness_estimator import ThicknessEstimator
from characterization.drift.particle_model import LagrangianParticleModel
from characterization.drift.hindcast import HindcastEngine
from characterization.drift.forecast import ForecastEngine
from characterization.uncertainty.dispersion import DispersionAnalyzer
from characterization.engine import CharacterizationEngine


@pytest.fixture
def sample_spill_mask():
    # 256x256 mask with a 40x40 square spill in the center
    mask = np.zeros((256, 256), dtype=np.uint8)
    mask[108:148, 108:148] = 1
    return mask


def test_geometry_extraction(sample_spill_mask):
    extractor = GeometryExtractor(pixel_resolution_meters=20.0)
    result = extractor.extract(
        binary_mask=sample_spill_mask,
        center_lat=-20.438119,
        center_lon=57.744631,
        buffer_deg=0.06,
    )
    assert result is not None
    assert result.area_km2 > 0.0
    assert result.perimeter_km > 0.0
    assert "lat" in result.centroid and "lon" in result.centroid
    assert len(result.bbox) == 4
    assert result.length_km >= result.width_km
    assert result.boundary["type"] == "Feature"
    assert result.boundary["geometry"]["type"] == "Polygon"


def test_uv_to_speed_dir():
    speed, deg, card = uv_to_speed_dir(0.0, 5.0)
    assert speed == 5.0
    assert deg == 0.0
    assert card == "N"

    speed, deg, card = uv_to_speed_dir(5.0, 0.0)
    assert speed == 5.0
    assert deg == 90.0
    assert card == "E"


def test_movement_calculation():
    provider = DemoEnvironmentalProvider()
    env = provider.get_conditions(lat=-20.438119, lon=57.744631, timestamp="2020-08-10T01:37:00Z")
    calc = DriftVectorCalculator(wind_drift_factor=0.03)
    movement = calc.calculate_drift(env)

    assert movement.speed_mps > 0.0
    assert 0.0 <= movement.direction_deg <= 360.0
    assert movement.direction in ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"]
    assert movement.wind_contribution_pct + movement.current_contribution_pct == pytest.approx(100.0, abs=1.0)
    assert movement.is_simulation is True


def test_spreading_calculator():
    calc = SpreadingCalculator()

    # Single observation -> insufficient data
    single = [TemporalObservation(timestamp="2020-08-10 01:00", area_km2=12.0)]
    res_single = calc.calculate(single)
    assert res_single.status == "insufficient_temporal_data"
    assert res_single.average_spread_rate_km2_per_hour is None

    # Multi-observation -> calculated
    multi = [
        TemporalObservation(timestamp="2020-08-10 01:00", area_km2=12.0),
        TemporalObservation(timestamp="2020-08-10 04:00", area_km2=18.0),
    ]
    res_multi = calc.calculate(multi)
    assert res_multi.status == "calculated"
    assert res_multi.average_spread_rate_km2_per_hour == 2.0  # (18 - 12) / 3 = 2.0 km2/h


def test_severity_estimator():
    estimator = ThicknessEstimator()
    sev = estimator.estimate(spill_area_km2=28.5, confidence_score=95.0, fai_index=0.084)
    assert sev.severity_class in ["Thick", "Very Thick"]
    assert sev.confidence > 0.70
    assert sev.calibrated is False
    assert sev.type == "model_based_estimate"


def test_particle_drift_hindcast_and_forecast(sample_spill_mask):
    extractor = GeometryExtractor(pixel_resolution_meters=20.0)
    geom = extractor.extract(sample_spill_mask, -20.438119, 57.744631, 0.06)
    assert geom is not None

    model = LagrangianParticleModel(wind_drift_factor=0.03, horizontal_diffusion_coeff=2.0)
    
    # Hindcast
    hindcast_eng = HindcastEngine(model)
    hind = hindcast_eng.run_hindcast(
        geo_polygon_coords=geom.raw_contour_points_geo,
        observation_time="2020-08-10T01:37:00Z",
        u_oil_mps=-0.41,
        v_oil_mps=0.25,
        hours_back=24,
        num_particles=100,
        timestep_minutes=30,
    )
    assert "lat" in hind.origin and "lon" in hind.origin
    assert hind.uncertainty_radius_km > 0.0
    assert len(hind.trajectories) > 0
    # Verify all backward particle trajectories converge at the probable origin
    for traj in hind.trajectories:
        terminal_lon, terminal_lat = traj[-1][0], traj[-1][1]
        assert abs(terminal_lat - hind.origin["lat"]) < 0.005
        assert abs(terminal_lon - hind.origin["lon"]) < 0.005

    # Forecast
    forecast_eng = ForecastEngine(model)
    fore = forecast_eng.run_forecast(
        geo_polygon_coords=geom.raw_contour_points_geo,
        observation_time="2020-08-10T01:37:00Z",
        u_oil_mps=-0.41,
        v_oil_mps=0.25,
        forecast_hours=[6, 12, 24],
        num_particles=100,
        timestep_minutes=30,
    )
    assert len(fore.forecast_steps) == 3
    assert fore.forecast_steps[0].hours == 6
    assert fore.forecast_steps[-1].hours == 24
    assert fore.uncertainty_cone_geojson["type"] == "Polygon"


def test_end_to_end_characterization(sample_spill_mask):
    engine = CharacterizationEngine()
    analysis = engine.process_spill(
        spill_id="wakashio_test",
        binary_mask=sample_spill_mask,
        center_lat=-20.438119,
        center_lon=57.744631,
        buffer_deg=0.06,
        observation_time="2020-08-10T01:37:00Z",
        confidence_score=96.0,
        fai_index=0.084,
    )
    data = analysis.to_dict()
    assert data["spill_id"] == "wakashio_test"
    assert "geometry" in data
    assert "movement" in data
    assert "spreading" in data
    assert "severity" in data
    assert "hindcast" in data
    assert "forecast" in data
    assert data["movement"]["is_simulation"] is True
