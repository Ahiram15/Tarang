export interface IncidentLocation {
  id: string;
  name: string;
  badge: string;
  lat: number;
  lon: number;
  date: string;
  spillId: string;
}

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
  landsat_optical?: string | null;
  sentinel1_pass2?: string | null;
  eos06_alternative?: string | null;
}

export interface SatelliteMetadata {
  sentinel1_radar: Record<string, any>;
  sentinel2_optical: Record<string, any>;
  sentinel1_pass2?: Record<string, any>;
  landsat8?: Record<string, any>;
  eos06_note?: Record<string, any>;
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
  investigation?: InvestigationPriorityReport;
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
  drift_vector_coords?: [number, number][];
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
  investigation?: InvestigationPriorityReport;
  created_at: string;
  updated_at: string;
}

// ==============================================================================
// AI MARITIME INVESTIGATION & COASTAL EARLY WARNING TYPES
// ==============================================================================

export interface OriginZoneTier {
  tier: string;
  label: string;
  confidence: number;
  radius_km: number;
  area_km2: number;
  polygon: any;
  description: string;
}

export interface ProbableReleaseTimeWindow {
  estimated_time: string;
  window_earliest: string;
  window_latest: string;
  window_duration_hours: number;
  confidence_level: number;
  basis: string;
}

export interface ProbableOriginZones {
  centroid: { lat: number; lon: number };
  time_window: ProbableReleaseTimeWindow;
  zones: {
    high: OriginZoneTier;
    medium: OriginZoneTier;
    low: OriginZoneTier;
  };
  spatial_uncertainty_boundary: any;
  summary: string;
}

export interface VesselWaypoint {
  lat: number;
  lon: number;
  timestamp: string;
  speed_knots: number;
  course_deg: number;
}

export interface AISGap {
  start_time: string;
  end_time: string;
  duration_hours: number;
  last_known_pos: { lat: number; lon: number };
  first_known_pos: { lat: number; lon: number };
  distance_during_gap_km: number;
  overlaps_release_window: boolean;
  notes: string;
}

export interface SARVesselDetection {
  detection_id: string;
  timestamp: string;
  lat: number;
  lon: number;
  estimated_length_m: number;
  estimated_width_m: number;
  confidence: number;
  is_ais_matched: boolean;
  matched_mmsi?: string | null;
  sensor: string;
  notes?: string;
}

export interface CandidateVessel {
  vessel_id: string;
  name: string;
  mmsi?: string | null;
  imo?: string | null;
  callsign?: string | null;
  flag: string;
  vessel_type: string;
  category: string;
  length_m: number;
  beam_m: number;
  trajectory: VesselWaypoint[];
  ais_gaps: AISGap[];
  sar_detections: SARVesselDetection[];
  min_distance_to_origin_km: number;
  entered_origin_zone: boolean;
  origin_zone_tier: string;
  time_overlap_hours: number;
  trajectory_intersects_origin: boolean;
  drift_alignment_cosine: number;
  score_breakdown: {
    spatial: number;
    temporal: number;
    trajectory: number;
    drift: number;
    ais_gap: number;
    vessel_type: number;
  };
  total_score: number;
  investigation_rank: number;
  explainability_reasons: string[];
}

export interface RankedVesselInvestigation {
  candidates: CandidateVessel[];
  total_evaluated: number;
  category_counts: Record<string, number>;
  top_candidate: {
    id: string;
    name: string;
    score: number;
  };
  summary: string;
}

export interface CoastalAlert {
  alert_id: string;
  receptor_id: string;
  location_name: string;
  receptor_type: string;
  risk_level: 'HIGH' | 'MODERATE' | 'LOW';
  eta_hours_min: number;
  eta_hours_max: number;
  eta_label: string;
  impact_probability_pct: number;
  potential_threat: string;
  recommended_actions: string[];
  alert_timestamp: string;
  status: string;
}

export interface CoastalReceptor {
  receptor_id: string;
  name: string;
  receptor_type: string;
  lat: number;
  lon: number;
  sensitivity_level: string;
  distance_to_slick_km: number;
  description: string;
}

