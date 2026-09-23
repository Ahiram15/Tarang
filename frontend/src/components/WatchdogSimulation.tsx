import React, { useState, useEffect, useRef } from 'react';
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
  TrendingDown,
  Terminal,
  Trash2
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

  // Live Telemetry Console State
  const [isConsoleStreaming, setIsConsoleStreaming] = useState<boolean>(true);
  const [consoleFilter, setConsoleFilter] = useState<'ALL' | 'TIER1' | 'TIER2' | 'AI' | 'ALERTS'>('ALL');
  const consoleBottomRef = useRef<HTMLDivElement>(null);

  const [consoleLogs, setConsoleLogs] = useState<Array<{
    id: string;
    time: string;
    source: string;
    level: 'POLL' | 'TIER1' | 'TIER2' | 'AI' | 'WIND' | 'ALERT' | 'INFO' | 'SUCCESS';
    color: string;
    message: string;
  }>>([
    { id: '1', time: '14:58:12.1', source: 'DAEMON', level: 'INFO', color: '#38bdf8', message: 'Autonomous Satellite Watchdog active. Polling interval: 30 mins.' },
    { id: '2', time: '14:59:02.4', source: 'STAC', level: 'POLL', color: '#00f2fe', message: 'Querying Copernicus STAC API: catalogue.dataspace.copernicus.eu/stac' },
    { id: '3', time: '14:59:45.8', source: 'ORBIT', level: 'INFO', color: '#94a3b8', message: 'Constellation check: Sentinel-1, Sentinel-2, Landsat-8, EOS-06 nominal.' },
    { id: '4', time: '15:00:00.0', source: 'POLLER', level: 'POLL', color: '#00f2fe', message: '30-min synchronization triggered. Ingesting Levantine Basin orbit pass.' },
    { id: '5', time: '15:00:01.8', source: 'INGEST', level: 'TIER1', color: '#f59e0b', message: 'New scene registered: S1B_IW_GRDH_1SDV_20210205T154212_025462' },
    { id: '6', time: '15:00:03.2', source: 'TIER-1', level: 'TIER1', color: '#00f2fe', message: 'Fast ~2.1 MB quicklook preview retrieved. Applying GSHHG shoreline mask.' },
    { id: '7', time: '15:00:04.5', source: 'CFAR-2P', level: 'ALERT', color: '#ef4444', message: 'Contrast anomaly detected: -8.4 dB below clutter baseline. BBOX extracted.' },
    { id: '8', time: '15:00:05.9', source: 'TIER-2', level: 'TIER2', color: '#a855f7', message: 'CDSE Process API: Targeted 10m patch requested [33.15°N, 34.20°E] (~4.8 MB).' },
    { id: '9', time: '15:00:07.4', source: 'SAVINGS', level: 'INFO', color: '#22c55e', message: 'Bandwidth optimization verified: 99.3% network transfer conserved (7 MB vs 1000 MB).' },
    { id: '10', time: '15:00:08.8', source: 'STAGE-6', level: 'AI', color: '#ec4899', message: 'Sigma0 backscatter calibrated + 7x7 Gamma-MAP speckle filter converged.' },
    { id: '11', time: '15:00:10.2', source: 'U-NET', level: 'AI', color: '#ec4899', message: 'Deep dual VV+VH segmentation complete (IoU: 0.887). Extracted slick: 42.6 km².' },
    { id: '12', time: '15:00:11.7', source: 'EOS-06', level: 'WIND', color: '#38bdf8', message: 'ISRO scatterometer wind speed: 4.8 m/s NW. Natural look-alike rejected (p < 0.04).' },
    { id: '13', time: '15:00:13.1', source: 'ALERT', level: 'ALERT', color: '#ef4444', message: 'CONFIRMED SPILL: Confidence 96.4%. Transmitted to 3D Globe & Hindcast Engine.' },
  ]);

  // Auto-scroll console to bottom when new logs arrive
  useEffect(() => {
    if (consoleBottomRef.current) {
      consoleBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [consoleLogs]);

  // Periodic Live Background Telemetry Generator
  useEffect(() => {
    if (!isConsoleStreaming) return;
    const pool = [
      { source: 'STAC-POLL', level: 'POLL' as const, color: '#00f2fe', message: 'Copernicus STAC catalog heartbeat: 4 active satellite collections responding.' },
      { source: 'EOS-06', level: 'WIND' as const, color: '#38bdf8', message: 'ISRO scatterometer wind vector: 4.8 m/s @ 312° NW across shipping corridor.' },
      { source: 'TIER-1', level: 'TIER1' as const, color: '#f59e0b', message: '2-param CFAR baseline sea clutter recalibrated: μ = -14.2 dB, σ = 1.84 dB.' },
      { source: 'CACHE', level: 'INFO' as const, color: '#22c55e', message: 'Storage guard active: 99.3% network transfer conserved (0 redundant gigabyte downloads).' },
      { source: 'LANDSAT-8', level: 'INFO' as const, color: '#f59e0b', message: 'TIRS Band 10 thermal calibrated: Ocean surface baseline 19.4°C.' },
      { source: 'SENTINEL-2', level: 'POLL' as const, color: '#38bdf8', message: 'MSI optical cloud-screening index updated for Mediterranean sector.' },
      { source: 'CDSE', level: 'TIER2' as const, color: '#a855f7', message: 'Process API token refreshed. Sub-patch bounding box server warm and responsive.' },
      { source: 'AIS-CROSS', level: 'INFO' as const, color: '#00f2fe', message: 'Corridor vessel transponder stream ingested: 18 commercial vessels tracked.' },
    ];

    const interval = setInterval(() => {
      const now = new Date();
      const timeStr = now.toISOString().substring(11, 21);
      const chosen = pool[Math.floor(Math.random() * pool.length)];
      setConsoleLogs((prev) => [
        ...prev.slice(-45),
        {
          id: `log-${Date.now()}-${Math.random()}`,
          time: timeStr,
          source: chosen.source,
          level: chosen.level,
          color: chosen.color,
          message: chosen.message,
        },
      ]);
    }, 2600);

    return () => clearInterval(interval);
  }, [isConsoleStreaming]);

  const triggerManualPoll = () => {
    const now = new Date();
    const timeStr = now.toISOString().substring(11, 21);
    setConsoleLogs((prev) => [
      ...prev,
      {
        id: `poll-${Date.now()}`,
        time: timeStr,
        source: 'MANUAL',
        level: 'POLL',
        color: '#00f2fe',
        message: '⚡ Manual poll triggered: Querying Copernicus OpenSearch STAC endpoint...',
      },
      {
        id: `poll-res-${Date.now()}`,
        time: timeStr,
        source: 'CDSE',
        level: 'TIER1',
        color: '#f59e0b',
        message: 'STAC query returned 1 active candidate scene. Dispatching Tier-1 screening.',
      },
    ]);
  };

  // Auto-advance through the 30-min polling cycles when playing
  useEffect(() => {
    if (!isPlaying) return;
    const timer = setTimeout(() => {
      setActiveCycle((prev) => (prev + 1) % 3);
    }, 4000);
    return () => clearTimeout(timer);
  }, [activeCycle, isPlaying]);

  // When activeCycle changes, log contextual batch to console
  useEffect(() => {
    const now = new Date();
    const timeStr = now.toISOString().substring(11, 21);
    if (activeCycle === 0) {
      setConsoleLogs((prev) => [
        ...prev,
        { id: `c0-${Date.now()}`, time: timeStr, source: 'POLLER-14:00', level: 'POLL', color: '#00f2fe', message: 'Cycle 14:00 UTC: Copernicus STAC sweep executed. Monitored corridors clear. Standby.' },
      ]);
    } else if (activeCycle === 1) {
      setConsoleLogs((prev) => [
        ...prev,
        { id: `c1-${Date.now()}`, time: timeStr, source: 'POLLER-14:30', level: 'POLL', color: '#f59e0b', message: 'Cycle 14:30 UTC: Landsat-8 scene screened. CFAR nominal (no dark damping). Standby.' },
      ]);
    } else if (activeCycle === 2) {
      setConsoleLogs((prev) => [
        ...prev,
        { id: `c2-${Date.now()}`, time: timeStr, source: 'POLLER-15:00', level: 'ALERT', color: '#ef4444', message: 'Cycle 15:00 UTC: Sentinel-1 pass acquired! Two-tier screening triggered: 42.6 km² spill verified.' },
      ]);
    }
  }, [activeCycle]);

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

          {/* Live Ingestion & Pipeline Telemetry Console */}
          <div style={{
            background: 'rgba(6, 11, 24, 0.90)',
            border: '1.5px solid rgba(0, 242, 254, 0.35)',
            borderRadius: '10px',
            padding: '10px 14px',
            boxShadow: '0 0 18px rgba(0, 242, 254, 0.12)',
          }}>
            {/* Header: Title & Controls */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Terminal size={12} color="#00f2fe" />
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#00f2fe', letterSpacing: '0.5px' }}>
                  LIVE INGESTION & PIPELINE TELEMETRY
                </span>
                <span style={{
                  width: '5px',
                  height: '5px',
                  borderRadius: '50%',
                  background: isConsoleStreaming ? '#22c55e' : '#f59e0b',
                  boxShadow: isConsoleStreaming ? '0 0 6px #22c55e' : 'none',
                  display: 'inline-block'
                }} />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <button
                  onClick={() => setIsConsoleStreaming(!isConsoleStreaming)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: isConsoleStreaming ? '#22c55e' : '#f59e0b',
                    borderRadius: '4px',
                    padding: '2px 6px',
                    fontSize: '0.62rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '3px',
                  }}
                >
                  {isConsoleStreaming ? <Pause size={9} /> : <Play size={9} />}
                  <span>{isConsoleStreaming ? 'STREAMING' : 'PAUSED'}</span>
                </button>

                <button
                  onClick={() => triggerManualPoll()}
                  style={{
                    background: 'rgba(0, 242, 254, 0.12)',
                    border: '1px solid rgba(0, 242, 254, 0.3)',
                    color: '#00f2fe',
                    borderRadius: '4px',
                    padding: '2px 6px',
                    fontSize: '0.62rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '3px',
                  }}
                >
                  <Zap size={9} />
                  <span>Poll</span>
                </button>

                <button
                  onClick={() => setConsoleLogs([])}
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '4px',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    padding: '2px 5px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  title="Clear Terminal"
                >
                  <Trash2 size={10} />
                </button>
              </div>
            </div>

            {/* Console Log Terminal Window - Short & Compact */}
            <div style={{
              background: '#020409',
              border: '1px solid rgba(0, 242, 254, 0.2)',
              borderRadius: '6px',
              padding: '7px 10px',
              fontFamily: 'ui-monospace, SFMono-Regular, "JetBrains Mono", Menlo, Consolas, monospace',
              fontSize: '0.67rem',
              lineHeight: 1.45,
              height: '92px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '3px',
              boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.8)',
            }}>
              {consoleLogs.length === 0 ? (
                <div style={{ color: '#64748b', fontStyle: 'italic', padding: '6px' }}>
                  Console buffer empty. Streaming telemetry will appear shortly or click "Poll"...
                </div>
              ) : (
                consoleLogs.map((log) => (
                  <div key={log.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', wordBreak: 'break-word' }}>
                    <span style={{ color: '#475569', fontSize: '0.62rem', flexShrink: 0 }}>
                      [{log.time}]
                    </span>
                    <span style={{
                      color: log.color,
                      fontWeight: 800,
                      fontSize: '0.60rem',
                      background: `${log.color}15`,
                      padding: '0 3px',
                      borderRadius: '2px',
                      border: `1px solid ${log.color}35`,
                      flexShrink: 0,
                    }}>
                      {log.source}
                    </span>
                    <span style={{
                      color: log.level === 'ALERT' ? '#fca5a5' : log.level === 'SUCCESS' ? '#86efac' : '#cbd5e1',
                      fontWeight: log.level === 'ALERT' ? 700 : 400,
                    }}>
                      {log.message}
                    </span>
                  </div>
                ))
              )}
              <div ref={consoleBottomRef} style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#00f2fe', marginTop: '2px' }}>
                <span style={{ fontSize: '0.64rem' }}>● CDSE_DAEMON &gt;</span>
                <span style={{
                  display: 'inline-block',
                  width: '6px',
                  height: '9px',
                  background: '#00f2fe',
                  animation: 'pulse 1s infinite'
                }} />
              </div>
            </div>

            {/* Live Console Telemetry Ticker Footer */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderTop: '1px solid rgba(255, 255, 255, 0.06)',
              paddingTop: '6px',
              marginTop: '6px',
              fontSize: '0.62rem',
              color: '#64748b',
              fontFamily: 'monospace',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>POLLER: <b style={{ color: '#22c55e' }}>ONLINE</b></span>
                <span>THROUGHPUT: <b style={{ color: '#38bdf8' }}>1.2 evt/s</b></span>
                <span>SATELLITES: <b style={{ color: '#f59e0b' }}>4 ACTIVE</b></span>
              </div>
              <div>
                SAVINGS: <b style={{ color: '#22c55e' }}>99.3%</b>
              </div>
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
