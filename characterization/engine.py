from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Dict, List, Optional
import numpy as np

from .config import CharacterizationConfig
from .geometry.geometry_extractor import GeometryExtractor, SpillGeometryResult
from .movement.environmental_provider import DemoEnvironmentalProvider, EnvironmentalProvider
from .movement.drift_vector import DriftVectorCalculator, SpillMovementResult
from .spreading.spreading_calculator import SpreadingCalculator, SpillSpreadingResult, TemporalObservation
from .severity.thickness_estimator import ThicknessEstimator, SpillSeverityResult
from .drift.particle_model import LagrangianParticleModel
from .drift.hindcast import HindcastEngine, HindcastResult
from .drift.forecast import ForecastEngine, ForecastResult
from .drift.coastal_boundary import CoastalBoundaryService


@dataclass
class SpillAnalysis:
    spill_id: str
    mask_reference: str
    timestamp: str
    geometry: SpillGeometryResult
    movement: SpillMovementResult
    spreading: SpillSpreadingResult
    severity: SpillSeverityResult
    hindcast: HindcastResult
    forecast: ForecastResult
    created_at: str
    updated_at: str

    def to_dict(self) -> Dict[str, Any]:
        return {
            "spill_id": self.spill_id,
            "mask_reference": self.mask_reference,
            "timestamp": self.timestamp,
            "geometry": {
                "boundary": self.geometry.boundary,
                "area_km2": self.geometry.area_km2,
                "perimeter_km": self.geometry.perimeter_km,
                "centroid": self.geometry.centroid,
                "bbox": self.geometry.bbox,
                "length_km": self.geometry.length_km,
                "width_km": self.geometry.width_km,
                "orientation_deg": self.geometry.orientation_deg,
            },
            "movement": {
                "direction_deg": self.movement.direction_deg,
                "direction": self.movement.direction,
                "speed_mps": self.movement.speed_mps,
                "speed_kmh": self.movement.speed_kmh,
                "speed_knots": self.movement.speed_knots,
                "wind_contribution_pct": self.movement.wind_contribution_pct,
                "current_contribution_pct": self.movement.current_contribution_pct,
                "wind": self.movement.wind,
                "current": self.movement.current,
                "is_simulation": self.movement.is_simulation,
                "mode_label": self.movement.mode_label,
                # Shoreline-clamped drift vector endpoints for map rendering
                "drift_vector_coords": self._compute_drift_vector_coords(),
            },
            "spreading": {
                "status": self.spreading.status,
                "observations_count": self.spreading.observations_count,
                "observations": self.spreading.observations,
                "average_spread_rate_km2_per_hour": self.spreading.average_spread_rate_km2_per_hour,
                "intervals": self.spreading.intervals,
                "message": self.spreading.message,
            },
            "severity": {
                "class": self.severity.severity_class,
                "confidence": self.severity.confidence,
                "type": self.severity.type,
                "calibrated": self.severity.calibrated,
                "features_used": self.severity.features_used,
                "description": self.severity.description,
            },
            "hindcast": {
                "origin": self.hindcast.origin,
                "origin_time_window": self.hindcast.origin_time_window,
                "hours_back": self.hindcast.hours_back,
                "uncertainty_radius_km": self.hindcast.uncertainty_radius_km,
                "confidence": self.hindcast.confidence,
                "particles_count": self.hindcast.particles_count,
                "trajectories": self.hindcast.trajectories,
                "origin_uncertainty_geojson": self.hindcast.origin_uncertainty_geojson,
                "is_simulation": self.hindcast.is_simulation,
                "mode_label": self.hindcast.mode_label,
            },
            "forecast": {
                "forecast": [
                    {
                        "hours": step.hours,
                        "valid_time": step.valid_time,
                        "centroid": step.centroid,
                        "polygon": step.polygon,
                        "uncertainty_radius_km": step.uncertainty_radius_km,
                        "confidence": step.confidence,
                    }
                    for step in self.forecast.forecast_steps
                ],
                "uncertainty_cone": self.forecast.uncertainty_cone_geojson,
                "trajectories": self.forecast.trajectories,
                "confidence": self.forecast.overall_confidence,
                "is_simulation": self.forecast.is_simulation,
                "mode_label": self.forecast.mode_label,
            },
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }

    def _compute_drift_vector_coords(self) -> list:
        """Returns [[start_lat, start_lon], [end_lat, end_lon]] for the net drift arrow,
        with the endpoint clamped to the shoreline so it never crosses over dry land."""
        import math
        centroid = self.geometry.centroid  # {"lat": ..., "lon": ...}
        c_lat = centroid["lat"] if isinstance(centroid, dict) else centroid.lat
        c_lon = centroid["lon"] if isinstance(centroid, dict) else centroid.lon

        # Visual arrow length: projected up to 25 km or until shoreline contact
        clamped_pts = CoastalBoundaryService.clip_drift_vector(
            start_lat=c_lat,
            start_lon=c_lon,
            drift_u=self.movement.u_oil_mps,
            drift_v=self.movement.v_oil_mps,
            max_dist_km=25.0,
        )
        # clamped_pts is [(lon0, lat0), (lon1, lat1)] — convert to [[lat, lon], ...] for Leaflet
        return [[pt[1], pt[0]] for pt in clamped_pts]


