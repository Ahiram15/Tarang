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
  Layers
} from 'lucide-react';

interface WatchdogSimulationProps {
  onProceedToGlobe: () => void;
  onLaunchDetection: () => void;
}

interface OceanZone {
  name: string;
  status: 'nominal' | 'alert' | 'scanning';
  activeAt?: number;
}

export const WatchdogSimulation: React.FC<WatchdogSimulationProps> = ({
  onProceedToGlobe,
  onLaunchDetection,
}) => {
  // 3 main stages:
  // stage 0: 06:00 Check -> No scene -> Wait
  // stage 1: 12:00 Check -> No scene -> Wait
  // stage 2: 18:00 New scene available -> Download -> AI analysis -> 🟥 Possible oil spill -> AIS + wind + current
  const [activeStage, setActiveStage] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState<boolean>(false);

  // Global Ocean Basins monitored by the autonomous constellation
  const oceanZones: OceanZone[] = [
    { name: 'North Atlantic', status: 'nominal' },
    { name: 'South Pacific', status: 'nominal' },
    {
      name: 'Indian Ocean Corridor',
      status: activeStage === 2 ? 'alert' : activeStage === 1 ? 'scanning' : 'nominal',
      activeAt: 2
    },
    { name: 'Mediterranean Sea', status: 'nominal' },
    { name: 'Strait of Malacca', status: 'nominal' },
    { name: 'Persian Gulf & Red Sea', status: 'nominal' },
  ];

  // Auto-advance through the 3 stages
  useEffect(() => {
    if (!isPlaying) return;

    const timer = setTimeout(() => {
      if (activeStage < 2) {
        setActiveStage((prev) => prev + 1);
      } else {
        setIsPlaying(false);
      }
    }, activeStage === 2 ? 6000 : 3500);

    return () => clearTimeout(timer);
  }, [activeStage, isPlaying]);

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: '#040711',
      color: '#f1f5f9',
      overflowY: 'auto',
      padding: '24px 32px',
      boxSizing: 'border-box',
    }}>
      {/* Top Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: '16px',
        borderBottom: '1px solid rgba(0, 242, 254, 0.2)',
        marginBottom: '20px',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            background: 'rgba(0, 242, 254, 0.12)',
            border: '1px solid #00f2fe',
            borderRadius: '10px',
            padding: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(0, 242, 254, 0.25)',
          }}>
            <Satellite size={24} color="#00f2fe" />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#00f2fe', letterSpacing: '1px' }}>
                SPILL TRACE • AUTONOMOUS GLOBAL OCEAN WATCHDOG
              </span>
              <span style={{ color: '#64748b' }}>•</span>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Planetary Satellite Constellation Monitoring</span>
            </div>
            <h1 style={{ margin: '3px 0 0 0', fontSize: '1.35rem', fontWeight: 900, color: '#ffffff' }}>
              How Autonomous Satellite Monitoring Works Across All Oceans
            </h1>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: '#94a3b8' }}>
              Radar satellites orbit Earth continuously. Every 6 hours, Spill Trace scans all major ocean basins and shipping routes worldwide for newly acquired SAR passes.
            </p>
          </div>
        </div>

        {/* Action button to proceed directly to globe */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={onProceedToGlobe}
            style={{
              background: 'linear-gradient(135deg, #00f2fe 0%, #38bdf8 100%)',
              border: 'none',
              color: '#030712',
              borderRadius: '8px',
              padding: '8px 18px',
              fontSize: '0.82rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 0 20px rgba(0, 242, 254, 0.3)',
            }}
          >
            <Globe2 size={16} />
            <span>Open 3D Ocean Globe →</span>
          </button>
        </div>
      </div>

      {/* Global Ocean Basins Monitored Bar */}
      <div style={{
        background: 'rgba(15, 23, 42, 0.6)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '10px',
        padding: '8px 16px',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '10px',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', fontWeight: 800, color: '#94a3b8' }}>
          <Globe2 size={14} color="#00f2fe" />
          <span>PLANETARY RADAR COVERAGE:</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {oceanZones.map((zone) => {
            const isAlert = zone.status === 'alert';
            const isScanning = zone.status === 'scanning';
            return (
              <div
                key={zone.name}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  background: isAlert
                    ? 'rgba(239, 68, 68, 0.2)'
                    : isScanning
                    ? 'rgba(0, 242, 254, 0.15)'
                    : 'rgba(255, 255, 255, 0.04)',
                  border: isAlert
                    ? '1px solid #ef4444'
                    : isScanning
                    ? '1px solid #00f2fe'
                    : '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '6px',
                  padding: '3px 9px',
                  fontSize: '0.72rem',
                  fontWeight: isAlert ? 800 : 600,
                  color: isAlert ? '#f87171' : isScanning ? '#00f2fe' : '#cbd5e1',
                  transition: 'all 0.3s ease',
                }}
              >
                <span style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: isAlert ? '#ef4444' : isScanning ? '#00f2fe' : '#22c55e',
                  boxShadow: isAlert ? '0 0 8px #ef4444' : 'none',
                }} />
                <span>{zone.name}</span>
                {isAlert && <span style={{ fontSize: '0.66rem', color: '#fca5a5' }}>[SPILL DETECTED]</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Control Banner: Current Status & Play/Pause */}
      <div style={{
        background: 'rgba(10, 16, 32, 0.8)',
        border: '1px solid rgba(0, 242, 254, 0.25)',
        borderRadius: '12px',
        padding: '12px 20px',
        marginBottom: '22px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(0, 0, 0, 0.5)',
            border: '1px solid rgba(0, 242, 254, 0.3)',
            borderRadius: '8px',
            padding: '6px 14px',
          }}>
            <Clock size={18} color="#00f2fe" />
            <span style={{ fontSize: '1.15rem', fontFamily: 'monospace', fontWeight: 900, color: '#00f2fe' }}>
              {activeStage === 0 ? '06:00' : activeStage === 1 ? '12:00' : '18:00'} UTC
            </span>
          </div>

          <div>
            <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700 }}>AUTONOMOUS WATCHDOG STATUS:</div>
            <div style={{ fontSize: '0.88rem', fontWeight: 800, color: activeStage === 2 ? '#ef4444' : '#38bdf8' }}>
              {activeStage === 0 && '06:00 UTC: Scanning global ocean catalog (Atlantic, Mediterranean, Malacca)... No new radar passes. Standby.'}
              {activeStage === 1 && '12:00 UTC: Scanning global ocean catalog (Pacific, Arabian Sea, Red Sea)... Constellation in orbit transit. Standby.'}
              {activeStage === 2 && '18:00 UTC: Sentinel-1 radar pass acquired over Indian Ocean route! Ingesting scene, running AI model & maritime fusion...'}
            </div>
          </div>
        </div>

        {/* Play / Replay Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            style={{
              background: isPlaying ? 'rgba(234, 179, 8, 0.15)' : 'rgba(0, 242, 254, 0.15)',
              border: isPlaying ? '1px solid #eab308' : '1px solid #00f2fe',
              color: isPlaying ? '#eab308' : '#00f2fe',
              borderRadius: '6px',
              padding: '6px 14px',
              fontSize: '0.78rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {isPlaying ? <Pause size={14} /> : <Play size={14} />}
            <span>{isPlaying ? 'Pause Simulation' : 'Resume Simulation'}</span>
          </button>

          <button
            onClick={() => {
              setActiveStage(0);
              setIsPlaying(true);
            }}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#cbd5e1',
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <RotateCcw size={14} />
            <span>Restart</span>
          </button>
        </div>
      </div>

      {/* 3 Main Progression Cards (06:00 -> 12:00 -> 18:00) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '20px',
        marginBottom: '20px',
      }}>
        {/* CARD 1: 06:00 */}
        <div
          onClick={() => {
            setActiveStage(0);
            setIsPlaying(false);
          }}
          style={{
            background: activeStage === 0 ? 'rgba(0, 242, 254, 0.08)' : 'rgba(10, 16, 30, 0.6)',
            border: activeStage === 0 ? '2px solid #00f2fe' : '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '14px',
            padding: '20px',
            cursor: 'pointer',
            transition: 'all 0.25s ease',
            boxShadow: activeStage === 0 ? '0 0 25px rgba(0, 242, 254, 0.2)' : 'none',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.15rem', fontWeight: 900, color: '#00f2fe', fontFamily: 'monospace' }}>
                06:00
              </span>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>UTC</span>
            </div>
            <span style={{
              background: activeStage === 0 ? 'rgba(0, 242, 254, 0.2)' : 'rgba(255, 255, 255, 0.05)',
              color: activeStage === 0 ? '#00f2fe' : '#64748b',
              fontSize: '0.68rem',
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: '6px',
            }}>
              CYCLE 1 • GLOBAL SCAN
            </span>
          </div>

          {/* Simple Step Sequence */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ background: 'rgba(56, 189, 248, 0.2)', padding: '6px', borderRadius: '6px' }}>
                <Search size={16} color="#38bdf8" />
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f1f5f9' }}>Check Catalog</div>
                <div style={{ fontSize: '0.70rem', color: '#94a3b8' }}>Atlantic, Mediterranean & Malacca</div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <ArrowDown size={14} color="#64748b" />
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px dashed rgba(255, 255, 255, 0.15)',
              borderRadius: '8px',
              padding: '10px 12px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#cbd5e1' }}>
                No new Sentinel-1 scene
              </div>
              <div style={{ fontSize: '0.70rem', color: '#64748b', marginTop: '2px' }}>
                No active radar passes captured for monitored routes
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <ArrowDown size={14} color="#64748b" />
            </div>

            <div style={{
              background: 'rgba(100, 116, 139, 0.15)',
              borderRadius: '8px',
              padding: '8px 12px',
              textAlign: 'center',
              fontSize: '0.80rem',
              fontWeight: 700,
              color: '#94a3b8',
            }}>
              ⏳ Wait / Sleep (6 hours)
            </div>
          </div>
        </div>

        {/* CARD 2: 12:00 */}
        <div
          onClick={() => {
            setActiveStage(1);
            setIsPlaying(false);
          }}
          style={{
            background: activeStage === 1 ? 'rgba(0, 242, 254, 0.08)' : 'rgba(10, 16, 30, 0.6)',
            border: activeStage === 1 ? '2px solid #00f2fe' : '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '14px',
            padding: '20px',
            cursor: 'pointer',
            transition: 'all 0.25s ease',
            boxShadow: activeStage === 1 ? '0 0 25px rgba(0, 242, 254, 0.2)' : 'none',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.15rem', fontWeight: 900, color: '#00f2fe', fontFamily: 'monospace' }}>
                12:00
              </span>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>UTC</span>
            </div>
            <span style={{
              background: activeStage === 1 ? 'rgba(0, 242, 254, 0.2)' : 'rgba(255, 255, 255, 0.05)',
              color: activeStage === 1 ? '#00f2fe' : '#64748b',
              fontSize: '0.68rem',
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: '6px',
            }}>
              CYCLE 2 • GLOBAL SCAN
            </span>
          </div>

          {/* Simple Step Sequence */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ background: 'rgba(56, 189, 248, 0.2)', padding: '6px', borderRadius: '6px' }}>
                <Search size={16} color="#38bdf8" />
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f1f5f9' }}>Check Catalog</div>
                <div style={{ fontSize: '0.70rem', color: '#94a3b8' }}>Pacific, Arabian Sea & Red Sea</div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <ArrowDown size={14} color="#64748b" />
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px dashed rgba(255, 255, 255, 0.15)',
              borderRadius: '8px',
              padding: '10px 12px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#cbd5e1' }}>
                No new scene
              </div>
              <div style={{ fontSize: '0.70rem', color: '#64748b', marginTop: '2px' }}>
                Constellation in orbital transit across oceanic gaps
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <ArrowDown size={14} color="#64748b" />
            </div>

            <div style={{
              background: 'rgba(100, 116, 139, 0.15)',
              borderRadius: '8px',
              padding: '8px 12px',
              textAlign: 'center',
              fontSize: '0.80rem',
              fontWeight: 700,
              color: '#94a3b8',
            }}>
              ⏳ Wait / Sleep (6 hours)
            </div>
          </div>
        </div>

        {/* CARD 3: 18:00 - DETECTION & ACTION */}
        <div
          onClick={() => {
            setActiveStage(2);
            setIsPlaying(false);
          }}
          style={{
            background: activeStage === 2 ? 'rgba(239, 68, 68, 0.12)' : 'rgba(10, 16, 30, 0.6)',
            border: activeStage === 2 ? '2px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '14px',
            padding: '20px',
            cursor: 'pointer',
            transition: 'all 0.25s ease',
            boxShadow: activeStage === 2 ? '0 0 35px rgba(239, 68, 68, 0.3)' : 'none',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.15rem', fontWeight: 900, color: '#ef4444', fontFamily: 'monospace' }}>
                18:00
              </span>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>UTC</span>
            </div>
            <span style={{
              background: '#ef4444',
              color: '#ffffff',
              fontSize: '0.68rem',
              fontWeight: 900,
              padding: '2px 8px',
              borderRadius: '6px',
            }}>
              SAR PASS ACQUIRED!
            </span>
          </div>

          {/* Simple Step Sequence */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Satellite size={16} color="#00f2fe" />
              <div>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#00f2fe' }}>
                  New scene available!
                </span>
                <span style={{ fontSize: '0.70rem', color: '#94a3b8', display: 'block' }}>
                  Indian Ocean shipping corridor
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <ArrowDown size={14} color="#64748b" />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.80rem', color: '#cbd5e1' }}>
              <Download size={14} color="#38bdf8" />
              <span>Automatically download SAR scene</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <ArrowDown size={14} color="#64748b" />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.80rem', color: '#cbd5e1' }}>
              <Brain size={14} color="#a78bfa" />
              <span>AI analysis (Global U-Net Model)</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <ArrowDown size={14} color="#ef4444" />
            </div>

            <div style={{
              background: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid #ef4444',
              borderRadius: '8px',
              padding: '8px 10px',
              fontSize: '0.82rem',
              fontWeight: 900,
              color: '#f87171',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}>
              <span>🟥 Possible oil spill (28.5 km²)</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <ArrowDown size={14} color="#22c55e" />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.80rem', fontWeight: 700, color: '#22c55e' }}>
              <Waves size={14} />
              <span>AIS + wind + current analysis</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Result Callout: Appears when 18:00 is active */}
      {activeStage === 2 && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(0, 242, 254, 0.15) 100%)',
          border: '1px solid #ef4444',
          borderRadius: '12px',
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 0 30px rgba(239, 68, 68, 0.25)',
          marginBottom: '16px',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '1rem' }}>🚨</span>
              <span style={{ fontSize: '0.95rem', fontWeight: 900, color: '#ffffff' }}>
                Oil Spill Confirmed by Watchdog at 18:00 UTC (Indian Ocean Maritime Corridor)
              </span>
            </div>
            <div style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>
              Autonomous detection identified a <b>28.5 km² slick</b> in active shipping lanes, simulated drift with ocean currents, and cross-matched AIS cargo vessel transponders.
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={onProceedToGlobe}
              style={{
                background: 'rgba(0, 242, 254, 0.2)',
                border: '1px solid #00f2fe',
                color: '#00f2fe',
                borderRadius: '8px',
                padding: '9px 18px',
                fontSize: '0.82rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Globe2 size={16} />
              <span>Open 3D Ocean Globe</span>
            </button>

            <button
              onClick={onLaunchDetection}
              style={{
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                border: 'none',
                color: '#ffffff',
                borderRadius: '8px',
                padding: '9px 20px',
                fontSize: '0.82rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 0 15px rgba(239, 68, 68, 0.4)',
              }}
            >
              <span>View AI Vision & Drift Analysis →</span>
            </button>
          </div>
        </div>
      )}

      {/* Optional Collapsible: "Show Technical System Log" */}
      <div style={{ marginTop: 'auto', paddingTop: '10px' }}>
        <button
          onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
          style={{
            background: 'none',
            border: 'none',
            color: '#64748b',
            fontSize: '0.74rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 0',
          }}
        >
          <FileCode2 size={13} />
          <span>{showTechnicalDetails ? 'Hide technical API logs' : 'Show technical API details (CDSE Global OData & Multi-Sensor Fusion)'}</span>
        </button>

        {showTechnicalDetails && (
          <div style={{
            background: '#020409',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            padding: '12px',
            marginTop: '8px',
            fontFamily: 'monospace',
            fontSize: '0.70rem',
            color: '#94a3b8',
            lineHeight: 1.6,
          }}>
            <div>[API] Polling ESA CDSE OpenSearch: <span style={{ color: '#38bdf8' }}>catalogue.dataspace.copernicus.eu/odata/v1/Products</span></div>
            <div>[SURVEILLANCE] Global Maritime Corridors: Atlantic, Indian Ocean, Pacific, Mediterranean, Malacca Strait, Persian Gulf</div>
            <div>[MODEL] U-Net Deep Convolutional Neural Network (Input: 256x256 dual VV/VH SAR backscatter)</div>
            <div>[FUSION] HYCOM Ocean Surface Currents (0.35 m/s) + NOAA GFS Winds (14.2 knots ESE) + GFW AIS vessel transponder database</div>
          </div>
        )}
      </div>
    </div>
  );
};
