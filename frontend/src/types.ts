export interface HistoricalIncident {
  id: string;
  name: string;
  shortName: string;
  lat: number;
  lon: number;
  date: string;
  desc: string;
  area_km2: number;
  type: string;
  country: string;
  severity: 'CRITICAL' | 'HIGH' | 'MODERATE';
}

export interface SimulatedHotspot {
  id: string;
  name: string;
  lat: number;
  lon: number;
  area_km2: number;
  status: string;
  confidence: number;
  region: string;
}

export interface SystemStatus {
  status: string;
  copernicus_cdse_active: boolean;
  mock_mode_default: boolean;
  default_lat: number;
  default_lon: number;
  model_file: string;
  server_time: string;
}

export interface GlobalKPIs {
  total_incidents: number;
  total_area_km2: number;
  active_satellites: string;
  surveillance_status: string;
}

export interface ScanTelemetry {
  spill_pixels: number;
  total_pixels: number;
  spill_coverage_percent: number;
  estimated_spill_area_km2: number;
  perimeter_km?: number;
  confidence_score: number;
  status: 'SPILL' | 'CLEAN';
  threshold_used: number;
  dsp_enhanced: boolean;
  palette: string;
  fai_index?: number;
  optical_confirmed?: boolean;
  verification_status?: string;
}

export interface PolygonVector {
  vertices_count: number;
  perimeter_km: number;
  geojson: {
    type: string;
    coordinates: number[][][];
  };
}

export interface VisualLayers {
  raw_sar?: string | null;
  enhanced_sar?: string | null;
  polygon_overlay?: string | null;
  zoomed_polygon?: string | null;
  super_res_sar?: string | null;
  sentinel1_sar: string | null;
  sentinel2_optical: string | null;
  probability_heatmap: string | null;
  binary_mask: string | null;
  red_overlay: string | null;
}

export interface SatelliteMetadata {
  sentinel1_radar: Record<string, any>;
  sentinel2_optical: Record<string, any>;
}

export interface ScanResponse {
  success: boolean;
  coordinates: { lat: number; lon: number };
  requested_date: string;
  oil_detected: boolean;
  telemetry: ScanTelemetry;
  polygon_vector?: PolygonVector;
  satellite_metadata: SatelliteMetadata;
  visual_layers: VisualLayers;
  timestamp: string;
  characterization_id?: string;
  characterization?: SpillAnalysis;
}

// ==============================================================================
// CHARACTERIZATION & DRIFT INTELLIGENCE TYPES
// ==============================================================================

export interface SpillGeometry {
  boundary: any;
  area_km2: number;
  perimeter_km: number;
  centroid: { lat: number; lon: number };
  bbox: number[];
  length_km: number;
  width_km: number;
  orientation_deg: number;
}

export interface VectorFieldInfo {
  u_mps: number;
  v_mps: number;
  speed_mps: number;
  direction_deg: number;
  cardinal: string;
  source: string;
}

export interface SpillMovement {
  direction_deg: number;
  direction: string;
  speed_mps: number;
  speed_kmh: number;
  speed_knots: number;
  wind_contribution_pct: number;
  current_contribution_pct: number;
  wind: VectorFieldInfo;
  current: VectorFieldInfo;
  is_simulation: boolean;
  mode_label: string;
}

export interface SpreadingObservation {
  timestamp: string;
  area_km2: number;
}

export interface SpreadingInterval {
  from_time: string;
  to_time: string;
  delta_hours: number;
  delta_area_km2: number;
  spread_rate_km2_per_hour: number;
}

export interface SpillSpreading {
  status: string;
  observations_count: number;
  observations: SpreadingObservation[];
  average_spread_rate_km2_per_hour: number | null;
  intervals?: SpreadingInterval[];
  message?: string;
}

export interface SpillSeverity {
  class: string;
  confidence: number;
  type: string;
  calibrated: boolean;
  features_used: Record<string, any>;
  description: string;
}

export interface HindcastResult {
  origin: { lat: number; lon: number };
  origin_time_window: {
    estimated_origin_time: string;
    earliest: string;
    latest: string;
  };
  hours_back: number;
  uncertainty_radius_km: number;
  confidence: number;
  particles_count: number;
  trajectories: number[][][];
  origin_uncertainty_geojson: any;
  is_simulation: boolean;
  mode_label: string;
}

export interface ForecastStep {
  hours: number;
  valid_time: string;
  centroid: { lat: number; lon: number };
  polygon: any;
  uncertainty_radius_km: number;
  confidence: number;
}

export interface ForecastResult {
  forecast: ForecastStep[];
  uncertainty_cone: any;
  trajectories: number[][][];
  confidence: number;
  is_simulation: boolean;
  mode_label: string;
}

export interface SpillAnalysis {
  spill_id: string;
  mask_reference: string;
  timestamp: string;
  geometry: SpillGeometry;
  movement: SpillMovement;
  spreading: SpillSpreading;
  severity: SpillSeverity;
  hindcast: HindcastResult;
  forecast: ForecastResult;
  created_at: string;
  updated_at: string;
}