class SpillAnalysisStore:
    """In-memory repository for storing and retrieving SpillAnalysis records."""

    def __init__(self):
        self._store: Dict[str, SpillAnalysis] = {}

    def save(self, analysis: SpillAnalysis):
        self._store[analysis.spill_id] = analysis

    def get(self, spill_id: str) -> Optional[SpillAnalysis]:
        return self._store.get(spill_id)


class CharacterizationEngine:
    """Master coordinator executing full oil spill characterization pipeline."""

    def __init__(self, config: Optional[CharacterizationConfig] = None):
        self.config = config or CharacterizationConfig()
        self.geometry_extractor = GeometryExtractor(self.config.pixel_resolution_meters)
        self.env_provider = DemoEnvironmentalProvider()
        self.movement_calc = DriftVectorCalculator(self.config.wind_drift_factor)
        self.spreading_calc = SpreadingCalculator()
        self.severity_estimator = ThicknessEstimator()
        self.particle_model = LagrangianParticleModel(
            wind_drift_factor=self.config.wind_drift_factor,
            horizontal_diffusion_coeff=self.config.horizontal_diffusion_coeff,
        )
        self.hindcast_engine = HindcastEngine(self.particle_model)
        self.forecast_engine = ForecastEngine(self.particle_model)
        self.store = SpillAnalysisStore()

    def process_spill(
        self,
        spill_id: str,
        binary_mask: np.ndarray,
        center_lat: float,
        center_lon: float,
        buffer_deg: float = 0.06,
        observation_time: Optional[str] = None,
        confidence_score: float = 95.0,
        fai_index: float = 0.084,
        historical_observations: Optional[List[TemporalObservation]] = None,
    ) -> SpillAnalysis:
        obs_time = observation_time or datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")

        # 1. Geometry
        geometry = self.geometry_extractor.extract(
            binary_mask=binary_mask,
            center_lat=center_lat,
            center_lon=center_lon,
            buffer_deg=buffer_deg,
        )
        if geometry is None:
            raise ValueError(f"No significant oil spill region found in mask for spill {spill_id}.")

        # 2. Environmental & Movement Drift
        env = self.env_provider.get_conditions(center_lat, center_lon, obs_time)
        movement = self.movement_calc.calculate_drift(env)

        # 3. Spreading Rate
        obs_list = historical_observations or [TemporalObservation(timestamp=obs_time, area_km2=geometry.area_km2)]
        spreading = self.spreading_calc.calculate(obs_list)

        # 4. Severity
        severity = self.severity_estimator.estimate(
            spill_area_km2=geometry.area_km2,
            confidence_score=confidence_score,
            fai_index=fai_index,
            wind_speed_mps=env.wind.speed_mps,
        )

        # 5. Hindcast (Probable Origin)
        hindcast = self.hindcast_engine.run_hindcast(
            geo_polygon_coords=geometry.raw_contour_points_geo,
            observation_time=obs_time,
            u_oil_mps=movement.u_oil_mps,
            v_oil_mps=movement.v_oil_mps,
            hours_back=self.config.hindcast_hours,
            num_particles=self.config.default_particle_count,
            timestep_minutes=self.config.default_timestep_minutes,
            is_simulation=env.is_simulation,
            mode_label=env.mode_label,
        )

        # 6. Forecast
        forecast = self.forecast_engine.run_forecast(
            geo_polygon_coords=geometry.raw_contour_points_geo,
            observation_time=obs_time,
            u_oil_mps=movement.u_oil_mps,
            v_oil_mps=movement.v_oil_mps,
            forecast_hours=self.config.forecast_hours,
            num_particles=self.config.default_particle_count,
            timestep_minutes=self.config.default_timestep_minutes,
            is_simulation=env.is_simulation,
            mode_label=env.mode_label,
        )

        analysis = SpillAnalysis(
            spill_id=spill_id,
            mask_reference=f"mask_{spill_id}.png",
            timestamp=obs_time,
            geometry=geometry,
            movement=movement,
            spreading=spreading,
            severity=severity,
            hindcast=hindcast,
            forecast=forecast,
            created_at=datetime.utcnow().isoformat() + "Z",
            updated_at=datetime.utcnow().isoformat() + "Z",
        )

        self.store.save(analysis)
        return analysis
