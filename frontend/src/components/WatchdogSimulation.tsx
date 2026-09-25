import React, { useState, useEffect, useRef } from 'react';
import {
  Globe2,
  ArrowRight,
  PlayCircle,
  Pause,
  RotateCcw,
  Terminal,
  CheckCircle2,
  Radar,
  Network,
  Radio,
  Layers,
  Sparkles,
} from 'lucide-react';
import { IncidentLocation } from '../types';

interface WatchdogSimulationProps {
  onProceedToGlobe: () => void;
  onLaunchDetection: () => void;
  selectedIncident?: IncidentLocation;
  onSelectIncident?: (inc: IncidentLocation) => void;
  incidents?: IncidentLocation[];
}

type SensorKey = 'sentinel1' | 'sentinel2' | 'landsat' | 'eos06';

interface SensorMetadata {
  title: string;
  spec: string;
  swath: string;
  res: string;
  calib: string;
  desc: string;
  clutter: string;
  slick: string;
  contrast: string;
}

export const WatchdogSimulation: React.FC<WatchdogSimulationProps> = ({
  onProceedToGlobe,
  onLaunchDetection,
  selectedIncident,
  onSelectIncident,
  incidents,
}) => {
  const isEmerald = selectedIncident?.id === 'emerald' || (selectedIncident?.lat && selectedIncident.lat > 0);
  const bboxLabel = isEmerald ? '33.380°N, 34.520°E' : '-20.438°S, 57.745°E';
  const regionLabel = isEmerald ? 'Levantine Basin (Eastern Mediterranean)' : 'Pointe d\'Esny Lagoon (Mauritius)';
  const incidentArea = isEmerald ? '42.6 km²' : '28.5 km²';
  const [selectedSensor, setSelectedSensor] = useState<SensorKey>('sentinel1');
  const [activeCycle, setActiveCycle] = useState<number>(2); // 0: 14:00Z, 1: 14:30Z, 2: 15:00Z
  const [isStreaming, setIsStreaming] = useState<boolean>(true);
  const terminalScreenRef = useRef<HTMLDivElement>(null);

  const sensorData: Record<SensorKey, SensorMetadata> = {
    sentinel1: {
      title: 'Active Subsystem: Sentinel-1A C-SAR Payload',
      spec: 'FREQ: 5.405 GHz // POL: VV+VH',
      swath: '250 km (IW Mode)',
      res: '5m x 20m (Native SAR)',
      calib: 'LUT Applied (dB)',
      desc: 'Hydrocarbon films form viscoelastic monolayers dampening high-frequency ocean capillary-gravity waves (wavelength 1.5–5 cm). This eliminates Bragg resonance scatter, producing stark low-backscatter radar dark signatures (< -22 dB).',
      clutter: '-14.2 dB',
      slick: '-21.8 dB',
      contrast: '-7.6 dB',
    },
    sentinel2: {
      title: 'Active Subsystem: Sentinel-2A MSI Optical Multi-Spectral',
      spec: 'BANDS: B2, B3, B4, B8, B11 // SWIR-2',
      swath: '290 km Swath',
      res: '10m – 20m VNIR',
      calib: 'TOA Refl -> BOA (Sen2Cor)',
      desc: 'Multi-Spectral Instrument identifies sunglint reflectance gradients and hydrocarbon absorption dip at 1.6 µm (SWIR). Cross-validates dark SAR formations against cloud cover and biogenic algal blooms.',
      clutter: '0.012 FAI',
      slick: '0.084 FAI',
      contrast: '+0.072 FAI',
    },
    landsat: {
      title: 'Active Subsystem: Landsat-8/9 TIRS Thermal Sensor',
      spec: 'B10 (10.6–11.19 µm) / B11 (11.5–12.51 µm)',
      swath: '185 km Swath',
      res: '100m Resampled to 30m',
      calib: 'Split-Window Brightness Temp',
      desc: 'Thermal Infrared Sensor maps surface skin temperature differentials. Thick oil emulsions display significant daytime thermal heating (0.5K–1.8K warmer than ambient sea) indicating high emulsion volume.',
      clutter: '19.4°C SST',
      slick: '20.6°C Core',
      contrast: '+1.2 K Delta',
    },
    eos06: {
      title: 'Active Subsystem: ISRO EOS-06 (Oceansat-3) Scatterometer',
      spec: 'FREQ: 13.515 GHz (Ku-Band) // 4 Beams',
      swath: '1400 km Wide Conical',
      res: '25 km Wind Vectors',
      calib: 'Ocean Sigma-0 Geo-calibrated',
      desc: 'Measures 10m neutral equivalent ocean surface wind vectors. Critical for look-alike gating: winds between 3 m/s and 12 m/s validate SAR oil slicks while winds < 3 m/s trigger calm water biogenic slick rejections.',
      clutter: '4.8 m/s NW',
      slick: 'Vector Valid',
      contrast: 'Gating Passed',
    },
  };

  const [logs, setLogs] = useState<Array<{
    id: string;
    time: string;
    tag: string;
    color: string;
    message: string;
  }>>([
    { id: '1', time: '15:00:01Z', tag: 'INFO', color: '#00f2fe', message: 'CDSE STAC Daemon v4.8 initialized. Synchronizing catalog endpoints.' },
    { id: '2', time: '15:00:14Z', tag: 'POLL', color: '#10b981', message: 'Querying Copernicus STAC API for AOI: Levantine Basin / Indian Ocean...' },
    { id: '3', time: '15:00:26Z', tag: 'TIER1', color: '#38bdf8', message: 'Ingested 2.1 MB quicklook GeoTIFF (GSD: 100m, BBOX: -20.438°S, 57.745°E).' },
    { id: '4', time: '15:00:40Z', tag: 'TIER1', color: '#38bdf8', message: '2-param CFAR sea clutter baseline: μ = -14.2 dB, σ = 1.84 dB. Anomaly detected (-16.2 dB dip).' },
    { id: '5', time: '15:01:05Z', tag: 'TIER2', color: '#a855f7', message: 'Triggering targeted 10m sub-patch extraction via CDSE Process API (4.8 MB payload). 99.3% cloud egress saved.' },
    { id: '6', time: '15:01:28Z', tag: 'AI-LAB', color: '#10b981', message: 'Applying 7x7 Gamma-MAP speckle filter. Dual-pol U-Net inference initialized (unet_oilspill.h5).' },
    { id: '7', time: '15:01:42Z', tag: 'DETECTION', color: '#ef4444', message: 'Oil slick confirmed. Area: 42.6 km² | Mean thickness: 180 µm | Confidence: 96.4%.' },
    { id: '8', time: '15:02:10Z', tag: 'WIND-GATE', color: '#f59e0b', message: 'EOS-06 Scatterometer wind: 4.8 m/s @ 142°. Rejection test passed. Dispatching to 3D Globe Radar.' },
  ]);

  // Auto-scroll terminal
  useEffect(() => {
    if (terminalScreenRef.current) {
      terminalScreenRef.current.scrollTop = terminalScreenRef.current.scrollHeight;
    }
  }, [logs]);

  // Live background log emission
  useEffect(() => {
    if (!isStreaming) return;
    const pool = [
      { tag: 'STAC', color: '#00f2fe', message: 'Heartbeat: Copernicus OpenSearch gateway responding within 190ms.' },
      { tag: 'WIND', color: '#38bdf8', message: 'ISRO EOS-06 Scatterometer swath telemetry: 4.8 m/s @ 312° NW across shipping lane.' },
      { tag: 'TIER1', color: '#f59e0b', message: '2-parameter CFAR clutter distribution: μ = -14.2 dB, σ = 1.84 dB across 100m grid.' },
      { tag: 'EGRESS', color: '#10b981', message: 'Storage savings confirmed: 99.3% bandwidth saved (0 unneeded gigabyte downloads).' },
      { tag: 'TIRS', color: '#f59e0b', message: 'Landsat-8 Band 10 calibrated: Sea skin baseline 19.4°C.' },
      { tag: 'MSI', color: '#38bdf8', message: 'Sentinel-2 cloud mask verified nominal across target bounding box.' },
      { tag: 'CDSE', color: '#a855f7', message: 'Process API sub-patch bounding box cache warm and responsive.' },
      { tag: 'AIS', color: '#00f2fe', message: 'Corridor vessel transponder stream ingested: 18 commercial vessels tracked.' },
    ];

    const timer = setInterval(() => {
      const now = new Date();
      const timeStr = now.toISOString().substring(11, 19) + 'Z';
      const item = pool[Math.floor(Math.random() * pool.length)];
      setLogs((prev) => [
        ...prev.slice(-40),
        {
          id: `log-${Date.now()}-${Math.random()}`,
          time: timeStr,
          tag: item.tag,
          color: item.color,
          message: item.message,
        },
      ]);
    }, 3200);

    return () => clearInterval(timer);
  }, [isStreaming]);

  const triggerSimulateSweep = () => {
    const now = new Date();
    const timeStr = now.toISOString().substring(11, 19) + 'Z';
    setLogs((prev) => [
      ...prev,
      { id: `swp-${Date.now()}`, time: timeStr, tag: 'SWEEP', color: '#00f2fe', message: 'Manual 30-minute orbit cycle triggered across 4 constellations...' },
    ]);
    setTimeout(() => {
      const t1 = new Date().toISOString().substring(11, 19) + 'Z';
      setLogs((prev) => [
        ...prev,
        { id: `t1-${Date.now()}`, time: t1, tag: 'TIER1', color: '#38bdf8', message: 'GSHHG coastline mask applied. BBOX: -20.438°S, 57.745°E identified candidate dark patch.' },
      ]);
    }, 450);
    setTimeout(() => {
      const t2 = new Date().toISOString().substring(11, 19) + 'Z';
      setLogs((prev) => [
        ...prev,
        { id: `t2-${Date.now()}`, time: t2, tag: 'TIER2', color: '#a855f7', message: 'CDSE API retrieved 4.8 MB targeted sub-patch. U-Net score: 96.4% confident.' },
      ]);
    }, 900);
  };

  const resetConsole = () => {
    const now = new Date().toISOString().substring(11, 19) + 'Z';
    setLogs([
      { id: `r1-${Date.now()}`, time: now, tag: 'INFO', color: '#00f2fe', message: 'Daemon reset. Telemetry baseline cleared.' },
      { id: `r2-${Date.now()}`, time: now, tag: 'STAC', color: '#10b981', message: 'Re-established connection to Copernicus OpenSearch Gateway.' },
    ]);
  };

  const handleSelectSensor = (key: SensorKey) => {
    setSelectedSensor(key);
    const now = new Date().toISOString().substring(11, 19) + 'Z';
    setLogs((prev) => [
      ...prev,
      { id: `usr-${Date.now()}`, time: now, tag: 'USER', color: '#00f2fe', message: `Inspector focused on: ${key.toUpperCase()} subsystem metadata.` },
    ]);
  };

  const handleSelectInterval = (index: number) => {
    setActiveCycle(index);
    const times = ['14:00 UTC', '14:30 UTC', '15:00 UTC'];
    const now = new Date().toISOString().substring(11, 19) + 'Z';
    setLogs((prev) => [
      ...prev,
      { id: `time-${Date.now()}`, time: now, tag: 'TIMELINE', color: '#38bdf8', message: `Stepped playback focus to ${times[index]}. Replaying STAC catalog cache.` },
    ]);
  };

  const currentInspector = sensorData[selectedSensor];

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: '#050e20',
      color: '#d9e2fc',
      overflow: 'hidden',
      userSelect: 'none',
      padding: '12px 18px',
      gap: '8px',
      boxSizing: 'border-box',
      fontFamily: "'Inter', sans-serif",
    }}>
      {/* ─────────────────────────────────────────────────────────────
          SECTION [A]: TACTICAL TOP BAR (Tactical Cobalt & Phosphor Amber)
         ───────────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 14px',
        borderRadius: '4px',
        background: 'rgba(18, 27, 46, 0.75)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(56, 189, 248, 0.18)',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Cyber Hexagon Radar Badge */}
          <div style={{ position: 'relative', width: '36px', height: '36px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg style={{ width: '100%', height: '100%', color: '#00f2fe' }} fill="none" viewBox="0 0 36 36">
              <polygon points="18,2 33,10 33,26 18,34 3,26 3,10" stroke="#00f2fe" strokeWidth="1.5" fill="rgba(14, 27, 51, 0.8)" />
              <polygon points="18,7 28,12 28,24 18,29 8,24 8,12" stroke="rgba(56, 189, 248, 0.4)" strokeWidth="1" fill="transparent" />
              <circle cx="18" cy="18" r="2.5" fill="#00f2fe" />
            </svg>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b', fontWeight: 600 }}>
                AUTONOMOUS SATELLITE ENGINE
              </span>
              <span style={{ color: '#475569', fontSize: '10px' }}>//</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: '#38bdf8' }}>
                EPSG:4326 WGS-84
              </span>
              <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#10b981' }} />
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: '#10b981', fontWeight: 600 }}>
                ACTIVE DAEMON
              </span>
            </div>
            <h1 style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: '16px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.02em',
              color: '#8ed5ff',
              margin: '2px 0 0 0',
            }}>
              Multi-Constellation Continuous Ocean Watchdog
            </h1>
          </div>
        </div>

        {/* Incident Selector & Global Action Cluster */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {incidents && onSelectIncident && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
              background: 'rgba(6, 11, 25, 0.92)',
              border: '1px solid rgba(0, 242, 254, 0.35)',
              borderRadius: '6px',
              padding: '2px 4px',
            }}>
              <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 800, padding: '0 4px', fontFamily: "'JetBrains Mono', monospace" }}>SCENARIO:</span>
              {incidents.map((inc) => {
                const isSelected = (selectedIncident?.id || 'emerald') === inc.id;
                const isEm = inc.id === 'emerald';
                return (
                  <button
                    key={inc.id}
                    onClick={() => onSelectIncident(inc)}
                    style={{
                      background: isSelected
                        ? isEm
                          ? 'linear-gradient(135deg, #00f2fe 0%, #0284c7 100%)'
                          : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                        : 'transparent',
                      color: isSelected ? '#030712' : '#94a3b8',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '3px 8px',
                      fontSize: '10px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    {isEm ? 'MT EMERALD (MED)' : 'MV WAKASHIO (MRI)'}
                  </button>
                );
              })}
            </div>
          )}

          <button
            onClick={onProceedToGlobe}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '4px',
              background: 'rgba(14, 27, 51, 0.9)',
              color: '#e0f2fe',
              border: '1px solid rgba(56, 189, 248, 0.18)',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.04em',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#1a263d';
              e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(14, 27, 51, 0.9)';
              e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.18)';
            }}
          >
            <Globe2 size={14} color="#00f2fe" />
            <span>Open 3D Ocean Globe</span>
          </button>

          <button
            onClick={onLaunchDetection}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 16px',
              borderRadius: '4px',
              background: '#f59e0b',
              color: '#030814',
              boxShadow: '0 0 16px rgba(245, 158, 11, 0.45)',
              border: '1px solid rgba(245, 158, 11, 0.6)',
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: '12px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(1.1)')}
            onMouseLeave={(e) => (e.currentTarget.style.filter = 'none')}
          >
            <span>Launch Satellite Lab ({isEmerald ? 'MT Emerald' : 'MV Wakashio'})</span>
            <ArrowRight size={14} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION [B]: SENSOR RIBBON & NRT STEPPER
         ───────────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        flexWrap: 'nowrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '8px',
        padding: '6px 14px',
        borderRadius: '4px',
        background: 'rgba(18, 27, 46, 0.75)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(56, 189, 248, 0.18)',
        flexShrink: 0,
      }}>
        {/* Sensor Pills Group */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {/* Sentinel-1A/B */}
          <button
            onClick={() => handleSelectSensor('sentinel1')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '4px',
              background: selectedSensor === 'sentinel1' ? '#0e1b33' : '#0b162c',
              color: selectedSensor === 'sentinel1' ? '#8ed5ff' : '#94a3b8',
              border: selectedSensor === 'sentinel1' ? '1px solid rgba(0, 242, 254, 0.5)' : '1px solid transparent',
              boxShadow: selectedSensor === 'sentinel1' ? '0 0 10px rgba(0, 242, 254, 0.25)' : 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00f2fe' }} />
            <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', lineHeight: 1.1 }}>
              <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '11px', fontWeight: 700 }}>Sentinel-1A/B</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', color: '#38bdf8' }}>C-SAR 10-20m</span>
            </div>
            <span style={{
              marginLeft: '6px',
              padding: '1px 5px',
              borderRadius: '2px',
              background: '#121b2e',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '9px',
              color: '#10b981',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              textTransform: 'uppercase',
              fontWeight: 600,
            }}>
              ACTIVE
            </span>
          </button>

          {/* Sentinel-2A/B */}
          <button
            onClick={() => handleSelectSensor('sentinel2')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '4px',
              background: selectedSensor === 'sentinel2' ? '#0e1b33' : '#0b162c',
              color: selectedSensor === 'sentinel2' ? '#8ed5ff' : '#94a3b8',
              border: selectedSensor === 'sentinel2' ? '1px solid rgba(56, 189, 248, 0.5)' : '1px solid transparent',
              boxShadow: selectedSensor === 'sentinel2' ? '0 0 10px rgba(56, 189, 248, 0.25)' : 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#38bdf8' }} />
            <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', lineHeight: 1.1 }}>
              <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '11px', fontWeight: 700 }}>Sentinel-2A/B</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', color: '#64748b' }}>Optical MSI VNIR</span>
            </div>
            <span style={{
              marginLeft: '6px',
              padding: '1px 5px',
              borderRadius: '2px',
              background: '#121b2e',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '9px',
              color: '#38bdf8',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              textTransform: 'uppercase',
              fontWeight: 600,
            }}>
              POLLING
            </span>
          </button>

          {/* Landsat-8/9 */}
          <button
            onClick={() => handleSelectSensor('landsat')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '4px',
              background: selectedSensor === 'landsat' ? '#0e1b33' : '#0b162c',
              color: selectedSensor === 'landsat' ? '#8ed5ff' : '#94a3b8',
              border: selectedSensor === 'landsat' ? '1px solid rgba(245, 158, 11, 0.5)' : '1px solid transparent',
              boxShadow: selectedSensor === 'landsat' ? '0 0 10px rgba(245, 158, 11, 0.25)' : 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f59e0b' }} />
            <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', lineHeight: 1.1 }}>
              <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '11px', fontWeight: 700 }}>Landsat-8/9</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', color: '#64748b' }}>TIRS Thermal IR</span>
            </div>
            <span style={{
              marginLeft: '6px',
              padding: '1px 5px',
              borderRadius: '2px',
              background: '#121b2e',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '9px',
              color: '#f59e0b',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              textTransform: 'uppercase',
              fontWeight: 600,
            }}>
              STANDBY
            </span>
          </button>

          {/* EOS-06 */}
          <button
            onClick={() => handleSelectSensor('eos06')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '4px',
              background: selectedSensor === 'eos06' ? '#0e1b33' : '#0b162c',
              color: selectedSensor === 'eos06' ? '#8ed5ff' : '#94a3b8',
              border: selectedSensor === 'eos06' ? '1px solid rgba(168, 85, 247, 0.5)' : '1px solid transparent',
              boxShadow: selectedSensor === 'eos06' ? '0 0 10px rgba(168, 85, 247, 0.25)' : 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#a855f7' }} />
            <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', lineHeight: 1.1 }}>
              <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '11px', fontWeight: 700 }}>EOS-06 Oceansat</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', color: '#64748b' }}>Scatterometer Winds</span>
            </div>
            <span style={{
              marginLeft: '6px',
              padding: '1px 5px',
              borderRadius: '2px',
              background: '#121b2e',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '9px',
              color: '#a855f7',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              textTransform: 'uppercase',
              fontWeight: 600,
            }}>
              INGESTION
            </span>
          </button>
        </div>

        {/* Stepper & Simulation Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: '#030814',
            padding: '2px 4px',
            borderRadius: '4px',
            border: '1px solid rgba(56, 189, 248, 0.18)',
          }}>
            {/* T-60 */}
            <button
              onClick={() => handleSelectInterval(0)}
              style={{
                padding: '3px 8px',
                borderRadius: '3px',
                background: activeCycle === 0 ? '#0e1b33' : 'transparent',
                border: activeCycle === 0 ? '1px solid rgba(0, 242, 254, 0.5)' : '1px solid transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: activeCycle === 0 ? '#8ed5ff' : '#64748b', fontWeight: 700 }}>14:00Z</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', color: '#64748b' }}>(0 Candidates)</span>
            </button>

            {/* T-30 */}
            <button
              onClick={() => handleSelectInterval(1)}
              style={{
                padding: '3px 8px',
                borderRadius: '3px',
                background: activeCycle === 1 ? '#0e1b33' : 'transparent',
                border: activeCycle === 1 ? '1px solid rgba(0, 242, 254, 0.5)' : '1px solid transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: activeCycle === 1 ? '#8ed5ff' : '#64748b', fontWeight: 700 }}>14:30Z</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', color: '#64748b' }}>(Clean Transit)</span>
            </button>

            {/* T-0 */}
            <button
              onClick={() => handleSelectInterval(2)}
              style={{
                padding: '3px 8px',
                borderRadius: '3px',
                background: activeCycle === 2 ? '#0e1b33' : 'transparent',
                border: activeCycle === 2 ? '1px solid rgba(0, 242, 254, 0.5)' : '1px solid transparent',
                boxShadow: activeCycle === 2 ? '0 0 8px rgba(0, 242, 254, 0.3)' : 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444' }} />
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', fontWeight: 700, color: '#8ed5ff' }}>15:00Z LATEST</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', color: '#ef4444', fontWeight: 600, textTransform: 'uppercase' }}>SAR SPILL VERIFIED</span>
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button
              onClick={triggerSimulateSweep}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
                borderRadius: '4px',
                background: '#0e1b33',
                color: '#7bd0ff',
                border: '1px solid rgba(56, 189, 248, 0.18)',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '11px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              <PlayCircle size={14} color="#38bdf8" />
              <span>Simulate 30m Sweep</span>
            </button>

            <button
              onClick={resetConsole}
              style={{
                padding: '4px 6px',
                borderRadius: '4px',
                background: '#0e1b33',
                color: '#64748b',
                border: '1px solid rgba(56, 189, 248, 0.18)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
              title="Reset Simulation"
            >
              <RotateCcw size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          MAIN OPERATIONS DECK (12-COL GRID)
         ───────────────────────────────────────────────────────────── */}
      <div style={{
        flex: 1,
        minHeight: 0,
        display: 'grid',
        gridTemplateColumns: 'repeat(12, minmax(0, 1fr))',
        gap: '8px',
      }}>
        {/* ========== COLUMN LEFT (COLS 1-7): ARCHITECTURE & SENSOR INSPECTION ========== */}
        <div style={{
          gridColumn: 'span 7 / span 7',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          minHeight: 0,
        }}>
          {/* TWO-TIER INGESTION CARDS */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            padding: '8px 12px',
            borderRadius: '4px',
            background: 'rgba(18, 27, 46, 0.75)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(56, 189, 248, 0.18)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Network size={16} color="#00f2fe" />
                <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#8ed5ff' }}>
                  Two-Tier Bandwidth Architecture
                </span>
              </div>
              <span style={{
                padding: '2px 6px',
                borderRadius: '2px',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#10b981',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '10px',
                fontWeight: 600,
                letterSpacing: '0.06em',
                border: '1px solid rgba(16, 185, 129, 0.3)',
              }}>
                99.3% CLOUD EGRESS SAVED
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
              {/* Tier 1 Quick Screen */}
              <div style={{
                padding: '8px 10px',
                borderRadius: '4px',
                background: 'rgba(14, 27, 51, 0.7)',
                border: '1px solid rgba(56, 189, 248, 0.18)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{
                      padding: '1px 5px',
                      borderRadius: '2px',
                      background: '#1a263d',
                      color: '#38bdf8',
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: '10px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      border: '1px solid rgba(56, 189, 248, 0.2)',
                    }}>
                      TIER 1: QUICK SCREEN
                    </span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: '#7bd0ff', fontWeight: 700 }}>
                      ~2.1 MB
                    </span>
                  </div>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', color: '#94a3b8', lineHeight: 1.4, margin: '0 0 4px 0' }}>
                    Copernicus STAC lightweight quicklook ingestion. Applies fast GSHHG high-res shoreline vector masking and two-parameter CFAR statistical background clutter estimation.
                  </p>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '4px 6px',
                  borderRadius: '2px',
                  background: 'rgba(3, 8, 20, 0.6)',
                  border: '1px solid rgba(56, 189, 248, 0.15)',
                }}>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', color: '#64748b', textTransform: 'uppercase' }}>TRIAGE DECISION</span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', color: '#10b981', fontWeight: 600 }}>Clean &rarr; Drop / Dark &rarr; BBOX</span>
                </div>
              </div>

              {/* Tier 2 Targeted Patch */}
              <div style={{
                padding: '8px 10px',
                borderRadius: '4px',
                background: 'rgba(14, 27, 51, 0.7)',
                border: '1px solid rgba(56, 189, 248, 0.18)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{
                      padding: '1px 5px',
                      borderRadius: '2px',
                      background: '#1a263d',
                      color: '#a855f7',
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: '10px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      border: '1px solid rgba(168, 85, 247, 0.3)',
                    }}>
                      TIER 2: TARGETED PATCH
                    </span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: '#a855f7', fontWeight: 700 }}>
                      ~4.8 MB
                    </span>
                  </div>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', color: '#94a3b8', lineHeight: 1.4, margin: '0 0 4px 0' }}>
                    Pulls sub-bounding box via CDSE Process API at native ~10m resolution. Runs 7x7 Gamma-MAP speckle mitigation, dual-pol U-Net segmentation, and scatterometer wind look-alike rejection.
                  </p>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '4px 6px',
                  borderRadius: '2px',
                  background: 'rgba(3, 8, 20, 0.6)',
                  border: '1px solid rgba(56, 189, 248, 0.15)',
                }}>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', color: '#64748b', textTransform: 'uppercase' }}>NATIVE RESOLUTION</span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', color: '#00f2fe', fontWeight: 600 }}>10m GSD Dual-Pol VV/VH</span>
                </div>
              </div>
            </div>

            {/* Bandwidth Economics Comparison Strip */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '4px 8px',
              borderRadius: '4px',
              background: 'rgba(3, 8, 20, 0.9)',
              border: '1px solid rgba(56, 189, 248, 0.18)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: '#64748b', textDecoration: 'line-through', textTransform: 'uppercase' }}>
                  Full Scene: 1,000 MB Egress
                </span>
                <span style={{ color: '#64748b', fontSize: '11px' }}>&rarr;</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: '#10b981', fontWeight: 700 }}>
                  TARANG Ingestion: 6.9 MB Total
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#10b981' }} />
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: '#10b981', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600 }}>
                  993.1 MB BANDWIDTH CONSERVED
                </span>
              </div>
            </div>
          </div>

          {/* SENSOR SUBSYSTEM INSPECTOR (DYNAMIC CARD) */}
          <div style={{
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            padding: '8px 12px',
            borderRadius: '4px',
            background: 'rgba(18, 27, 46, 0.75)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(56, 189, 248, 0.18)',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '4px 8px',
              marginBottom: '6px',
              borderRadius: '4px',
              background: 'rgba(18, 27, 46, 0.5)',
              border: '1px solid rgba(56, 189, 248, 0.18)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Radar size={15} color="#00f2fe" />
                <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: '#8ed5ff' }}>
                  {currentInspector.title}
                </span>
              </div>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: '#00f2fe', textTransform: 'uppercase' }}>
                {currentInspector.spec}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginBottom: '6px' }}>
              <div style={{ padding: '4px 6px', borderRadius: '4px', background: 'rgba(14, 27, 51, 0.7)', border: '1px solid rgba(56, 189, 248, 0.15)' }}>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', color: '#64748b', textTransform: 'uppercase' }}>Swath / Mode</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: '#8ed5ff', fontWeight: 600 }}>{currentInspector.swath}</div>
              </div>
              <div style={{ padding: '4px 6px', borderRadius: '4px', background: 'rgba(14, 27, 51, 0.7)', border: '1px solid rgba(56, 189, 248, 0.15)' }}>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', color: '#64748b', textTransform: 'uppercase' }}>Ground Resolution</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: '#8ed5ff', fontWeight: 600 }}>{currentInspector.res}</div>
              </div>
              <div style={{ padding: '4px 6px', borderRadius: '4px', background: 'rgba(14, 27, 51, 0.7)', border: '1px solid rgba(56, 189, 248, 0.15)' }}>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', color: '#10b981', fontWeight: 600 }}>{currentInspector.calib}</div>
              </div>
            </div>

            <div style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '8px', alignItems: 'center' }}>
              {/* Textual Physics Context */}
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', color: '#00f2fe', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>
                  Hydrodynamic Damping Mechanism
                </span>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', color: '#94a3b8', lineHeight: 1.4, margin: '0 0 6px 0' }}>
                  {currentInspector.desc}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontFamily: "'JetBrains Mono', monospace", fontSize: '10px' }}>
                  <div>
                    <span style={{ color: '#64748b' }}>Sea Clutter (μ):</span>
                    <span style={{ color: '#8ed5ff', fontWeight: 700, marginLeft: '4px' }}>{currentInspector.clutter}</span>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Slick Mean:</span>
                    <span style={{ color: '#ef4444', fontWeight: 700, marginLeft: '4px' }}>{currentInspector.slick}</span>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Contrast Δ:</span>
                    <span style={{ color: '#10b981', fontWeight: 700, marginLeft: '4px' }}>{currentInspector.contrast}</span>
                  </div>
                </div>
              </div>

              {/* Micro Polar / Waveform Interactive SVG Diagram */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '6px',
                borderRadius: '4px',
                background: 'rgba(3, 8, 20, 0.9)',
                border: '1px solid rgba(56, 189, 248, 0.18)',
                height: '100%',
                position: 'relative',
              }}>
                <svg style={{ width: '100%', height: '100px' }} fill="none" viewBox="0 0 200 100">
                  {/* Radar Beam Geometry */}
                  <path d="M 10 10 L 80 85" stroke="rgba(0, 242, 254, 0.6)" strokeWidth="1.5" strokeDasharray="3 3" />
                  <path d="M 80 85 L 120 40" stroke="rgba(16, 185, 129, 0.7)" strokeWidth="1.5" />
                  <path d="M 120 85 L 125 78" stroke="#ef4444" strokeWidth="1.2" />
                  {/* Ocean Baseline Waves */}
                  <path d="M 0 85 Q 20 78, 40 85 T 80 85" stroke="#38bdf8" strokeWidth="1.5" fill="none" />
                  {/* Dampened Slick Surface (Flat / Absorbing) */}
                  <path d="M 80 85 L 170 85" stroke="#ef4444" strokeWidth="2.5" />
                  {/* Resumed Waves */}
                  <path d="M 170 85 Q 185 80, 200 85" stroke="#38bdf8" strokeWidth="1.5" fill="none" />
                  {/* Annotations */}
                  <text x="12" y="24" fill="#00f2fe" fontFamily="'JetBrains Mono', monospace" fontSize="8">INCIDENCE θ=34.2°</text>
                  <text x="92" y="97" fill="#ef4444" fontFamily="'JetBrains Mono', monospace" fontSize="8" fontWeight="bold">OIL SLICK (DAMPED)</text>
                  <text x="10" y="97" fill="#64748b" fontFamily="'JetBrains Mono', monospace" fontSize="7">ROUGH SEA (BRAGG)</text>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* ========== COLUMN RIGHT (COLS 8-12): REAL-TIME TELEMETRY TERMINAL CONSOLE ========== */}
        <div style={{
          gridColumn: 'span 5 / span 5',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '4px',
          background: 'rgba(18, 27, 46, 0.75)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(56, 189, 248, 0.18)',
          minHeight: 0,
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden',
        }}>
          {/* Terminal Window Bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '6px 10px',
            background: 'rgba(3, 8, 20, 0.95)',
            borderBottom: '1px solid rgba(56, 189, 248, 0.18)',
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.8)' }} />
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'rgba(245, 158, 11, 0.8)' }} />
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.8)' }} />
              </div>
              <span style={{ marginLeft: '4px', fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: '#64748b', letterSpacing: '0.02em' }}>
                cdse_daemon@tarang-node-02: ~ / STAC_STREAM
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '1px 5px',
                borderRadius: '2px',
                background: isStreaming ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                border: isStreaming ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)',
              }}>
                <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: isStreaming ? '#10b981' : '#f59e0b' }} />
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', color: isStreaming ? '#10b981' : '#f59e0b', textTransform: 'uppercase', fontWeight: 600 }}>
                  {isStreaming ? 'STREAMING' : 'PAUSED'}
                </span>
              </div>

              <button
                onClick={() => setIsStreaming(!isStreaming)}
                style={{
                  padding: '1px 6px',
                  borderRadius: '2px',
                  background: '#0e1b33',
                  color: '#64748b',
                  border: '1px solid rgba(56, 189, 248, 0.18)',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '9px',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                }}
              >
                {isStreaming ? 'Pause' : 'Resume'}
              </button>

              <button
                onClick={triggerSimulateSweep}
                style={{
                  padding: '1px 6px',
                  borderRadius: '2px',
                  background: '#0e1b33',
                  color: '#00f2fe',
                  border: '1px solid rgba(56, 189, 248, 0.18)',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '9px',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                }}
              >
                Poll
              </button>

              <button
                onClick={resetConsole}
                style={{
                  padding: '1px 6px',
                  borderRadius: '2px',
                  background: '#0e1b33',
                  color: '#64748b',
                  border: '1px solid rgba(56, 189, 248, 0.18)',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '9px',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                }}
              >
                Clear
              </button>
            </div>
          </div>

          {/* Realtime Log Stream Screen */}
          <div
            ref={terminalScreenRef}
            style={{
              flex: 1,
              minHeight: 0,
              background: 'rgba(3, 8, 20, 0.95)',
              padding: '8px 10px',
              overflowY: 'auto',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '11px',
              lineHeight: 1.5,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {logs.map((log) => (
                <div key={log.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', wordBreak: 'break-word' }}>
                  <span style={{ color: '#475569', fontSize: '10px', flexShrink: 0 }}>[{log.time}]</span>
                  <span style={{ color: log.color, fontWeight: 700, fontSize: '10px', flexShrink: 0 }}>[{log.tag}]</span>
                  <span style={{ color: log.tag === 'DETECTION' ? '#ef4444' : '#cbd5e1', fontWeight: log.tag === 'DETECTION' ? 700 : 400 }}>
                    {log.message}
                  </span>
                </div>
              ))}
            </div>

            {/* Terminal Prompt Line */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginTop: '8px',
              paddingTop: '6px',
              borderTop: '1px solid rgba(56, 189, 248, 0.2)',
            }}>
              <span style={{ color: '#00f2fe', fontWeight: 700, fontSize: '11px' }}>● CDSE_DAEMON &gt;</span>
              <span style={{ color: '#8ed5ff', fontFamily: "'JetBrains Mono', monospace", fontSize: '10px' }}>
                STANDBY FOR CYCLE 15:30Z TELEMETRY
              </span>
              <span style={{ display: 'inline-block', width: '6px', height: '12px', background: '#00f2fe', animation: 'pulse 1s infinite' }} />
            </div>
          </div>

          {/* Telemetry Ticker Strip Footer */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '6px 12px',
            background: 'rgba(3, 8, 20, 0.95)',
            borderTop: '1px solid rgba(56, 189, 248, 0.18)',
            flexShrink: 0,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '10px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div>
                <span style={{ color: '#64748b' }}>DAEMON: </span>
                <span style={{ color: '#10b981', fontWeight: 700 }}>ONLINE</span>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>CADENCE: </span>
                <span style={{ color: '#00f2fe', fontWeight: 700 }}>30 MIN</span>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>RATE: </span>
                <span style={{ color: '#8ed5ff', fontWeight: 700 }}>1.2 EVT/S</span>
              </div>
            </div>
            <div>
              <span style={{ color: '#64748b' }}>BANDWIDTH SAVED: </span>
              <span style={{ color: '#10b981', fontWeight: 700 }}>99.3%</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION [E]: COMPACT TELEMETRY VERIFICATION FOOTER
         ───────────────────────────────────────────────────────────── */}
      <div style={{
        height: '36px',
        padding: '0 14px',
        borderRadius: '4px',
        background: 'rgba(18, 27, 46, 0.75)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(56, 189, 248, 0.18)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={16} color="#10b981" />
          <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', color: '#d9e2fc' }}>
            <strong style={{ color: '#8ed5ff', fontWeight: 600 }}>Autonomous Pipeline Status:</strong> Sentinel-1 SAR anomaly confirmed with ISRO Oceansat-3 wind gating (4.8 m/s). Ready for 3D Globe &amp; Lagrangian drift modeling.
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            padding: '2px 8px',
            borderRadius: '4px',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
          }}>
            <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px rgba(16, 185, 129, 0.8)' }} />
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: '#10b981', fontWeight: 700, letterSpacing: '0.06em' }}>
              CONFIDENCE: 96.4%
            </span>
          </div>

          <button
            onClick={onProceedToGlobe}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: 'transparent',
              border: 'none',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '10px',
              color: '#00f2fe',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            <span>Proceed to 3D Globe (Act 1)</span>
            <ArrowRight size={12} />
          </button>
        </div>
      </div>
    </div>
  );
};
