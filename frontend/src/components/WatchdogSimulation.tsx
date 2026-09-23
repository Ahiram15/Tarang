import React, { useState, useEffect } from 'react';
import {
  Clock,
  Play,
  Pause,
  RotateCcw,
  Satellite,
  Search,
  Download,
  Brain,
  Waves,
  Ship,
  Globe2,
  ArrowRight,
  ArrowDown,
  CheckCircle2,
  AlertTriangle,
  Radio,
  FileCode2,
  Compass,
  Layers,
  Filter,
  Sparkles,
  Cpu,
  ShieldCheck,
  Eye,
  Activity,
  Flame,
  Wind,
  Zap,
  ChevronRight,
  Maximize2,
  Check,
  Sliders,
  BarChart3,
  TrendingDown
} from 'lucide-react';

interface WatchdogSimulationProps {
  onProceedToGlobe: () => void;
  onLaunchDetection: () => void;
}

export const WatchdogSimulation: React.FC<WatchdogSimulationProps> = ({
  onProceedToGlobe,
  onLaunchDetection,
}) => {
  // 3-step 30-minute polling simulation
  // 0: 14:00 UTC - 30m Polling Tick -> No active scene -> Nominal Standby
  // 1: 14:30 UTC - 30m Polling Tick -> Orbital transit across ocean gap -> Nominal Standby
  // 2: 15:00 UTC - 30m Polling Tick -> New Sentinel-1 Pass Acquired! -> Two-Tier Screening & Stages 6-10 Pipeline
  const [activeCycle, setActiveCycle] = useState<number>(2);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'diagram' | 'scanner' | 'stages' | 'bandwidth'>('diagram');

  // Interactive Visual Radar Layer in the Canvas: 'raw' | 'masked' | 'cfar' | 'patch' | 'unet'
  const [visualLayer, setVisualLayer] = useState<'raw' | 'masked' | 'cfar' | 'patch' | 'unet'>('unet');

  // Active highlighted pipeline step (1 to 7)
  const [activeStep, setActiveStep] = useState<number>(5);

  // Active satellite selected for detail chip
  const [selectedSat, setSelectedSat] = useState<number>(0);

  // Auto-advance through the 30-min polling cycles when playing
  useEffect(() => {
    if (!isPlaying) return;
    const timer = setTimeout(() => {
      setActiveCycle((prev) => (prev + 1) % 3);
    }, 4000);
    return () => clearTimeout(timer);
  }, [activeCycle, isPlaying]);

  const satellites = [
    {
      name: 'Sentinel-1A/B',
      agency: 'ESA Copernicus',
      type: 'C-Band SAR',
      tag: 'PRIMARY RADAR',
      band: '5.405 GHz (VV+VH)',
      res: '10–20m (250km Swath)',
      poll: 'Every 30 mins',
      color: '#00f2fe',
      icon: '📡',
      detail: 'All-weather, cloud-penetrating Day/Night radar. Primary dark-spot damping detector.',
    },
    {
      name: 'Sentinel-2A/B',
      agency: 'ESA Copernicus',
      type: 'Multi-Spectral',
      tag: 'OPTICAL MSI',
      band: '13 Spectral Bands (VNIR/SWIR)',
      res: '10–20m (290km Swath)',
      poll: 'Every 30 mins',
      color: '#38bdf8',
      icon: '🛰️',
      detail: 'False-color RGB & sunglint absorption indices for optical corroboration.',
    },
    {
      name: 'Landsat-8 & 9',
      agency: 'USGS / NASA',
      type: 'Thermal + Optical',
      tag: 'TIRS THERMAL IR',
      band: 'OLI (30m) + TIRS (100m IR)',
      res: '30m / 100m (185km Swath)',
      poll: 'Every 30 mins',
      color: '#f59e0b',
      icon: '🌡️',
      detail: 'Calibrated surface thermal infrared contrast distinguishing thick crude emulsions.',
    },
    {
      name: 'EOS-06 (Oceansat-3)',
      agency: 'ISRO',
      type: 'Ku-Band Scatterometer',
      tag: 'OCEAN WINDS',
      band: 'Ku-band (13.515 GHz)',
      res: '25 km Wind Vectors',
      poll: 'Every 30 mins',
      color: '#a855f7',
      icon: '💨',
      detail: 'ISRO Oceansat-3 scatterometer providing real-time surface wind speed & direction (3–30 m/s) to filter low-wind look-alikes.',
    },
  ];

  const pipelineSteps = [
    {
      id: 1,
      title: 'Global Ocean Monitor',
      sub: 'Copernicus STAC API',
      badge: 'Every 30 Mins',
      desc: 'Autonomous daemon scans monitored oceanic routes across 4 satellites without human intervention.',
      tag: 'POLL',
      color: '#38bdf8',
      icon: <Globe2 size={16} />,
    },
    {
      id: 2,
      title: 'Tier 1: Quick Screening',
      sub: '~2 MB Quicklook Preview',
      badge: 'Low Bandwidth',
      desc: 'Fetches low-resolution ~2MB quicklook. Applies shoreline masking & fast statistical screening.',
      tag: 'TIER 1',
      color: '#00f2fe',
      icon: <Zap size={16} />,
    },
    {
      id: 3,
      title: 'Fast 2-Param CFAR',
      sub: 'Adaptive Clutter Check',
      badge: 'Constant False Alarm',
      desc: 'Models local sea clutter: T = μ - k*σ. If clean: drop & stop. If dark spot: extract bounding box.',
      tag: 'DETECT',
      color: '#f59e0b',
      icon: <Activity size={16} />,
    },
    {
      id: 4,
      title: 'Tier 2: Targeted Patch',
      sub: '~5 MB High-Res 10m Patch',
      badge: '95% Bandwidth Saved',
      desc: 'Requests ONLY the flagged bounding box from CDSE Process API at native ~10m resolution.',
      tag: 'TIER 2',
      color: '#a855f7',
      icon: <Download size={16} />,
    },
    {
      id: 5,
      title: 'Preprocessing & Filtering',
      sub: 'Calibration & Gamma-MAP',
      badge: 'Physics-Based',
      desc: 'DN to σ⁰ backscatter conversion + Gamma-MAP speckle filter preserving delicate slick boundaries.',
      tag: 'STAGE 6',
      color: '#ec4899',
      icon: <Filter size={16} />,
    },
    {
      id: 6,
      title: 'U-Net Deep Delineation',
      sub: 'Sub-Pixel Exact Geometry',
      badge: 'Pixel Masking',
      desc: 'Dual-pol VV/VH convolutional neural network generates precise closed GeoJSON multi-polygons.',
      tag: 'STAGE 8',
      color: '#10b981',
      icon: <Brain size={16} />,
    },
    {
      id: 7,
      title: 'Look-Alike Rejection',
      sub: 'Wind Gating & AIS Context',
      badge: '96.4% Confirmed',
      desc: 'Rejects calm biogenic films (<3 m/s wind via EOS-06). Cross-matches AIS cargo routes. Handoff to Act 1–4.',
      tag: 'STAGE 9–10',
      color: '#ef4444',
      icon: <ShieldCheck size={16} />,
    },
  ];

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'radial-gradient(ellipse at 50% 0%, #0a1329 0%, #030611 100%)',
      color: '#f1f5f9',
      overflowY: 'auto',
      padding: '16px 24px',
      boxSizing: 'border-box',
    }}>
      {/* Top Bar: Title & Primary CTA Buttons */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: '14px',
        borderBottom: '1px solid rgba(0, 242, 254, 0.2)',
        marginBottom: '14px',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.25) 0%, rgba(56, 189, 248, 0.1) 100%)',
            border: '1.5px solid #00f2fe',
            borderRadius: '10px',
            padding: '8px 10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 16px rgba(0, 242, 254, 0.3)',
          }}>
            <Satellite size={22} color="#00f2fe" />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.74rem', fontWeight: 900, color: '#00f2fe', letterSpacing: '1px' }}>
                AUTONOMOUS SATELLITE WATCHDOG
              </span>
              <span style={{ color: '#475569' }}>•</span>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>
                Every 30-Minute Multi-Constellation Ocean Polling
              </span>
            </div>
            <h1 style={{ margin: '2px 0 0 0', fontSize: '1.25rem', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.2px' }}>
              Two-Tier Satellite Screening & Oil Spill Detection Architecture
            </h1>
          </div>
        </div>

        {/* Action Direct Links to subsequent stages */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={onProceedToGlobe}
            style={{
              background: 'rgba(0, 242, 254, 0.12)',
              border: '1px solid #00f2fe',
              color: '#00f2fe',
              borderRadius: '7px',
              padding: '7px 14px',
              fontSize: '0.78rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
            }}
          >
            <Globe2 size={14} />
            <span>Open 3D Ocean Globe</span>
          </button>

          <button
            onClick={onLaunchDetection}
            style={{
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              border: 'none',
              color: '#ffffff',
              borderRadius: '7px',
              padding: '7px 16px',
              fontSize: '0.78rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 0 16px rgba(239, 68, 68, 0.4)',
              transition: 'all 0.15s ease',
            }}
          >
            <span>Proceed to Satellite Lab (Act 2) →</span>
          </button>
        </div>
      </div>

      {/* 4 PRIMARY SATELLITE STATUS CARDS (Visual & Compact) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '10px',
        marginBottom: '14px',
        flexShrink: 0,
      }}>
        {satellites.map((sat, idx) => {
          const isSelected = selectedSat === idx;
          return (
            <div
              key={sat.name}
              onClick={() => setSelectedSat(idx)}
              style={{
                background: isSelected
                  ? 'linear-gradient(180deg, rgba(15, 23, 42, 0.9) 0%, rgba(10, 20, 40, 0.95) 100%)'
                  : 'rgba(10, 16, 30, 0.75)',
                border: isSelected ? `2px solid ${sat.color}` : '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '10px',
                padding: '10px 12px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: isSelected ? `0 0 18px ${sat.color}35` : 'none',
                display: 'flex',
                flexDirection: 'column',
                gap: '5px',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Subtle top indicator bar */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: sat.color }} />

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '1rem' }}>{sat.icon}</span>
                  <span style={{ fontSize: '0.84rem', fontWeight: 900, color: '#ffffff' }}>{sat.name}</span>
                </div>
                <span style={{
                  fontSize: '0.62rem',
                  fontWeight: 800,
                  padding: '2px 5px',
                  borderRadius: '4px',
                  background: `${sat.color}20`,
                  color: sat.color,
                  border: `1px solid ${sat.color}40`,
                }}>
                  {sat.tag}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.70rem', color: '#94a3b8' }}>
                <span>{sat.agency}</span>
                <span style={{ color: '#22c55e', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#22c55e' }} />
                  {sat.poll}
                </span>
              </div>

              <div style={{ fontSize: '0.68rem', color: '#cbd5e1', fontWeight: 600 }}>
                {sat.res}
              </div>
            </div>
          );
        })}
      </div>

      {/* 30-MIN POLLING TICK & SIMULATION CONTROLS */}
      <div style={{
        background: 'rgba(8, 14, 28, 0.85)',
        border: '1px solid rgba(0, 242, 254, 0.25)',
        borderRadius: '10px',
        padding: '10px 16px',
        marginBottom: '14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* UTC Clock pill */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.6)',
            border: '1px solid #00f2fe',
            borderRadius: '6px',
            padding: '4px 10px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}>
            <Clock size={14} color="#00f2fe" />
            <span style={{ fontSize: '0.92rem', fontFamily: 'monospace', fontWeight: 900, color: '#00f2fe' }}>
              {activeCycle === 0 ? '14:00' : activeCycle === 1 ? '14:30' : '15:00'} UTC
            </span>
          </div>

          {/* Stepper pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {[
              { cycle: 0, time: '14:00', status: 'Cycle 1: 0 scenes', color: '#64748b' },
              { cycle: 1, time: '14:30', status: 'Cycle 2: Orbit transit', color: '#64748b' },
              { cycle: 2, time: '15:00', status: 'Cycle 3: 🚨 SAR Pass Acquired!', color: '#ef4444' },
            ].map((c) => (
              <button
                key={c.cycle}
                onClick={() => {
                  setActiveCycle(c.cycle);
                  setIsPlaying(false);
                }}
                style={{
                  background: activeCycle === c.cycle
                    ? c.cycle === 2 ? 'rgba(239, 68, 68, 0.25)' : 'rgba(0, 242, 254, 0.2)'
                    : 'rgba(255, 255, 255, 0.04)',
                  border: activeCycle === c.cycle
                    ? c.cycle === 2 ? '1px solid #ef4444' : '1px solid #00f2fe'
                    : '1px solid rgba(255, 255, 255, 0.08)',
                  color: activeCycle === c.cycle
                    ? c.cycle === 2 ? '#fca5a5' : '#00f2fe'
                    : '#94a3b8',
                  borderRadius: '5px',
                  padding: '3px 8px',
                  fontSize: '0.70rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span>{c.time}</span>
                <span style={{ opacity: 0.8 }}>({c.status})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Play / Restart */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            style={{
              background: isPlaying ? 'rgba(234, 179, 8, 0.15)' : 'rgba(0, 242, 254, 0.15)',
              border: isPlaying ? '1px solid #eab308' : '1px solid #00f2fe',
              color: isPlaying ? '#eab308' : '#00f2fe',
              borderRadius: '5px',
              padding: '4px 10px',
              fontSize: '0.72rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            {isPlaying ? <Pause size={12} /> : <Play size={12} />}
            <span>{isPlaying ? 'Pause' : 'Simulate 30m Check'}</span>
          </button>

          <button
            onClick={() => {
              setActiveCycle(0);
              setIsPlaying(true);
            }}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#cbd5e1',
              borderRadius: '5px',
              padding: '4px 8px',
              fontSize: '0.72rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <RotateCcw size={12} />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* MAIN TWO-TIER ARCHITECTURE & PIPELINE WORKFLOW */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.05fr 0.95fr',
        gap: '14px',
        flex: 1,
        marginBottom: '14px',
      }}>
        {/* LEFT COLUMN: Two-Tier Architecture & Selected Step Deep-Dive */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}>
          {/* Two-Tier Core Concept Card */}
          <div style={{
            background: 'rgba(6, 11, 24, 0.85)',
            border: '1px solid rgba(0, 242, 254, 0.25)',
            borderRadius: '12px',
            padding: '16px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Zap size={16} color="#00f2fe" />
                <span style={{ fontSize: '0.84rem', fontWeight: 900, color: '#ffffff' }}>
                  TWO-TIER BANDWIDTH & SCREENING ARCHITECTURE
                </span>
              </div>
              <span style={{ fontSize: '0.66rem', color: '#22c55e', background: 'rgba(34, 197, 94, 0.15)', padding: '2px 7px', borderRadius: '4px', fontWeight: 800 }}>
                99.3% BANDWIDTH SAVED
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
              {/* Tier 1 Box */}
              <div style={{
                background: 'rgba(15, 23, 42, 0.7)',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                borderRadius: '8px',
                padding: '10px 12px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 900, color: '#38bdf8' }}>
                    ⚡ TIER 1: QUICK SCREEN
                  </span>
                  <span style={{ fontSize: '0.64rem', color: '#38bdf8', background: 'rgba(56, 189, 248, 0.15)', padding: '1px 5px', borderRadius: '3px' }}>
                    ~2 MB
                  </span>
                </div>
                <div style={{ fontSize: '0.70rem', color: '#cbd5e1', lineHeight: 1.4 }}>
                  Retrieves lightweight ~2MB quicklook. Applies fast GSHHG coastline mask and runs 2-parameter CFAR statistical screening.
                </div>
                <div style={{ marginTop: '6px', fontSize: '0.64rem', color: '#94a3b8' }}>
                  <b>Decision:</b> Clean → Drop & Stop. Dark spot → Extract BBOX.
                </div>
              </div>

              {/* Tier 2 Box */}
              <div style={{
                background: 'rgba(15, 23, 42, 0.7)',
                border: '1px solid rgba(168, 85, 247, 0.35)',
                borderRadius: '8px',
                padding: '10px 12px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 900, color: '#c084fc' }}>
                    🎯 TIER 2: TARGETED PATCH
                  </span>
                  <span style={{ fontSize: '0.64rem', color: '#c084fc', background: 'rgba(168, 85, 247, 0.15)', padding: '1px 5px', borderRadius: '3px' }}>
                    ~5 MB
                  </span>
                </div>
                <div style={{ fontSize: '0.70rem', color: '#cbd5e1', lineHeight: 1.4 }}>
                  Requests <b>only</b> the flagged bounding box from CDSE Process API at native ~10m resolution for deep AI delineation.
                </div>
                <div style={{ marginTop: '6px', fontSize: '0.64rem', color: '#94a3b8' }}>
                  <b>Processing:</b> Gamma-MAP speckle filter + U-Net + Wind gating.
                </div>
              </div>
            </div>

            {/* Bandwidth Savings Comparison */}
            <div style={{
              background: 'rgba(0, 0, 0, 0.45)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '8px',
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div>
                <div style={{ fontSize: '0.68rem', color: '#ef4444', textDecoration: 'line-through' }}>
                  Full Scene Download: 1,000 MB per pass (Heavy, slow, high cloud storage cost)
                </div>
                <div style={{ fontSize: '0.74rem', color: '#22c55e', fontWeight: 800, marginTop: '2px' }}>
                  ✓ TARANG Screening: 2 MB Quicklook + 5 MB Targeted Patch = 7 MB Total
                </div>
              </div>
              <div style={{
                background: 'rgba(34, 197, 94, 0.15)',
                border: '1px solid #22c55e',
                color: '#22c55e',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '0.82rem',
                fontWeight: 900,
                textAlign: 'center',
                flexShrink: 0,
              }}>
                99.3% SAVED
              </div>
            </div>
          </div>

          {/* Active Step Deep-Dive Inspector */}
          <div style={{
            background: 'rgba(6, 11, 24, 0.85)',
            border: `1.5px solid ${pipelineSteps[activeStep - 1].color}`,
            borderRadius: '12px',
            padding: '16px',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: `0 0 20px ${pipelineSteps[activeStep - 1].color}25`,
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    background: pipelineSteps[activeStep - 1].color,
                    color: '#030712',
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.72rem',
                    fontWeight: 900,
                  }}>
                    {pipelineSteps[activeStep - 1].id}
                  </div>
                  <span style={{ fontSize: '0.86rem', fontWeight: 900, color: '#ffffff' }}>
                    {pipelineSteps[activeStep - 1].title}
                  </span>
                </div>
                <span style={{
                  fontSize: '0.64rem',
                  fontWeight: 800,
                  padding: '2px 7px',
                  borderRadius: '4px',
                  background: `${pipelineSteps[activeStep - 1].color}20`,
                  color: pipelineSteps[activeStep - 1].color,
                  border: `1px solid ${pipelineSteps[activeStep - 1].color}40`,
                }}>
                  {pipelineSteps[activeStep - 1].tag}
                </span>
              </div>

              <div style={{ fontSize: '0.74rem', color: '#cbd5e1', lineHeight: 1.5, marginBottom: '12px' }}>
                {pipelineSteps[activeStep - 1].desc}
              </div>

              {/* Specific technical pill for selected step */}
              {activeStep === 1 && (
                <div style={{ background: 'rgba(255,255,255,0.04)', padding: '8px 12px', borderRadius: '6px', fontSize: '0.70rem', color: '#94a3b8' }}>
                  <b>Catalog Search:</b> Polling Copernicus STAC endpoint: <code>catalogue.dataspace.copernicus.eu/stac</code>. Queries Sentinel-1, Sentinel-2, Landsat-8, and ISRO EOS-06 wind fields every 30 minutes.
                </div>
              )}
              {activeStep === 2 && (
                <div style={{ background: 'rgba(255,255,255,0.04)', padding: '8px 12px', borderRadius: '6px', fontSize: '0.70rem', color: '#94a3b8' }}>
                  <b>Quicklook Spec:</b> ~2 MB sub-sampled preview. OSM / GSHHG shoreline polygon mask applied with a 500m coastal buffer to prevent false land terrain triggers.
                </div>
              )}
              {activeStep === 3 && (
                <div style={{ background: 'rgba(255,255,255,0.04)', padding: '8px 12px', borderRadius: '6px', fontSize: '0.70rem', color: '#94a3b8' }}>
                  <b>CFAR Threshold Formula:</b> <code>T_cfar = μ_clutter - k * σ_clutter</code>. Dynamically models local sea clutter statistics for constant false-alarm rate, independent of global wind state.
                </div>
              )}
              {activeStep === 4 && (
                <div style={{ background: 'rgba(255,255,255,0.04)', padding: '8px 12px', borderRadius: '6px', fontSize: '0.70rem', color: '#94a3b8' }}>
                  <b>CDSE Process API:</b> <code>POST /api/v1/process</code> requests native 10m GeoTIFF patch constrained strictly to the flagged BBOX coordinates, avoiding 95% unnecessary image transfer.
                </div>
              )}
              {activeStep === 5 && (
                <div style={{ background: 'rgba(255,255,255,0.04)', padding: '8px 12px', borderRadius: '6px', fontSize: '0.70rem', color: '#94a3b8' }}>
                  <b>SAR Preprocessing (Stage 6):</b> Calibration LUT converts raw DN to backscatter σ⁰ (dB). Gamma-MAP adaptive filter models radar reflectivity as Gamma-distributed to preserve intricate slick boundaries.
                </div>
              )}
              {activeStep === 6 && (
                <div style={{ background: 'rgba(255,255,255,0.04)', padding: '8px 12px', borderRadius: '6px', fontSize: '0.70rem', color: '#94a3b8' }}>
                  <b>Deep Segmentation (Stage 8):</b> Dual-channel VV/VH U-Net delineates exact polygon contours. Compared against Level Set Method (LSM) and Superpixel SLIC to ensure sub-pixel boundary fidelity.
                </div>
              )}
              {activeStep === 7 && (
                <div style={{ background: 'rgba(255,255,255,0.04)', padding: '8px 12px', borderRadius: '6px', fontSize: '0.70rem', color: '#94a3b8' }}>
                  <b>False Positive Removal (Stage 9 & 10):</b> Wind-speed gating rejects low-wind calm water (&lt;3 m/s via EOS-06). Cross-matches AIS cargo ship transponders. Confirmed score: <b>96.4%</b> → Handoff to Acts 1–4.
                </div>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '10px', marginTop: '10px' }}>
              <span style={{ fontSize: '0.68rem', color: '#64748b' }}>
                Pipeline Stage: <b>{pipelineSteps[activeStep - 1].sub}</b>
              </span>
              <span style={{ fontSize: '0.68rem', color: '#22c55e', fontWeight: 800 }}>
                STATUS: VERIFIED
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: 7-Step Interactive Pipeline Workflow */}
        <div style={{
          background: 'rgba(6, 11, 24, 0.85)',
          border: '1px solid rgba(0, 242, 254, 0.25)',
          borderRadius: '12px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Layers size={16} color="#00f2fe" />
              <span style={{ fontSize: '0.84rem', fontWeight: 900, color: '#ffffff' }}>
                SCIENTIFIC DETECTION PIPELINE (STAGES 6 — 10)
              </span>
            </div>
            <span style={{ fontSize: '0.66rem', color: '#38bdf8', background: 'rgba(56, 189, 248, 0.15)', padding: '2px 7px', borderRadius: '4px', fontWeight: 700 }}>
              7 Interactive Steps
            </span>
          </div>

          {/* Stepper List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', flex: 1, justifyContent: 'space-between' }}>
            {pipelineSteps.map((step) => {
              const isActive = activeStep === step.id;
              return (
                <div
                  key={step.id}
                  onClick={() => setActiveStep(step.id)}
                  style={{
                    background: isActive
                      ? `linear-gradient(90deg, ${step.color}22 0%, rgba(15, 23, 42, 0.85) 100%)`
                      : 'rgba(15, 23, 42, 0.45)',
                    border: isActive ? `1.5px solid ${step.color}` : '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    cursor: 'pointer',
                    transition: 'all 0.18s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    boxShadow: isActive ? `0 0 14px ${step.color}30` : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: isActive ? step.color : 'rgba(255,255,255,0.08)',
                      color: isActive ? '#030712' : '#94a3b8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.72rem',
                      fontWeight: 900,
                      flexShrink: 0,
                    }}>
                      {step.id}
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '0.80rem', fontWeight: 800, color: isActive ? '#ffffff' : '#e2e8f0' }}>
                          {step.title}
                        </span>
                        <span style={{ fontSize: '0.64rem', color: step.color, fontWeight: 700 }}>
                          [{step.sub}]
                        </span>
                      </div>
                      <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '1px' }}>
                        {step.desc}
                      </div>
                    </div>
                  </div>

                  <span style={{
                    fontSize: '0.62rem',
                    fontWeight: 800,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: `${step.color}18`,
                    color: step.color,
                    border: `1px solid ${step.color}40`,
                    flexShrink: 0,
                  }}>
                    {step.tag}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* CONFIRMED ALERT & DOWNSTREAM NAVIGATION FOOTER */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.14) 0%, rgba(0, 242, 254, 0.14) 100%)',
        border: '1px solid #ef4444',
        borderRadius: '10px',
        padding: '12px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 0 25px rgba(239, 68, 68, 0.2)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1.2rem' }}>🚨</span>
          <div>
            <div style={{ fontSize: '0.86rem', fontWeight: 900, color: '#ffffff' }}>
              Confirmed Spill Verified by Autonomous Screening Pipeline (Confidence: 96.4%)
            </div>
            <div style={{ fontSize: '0.72rem', color: '#cbd5e1' }}>
              Multi-spectral and radar corroboration completed. Proceed to the 3D Ocean Globe or Satellite Lab to inspect calibrated backscatter, hindcasting, and culprit attribution.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={onProceedToGlobe}
            style={{
              background: 'rgba(0, 242, 254, 0.15)',
              border: '1px solid #00f2fe',
              color: '#00f2fe',
              borderRadius: '7px',
              padding: '8px 14px',
              fontSize: '0.78rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Globe2 size={14} />
            <span>Open 3D Ocean Globe</span>
          </button>

          <button
            onClick={onLaunchDetection}
            style={{
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              border: 'none',
              color: '#ffffff',
              borderRadius: '7px',
              padding: '8px 18px',
              fontSize: '0.78rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 0 16px rgba(239, 68, 68, 0.4)',
            }}
          >
            <span>Proceed to Satellite Lab (Act 2) →</span>
          </button>
        </div>
      </div>
    </div>
  );
};
