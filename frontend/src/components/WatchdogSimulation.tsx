import React, { useState, useEffect, useRef } from 'react';
import {
  Clock,
  Play,
  Pause,
  RotateCcw,
  Satellite,
  Globe2,
  ArrowRight,
  Zap,
  Terminal,
  Trash2,
  Layers,
  ShieldCheck,
  CheckCircle2,
  Activity
} from 'lucide-react';

interface WatchdogSimulationProps {
  onProceedToGlobe: () => void;
  onLaunchDetection: () => void;
}

export const WatchdogSimulation: React.FC<WatchdogSimulationProps> = ({
  onProceedToGlobe,
  onLaunchDetection,
}) => {
  // 3-step 30-minute lookback acquisition simulation (past data downlink)
  // 0: T - 60 min -> Past 30m window -> 0 candidate scenes -> Nominal Standby
  // 1: T - 30 min -> Preceding 30m window -> Orbital transit pass -> Clutter Nominal
  // 2: T - 0 min (LATEST NRT) -> Freshly downlinked Sentinel-1 pass -> Two-Tier Screening & Anomaly Verified
  const [activeCycle, setActiveCycle] = useState<number>(2);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [selectedSat, setSelectedSat] = useState<number>(0);

  // Live Telemetry Console State
  const [isConsoleStreaming, setIsConsoleStreaming] = useState<boolean>(true);
  const terminalBoxRef = useRef<HTMLDivElement>(null);

  const [consoleLogs, setConsoleLogs] = useState<Array<{
    id: string;
    time: string;
    source: string;
    level: 'POLL' | 'TIER1' | 'TIER2' | 'AI' | 'WIND' | 'ALERT' | 'INFO' | 'SUCCESS';
    color: string;
    message: string;
  }>>([
    { id: '1', time: 'T-30m 00s', source: 'DAEMON', level: 'INFO', color: '#38bdf8', message: 'Autonomous Satellite Watchdog active. Polling cadence: 30-min lookback.' },
    { id: '2', time: 'T-25m 14s', source: 'STAC', level: 'POLL', color: '#00f2fe', message: 'Querying Copernicus STAC API: catalogue.dataspace.copernicus.eu/stac [Lookback: T-30m → T]' },
    { id: '3', time: 'T-18m 02s', source: 'ORBIT', level: 'INFO', color: '#94a3b8', message: 'Constellation telemetry: Sentinel-1, Sentinel-2, Landsat-8, EOS-06 synchronized.' },
    { id: '4', time: 'T-12m 40s', source: 'INGEST', level: 'TIER1', color: '#f59e0b', message: 'New NRT Level-1 scene downlinked: S1B_IW_GRDH_1SDV_20210205T154212_025462' },
    { id: '5', time: 'T-08m 15s', source: 'TIER-1', level: 'TIER1', color: '#00f2fe', message: 'Tier-1 Quicklook (~2.1 MB) ingested. Shoreline masked via GSHHG database.' },
    { id: '6', time: 'T-05m 22s', source: 'CFAR-2P', level: 'ALERT', color: '#ef4444', message: 'Adaptive CFAR anomaly: -8.4 dB below ocean clutter baseline. BBOX extracted.' },
    { id: '7', time: 'T-03m 10s', source: 'TIER-2', level: 'TIER2', color: '#a855f7', message: 'CDSE Process API: Targeted 10m SAR sub-patch requested (~4.8 MB).' },
    { id: '8', time: 'T-01m 45s', source: 'SAVINGS', level: 'INFO', color: '#22c55e', message: 'Bandwidth optimization: 99.3% transfer conserved (6.9 MB total vs 1,000 MB full scene).' },
    { id: '9', time: 'T-00m 30s', source: 'U-NET', level: 'AI', color: '#ec4899', message: 'Deep dual VV+VH segmentation complete (IoU: 0.887). Verified spill: 42.6 km².' },
    { id: '10', time: 'LATEST', source: 'ALERT', level: 'ALERT', color: '#ef4444', message: 'CONFIRMED ANOMALY: Confidence 96.4%. Ready for 3D Globe & Lagrangian drift modeling.' },
  ]);

  // Auto-scroll terminal
  useEffect(() => {
    if (terminalBoxRef.current) {
      terminalBoxRef.current.scrollTop = terminalBoxRef.current.scrollHeight;
    }
  }, [consoleLogs]);

  // Periodic Live Background Telemetry
  useEffect(() => {
    if (!isConsoleStreaming) return;
    const pool = [
      { source: 'STAC-POLL', level: 'POLL' as const, color: '#00f2fe', message: 'Copernicus STAC catalog heartbeat: 4 active collections responding within 210ms.' },
      { source: 'EOS-06', level: 'WIND' as const, color: '#38bdf8', message: 'ISRO scatterometer wind vector: 4.8 m/s @ 312° NW across shipping corridor.' },
      { source: 'TIER-1', level: 'TIER1' as const, color: '#f59e0b', message: '2-param CFAR baseline clutter recalibrated: mu = -14.2 dB, sigma = 1.84 dB.' },
      { source: 'CACHE', level: 'INFO' as const, color: '#22c55e', message: 'Storage guard active: 99.3% bandwidth saved (0 redundant gigabyte downloads).' },
      { source: 'LANDSAT-8', level: 'INFO' as const, color: '#f59e0b', message: 'TIRS Band 10 thermal calibrated: Ocean surface baseline 19.4°C.' },
      { source: 'SENTINEL-2', level: 'POLL' as const, color: '#38bdf8', message: 'MSI optical cloud-screening index refreshed for monitored corridor.' },
      { source: 'CDSE', level: 'TIER2' as const, color: '#a855f7', message: 'Process API token refreshed. Sub-patch bounding box server warm and responsive.' },
      { source: 'AIS-CROSS', level: 'INFO' as const, color: '#00f2fe', message: 'Corridor vessel transponder stream ingested: 18 commercial vessels tracked.' },
    ];

    const interval = setInterval(() => {
      const now = new Date();
      const timeStr = now.toISOString().substring(11, 19) + ' UTC';
      const chosen = pool[Math.floor(Math.random() * pool.length)];
      setConsoleLogs((prev) => [
        ...prev.slice(-35),
        {
          id: `log-${Date.now()}-${Math.random()}`,
          time: timeStr,
          source: chosen.source,
          level: chosen.level,
          color: chosen.color,
          message: chosen.message,
        },
      ]);
    }, 2800);

    return () => clearInterval(interval);
  }, [isConsoleStreaming]);

  const triggerManualPoll = () => {
    const now = new Date();
    const timeStr = now.toISOString().substring(11, 19) + ' UTC';
    setConsoleLogs((prev) => [
      ...prev,
      {
        id: `poll-${Date.now()}`,
        time: timeStr,
        source: 'MANUAL',
        level: 'POLL',
        color: '#00f2fe',
        message: 'Manual sweep triggered: Querying Copernicus OpenSearch STAC for past 30-min window...',
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

  // Auto-advance through the past lookback cycles when playing
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
    const timeStr = now.toISOString().substring(11, 19) + ' UTC';
    if (activeCycle === 0) {
      setConsoleLogs((prev) => [
        ...prev,
        { id: `c0-${Date.now()}`, time: timeStr, source: 'POLLER [T-60m]', level: 'POLL', color: '#00f2fe', message: 'Lookback [T-90m to T-60m]: Copernicus STAC sweep executed. Corridors nominal. 0 candidate scenes.' },
      ]);
    } else if (activeCycle === 1) {
      setConsoleLogs((prev) => [
        ...prev,
        { id: `c1-${Date.now()}`, time: timeStr, source: 'POLLER [T-30m]', level: 'POLL', color: '#f59e0b', message: 'Lookback [T-60m to T-30m]: Optical/SAR transit screened. Clutter nominal (no dark damping). Standby.' },
      ]);
    } else if (activeCycle === 2) {
      setConsoleLogs((prev) => [
        ...prev,
        { id: `c2-${Date.now()}`, time: timeStr, source: 'POLLER [LATEST]', level: 'ALERT', color: '#ef4444', message: 'Lookback [T-30m to T-0m]: Fresh Sentinel-1 SAR pass downlinked! Two-tier screening triggered: 42.6 km² spill verified.' },
      ]);
    }
  }, [activeCycle]);

  const satellites = [
    {
      name: 'Sentinel-1A/B',
      agency: 'ESA Copernicus',
      type: 'C-Band SAR',
      tag: 'PRIMARY RADAR',
      res: '10–20m (250km Swath)',
      poll: '30-Min Lookback',
      color: '#00f2fe',
      desc: 'All-weather, cloud-penetrating Day/Night radar for capillary wave-damping anomalies.',
    },
    {
      name: 'Sentinel-2A/B',
      agency: 'ESA Copernicus',
      type: 'Multi-Spectral',
      tag: 'OPTICAL MSI',
      res: '10–20m (290km Swath)',
      poll: '30-Min Lookback',
      color: '#38bdf8',
      desc: 'Floating Algae Index (FAI) & sunglint contrast for optical sheen confirmation.',
    },
    {
      name: 'Landsat-8 & 9',
      agency: 'USGS / NASA',
      type: 'Thermal IR',
      tag: 'TIRS THERMAL',
      res: '30m / 100m IR',
      poll: '30-Min Lookback',
      color: '#f59e0b',
      desc: 'Thermal infrared contrast identifying thick emulsified oil patches.',
    },
    {
      name: 'EOS-06 (Oceansat-3)',
      agency: 'ISRO',
      type: 'Scatterometer',
      tag: 'OCEAN WINDS',
      res: '25 km Wind Vectors',
      poll: '30-Min Lookback',
      color: '#a855f7',
      desc: 'Surface wind speeds (3–30 m/s) to reject low-wind false positives and feed drift models.',
    },
  ];

  const lookbackCycles = [
    {
      cycle: 0,
      label: 'T - 60 min',
      sub: 'Prior 30m Window',
      status: '0 Scenes (Nominal)',
      color: '#64748b',
    },
    {
      cycle: 1,
      label: 'T - 30 min',
      sub: 'Preceding Window',
      status: 'Transit Pass (Clean)',
      color: '#38bdf8',
    },
    {
      cycle: 2,
      label: 'T - 0 min (LATEST)',
      sub: 'Past 30m Downlink',
      status: 'SAR Pass Acquired & Verified',
      color: '#ef4444',
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
      padding: '18px 24px',
      boxSizing: 'border-box',
      gap: '14px',
    }}>
      {/* ─────────────────────────────────────────────────────────────
          1. TOP BAR: Title & Primary Forward Navigation
         ───────────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: '12px',
        borderBottom: '1px solid rgba(0, 242, 254, 0.18)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.25) 0%, rgba(56, 189, 248, 0.1) 100%)',
            border: '1.5px solid #00f2fe',
            borderRadius: '8px',
            padding: '7px 9px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 16px rgba(0, 242, 254, 0.25)',
          }}>
            <Satellite size={20} color="#00f2fe" />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#00f2fe', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                AUTONOMOUS SATELLITE WATCHDOG
              </span>
              <span style={{ color: '#475569' }}>•</span>
              <span style={{ fontSize: '0.70rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                Lookback Window: [T - 30m → T]
              </span>
            </div>
            <h1 style={{ margin: '2px 0 0 0', fontSize: '1.18rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.01em' }}>
              Two-Tier Ingestion &amp; Automated Detection Telemetry
            </h1>
          </div>
        </div>

        {/* Action Direct Links to subsequent stages */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={onProceedToGlobe}
            style={{
              background: 'rgba(0, 242, 254, 0.10)',
              border: '1px solid rgba(0, 242, 254, 0.4)',
              color: '#00f2fe',
              borderRadius: '6px',
              padding: '7px 13px',
              fontSize: '0.76rem',
              fontWeight: 700,
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
              background: 'linear-gradient(135deg, #0284c7 0%, #00f2fe 100%)',
              border: 'none',
              color: '#030712',
              borderRadius: '6px',
              padding: '7px 15px',
              fontSize: '0.76rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 0 16px rgba(0, 242, 254, 0.35)',
              transition: 'all 0.15s ease',
            }}
          >
            <span>Proceed to Satellite Lab</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. SENSOR RIBBON & REALISTIC LOOKBACK TIMELINE (Compact Strip)
         ───────────────────────────────────────────────────────────── */}
      <div style={{
        background: 'rgba(8, 14, 28, 0.85)',
        border: '1px solid rgba(0, 242, 254, 0.20)',
        borderRadius: '8px',
        padding: '10px 14px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        flexShrink: 0,
      }}>
        {/* Constellation Sensor Chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            CONSTELLATION:
          </span>
          {satellites.map((sat, idx) => {
            const isSelected = selectedSat === idx;
            return (
              <button
                key={sat.name}
                onClick={() => setSelectedSat(idx)}
                style={{
                  background: isSelected ? `${sat.color}22` : 'rgba(255, 255, 255, 0.04)',
                  border: isSelected ? `1px solid ${sat.color}` : '1px solid rgba(255, 255, 255, 0.08)',
                  color: isSelected ? '#ffffff' : '#94a3b8',
                  borderRadius: '5px',
                  padding: '3px 8px',
                  fontSize: '0.70rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  transition: 'all 0.15s ease',
                }}
              >
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: sat.color }} />
                <span>{sat.name}</span>
                <span style={{ fontSize: '0.62rem', color: sat.color, opacity: 0.85 }}>[{sat.tag}]</span>
              </button>
            );
          })}
        </div>

        {/* 30-Min Lookback Stepper & Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            {lookbackCycles.map((c) => {
              const isActive = activeCycle === c.cycle;
              return (
                <button
                  key={c.cycle}
                  onClick={() => {
                    setActiveCycle(c.cycle);
                    setIsPlaying(false);
                  }}
                  style={{
                    background: isActive
                      ? c.cycle === 2 ? 'rgba(239, 68, 68, 0.22)' : 'rgba(0, 242, 254, 0.18)'
                      : 'rgba(255, 255, 255, 0.03)',
                    border: isActive
                      ? c.cycle === 2 ? '1px solid #ef4444' : '1px solid #00f2fe'
                      : '1px solid rgba(255, 255, 255, 0.08)',
                    color: isActive
                      ? c.cycle === 2 ? '#fca5a5' : '#00f2fe'
                      : '#64748b',
                    borderRadius: '5px',
                    padding: '4px 9px',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: '1px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span style={{ letterSpacing: '0.04em' }}>{c.label}</span>
                  <span style={{ fontSize: '0.60rem', opacity: 0.8, fontWeight: 400 }}>{c.status}</span>
                </button>
              );
            })}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              style={{
                background: isPlaying ? 'rgba(234, 179, 8, 0.15)' : 'rgba(0, 242, 254, 0.12)',
                border: isPlaying ? '1px solid #eab308' : '1px solid #00f2fe',
                color: isPlaying ? '#eab308' : '#00f2fe',
                borderRadius: '5px',
                padding: '5px 10px',
                fontSize: '0.70rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              {isPlaying ? <Pause size={11} /> : <Play size={11} />}
              <span>{isPlaying ? 'Pause' : 'Simulate'}</span>
            </button>

            <button
              onClick={() => {
                setActiveCycle(0);
                setIsPlaying(true);
              }}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#cbd5e1',
                borderRadius: '5px',
                padding: '5px 8px',
                fontSize: '0.70rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
              }}
              title="Reset Simulation"
            >
              <RotateCcw size={11} />
            </button>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. MAIN CONTENT: Two-Tier Architecture & Live Telemetry Console
         ───────────────────────────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.05fr 0.95fr',
        gap: '14px',
        flex: 1,
        minHeight: 0,
      }}>
        {/* LEFT COLUMN: Two-Tier Bandwidth Architecture Card */}
        <div style={{
          background: 'rgba(6, 11, 24, 0.85)',
          border: '1px solid rgba(0, 242, 254, 0.22)',
          borderRadius: '10px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '14px',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Zap size={16} color="#00f2fe" />
                <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#ffffff', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  Two-Tier Ingestion &amp; Bandwidth Conservation
                </span>
              </div>
              <span style={{ fontSize: '0.66rem', color: '#22c55e', background: 'rgba(34, 197, 94, 0.14)', padding: '2px 7px', borderRadius: '4px', fontWeight: 700, border: '1px solid rgba(34, 197, 94, 0.3)' }}>
                99.3% BANDWIDTH SAVED
              </span>
            </div>

            {/* Tier 1 and Tier 2 Side-by-Side */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
              {/* Tier 1 Box */}
              <div style={{
                background: 'rgba(15, 23, 42, 0.65)',
                border: '1px solid rgba(56, 189, 248, 0.28)',
                borderRadius: '6px',
                padding: '10px 12px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#38bdf8' }}>
                    TIER 1: QUICK SCREEN
                  </span>
                  <span style={{ fontSize: '0.62rem', color: '#38bdf8', background: 'rgba(56, 189, 248, 0.15)', padding: '1px 5px', borderRadius: '3px', fontWeight: 700 }}>
                    ~2.1 MB
                  </span>
                </div>
                <div style={{ fontSize: '0.70rem', color: '#cbd5e1', lineHeight: 1.45 }}>
                  Retrieves low-resolution STAC quicklooks across 14 monitored sea corridors. Applies shoreline masking &amp; 2-parameter CFAR statistical screening.
                </div>
                <div style={{ marginTop: '8px', fontSize: '0.64rem', color: '#94a3b8', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '6px' }}>
                  <b>Decision Rule:</b> Clean ocean &rarr; Drop &amp; Standby. Dark anomaly &rarr; Extract sub-patch BBOX.
                </div>
              </div>

              {/* Tier 2 Box */}
              <div style={{
                background: 'rgba(15, 23, 42, 0.65)',
                border: '1px solid rgba(168, 85, 247, 0.28)',
                borderRadius: '6px',
                padding: '10px 12px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#c084fc' }}>
                    TIER 2: TARGETED PATCH
                  </span>
                  <span style={{ fontSize: '0.62rem', color: '#c084fc', background: 'rgba(168, 85, 247, 0.15)', padding: '1px 5px', borderRadius: '3px', fontWeight: 700 }}>
                    ~4.8 MB
                  </span>
                </div>
                <div style={{ fontSize: '0.70rem', color: '#cbd5e1', lineHeight: 1.45 }}>
                  Requests <b>only</b> the flagged bounding box from CDSE Process API at native 10m resolution for deep neural delineation.
                </div>
                <div style={{ marginTop: '8px', fontSize: '0.64rem', color: '#94a3b8', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '6px' }}>
                  <b>Pipeline:</b> Gamma-MAP despeckle &rarr; U-Net (unet_oilspill.h5) &rarr; Wind look-alike gating.
                </div>
              </div>
            </div>

            {/* Bandwidth Savings Metric Bar */}
            <div style={{
              background: 'rgba(2, 6, 18, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '6px',
              padding: '9px 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div>
                <div style={{ fontSize: '0.66rem', color: '#ef4444', textDecoration: 'line-through' }}>
                  Full Scene Raw Ingestion: ~1,000 MB per orbit pass
                </div>
                <div style={{ fontSize: '0.74rem', color: '#22c55e', fontWeight: 700, marginTop: '2px' }}>
                  TARANG Two-Tier Sweep: 2.1 MB Quicklook + 4.8 MB Sub-Patch = 6.9 MB Total
                </div>
              </div>
              <div style={{
                background: 'rgba(34, 197, 94, 0.15)',
                border: '1px solid #22c55e',
                color: '#22c55e',
                padding: '3px 8px',
                borderRadius: '5px',
                fontSize: '0.78rem',
                fontWeight: 800,
                textAlign: 'center',
                flexShrink: 0,
              }}>
                99.3% SAVED
              </div>
            </div>
          </div>

          {/* Selected Satellite Sensor Detail Card */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.55)',
            border: '1px solid rgba(0, 242, 254, 0.18)',
            borderRadius: '6px',
            padding: '10px 12px',
            fontSize: '0.72rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontWeight: 800, color: satellites[selectedSat].color }}>
                {satellites[selectedSat].name} ({satellites[selectedSat].agency})
              </span>
              <span style={{ fontSize: '0.64rem', color: '#94a3b8' }}>
                Resolution: {satellites[selectedSat].res}
              </span>
            </div>
            <div style={{ color: '#cbd5e1', lineHeight: 1.4 }}>
              {satellites[selectedSat].desc}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Live Ingestion & Pipeline Telemetry Console */}
        <div style={{
          background: 'rgba(6, 11, 24, 0.90)',
          border: '1.5px solid rgba(0, 242, 254, 0.30)',
          borderRadius: '10px',
          padding: '14px',
          boxShadow: '0 0 18px rgba(0, 242, 254, 0.10)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: '280px',
        }}>
          {/* Terminal Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '10px',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            paddingBottom: '8px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Terminal size={14} color="#00f2fe" />
              <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#00f2fe', letterSpacing: '0.06em' }}>
                LIVE INGESTION &amp; PIPELINE TELEMETRY
              </span>
              <span style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: isConsoleStreaming ? '#22c55e' : '#f59e0b',
                boxShadow: isConsoleStreaming ? '0 0 6px #22c55e' : 'none',
                display: 'inline-block'
              }} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <button
                onClick={() => setIsConsoleStreaming(!isConsoleStreaming)}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: isConsoleStreaming ? '#22c55e' : '#f59e0b',
                  borderRadius: '4px',
                  padding: '3px 7px',
                  fontSize: '0.64rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
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
                  padding: '3px 7px',
                  fontSize: '0.64rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Trigger Poll
              </button>

              <button
                onClick={() => setConsoleLogs([])}
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '4px',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '3px 6px',
                  display: 'flex',
                  alignItems: 'center',
                }}
                title="Clear Terminal"
              >
                <Trash2 size={11} />
              </button>
            </div>
          </div>

          {/* Console Log Terminal Window */}
          <div
            ref={terminalBoxRef}
            style={{
              background: '#020409',
              border: '1px solid rgba(0, 242, 254, 0.18)',
              borderRadius: '6px',
              padding: '10px 12px',
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: '0.68rem',
              lineHeight: 1.5,
              flex: 1,
              minHeight: '180px',
              maxHeight: '260px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.8)',
            }}
          >
            {consoleLogs.length === 0 ? (
              <div style={{ color: '#64748b', fontStyle: 'italic', padding: '6px' }}>
                Console buffer empty. Streaming telemetry will appear shortly or click "Trigger Poll"...
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
                    padding: '0 4px',
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#00f2fe', marginTop: '2px' }}>
              <span style={{ fontSize: '0.64rem' }}>CDSE_DAEMON &gt;</span>
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
            paddingTop: '8px',
            marginTop: '8px',
            fontSize: '0.64rem',
            color: '#64748b',
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span>POLLER: <b style={{ color: '#22c55e' }}>ONLINE</b></span>
              <span>CADENCE: <b style={{ color: '#38bdf8' }}>30 MIN</b></span>
              <span>CONSTELLATION: <b style={{ color: '#f59e0b' }}>4 SYNCED</b></span>
            </div>
            <div>
              BANDWIDTH CONSERVED: <b style={{ color: '#22c55e' }}>99.3%</b>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. SLEEK TELEMETRY VERIFICATION STATUS BAR (No Duplicate Buttons)
         ───────────────────────────────────────────────────────────── */}
      <div style={{
        background: 'rgba(8, 14, 28, 0.85)',
        border: '1px solid rgba(0, 242, 254, 0.22)',
        borderRadius: '8px',
        padding: '10px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <CheckCircle2 size={16} color="#00f2fe" />
          <div style={{ fontSize: '0.74rem', color: '#cbd5e1' }}>
            <span style={{ color: '#00f2fe', fontWeight: 700 }}>Autonomous Pipeline Status: </span>
            Sentinel-1 SAR screening verified with ISRO Oceansat-3 wind gating &bull; Dual-Pol U-Net inference ready for 3D Globe &amp; Satellite Lab.
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            fontSize: '0.68rem',
            fontFamily: "'JetBrains Mono', monospace",
            color: '#22c55e',
            background: 'rgba(34, 197, 94, 0.12)',
            border: '1px solid rgba(34, 197, 94, 0.25)',
            padding: '2px 8px',
            borderRadius: '4px',
            fontWeight: 700,
          }}>
            CONFIDENCE: 96.4%
          </span>
        </div>
      </div>
    </div>
  );
};