export interface CoastalRiskAnalysis {
  overall_risk_level: 'HIGH' | 'MODERATE' | 'LOW';
  earliest_eta_hours: number | null;
  earliest_impact_location: string | null;
  active_alerts_count: number;
  alerts: CoastalAlert[];
  receptors: CoastalReceptor[];
  coastal_drift_vector: any;
  summary: string;
}

export interface CounterfactualDriftMatch {
  iou: number;
  centroid_error_km: number;
  arrival_error_hours: number;
  area_difference_pct: number;
  shape_similarity_pct: number;
  consistency_score: number;
  simulated_slick_polygon?: any;
  notes?: string;
}

export type PlausibleSourceType = 'vessel' | 'port' | 'pipeline' | 'platform' | 'industrial' | 'natural_seep';
export type SourceCategoryGroup = 'Vessel-related' | 'Land / Infrastructure' | 'Natural Seep';

export interface PlausibleSourceCandidate {
  source_id: string;
  name: string;
  source_type: PlausibleSourceType;
  category_group: SourceCategoryGroup;
  lat: number;
  lon: number;
  geometry?: any;
  buffer_radius_km: number;
  distance_to_origin_km: number;
  distance_score: number;
  origin_overlap: boolean;
  origin_overlap_score: number;
  transport_compatibility_score: number;
  is_upwind_upcurrent: boolean;
  drift_relative_angle_deg: number;
  historical_persistence_score: number;
  recurrence_observations_count?: number;
  historical_spill_records?: string[];
  time_compatibility_score?: number;
  trajectory_compatibility_score?: number;
  counterfactual_drift_score?: number;
  behavioural_consistency_score?: number;
  counterfactual_simulation?: CounterfactualDriftMatch | null;
  vessel_metadata?: Record<string, any> | null;
  component_scores: Record<string, number>;
  raw_evidence_score: number;
  relative_evidence_pct: number;
  rank: number;
  explainability_reasons: string[];
  scientific_status: 'Observed' | 'Modelled' | 'Hypothesis' | 'Uncertainty';
  source_specific_details?: Record<string, any>;
}

export interface EvidenceWeightConfig {
  vessel_weights: {
    w1_spatial: number;
    w2_temporal: number;
    w3_trajectory: number;
    w4_counterfactual: number;
    w5_behavioural: number;
  };
  infrastructure_weights: {
    w1_spatial: number;
    w2_origin_overlap: number;
    w3_transport: number;
    w4_persistence: number;
  };
  seep_weights: {
    w1_spatial: number;
    w2_origin_overlap: number;
    w3_transport: number;
    w4_persistence: number;
  };
  distance_thresholds_km: {
    very_strong: number;
    strong: number;
    moderate: number;
    weak: number;
  };
}

export interface MultiSourceEvidenceComparison {
  candidates: PlausibleSourceCandidate[];
  total_sources_evaluated: number;
  category_summary: Record<string, number>;
  top_candidate: Record<string, any>;
  scientific_interpretation: string;
  uncertainty_level: 'HIGH' | 'MODERATE' | 'LOW';
  competing_hypotheses_flag: boolean;
  weights_config: EvidenceWeightConfig;
  summary: string;
}

export interface InvestigationPriorityReport {
  report_id: string;
  spill_id: string;
  generated_at: string;
  origin_analysis: ProbableOriginZones;
  vessel_investigation: RankedVesselInvestigation;
  coastal_warning: CoastalRiskAnalysis;
  multi_source_comparison?: MultiSourceEvidenceComparison;
  markdown_content: string;
}

export interface EmailDispatchRequest {
  recipients: string[];
  subject: string;
  message: string;
  include_pdf: boolean;
  agency_notes?: string;
  urgency_level?: 'CRITICAL' | 'HIGH' | 'TACTICAL';
}

export interface EmailDispatchResponse {
  status: string;
  tracking_id: string;
  timestamp: string;
  recipients: string[];
  subject: string;
  pdf_attached: boolean;
  mode: 'smtp' | 'simulated';
  urgency_level: string;
  smtp_error?: string | null;
  message: string;
  delivery_details?: {
    agencies_notified: string[];
    pdf_filename?: string | null;
    pdf_size_bytes?: number;
    spill_id: string;
  };
}

