import React, { useState } from 'react';
import {
  PlausibleSourceCandidate,
  MultiSourceEvidenceComparison,
  EvidenceWeightConfig,
  CounterfactualDriftMatch,
} from '../types';
import {
  Ship,
  Anchor,
  Activity,
  Compass,
  Sliders,
  RotateCcw,
  Info,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  TrendingUp,
  MapPin,
  Waves,
  ChevronDown,
  ChevronUp,
  Eye,
  Crosshair,
  Shield,
  Layers,
  Sparkles,
} from 'lucide-react';

interface SourceHypothesisSuiteProps {
  multiSourceComparison?: MultiSourceEvidenceComparison;
  selectedSourceId: string | null;
  onSelectSource: (source: PlausibleSourceCandidate) => void;
  onUpdateWeights?: (weights: EvidenceWeightConfig) => void;
  originLat: number;
  originLon: number;
  originUncertaintyKm: number;
  onFocusOrigin?: () => void;
  showSimulatedSlick?: boolean;
  onToggleSimulatedSlick?: (show: boolean) => void;
}

export const SourceHypothesisSuite: React.FC<SourceHypothesisSuiteProps> = ({
  multiSourceComparison,
  selectedSourceId,
  onSelectSource,
  onUpdateWeights,
  originLat,
  originLon,
  originUncertaintyKm,
  onFocusOrigin,
  showSimulatedSlick,
  onToggleSimulatedSlick,
}) => {
  const [showWeightsConfig, setShowWeightsConfig] = useState(false);
  const [showOriginModal, setShowOriginModal] = useState(false);
  const [expandedSourceId, setExpandedSourceId] = useState<string | null>(
    selectedSourceId || (multiSourceComparison?.candidates[0]?.source_id ?? null)
  );

  // Local configurable weights state
  const defaultWeights: EvidenceWeightConfig = multiSourceComparison?.weights_config || {
    vessel_weights: {
      w1_spatial: 0.25,
      w2_temporal: 0.2,
      w3_trajectory: 0.2,
      w4_counterfactual: 0.2,
      w5_behavioural: 0.15,
    },
    infrastructure_weights: {
      w1_spatial: 0.35,
      w2_origin_overlap: 0.25,
      w3_transport: 0.25,
      w4_persistence: 0.15,
    },
    seep_weights: {
      w1_spatial: 0.35,
      w2_origin_overlap: 0.25,
      w3_transport: 0.2,
      w4_persistence: 0.2,
    },
    distance_thresholds_km: {
      very_strong: 5.0,
      strong: 10.0,
      moderate: 25.0,
      weak: 50.0,
    },
  };

  const [weights, setWeights] = useState<EvidenceWeightConfig>(defaultWeights);

  if (!multiSourceComparison || !multiSourceComparison.candidates || multiSourceComparison.candidates.length === 0) {
    return (
      <div style={{ padding: '1.25rem', color: '#94a3b8', fontSize: '0.85rem', textAlign: 'center' }}>
        <Info size={28} style={{ margin: '0 auto 0.5rem', color: '#64748b' }} />
        <div>Computing multi-source spatial-temporal compatibility matrix...</div>
      </div>
    );
  }

  const candidates = multiSourceComparison.candidates;
  const selectedCandidate = candidates.find((c) => c.source_id === selectedSourceId) || candidates[0];

  const getSourceIcon = (type: string) => {
    switch (type) {
      case 'vessel':
        return <Ship size={15} color="#38bdf8" />;
      case 'port':
        return <Anchor size={15} color="#f59e0b" />;
      case 'pipeline':
        return <Activity size={15} color="#f97316" />;
      case 'platform':
        return <Layers size={15} color="#a855f7" />;
      case 'industrial':
        return <Waves size={15} color="#38bdf8" />;
      case 'natural_seep':
        return <Sparkles size={15} color="#10b981" />;
      default:
        return <MapPin size={15} color="#94a3b8" />;
    }
  };

  const getSourceColor = (type: string) => {
    switch (type) {
      case 'vessel':
        return '#38bdf8';
      case 'port':
        return '#f59e0b';
      case 'pipeline':
        return '#f97316';
      case 'platform':
        return '#a855f7';
      case 'industrial':
        return '#38bdf8';
      case 'natural_seep':
        return '#10b981';
      default:
        return '#94a3b8';
    }
  };

  const getProgressBarColor = (score: number) => {
    if (score >= 70) return 'linear-gradient(90deg, #10b981, #059669)';
    if (score >= 45) return 'linear-gradient(90deg, #f59e0b, #d97706)';
    return 'linear-gradient(90deg, #64748b, #475569)';
  };

  const handleWeightChange = (category: 'vessel' | 'infrastructure' | 'seep', key: string, value: number) => {
    const updated = { ...weights };
    if (category === 'vessel') {
      (updated.vessel_weights as any)[key] = value;
    } else if (category === 'infrastructure') {
      (updated.infrastructure_weights as any)[key] = value;
    } else {
      (updated.seep_weights as any)[key] = value;
    }
    setWeights(updated);
    if (onUpdateWeights) onUpdateWeights(updated);
  };

  const handleResetWeights = () => {
    setWeights(defaultWeights);
    if (onUpdateWeights) onUpdateWeights(defaultWeights);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* 1. Header & Scientific Guardrails Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.9) 100%)',
          borderRadius: '10px',
          padding: '1rem',
          border: '1px solid rgba(56, 189, 248, 0.2)',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                background: 'rgba(56, 189, 248, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(56, 189, 248, 0.4)',
              }}
            >
              <Crosshair size={16} color="#38bdf8" />
            </div>
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc', letterSpacing: '0.3px' }}>
                SOURCE EVIDENCE COMPARISON
              </div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                Multi-Hypothesis Spatial, Temporal & Hydrodynamic Evidence Matrix
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <button
              onClick={() => setShowWeightsConfig(!showWeightsConfig)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                background: showWeightsConfig ? 'rgba(56, 189, 248, 0.25)' : 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                borderRadius: '6px',
                padding: '0.35rem 0.65rem',
                color: '#38bdf8',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
              title="Configure evidence weighting factors and distance thresholds"
            >
              <Sliders size={13} />
              Weights
            </button>

            <button
              onClick={() => setShowOriginModal(!showOriginModal)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                background: 'rgba(234, 179, 8, 0.15)',
                border: '1px solid rgba(234, 179, 8, 0.4)',
                borderRadius: '6px',
                padding: '0.35rem 0.65rem',
                color: '#eab308',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
              title="Inspect Probable Origin Coordinates & Nearby Distances"
            >
              <MapPin size={13} />
              Origin
            </button>
          </div>
        </div>

        {/* Required Mandatory Label */}
        <div
          style={{
            background: 'rgba(2, 6, 23, 0.65)',
            borderLeft: '3px solid #38bdf8',
            padding: '0.45rem 0.65rem',
            borderRadius: '0 6px 6px 0',
            fontSize: '0.72rem',
            color: '#cbd5e1',
            lineHeight: 1.4,
          }}
        >
          <span style={{ fontWeight: 700, color: '#38bdf8' }}>Relative evidence score</span> — not a calibrated probability of legal responsibility. Heuristic physical compatibility metric.
        </div>
      </div>

      {/* 2. Configurable Weights Drawer (if opened) */}
      {showWeightsConfig && (
        <div
          style={{
            background: '#090d16',
            borderRadius: '8px',
            padding: '1rem',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f8fafc' }}>
              EVIDENCE WEIGHT CONFIGURATION (HEURISTIC)
            </span>
            <button
              onClick={handleResetWeights}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                fontSize: '0.72rem',
                cursor: 'pointer',
              }}
            >
              <RotateCcw size={12} /> Reset Defaults
            </button>
          </div>

          <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
            Weights are configurable heuristics unless calibrated using historical benchmark cases. Adjust component significance below:
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.6rem' }}>
            {/* Vessel Weights */}
            <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '0.6rem', borderRadius: '6px' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#38bdf8', marginBottom: '0.3rem' }}>
                Vessel Weights
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.7rem' }}>
                <label style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
                  <span>Spatial Proximity (w1):</span>
                  <span>{weights.vessel_weights.w1_spatial.toFixed(2)}</span>
                </label>
                <input
                  type="range"
                  min="0.05"
                  max="0.5"
                  step="0.05"
                  value={weights.vessel_weights.w1_spatial}
                  onChange={(e) => handleWeightChange('vessel', 'w1_spatial', parseFloat(e.target.value))}
                />

                <label style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
                  <span>Time Match (w2):</span>
                  <span>{weights.vessel_weights.w2_temporal.toFixed(2)}</span>
                </label>
                <input
                  type="range"
                  min="0.05"
                  max="0.5"
                  step="0.05"
                  value={weights.vessel_weights.w2_temporal}
                  onChange={(e) => handleWeightChange('vessel', 'w2_temporal', parseFloat(e.target.value))}
                />

                <label style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
                  <span>Counterfactual Drift (w4):</span>
                  <span>{weights.vessel_weights.w4_counterfactual.toFixed(2)}</span>
                </label>
                <input
                  type="range"
                  min="0.05"
                  max="0.5"
                  step="0.05"
                  value={weights.vessel_weights.w4_counterfactual}
                  onChange={(e) => handleWeightChange('vessel', 'w4_counterfactual', parseFloat(e.target.value))}
                />
              </div>
            </div>

            {/* Infrastructure & Seep Weights */}
            <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '0.6rem', borderRadius: '6px' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f59e0b', marginBottom: '0.3rem' }}>
                Infrastructure / Seep Weights
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.7rem' }}>
                <label style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
                  <span>Spatial Distance (w1):</span>
                  <span>{weights.infrastructure_weights.w1_spatial.toFixed(2)}</span>
                </label>
                <input
                  type="range"
                  min="0.05"
                  max="0.5"
                  step="0.05"
                  value={weights.infrastructure_weights.w1_spatial}
                  onChange={(e) => handleWeightChange('infrastructure', 'w1_spatial', parseFloat(e.target.value))}
                />

                <label style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
                  <span>Origin Overlap (w2):</span>
                  <span>{weights.infrastructure_weights.w2_origin_overlap.toFixed(2)}</span>
                </label>
                <input
                  type="range"
                  min="0.05"
                  max="0.5"
                  step="0.05"
                  value={weights.infrastructure_weights.w2_origin_overlap}
                  onChange={(e) => handleWeightChange('infrastructure', 'w2_origin_overlap', parseFloat(e.target.value))}
                />

                <label style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
                  <span>Transport Match (w3):</span>
                  <span>{weights.infrastructure_weights.w3_transport.toFixed(2)}</span>
                </label>
                <input
                  type="range"
                  min="0.05"
                  max="0.5"
                  step="0.05"
                  value={weights.infrastructure_weights.w3_transport}
                  onChange={(e) => handleWeightChange('infrastructure', 'w3_transport', parseFloat(e.target.value))}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Probable Origin Inspection Side Modal / Card */}
      {showOriginModal && (
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(20, 24, 39, 0.98) 0%, rgba(10, 15, 29, 0.95) 100%)',
            borderRadius: '8px',
            padding: '1rem',
            border: '1px solid rgba(234, 179, 8, 0.4)',
            boxShadow: '0 6px 20px rgba(0, 0, 0, 0.5)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#eab308', fontWeight: 700, fontSize: '0.85rem' }}>
              <Crosshair size={16} /> PROBABLE ORIGIN INSPECTION
            </div>
            <button
              onClick={() => setShowOriginModal(false)}
              style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '0.85rem', cursor: 'pointer' }}
            >
              ✕
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem', fontSize: '0.75rem' }}>
            <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '0.5rem', borderRadius: '6px' }}>
              <span style={{ color: '#94a3b8' }}>Hindcast Location:</span>
              <div style={{ color: '#f8fafc', fontWeight: 600, marginTop: '2px' }}>
                {originLat.toFixed(3)}°N, {originLon.toFixed(3)}°E
              </div>
            </div>
            <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '0.5rem', borderRadius: '6px' }}>
              <span style={{ color: '#94a3b8' }}>Uncertainty Radius:</span>
              <div style={{ color: '#eab308', fontWeight: 600, marginTop: '2px' }}>
                ±{originUncertaintyKm.toFixed(1)} km (3σ)
              </div>
            </div>
          </div>

          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.4rem' }}>
            Nearby Sources (Sorted by Distance):
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', maxHeight: '140px', overflowY: 'auto' }}>
            {candidates
              .slice()
              .sort((a, b) => a.distance_to_origin_km - b.distance_to_origin_km)
              .map((src) => (
                <div
                  key={src.source_id}
                  onClick={() => {
                    onSelectSource(src);
                    setExpandedSourceId(src.source_id);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: selectedCandidate.source_id === src.source_id ? 'rgba(56, 189, 248, 0.15)' : 'rgba(15, 23, 42, 0.4)',
                    padding: '0.35rem 0.5rem',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.72rem',
                    border: selectedCandidate.source_id === src.source_id ? '1px solid #38bdf8' : '1px solid transparent',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    {getSourceIcon(src.source_type)}
                    <span style={{ color: '#f1f5f9', fontWeight: 500 }}>{src.name.split('(')[0]}</span>
                  </div>
                  <span style={{ color: '#eab308', fontWeight: 600 }}>{src.distance_to_origin_km.toFixed(1)} km</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* 4. Horizontal Source Evidence Comparison Bars */}
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.9)',
          borderRadius: '8px',
          padding: '1rem',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#cbd5e1', letterSpacing: '0.3px' }}>
            RELATIVE EVIDENCE RANKING
          </span>
          <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
            {candidates.length} Plausible Sources Evaluated
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          {candidates.map((src) => {
            const isSelected = selectedCandidate?.source_id === src.source_id;
            const isExpanded = expandedSourceId === src.source_id;
            const score = src.raw_evidence_score;

            return (
              <div
                key={src.source_id}
                style={{
                  background: isSelected ? 'rgba(30, 41, 59, 0.85)' : 'rgba(15, 23, 42, 0.6)',
                  border: isSelected ? `1.5px solid ${getSourceColor(src.source_type)}` : '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '6px',
                  padding: '0.65rem 0.75rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onClick={() => {
                  onSelectSource(src);
                  setExpandedSourceId(isExpanded ? null : src.source_id);
                }}
              >
                {/* Top Row: Name + Type Badge + Score */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <div style={{ transform: 'scale(1.1)' }}>{getSourceIcon(src.source_type)}</div>
                    <span style={{ color: '#f8fafc', fontWeight: 600, fontSize: '0.8rem' }}>
                      {src.name}
                    </span>
                    <span
                      style={{
                        fontSize: '0.65rem',
                        padding: '1px 5px',
                        borderRadius: '4px',
                        background: 'rgba(255, 255, 255, 0.08)',
                        color: getSourceColor(src.source_type),
                        fontWeight: 600,
                        textTransform: 'uppercase',
                      }}
                    >
                      {src.source_type.replace('_', ' ')}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ fontSize: '0.88rem', fontWeight: 800, color: getSourceColor(src.source_type) }}>
                      {score.toFixed(0)}%
                    </span>
                    {isExpanded ? <ChevronUp size={14} color="#94a3b8" /> : <ChevronDown size={14} color="#94a3b8" />}
                  </div>
                </div>

                {/* Progress Bar */}
                <div
                  style={{
                    width: '100%',
                    height: '7px',
                    background: 'rgba(2, 6, 23, 0.7)',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    marginBottom: '0.35rem',
                  }}
                >
                  <div
                    style={{
                      width: `${Math.max(4, score)}%`,
                      height: '100%',
                      background: getProgressBarColor(score),
                      borderRadius: '4px',
                      transition: 'width 0.4s ease',
                    }}
                  />
                </div>

                {/* Quick Sub-Stats */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: '#94a3b8' }}>
                  <span>Distance: <b style={{ color: '#cbd5e1' }}>{src.distance_to_origin_km.toFixed(1)} km</b></span>
                  <span>Transport: <b style={{ color: src.is_upwind_upcurrent ? '#10b981' : '#cbd5e1' }}>{src.is_upwind_upcurrent ? 'Up-Current' : 'Cross-Drift'}</b></span>
                  <span>Rank: <b style={{ color: '#cbd5e1' }}>#{src.rank}</b></span>
                </div>

                {/* Expanded Explainable Breakdown */}
                {isExpanded && (
                  <div
                    style={{
                      marginTop: '0.65rem',
                      paddingTop: '0.65rem',
                      borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem',
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8' }}>
                      Explainable Component Score Breakdown:
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '0.4rem' }}>
                      {Object.entries(src.component_scores).map(([name, val]) => (
                        <div
                          key={name}
                          style={{
                            background: 'rgba(2, 6, 23, 0.6)',
                            padding: '0.35rem 0.5rem',
                            borderRadius: '4px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '2px',
                          }}
                        >
                          <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>{name}</span>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: val >= 70 ? '#10b981' : val >= 40 ? '#f59e0b' : '#94a3b8' }}>
                            {val.toFixed(0)}/100
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Counterfactual forward simulation test box for vessels */}
                    {src.counterfactual_simulation && (
                      <div
                        style={{
                          background: 'rgba(56, 189, 248, 0.08)',
                          border: '1px solid rgba(56, 189, 248, 0.3)',
                          borderRadius: '6px',
                          padding: '0.55rem',
                          marginTop: '0.25rem',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#38bdf8' }}>
                            COUNTERFACTUAL FORWARD SIMULATION TEST
                          </span>
                          {onToggleSimulatedSlick && (
                            <button
                              onClick={() => onToggleSimulatedSlick(!showSimulatedSlick)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.2rem',
                                background: showSimulatedSlick ? '#0284c7' : 'rgba(56, 189, 248, 0.2)',
                                border: 'none',
                                color: '#ffffff',
                                borderRadius: '4px',
                                padding: '0.2rem 0.45rem',
                                fontSize: '0.65rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              <Eye size={11} /> {showSimulatedSlick ? 'Hide Map Overlay' : 'Compare Slick Overlay'}
                            </button>
                          )}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.3rem', fontSize: '0.68rem', textAlign: 'center' }}>
                          <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '0.25rem', borderRadius: '3px' }}>
                            <span style={{ color: '#94a3b8' }}>IoU Match:</span>
                            <div style={{ fontWeight: 700, color: '#38bdf8' }}>
                              {src.counterfactual_simulation.iou.toFixed(2)}
                            </div>
                          </div>
                          <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '0.25rem', borderRadius: '3px' }}>
                            <span style={{ color: '#94a3b8' }}>Centroid Error:</span>
                            <div style={{ fontWeight: 700, color: '#f59e0b' }}>
                              {src.counterfactual_simulation.centroid_error_km.toFixed(1)} km
                            </div>
                          </div>
                          <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '0.25rem', borderRadius: '3px' }}>
                            <span style={{ color: '#94a3b8' }}>Arrival Error:</span>
                            <div style={{ fontWeight: 700, color: '#cbd5e1' }}>
                              {src.counterfactual_simulation.arrival_error_hours.toFixed(1)} h
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Reasons List */}
                    <div style={{ fontSize: '0.68rem', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      {src.explainability_reasons.map((r, i) => (
                        <div key={i} style={{ display: 'flex', gap: '4px' }}>
                          <span style={{ color: '#38bdf8' }}>•</span>
                          <span>{r}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Final Source Assessment & Competing Hypotheses Notice */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(20, 29, 47, 0.95) 100%)',
          borderRadius: '8px',
          padding: '0.9rem',
          border: multiSourceComparison.competing_hypotheses_flag
            ? '1px solid rgba(234, 179, 8, 0.5)'
            : '1px solid rgba(56, 189, 248, 0.3)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
          {multiSourceComparison.competing_hypotheses_flag ? (
            <AlertTriangle size={16} color="#eab308" />
          ) : (
            <TrendingUp size={16} color="#38bdf8" />
          )}
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f8fafc' }}>
            SOURCE ASSESSMENT
          </span>
        </div>

        {/* Category Summary Tickers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem', marginBottom: '0.65rem' }}>
          <div style={{ background: 'rgba(2, 6, 23, 0.6)', padding: '0.4rem', borderRadius: '4px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>Vessel-related</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#38bdf8' }}>
              {(multiSourceComparison.category_summary['Vessel-related'] || 0).toFixed(0)}%
            </div>
          </div>
          <div style={{ background: 'rgba(2, 6, 23, 0.6)', padding: '0.4rem', borderRadius: '4px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>Land / Infra</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#f59e0b' }}>
              {(multiSourceComparison.category_summary['Land / Infrastructure'] || 0).toFixed(0)}%
            </div>
          </div>
          <div style={{ background: 'rgba(2, 6, 23, 0.6)', padding: '0.4rem', borderRadius: '4px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>Natural Seep</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#10b981' }}>
              {(multiSourceComparison.category_summary['Natural Seep'] || 0).toFixed(0)}%
            </div>
          </div>
        </div>

        {/* Scientific Interpretation Statement */}
        <div
          style={{
            fontSize: '0.74rem',
            lineHeight: 1.45,
            color: '#f1f5f9',
            background: 'rgba(2, 6, 23, 0.5)',
            padding: '0.6rem',
            borderRadius: '5px',
            borderLeft: multiSourceComparison.competing_hypotheses_flag ? '3px solid #eab308' : '3px solid #38bdf8',
          }}
        >
          {multiSourceComparison.scientific_interpretation}
        </div>
      </div>

      {/* 6. Scientific Safeguards Distinction Legend */}
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.6)',
          borderRadius: '6px',
          padding: '0.65rem',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          fontSize: '0.68rem',
          color: '#94a3b8',
        }}
      >
        <div style={{ fontWeight: 700, color: '#cbd5e1', marginBottom: '0.3rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Shield size={12} color="#38bdf8" /> SCIENTIFIC SAFEGUARDS & DATA CLASSIFICATION
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.3rem' }}>
          <div><b style={{ color: '#38bdf8' }}>Observed:</b> Satellite slick, AIS data, Infrastructure map</div>
          <div><b style={{ color: '#eab308' }}>Modelled:</b> Backward hindcast, Probable origin, Counterfactual</div>
          <div><b style={{ color: '#a855f7' }}>Hypothesis:</b> Vessel, Pipeline, Port, Seep hypotheses</div>
          <div><b style={{ color: '#f87171' }}>Uncertainty:</b> Temporal gaps, Metocean resolution, Ambiguity</div>
        </div>
      </div>
    </div>
  );
};
