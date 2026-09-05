import React, { useState, useEffect, useRef } from 'react';
import {
  Clock,
  Play,
  Pause,
  RotateCcw,
  FastForward,
  CheckCircle2,
  AlertTriangle,
  Satellite,
  Radio,
  Search,
  Download,
  Waves,
  Ship,
  ShieldAlert,
  ArrowRight,
  Terminal,
  Globe2,
  Microscope,
  Eye,
  Check
} from 'lucide-react';

interface WatchdogSimulationProps {
  onProceedToGlobe: () => void;
  onLaunchDetection: () => void;
}

interface LogEntry {
  time: string;
  type: 'info' | 'query' | 'idle' | 'detect' | 'alert' | 'success';
  text: string;
  detail?: string;
}

export const WatchdogSimulation: React.FC<WatchdogSimulationProps> = ({
  onProceedToGlobe,
  onLaunchDetection,
}) => {
  // Current simulation step: 0 to 5
  // 0: 06:00 Query
  // 1: 06:01 No scene -> Wait
  // 2: 12:00 Query
  // 3: 12:01 No scene -> Wait
  // 4: 18:00 New scene detected -> Auto download & AI analysis
  // 5: 18:05 Possible oil spill -> AIS + wind + current analysis
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1); // 1x, 2x, 4x
  const terminalBottomRef = useRef<HTMLDivElement>(null);

  // Stepped sequence definitions
  const stepDefinitions = [
    {
      hour: '06:00',
      label: 'Morning Orbital Query',
      tag: 'CHECK CATALOG',
      status: 'Querying ESA Copernicus CDSE OpenSearch API...',
      result: 'No new Sentinel-1 SAR scene found over sector',
      directive: 'Polling condition: IDLE → Sleep 6 hours',
      color: '#64748b',
    },
    {
      hour: '06:05',
      label: 'Idle Standby Window',
      tag: 'STANDBY / WAIT',
      status: 'Watchdog sleeping. Zero active orbital passes over Mauritius.',
      result: 'Catalog index clean. Low orbital elevation.',
      directive: 'Waiting for next satellite window...',
      color: '#475569',
    },
    {
      hour: '12:00',
      label: 'Midday Orbital Query',
      tag: 'CHECK CATALOG',
      status: 'Querying ESA Copernicus CDSE OData API for AOI [-20.38 to -20.50]...',
      result: 'No new scene detected. Orbit track 42 off-nadir.',
      directive: 'Polling condition: IDLE → Sleep 6 hours',
      color: '#64748b',
    },
    {
      hour: '12:05',
      label: 'Idle Standby Window',
      tag: 'STANDBY / WAIT',
      status: 'Watchdog sleeping. Sentinel-1B in orbital transit over Southern Hemisphere.',
      result: 'Target AOI monitoring queue active.',
      directive: 'Next predicted pass window: ~18:00 UTC.',
      color: '#475569',
    },
    {
      hour: '18:00',
      label: 'Evening Pass Detection',
      tag: 'NEW SCENE DETECTED',
      status: 'Sentinel-1 SAR Scene S1A_IW_GRDH_1SDV_20200810T174822 available!',
      result: 'Automated ingestion initiated: Extracting VV + VH polarizations',
      directive: 'Streaming to Deep Learning U-Net AI Segmentation Pipeline...',
      color: '#00f2fe',
    },
    {
      hour: '18:05',
      label: 'AI Spill Detection & Fusion',
      tag: '🟥 POSSIBLE OIL SPILL FLAGGED',
      status: 'U-Net Model confirmed 28.50 km² slick (Confidence: 96.4%)',
      result: 'Lagrangian current drift (-0.3, 0.2 m/s) + NOAA winds (14.2 kts) + GFW AIS correlation',
      directive: 'Emergency coastal landfall early warning ready for dispatch!',
      color: '#ef4444',
    },
  ];

  // Logs pool for each step
  const logsByStep: LogEntry[][] = [
    [
      { time: '06:00:00 UTC', type: 'info', text: 'Spill Trace Watchdog v2.1 awakened by system cron daemon' },
      { time: '06:00:02 UTC', type: 'query', text: 'GET https://catalogue.dataspace.copernicus.eu/odata/v1/Products' },
      { time: '06:00:03 UTC', type: 'query', text: 'Filter: Collection eq "SENTINEL-1" and Intersects(AOI_MAURITIUS)' },
      { time: '06:00:04 UTC', type: 'idle', text: 'HTTP 200 OK — 0 new products in time window [00:00 - 06:00 UTC]' },
      { time: '06:00:05 UTC', type: 'idle', text: 'Result: No new Sentinel-1 radar scene available' },
      { time: '06:00:06 UTC', type: 'idle', text: 'Directive: Standby. Scheduled sleep until 12:00 UTC window' },
    ],
    [
      { time: '06:01:00 UTC', type: 'idle', text: 'System status: IDLE / SLEEPING' },
      { time: '08:30:00 UTC', type: 'info', text: 'Background heartbeat check: NOMINAL (0 alerts queued)' },
      { time: '11:58:00 UTC', type: 'info', text: 'Scheduled timer expired: Awakening watchdog for 12:00 cycle' },
    ],
    [
      { time: '12:00:00 UTC', type: 'info', text: 'Spill Trace Watchdog checking midday satellite pass window...' },
      { time: '12:00:01 UTC', type: 'query', text: 'GET /odata/v1/Products?filter=Sentinel-1+Sentinel-2&BBox=[-20.38,57.68]' },
      { time: '12:00:03 UTC', type: 'idle', text: 'HTTP 200 OK — 0 matching calibrated L1C/L2A scenes found' },
      { time: '12:00:04 UTC', type: 'idle', text: 'Result: No new satellite scene available' },
      { time: '12:00:05 UTC', type: 'idle', text: 'Directive: Standby. Scheduled sleep until 18:00 UTC orbital pass' },
    ],
    [
      { time: '12:01:00 UTC', type: 'idle', text: 'System status: IDLE / SLEEPING' },
      { time: '15:20:00 UTC', type: 'info', text: 'Orbital ephemeris calculation: Sentinel-1 ascending pass predicted at ~17:48 UTC' },
      { time: '17:55:00 UTC', type: 'info', text: 'Sentinel-1 ground downlink completed at Inuvik station. Ingesting...' },
    ],
    [
      { time: '18:00:00 UTC', type: 'info', text: 'Spill Trace Watchdog polling evening pass window...' },
      { time: '18:00:01 UTC', type: 'query', text: 'GET /odata/v1/Products?filter=Collection eq "SENTINEL-1"&aoi=Mauritius' },
      { time: '18:00:03 UTC', type: 'detect', text: 'HTTP 200 OK — 1 NEW SAR PRODUCT FOUND! [S1A_IW_GRDH_1SDV_20200810T174822]' },
      { time: '18:00:04 UTC', type: 'detect', text: 'Starting autonomous automated download from CDSE S3 bucket (~42 MB)...' },
      { time: '18:00:06 UTC', type: 'detect', text: 'Extraction complete: VV band + VH band dual polarizations loaded' },
      { time: '18:00:08 UTC', type: 'info', text: 'Signal Processing: Applied Lee Speckle Filter (7x7 window) & dB normalization' },
      { time: '18:00:10 UTC', type: 'detect', text: 'Launching AI Inference Engine: U-Net Deep Convolutional Network (256x256)' },
    ],
    [
      { time: '18:02:15 UTC', type: 'alert', text: '🟥 AI INFERENCE ALERT: POSSIBLY CONFIRMED OIL SPILL DETECTED!' },
      { time: '18:02:16 UTC', type: 'alert', text: 'Detected Surface Area: 28.50 km² | Confidence Score: 96.4%' },
      { time: '18:02:17 UTC', type: 'alert', text: 'Backscatter Damping Anomaly: -4.82 dB below ambient ocean baseline' },
      { time: '18:03:00 UTC', type: 'success', text: 'Autonomous Trigger: Starting Lagrangian Drift & Hindcast Simulation...' },
      { time: '18:03:10 UTC', type: 'success', text: 'Ingested NOAA GFS Winds (14.2 kts ESE) + HYCOM Ocean Currents (0.35 m/s)' },
      { time: '18:03:25 UTC', type: 'success', text: 'AIS Intelligence Fusion: Ingested Global Fishing Watch vessel transponders' },
      { time: '18:03:30 UTC', type: 'alert', text: 'Correlated Suspect Vessel: MV Wakashio (Rank #1, Evidence: 94.2/100, AIS Gap Flagged)' },
      { time: '18:04:00 UTC', type: 'success', text: 'Coastal Landfall Threat: Blue Bay Marine Park (ETA: 4.2h, Prob: 92%)' },
      { time: '18:05:00 UTC', type: 'success', text: 'ADVISORY READY: System standing by to launch 3D Surveillance Globe & AI Vision Lab' },
    ],
  ];

  // Auto progression timer
  useEffect(() => {
    if (!isPlaying) return;

    const baseDelays = [3200, 2000, 3200, 2000, 4200, 5000];
    const delay = (baseDelays[currentStep] || 3000) / speedMultiplier;

    const timer = setTimeout(() => {
      if (currentStep < stepDefinitions.length - 1) {
        setCurrentStep((prev) => prev + 1);
      } else {
        setIsPlaying(false); // Stop at the end
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [currentStep, isPlaying, speedMultiplier]);

  // Auto scroll terminal
  useEffect(() => {
    if (terminalBottomRef.current) {
      terminalBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentStep]);

  // Flattened logs up to current step
  const visibleLogs = logsByStep.slice(0, currentStep + 1).flat();

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: '#040711',
      color: '#f1f5f9',
      overflow: 'hidden',
      padding: '16px 22px',
      boxSizing: 'border-box',
    }}>
      {/* Top Header Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: '12px',
        borderBottom: '1px solid rgba(0, 242, 254, 0.25)',
        marginBottom: '14px',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            background: 'rgba(0, 242, 254, 0.15)',
            border: '1px solid #00f2fe',
            borderRadius: '10px',
            padding: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(0, 242, 254, 0.3)',
          }}>
            <Satellite size={22} color="#00f2fe" />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.74rem', fontWeight: 900, color: '#00f2fe', letterSpacing: '1px' }}>
                SPILL TRACE • AUTONOMOUS SATELLITE WATCHDOG
              </span>
              <span style={{ color: '#64748b' }}>|</span>
              <span style={{
                background: currentStep >= 4 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(0, 242, 254, 0.12)',
                border: currentStep >= 4 ? '1px solid #ef4444' : '1px solid rgba(0, 242, 254, 0.4)',
                color: currentStep >= 4 ? '#ef4444' : '#38bdf8',
                fontSize: '0.62rem',
                fontWeight: 800,
                padding: '2px 6px',
                borderRadius: '4px',
              }}>
                {currentStep < 4 ? 'POLLING MODE' : currentStep === 4 ? 'SCENE INGESTION' : 'ALERT DISPATCHED'}
              </span>
            </div>
            <h1 style={{ margin: '2px 0 0 0', fontSize: '1.25rem', fontWeight: 900, color: '#ffffff' }}>
              24-Hour Autonomous Orbital Surveillance & Catalog Polling Simulation
            </h1>
          </div>
        </div>

        {/* Top Quick Actions: Skip to Globe / AI Lab */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={onProceedToGlobe}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#cbd5e1',
              borderRadius: '8px',
              padding: '7px 14px',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s',
            }}
          >
            <Globe2 size={15} />
            <span>Enter 3D Ocean Globe →</span>
          </button>

          <button
            onClick={onLaunchDetection}
            style={{
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              border: 'none',
              color: '#ffffff',
              borderRadius: '8px',
              padding: '7px 16px',
              fontSize: '0.78rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 0 16px rgba(239, 68, 68, 0.4)',
            }}
          >
            <Microscope size={15} />
            <span>Direct AI Detection Lab</span>
          </button>
        </div>
      </div>

      {/* Interactive Simulation Control & Timeline Bar */}
      <div style={{
        background: 'rgba(10, 16, 32, 0.85)',
        border: '1px solid rgba(0, 242, 254, 0.25)',
        borderRadius: '12px',
        padding: '12px 18px',
        marginBottom: '14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
        gap: '16px',
        flexWrap: 'wrap',
      }}>
        {/* Left: Digital Chronometer */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            background: 'rgba(0, 0, 0, 0.6)',
            border: '1px solid rgba(0, 242, 254, 0.4)',
            borderRadius: '8px',
            padding: '6px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <Clock size={18} color="#00f2fe" />
            <div>
              <div style={{ fontSize: '0.62rem', color: '#64748b', fontWeight: 800 }}>SIMULATED TIME</div>
              <div style={{ fontSize: '1.2rem', fontFamily: 'monospace', fontWeight: 900, color: '#00f2fe' }}>
                {stepDefinitions[currentStep].hour} <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>UTC</span>
              </div>
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.70rem', color: '#94a3b8' }}>TARGET SECTOR / AOI:</div>
            <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#f1f5f9' }}>
              Mauritius / Pointe d'Esny [-20.4381°S, 57.7446°E]
            </div>
          </div>
        </div>

        {/* Center: 3 Primary Timeline Nodes (06:00 -> 12:00 -> 18:00) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, maxWidth: '520px' }}>
          {[
            { step: 0, time: '06:00 UTC', label: '1. Morning Check', desc: 'No Scene → Wait' },
            { step: 2, time: '12:00 UTC', label: '2. Midday Check', desc: 'No Scene → Wait' },
            { step: 4, time: '18:00 UTC', label: '3. Evening Sweep', desc: '🛰️ Pass → AI Detection' },
          ].map((item, idx) => {
            const isCompleted = currentStep > item.step + 1;
            const isCurrent = currentStep === item.step || currentStep === item.step + 1;
            const isAlert = item.step === 4 && currentStep >= 4;

            return (
              <React.Fragment key={idx}>
                <div
                  onClick={() => {
                    setCurrentStep(item.step);
                    setIsPlaying(false);
                  }}
                  style={{
                    flex: 1,
                    background: isCurrent
                      ? isAlert ? 'rgba(239, 68, 68, 0.2)' : 'rgba(0, 242, 254, 0.2)'
                      : isCompleted ? 'rgba(34, 197, 94, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                    border: isCurrent
                      ? isAlert ? '1px solid #ef4444' : '1px solid #00f2fe'
                      : isCompleted ? '1px solid rgba(34, 197, 94, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '8px',
                    padding: '6px 10px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    textAlign: 'center',
                  }}
                >
                  <div style={{
                    fontSize: '0.72rem',
                    fontWeight: 900,
                    color: isCurrent
                      ? isAlert ? '#ef4444' : '#00f2fe'
                      : isCompleted ? '#22c55e' : '#94a3b8',
                  }}>
                    {item.time}
                  </div>
                  <div style={{ fontSize: '0.62rem', color: '#cbd5e1', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.desc}
                  </div>
                </div>

                {idx < 2 && (
                  <ArrowRight size={14} color={currentStep > (idx === 0 ? 1 : 3) ? '#22c55e' : '#475569'} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Right: Controls & Speed Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            style={{
              background: isPlaying ? 'rgba(234, 179, 8, 0.2)' : 'rgba(0, 242, 254, 0.2)',
              border: isPlaying ? '1px solid #eab308' : '1px solid #00f2fe',
              color: isPlaying ? '#eab308' : '#00f2fe',
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '0.74rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {isPlaying ? <Pause size={13} /> : <Play size={13} />}
            <span>{isPlaying ? 'Pause' : 'Resume'}</span>
          </button>

          <button
            onClick={() => {
              setCurrentStep(0);
              setIsPlaying(true);
            }}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#cbd5e1',
              borderRadius: '6px',
              padding: '6px 10px',
              fontSize: '0.74rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
            title="Restart Simulation"
          >
            <RotateCcw size={13} />
          </button>

          {/* Speed Toggles */}
          <div style={{ display: 'flex', background: 'rgba(0, 0, 0, 0.4)', borderRadius: '6px', padding: '2px', border: '1px solid rgba(255,255,255,0.1)' }}>
            {[1, 2, 4].map((s) => (
              <button
                key={s}
                onClick={() => setSpeedMultiplier(s)}
                style={{
                  background: speedMultiplier === s ? '#00f2fe' : 'transparent',
                  color: speedMultiplier === s ? '#030712' : '#94a3b8',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '3px 7px',
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Split-Screen: Visual Flow Chart (Left) + Live Telemetry Terminal (Right) */}
      <div style={{
        flex: 1,
        minHeight: 0,
        display: 'grid',
        gridTemplateColumns: '1.05fr 1fr',
        gap: '14px',
      }}>
        {/* LEFT COLUMN: Visual Watchdog Step Flow */}
        <div style={{
          background: 'rgba(6, 11, 24, 0.85)',
          border: '1px solid rgba(0, 242, 254, 0.2)',
          borderRadius: '12px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
        }}>
          <div style={{ fontSize: '0.74rem', fontWeight: 900, color: '#00f2fe', letterSpacing: '0.8px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Radio size={14} />
            <span>OPERATIONAL WATCHDOG DECISION FLOW</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* 1. 06:00 CYCLE */}
            <div style={{
              background: currentStep <= 1 ? 'rgba(0, 242, 254, 0.08)' : 'rgba(15, 23, 42, 0.5)',
              border: currentStep <= 1 ? '1px solid #00f2fe' : '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '10px',
              padding: '12px 14px',
              transition: 'all 0.25s ease',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.92rem', fontWeight: 900, color: '#00f2fe', fontFamily: 'monospace' }}>06:00 UTC</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#f1f5f9' }}>→ Check ESA CDSE Catalog</span>
                </div>
                <span style={{
                  background: 'rgba(100, 116, 139, 0.2)',
                  color: '#94a3b8',
                  fontSize: '0.62rem',
                  fontWeight: 800,
                  padding: '2px 6px',
                  borderRadius: '4px',
                }}>
                  CYCLE 1
                </span>
              </div>

              <div style={{ margin: '8px 0 4px 18px', borderLeft: '2px solid rgba(100, 116, 139, 0.4)', paddingLeft: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ fontSize: '0.74rem', color: '#cbd5e1' }}>
                  ↓ No new Sentinel-1 scene over Mauritius sector
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                  ↓ <b>Wait / Standby (Sleep 6 hours)</b>
                </div>
              </div>
            </div>

            {/* Down Connector */}
            <div style={{ display: 'flex', justifyContent: 'center', margin: '-2px 0' }}>
              <div style={{ width: '2px', height: '14px', background: currentStep >= 2 ? '#22c55e' : 'rgba(255,255,255,0.15)' }} />
            </div>

            {/* 2. 12:00 CYCLE */}
            <div style={{
              background: currentStep === 2 || currentStep === 3 ? 'rgba(0, 242, 254, 0.08)' : 'rgba(15, 23, 42, 0.5)',
              border: currentStep === 2 || currentStep === 3 ? '1px solid #00f2fe' : '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '10px',
              padding: '12px 14px',
              transition: 'all 0.25s ease',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.92rem', fontWeight: 900, color: '#00f2fe', fontFamily: 'monospace' }}>12:00 UTC</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#f1f5f9' }}>→ Check ESA CDSE Catalog</span>
                </div>
                <span style={{
                  background: 'rgba(100, 116, 139, 0.2)',
                  color: '#94a3b8',
                  fontSize: '0.62rem',
                  fontWeight: 800,
                  padding: '2px 6px',
                  borderRadius: '4px',
                }}>
                  CYCLE 2
                </span>
              </div>

              <div style={{ margin: '8px 0 4px 18px', borderLeft: '2px solid rgba(100, 116, 139, 0.4)', paddingLeft: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ fontSize: '0.74rem', color: '#cbd5e1' }}>
                  ↓ No new satellite scene detected
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                  ↓ <b>Wait / Standby (Sleep 6 hours)</b>
                </div>
              </div>
            </div>

            {/* Down Connector */}
            <div style={{ display: 'flex', justifyContent: 'center', margin: '-2px 0' }}>
              <div style={{ width: '2px', height: '14px', background: currentStep >= 4 ? '#ef4444' : 'rgba(255,255,255,0.15)' }} />
            </div>

            {/* 3. 18:00 CYCLE - TRIGGER & DETECTION */}
            <div style={{
              background: currentStep >= 4 ? 'rgba(239, 68, 68, 0.12)' : 'rgba(15, 23, 42, 0.5)',
              border: currentStep >= 4 ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '10px',
              padding: '12px 14px',
              boxShadow: currentStep >= 4 ? '0 0 25px rgba(239, 68, 68, 0.25)' : 'none',
              transition: 'all 0.25s ease',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.92rem', fontWeight: 900, color: currentStep >= 4 ? '#ef4444' : '#00f2fe', fontFamily: 'monospace' }}>18:00 UTC</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#f1f5f9' }}>→ New Sentinel-1 scene available!</span>
                </div>
                <span style={{
                  background: currentStep >= 4 ? '#ef4444' : 'rgba(255,255,255,0.1)',
                  color: currentStep >= 4 ? '#ffffff' : '#94a3b8',
                  fontSize: '0.62rem',
                  fontWeight: 900,
                  padding: '2px 6px',
                  borderRadius: '4px',
                }}>
                  {currentStep >= 4 ? 'PASS DETECTED' : 'PENDING'}
                </span>
              </div>

              <div style={{ margin: '8px 0 4px 18px', borderLeft: currentStep >= 4 ? '2px solid #ef4444' : '2px solid rgba(100, 116, 139, 0.4)', paddingLeft: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ fontSize: '0.74rem', color: currentStep >= 4 ? '#38bdf8' : '#cbd5e1' }}>
                  ↓ <b>Automatically download & calibrate (VV + VH polarizations)</b>
                </div>

                <div style={{ fontSize: '0.74rem', color: currentStep >= 4 ? '#a78bfa' : '#cbd5e1' }}>
                  ↓ <b>Deep Learning U-Net AI analysis (256x256 segmentation)</b>
                </div>

                <div style={{
                  background: currentStep >= 5 ? 'rgba(239, 68, 68, 0.2)' : 'transparent',
                  border: currentStep >= 5 ? '1px solid #ef4444' : 'none',
                  borderRadius: '6px',
                  padding: currentStep >= 5 ? '6px 8px' : '0',
                  fontSize: '0.76rem',
                  fontWeight: 800,
                  color: currentStep >= 5 ? '#f87171' : '#cbd5e1',
                }}>
                  ↓ 🟥 <b>Possible oil spill detected (Area: 28.50 km², Confidence: 96.4%)</b>
                </div>

                <div style={{ fontSize: '0.74rem', color: currentStep >= 5 ? '#22c55e' : '#cbd5e1' }}>
                  ↓ <b>AIS Dark Vessel + NOAA Wind + HYCOM Current Drift Analysis</b>
                </div>
              </div>
            </div>
          </div>

          {/* Action Callout once 18:00 is reached */}
          {currentStep >= 4 && (
            <div style={{
              marginTop: '14px',
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(0, 242, 254, 0.15) 100%)',
              border: '1px solid #ef4444',
              borderRadius: '10px',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldAlert size={18} color="#ef4444" />
                <span style={{ fontSize: '0.82rem', fontWeight: 900, color: '#f1f5f9' }}>
                  CRITICAL SATELLITE PASS PROCESSED & VERIFIED
                </span>
              </div>
              <div style={{ fontSize: '0.72rem', color: '#cbd5e1' }}>
                Automated pipeline successfully detected and characterized the 28.5 km² slick over Pointe d'Esny. Enter Act 1 to inspect the 3D globe or launch Act 2 for AI backscatter analysis.
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <button
                  onClick={onProceedToGlobe}
                  style={{
                    flex: 1,
                    background: 'rgba(0, 242, 254, 0.2)',
                    border: '1px solid #00f2fe',
                    color: '#00f2fe',
                    borderRadius: '6px',
                    padding: '8px',
                    fontSize: '0.76rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  <Globe2 size={14} />
                  <span>Inspect in 3D Ocean Globe</span>
                </button>

                <button
                  onClick={onLaunchDetection}
                  style={{
                    flex: 1,
                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    border: 'none',
                    color: '#ffffff',
                    borderRadius: '6px',
                    padding: '8px',
                    fontSize: '0.76rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    boxShadow: '0 0 12px rgba(239, 68, 68, 0.4)',
                  }}
                >
                  <Microscope size={14} />
                  <span>Inspect AI Vision Lab</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Live Cyber Telemetry Terminal */}
        <div style={{
          background: '#020409',
          border: '1px solid rgba(0, 242, 254, 0.25)',
          borderRadius: '12px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
        }}>
          {/* Terminal Header */}
          <div style={{
            padding: '8px 14px',
            background: 'rgba(15, 23, 42, 0.9)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Terminal size={14} color="#00f2fe" />
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#f1f5f9', fontFamily: 'monospace' }}>
                SPILTRACE_DAEMON.LOG (LIVE CDSE API FEED)
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: isPlaying ? '#22c55e' : '#eab308',
                boxShadow: isPlaying ? '0 0 8px #22c55e' : '0 0 8px #eab308',
              }} />
              <span style={{ fontSize: '0.65rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                {isPlaying ? 'STREAMING' : 'PAUSED'}
              </span>
            </div>
          </div>

          {/* Terminal Body */}
          <div style={{
            flex: 1,
            padding: '12px 14px',
            overflowY: 'auto',
            fontFamily: 'Consolas, Monaco, "Courier New", monospace',
            fontSize: '0.70rem',
            lineHeight: 1.55,
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}>
            {visibleLogs.map((log, index) => {
              const typeColor =
                log.type === 'alert'
                  ? '#ef4444'
                  : log.type === 'detect'
                  ? '#00f2fe'
                  : log.type === 'success'
                  ? '#22c55e'
                  : log.type === 'query'
                  ? '#38bdf8'
                  : log.type === 'idle'
                  ? '#94a3b8'
                  : '#cbd5e1';

              return (
                <div key={index} style={{ display: 'flex', gap: '10px' }}>
                  <span style={{ color: '#64748b', flexShrink: 0 }}>[{log.time.split(' ')[0]}]</span>
                  <span style={{ color: typeColor }}>{log.text}</span>
                </div>
              );
            })}
            <div ref={terminalBottomRef} />
          </div>

          {/* Terminal Footer Status Bar */}
          <div style={{
            padding: '8px 14px',
            background: 'rgba(15, 23, 42, 0.7)',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.68rem',
            color: '#94a3b8',
            fontFamily: 'monospace',
          }}>
            <span>POLL_INTERVAL: 6 HOURS</span>
            <span>CATALOG_TARGET: CDSE OData v1</span>
            <span>STATUS: {stepDefinitions[currentStep].tag}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
