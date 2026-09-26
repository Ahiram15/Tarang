import React, { useState, useEffect, useRef } from 'react';
import {
  Globe2,
  ArrowRight,
  PlayCircle,
  RotateCcw,
  CheckCircle2,
  Radar,
  Network,
  Zap,
  Activity,
  Layers,
  Sparkles,
} from 'lucide-react';
const sentinel1Video = '/videos/sentinel-1.mp4';
const sentinel2Video = '/videos/sentinel-2.mp4';
const landsatVideo = '/videos/landsat.mp4';
const eos06Video = '/videos/EOS-06.mp4';
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
  summary: string;
  clutter: string;
  slick: string;
  contrast: string;
  channel: string;
  mechanismTitle: string;
  physicsFormula: string;
  metric1Label: string;
  metric1Value: string;
  metric2Label: string;
  metric2Value: string;
  metric3Label: string;
  metric3Value: string;
  orbitGeometry: string;
  inputMode: string;
  pipeline: string;
  clutterLabel: string;
  slickLabel: string;
  contrastLabel: string;
  processingLatency: string;
  targetConfidence: string;
}

/* ─────────────────────────────────────────────────────────────
   AUTHENTIC SATELLITE VIDEO STREAM DECK (REPLACING MOCK DIAGRAMS)
   ───────────────────────────────────────────────────────────── */
interface SatelliteVideoFeedProps {
  sensor: SensorKey;
}

const SATELLITE_VIDEO_METADATA: Record<SensorKey, {
  src: string;
  name: string;
  agency: string;
  band: string;
  badgeColor: string;
  orbit: string;
  resolution: string;
  payload: string;
}> = {
  sentinel1: {
    src: sentinel1Video,
    name: 'Sentinel-1A/B Constellation',
    agency: 'ESA • Copernicus Program',
    band: 'C-SAR Active Radar (5.405 GHz)',
    badgeColor: '#00f2fe',
    orbit: 'Polar Sun-Synchronous (693 km LEO)',
    resolution: '10m GSD Dual-Pol (VV+VH)',
    payload: 'Synthetic Aperture Radar (SAR) Active Antenna',
  },
  sentinel2: {
    src: sentinel2Video,
    name: 'Sentinel-2A/B Constellation',
    agency: 'ESA • Copernicus Program',
    band: 'MSI Multispectral (13 Spectral Bands)',
    badgeColor: '#38bdf8',
    orbit: 'Sun-Synchronous (786 km LEO)',
    resolution: '10m - 20m VNIR/SWIR & FAI Glint Index',
    payload: 'Multispectral Instrument (MSI) Telescopic Swath',
  },
  landsat: {
    src: landsatVideo,
    name: 'Landsat-8/9 Observatory',
    agency: 'NASA / USGS',
    band: 'OLI Optical + TIRS Cryogenic Thermal',
    badgeColor: '#fbbf24',
    orbit: 'Sun-Synchronous (705 km LEO)',
    resolution: '15m Pan / 30m Multi / 100m Thermal SST',
    payload: 'Thermal Infrared Sensor (TIRS-2) Split-Window',
  },
  eos06: {
    src: eos06Video,
    name: 'ISRO EOS-06 (Oceansat-3)',
    agency: 'ISRO Earth Observation',
    band: 'Ku-Band OSCAT Scatterometer (13.515 GHz)',
    badgeColor: '#c084fc',
    orbit: 'Sun-Synchronous (720 km Polar LEO)',
    resolution: '20.5 RPM Conical Scan • 25 km Wind Vectors',
    payload: 'Rotating Pencil-Beam Scatterometer & Ocean Colour Monitor',
  },
};

const SatelliteVideoFeed: React.FC<SatelliteVideoFeedProps> = ({ sensor }) => {
  const meta = SATELLITE_VIDEO_METADATA[sensor];
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => { });
      setIsPlaying(true);
    }
  }, [sensor]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().catch(() => { });
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  return (
    <div style={{
      width: '100%',
      height: '100%',
      position: 'relative',
      background: '#020612',
      borderRadius: '6px',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      {/* Authentic High-Definition Satellite Video */}
      <video
        ref={videoRef}
        key={meta.src}
        src={meta.src}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
        }}
      />

      {/* High-Tech Vignette & Scanline Overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        background: 'radial-gradient(ellipse at center, rgba(2, 6, 18, 0.05) 40%, rgba(2, 6, 18, 0.65) 100%)',
        boxShadow: `inset 0 0 24px ${meta.badgeColor}22`,
      }} />

      {/* Top Left: Live Orbital Telemetry Stream HUD Badge */}
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        background: 'rgba(3, 7, 18, 0.85)',
        backdropFilter: 'blur(10px)',
        border: `1px solid ${meta.badgeColor}40`,
        borderRadius: '5px',
        padding: '3px 8px',
        boxShadow: `0 0 12px ${meta.badgeColor}25`,
        pointerEvents: 'none',
      }}>
        <span style={{
          width: '7px',
          height: '7px',
          borderRadius: '50%',
          background: '#ef4444',
          boxShadow: '0 0 8px #ef4444',
        }} />
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '10px',
          fontWeight: 800,
          color: '#ffffff',
          letterSpacing: '0.04em',
        }}>
          LIVE ORBIT FEED // {meta.name}
        </span>
      </div>

      {/* Top Right: Agency & Sensor Spectrum Tag */}
      <div style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '2px',
        background: 'rgba(3, 7, 18, 0.85)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '5px',
        padding: '3px 8px',
        pointerEvents: 'none',
      }}>
        <span style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: '10.5px',
          fontWeight: 700,
          color: meta.badgeColor,
        }}>
          {meta.agency}
        </span>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '9px',
          color: '#94a3b8',
        }}>
          {meta.band}
        </span>
      </div>

      {/* Bottom Left: Flight Dynamics & Resolution Readout */}
      <div style={{
        position: 'absolute',
        bottom: '10px',
        left: '10px',
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
        background: 'rgba(3, 7, 18, 0.82)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '5px',
        padding: '4px 8px',
        pointerEvents: 'none',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', color: '#64748b' }}>ORBIT:</span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9.5px', color: '#e2e8f0', fontWeight: 600 }}>{meta.orbit}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', color: '#64748b' }}>RESOLUTION:</span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9.5px', color: meta.badgeColor, fontWeight: 700 }}>{meta.resolution}</span>
        </div>
      </div>

      {/* Bottom Right: Play/Pause Controls */}
      <div style={{
        position: 'absolute',
        bottom: '10px',
        right: '10px',
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
      }}>
        <button
          onClick={togglePlay}
          style={{
            background: 'rgba(3, 7, 18, 0.85)',
            border: `1px solid ${meta.badgeColor}50`,
            borderRadius: '4px',
            color: meta.badgeColor,
            padding: '3px 8px',
            fontSize: '9.5px',
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            backdropFilter: 'blur(10px)',
          }}
          title={isPlaying ? 'Pause Video' : 'Play Video'}
        >
          <span>{isPlaying ? '⏸ PAUSE' : '▶ PLAY'}</span>
        </button>
      </div>
    </div>
  );
};

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
      title: 'Sentinel-1A/B C-Band SAR Payload',
      spec: '5.405 GHz • VV+VH Dual-Pol • 250km Swath',
      summary: 'Hydrocarbon viscoelastic monolayer dampens high-frequency ocean capillary-gravity ripples, eliminating Bragg scatter to produce dark radar signatures (< -22 dB).',
      clutter: '-14.2 dB',
      slick: '-21.8 dB',
      contrast: '-7.6 dB',
      channel: 'PRIMARY RADAR',
      mechanismTitle: 'ACTIVE MICROWAVE BRAGG BACKSCATTER & CAPILLARY DAMPING',
      physicsFormula: 'λ_Bragg = λ_radar / (2·sin θ) ≈ 4.8 cm | σ₀ Drop: -7.6 dB',
      metric1Label: 'Bragg Resonance',
      metric1Value: '4.8 cm (C-Band)',
      metric2Label: 'Incidence Angle',
      metric2Value: '20° – 45° (IW)',
      metric3Label: 'Polarization',
      metric3Value: 'VV + VH Dual-Pol',
      orbitGeometry: 'Sun-sync 693 km • 12d repeat',
      inputMode: 'Active Microwave SAR (5.405 GHz)',
      pipeline: 'CDSE L1-GRD → 7×7 Gamma-MAP Despeckle → 2-Param CFAR',
      clutterLabel: 'AMBIENT SEA CLUTTER',
      slickLabel: 'SLICK SURFACE σ₀',
      contrastLabel: 'CONTRAST RATIO (Δσ₀)',
      processingLatency: '18m Acquisition Latency',
      targetConfidence: '98.6% CFAR CONFIRMED',
    },
    sentinel2: {
      title: 'Sentinel-2A/B MSI Optical Multispectral',
      spec: 'B2, B3, B4, B8, B11 • 13 Spectral Bands • 290km Swath',
      summary: 'Measures sunglint reflectance gradients and Floating Algae Index (FAI) to cross-validate SAR dark spots against biogenic algae and cloud shadows.',
      clutter: '0.012 FAI',
      slick: '0.084 FAI',
      contrast: '+0.072 FAI',
      channel: 'OPTICAL MSI',
      mechanismTitle: 'PASSIVE SOLAR REFLECTANCE & FLOATING ALGAE INDEX (FAI)',
      physicsFormula: 'FAI = R_842 - [R_665 + (R_1610 - R_665) · (842-665)/(1610-665)]',
      metric1Label: 'B4 (Red)',
      metric1Value: '665 nm (10m)',
      metric2Label: 'B8 (NIR)',
      metric2Value: '842 nm (10m)',
      metric3Label: 'B11 (SWIR)',
      metric3Value: '1610 nm (20m)',
      orbitGeometry: 'Sun-sync 786 km • 5d repeat',
      inputMode: 'Passive Solar Reflectance (13 Bands)',
      pipeline: 'Copernicus L2A BOA → Glint Normalization → FAI Differential Profiler',
      clutterLabel: 'OPEN WATER BASELINE',
      slickLabel: 'EMULSIFIED SLICK FAI',
      contrastLabel: 'SPECTRAL DELTA (ΔFAI)',
      processingLatency: '24m Acquisition Latency',
      targetConfidence: '95.2% GLINT VALIDATED',
    },
    landsat: {
      title: 'Landsat-8/9 TIRS Thermal Infrared',
      spec: 'B10 (10.8 µm) & B11 (12.0 µm) • 185km Swath',
      summary: 'Calibrated surface thermal infrared: Thick crude emulsions absorb solar radiation, appearing 0.5K–1.8K warmer than ambient seawater during daytime passes.',
      clutter: '19.4°C SST',
      slick: '20.6°C Core',
      contrast: '+1.2 K Δ',
      channel: 'THERMAL IR',
      mechanismTitle: 'PASSIVE LONGWAVE THERMAL INFRARED (TIRS) SPLIT-WINDOW',
      physicsFormula: 'ΔT_surface = T_B10 - T_SST = +1.2 K (Daytime Solar Absorber)',
      metric1Label: 'TIRS Band 10',
      metric1Value: '10.60 – 11.19 µm',
      metric2Label: 'TIRS Band 11',
      metric2Value: '11.50 – 12.51 µm',
      metric3Label: 'Cryo Cooling',
      metric3Value: '43 K QWIP Array',
      orbitGeometry: 'Sun-sync 705 km • 16d repeat',
      inputMode: 'Passive Thermal Blackbody Radiation',
      pipeline: 'USGS L2-ST → Radiative Transfer Calibration → Split-Window ΔT',
      clutterLabel: 'AMBIENT SST BASELINE',
      slickLabel: 'CRUDE CORE TEMP',
      contrastLabel: 'THERMAL ANOMALY (ΔT)',
      processingLatency: '32m Acquisition Latency',
      targetConfidence: '93.8% THERMAL ALIGNED',
    },
    eos06: {
      title: 'ISRO EOS-06 (Oceansat-3) Scatterometer',
      spec: '13.515 GHz Ku-Band • 1400km Conical Swath',
      summary: 'Real-time 10m ocean surface wind vectors: Winds between 3–12 m/s confirm valid petroleum damping; calm winds < 3 m/s reject biogenic look-alikes.',
      clutter: '4.8 m/s NW',
      slick: 'Vector Valid',
      contrast: 'Wind Verified',
      channel: 'OCEAN WINDS',
      mechanismTitle: 'ACTIVE Ku-BAND CONICAL SCATTEROMETRY & WIND VECTOR GATING',
      physicsFormula: 'σ₀ = f(U₁₀, ϕ, θ) | Valid SAR Oil Gate: 3.0 m/s ≤ U₁₀ ≤ 12.0 m/s',
      metric1Label: 'Conical Beams',
      metric1Value: 'Inner HH 49° / Outer VV 57°',
      metric2Label: 'Rotational Rate',
      metric2Value: '20.5 RPM (Ku-Band)',
      metric3Label: 'Wind Gate Status',
      metric3Value: '4.8 m/s (Optimal 3-12 m/s)',
      orbitGeometry: 'Sun-sync 720 km • 2d repeat',
      inputMode: 'Active Ku-Band Conical Radar',
      pipeline: 'ISRO MOSDAC L2B → 25km Wind Vector Cell (WVC) → MLE Scatter Inversion',
      clutterLabel: '10M WIND VELOCITY',
      slickLabel: 'DAMPING REGIME',
      contrastLabel: 'LOOK-ALIKE FILTER',
      processingLatency: '14m Acquisition Latency',
      targetConfidence: '99.1% MET-OCEAN VERIFIED',
    },
  };

  const [logs, setLogs] = useState<Array<{
    id: string;
    time: string;
    tag: string;
    color: string;
    message: string;
  }>>([
    { id: '1', time: '15:00:01Z', tag: 'DAEMON', color: '#00f2fe', message: 'Copernicus STAC Daemon v4.8 active. 14 corridor regions synchronized.' },
    { id: '2', time: '15:00:14Z', tag: 'STAC', color: '#38bdf8', message: 'Querying OpenSearch catalogue: [T-30m → T-0m] ingestion window.' },
    { id: '3', time: '15:00:26Z', tag: 'TIER-1', color: '#38bdf8', message: 'Screened 2.1 MB quicklook preview. GSHHG shoreline vector mask applied.' },
    { id: '4', time: '15:00:40Z', tag: 'CFAR', color: '#fbbf24', message: 'Adaptive 2-param CFAR anomaly flagged: -8.4 dB dip below clutter baseline.' },
    { id: '5', time: '15:01:05Z', tag: 'TIER-2', color: '#a855f7', message: 'CDSE Process API: Targeted 10m sub-patch extracted (4.8 MB payload).' },
    { id: '6', time: '15:01:28Z', tag: 'AI-UNET', color: '#10b981', message: '7x7 Gamma-MAP despeckled. Dual-pol U-Net segmentation complete (IoU: 0.887).' },
    { id: '7', time: '15:01:42Z', tag: 'ALERT', color: '#ef4444', message: 'Marine petroleum slick confirmed. Area: 42.6 km² | Confidence: 96.4%.' },
    { id: '8', time: '15:02:10Z', tag: 'WIND', color: '#38bdf8', message: 'ISRO scatterometer wind: 4.8 m/s @ 312° NW. Look-alike rejection passed.' },
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
      { tag: 'STAC', color: '#00f2fe', message: 'Heartbeat: Copernicus OpenSearch gateway responsive (190ms latency).' },
      { tag: 'EOS-06', color: '#38bdf8', message: 'ISRO scatterometer wind vector: 4.8 m/s @ 312° NW across shipping lane.' },
      { tag: 'CFAR', color: '#fbbf24', message: 'Background clutter recalibrated: μ = -14.2 dB, σ = 1.84 dB.' },
      { tag: 'SAVINGS', color: '#10b981', message: 'Bandwidth optimization active: 99.3% transfer conserved.' },
      { tag: 'TIRS', color: '#fbbf24', message: 'Landsat-8 Band 10 thermal calibrated: Sea surface baseline 19.4°C.' },
      { tag: 'MSI', color: '#38bdf8', message: 'Sentinel-2 optical cloud-screening index nominal across target BBOX.' },
      { tag: 'CDSE', color: '#a855f7', message: 'Process API sub-patch bounding box cache warm and ready.' },
      { tag: 'AIS', color: '#00f2fe', message: 'Corridor vessel transponder stream active: 18 commercial vessels tracked.' },
    ];

    const timer = setInterval(() => {
      const now = new Date();
      const timeStr = now.toISOString().substring(11, 19) + 'Z';
      const item = pool[Math.floor(Math.random() * pool.length)];
      setLogs((prev) => [
        ...prev.slice(-35),
        {
          id: `log-${Date.now()}-${Math.random()}`,
          time: timeStr,
          tag: item.tag,
          color: item.color,
          message: item.message,
        },
      ]);
    }, 3000);

    return () => clearInterval(timer);
  }, [isStreaming]);

  const triggerSimulateSweep = () => {
    const now = new Date().toISOString().substring(11, 19) + 'Z';
    setLogs((prev) => [
      ...prev,
      { id: `swp-${Date.now()}`, time: now, tag: 'SWEEP', color: '#00f2fe', message: 'Manual 30-min orbit cycle triggered across 4 constellations...' },
    ]);
    setTimeout(() => {
      const t1 = new Date().toISOString().substring(11, 19) + 'Z';
      setLogs((prev) => [
        ...prev,
        { id: `t1-${Date.now()}`, time: t1, tag: 'TIER-1', color: '#38bdf8', message: 'GSHHG coastline mask applied. BBOX: -20.438°S, 57.745°E identified dark anomaly.' },
      ]);
    }, 450);
    setTimeout(() => {
      const t2 = new Date().toISOString().substring(11, 19) + 'Z';
      setLogs((prev) => [
        ...prev,
        { id: `t2-${Date.now()}`, time: t2, tag: 'TIER-2', color: '#a855f7', message: 'CDSE API retrieved 4.8 MB targeted sub-patch. U-Net score: 96.4% confident.' },
      ]);
    }, 900);
  };

  const resetConsole = () => {
    const now = new Date().toISOString().substring(11, 19) + 'Z';
    setLogs([
      { id: `r1-${Date.now()}`, time: now, tag: 'RESET', color: '#00f2fe', message: 'Daemon telemetry reset. Baseline cleared.' },
      { id: `r2-${Date.now()}`, time: now, tag: 'STAC', color: '#10b981', message: 'Reconnected to Copernicus OpenSearch Gateway.' },
    ]);
  };

  const handleSelectSensor = (key: SensorKey) => {
    setSelectedSensor(key);
    const now = new Date().toISOString().substring(11, 19) + 'Z';
    setLogs((prev) => [
      ...prev,
      { id: `usr-${Date.now()}`, time: now, tag: 'INSPECT', color: '#00f2fe', message: `Telemetry focused on: ${key.toUpperCase()} sensor payload.` },
    ]);
  };

  const handleSelectInterval = (index: number) => {
    setActiveCycle(index);
    const times = ['14:00Z', '14:30Z', '15:00Z'];
    const now = new Date().toISOString().substring(11, 19) + 'Z';
    setLogs((prev) => [
      ...prev,
      { id: `time-${Date.now()}`, time: now, tag: 'TIMELINE', color: '#38bdf8', message: `Timeline shifted to lookback cycle: ${times[index]}.` },
    ]);
  };

  const currentInspector = sensorData[selectedSensor];

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'radial-gradient(circle at 50% 0%, #08142a 0%, #030712 100%)',
      color: '#e2e8f0',
      overflowY: 'auto',
      overflowX: 'hidden',
      userSelect: 'none',
      padding: '16px 22px',
      gap: '12px',
      boxSizing: 'border-box',
      fontFamily: "'Inter', -apple-system, sans-serif",
    }}>
      {/* ─────────────────────────────────────────────────────────────
          SECTION [A]: TACTICAL TOP BAR
         ───────────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 18px',
        borderRadius: '8px',
        background: 'rgba(9, 19, 37, 0.75)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(0, 242, 254, 0.2)',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* Glowing Cyber Radar Icon */}
          <div style={{
            position: 'relative',
            width: '38px',
            height: '38px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.2) 0%, rgba(56, 189, 248, 0.05) 100%)',
            border: '1px solid rgba(0, 242, 254, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 16px rgba(0, 242, 254, 0.25)',
          }}>
            <Radar size={20} color="#00f2fe" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '0.1em',
                color: '#38bdf8',
                textTransform: 'uppercase',
              }}>
                STAGE 0 // AUTONOMOUS WATCHDOG
              </span>
              <span style={{ color: '#334155' }}>•</span>
              <span style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '10px',
                color: '#94a3b8',
              }}>
                EPSG:4326 WGS-84
              </span>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '1px 6px',
                borderRadius: '9999px',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '9px',
                color: '#10b981',
                fontWeight: 700,
              }}>
                <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981' }} />
                DAEMON ONLINE
              </span>
            </div>

            <h1 style={{
              fontFamily: "'Space Grotesk', -apple-system, sans-serif",
              fontSize: '17px',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              background: 'linear-gradient(180deg, #ffffff 30%, #93c5fd 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              margin: '2px 0 0 0',
            }}>
              Multi-Constellation Continuous Ocean Watchdog
            </h1>
          </div>
        </div>

        {/* Global Action Cluster */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={onProceedToGlobe}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 18px',
              borderRadius: '6px',
              background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.15) 0%, rgba(56, 189, 248, 0.08) 100%)',
              color: '#e0fdff',
              border: '1px solid rgba(0, 242, 254, 0.4)',
              boxShadow: '0 0 16px rgba(0, 242, 254, 0.15)',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '12px',
              fontWeight: 700,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 0 24px rgba(0, 242, 254, 0.4)';
              e.currentTarget.style.borderColor = '#00f2fe';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 0 16px rgba(0, 242, 254, 0.15)';
              e.currentTarget.style.borderColor = 'rgba(0, 242, 254, 0.4)';
            }}
          >
            <Globe2 size={15} color="#00f2fe" />
            <span>Open 3D Ocean Globe</span>
            <ArrowRight size={14} color="#00f2fe" />
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION [B]: SENSOR RIBBON & NRT TIMELINE
         ───────────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 14px',
        borderRadius: '8px',
        background: 'rgba(9, 19, 37, 0.65)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        flexShrink: 0,
        gap: '12px',
      }}>
        {/* Sensor Instrument Selector Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {[
            { key: 'sentinel1' as SensorKey, name: 'Sentinel-1A/B', band: 'C-SAR Radar', color: '#00f2fe', tag: 'ACTIVE' },
            { key: 'sentinel2' as SensorKey, name: 'Sentinel-2A/B', band: 'Optical MSI', color: '#38bdf8', tag: 'POLLING' },
            { key: 'landsat' as SensorKey, name: 'Landsat-8/9', band: 'Thermal TIRS', color: '#fbbf24', tag: 'STANDBY' },
            { key: 'eos06' as SensorKey, name: 'EOS-06 Oceansat', band: 'Scatterometer', color: '#c084fc', tag: 'WINDS' },
          ].map((item) => {
            const isSelected = selectedSensor === item.key;
            return (
              <button
                key={item.key}
                onClick={() => handleSelectSensor(item.key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  background: isSelected ? 'rgba(14, 30, 58, 0.9)' : 'rgba(255, 255, 255, 0.03)',
                  border: isSelected ? `1px solid ${item.color}` : '1px solid rgba(255, 255, 255, 0.06)',
                  boxShadow: isSelected ? `0 0 14px ${item.color}35` : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <span style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  background: item.color,
                  boxShadow: isSelected ? `0 0 8px ${item.color}` : 'none',
                }} />
                <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', lineHeight: 1.15 }}>
                  <span style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: '12px',
                    fontWeight: 700,
                    color: isSelected ? '#ffffff' : '#94a3b8',
                  }}>
                    {item.name}
                  </span>
                  <span style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '10px',
                    color: isSelected ? item.color : '#64748b',
                  }}>
                    {item.band}
                  </span>
                </div>
                <span style={{
                  marginLeft: '4px',
                  padding: '2px 5px',
                  borderRadius: '3px',
                  background: 'rgba(0, 0, 0, 0.4)',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '9px',
                  fontWeight: 700,
                  color: isSelected ? item.color : '#64748b',
                  border: `1px solid ${isSelected ? item.color + '40' : 'rgba(255, 255, 255, 0.08)'}`,
                }}>
                  {item.tag}
                </span>
              </button>
            );
          })}
        </div>

        {/* 30-Min Lookback Stepper & Sweep Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: 'rgba(3, 7, 18, 0.85)',
            padding: '3px 5px',
            borderRadius: '6px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}>
            {[
              { cycle: 0, time: '14:00Z', label: '0 Candidates' },
              { cycle: 1, time: '14:30Z', label: 'Clean Transit' },
              { cycle: 2, time: '15:00Z', label: 'SAR SPILL DETECTED', isAlert: true },
            ].map((st) => {
              const isActive = activeCycle === st.cycle;
              return (
                <button
                  key={st.cycle}
                  onClick={() => handleSelectInterval(st.cycle)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '4px 10px',
                    borderRadius: '4px',
                    background: isActive
                      ? st.isAlert ? 'rgba(239, 68, 68, 0.2)' : 'rgba(0, 242, 254, 0.18)'
                      : 'transparent',
                    border: isActive
                      ? st.isAlert ? '1px solid #ef4444' : '1px solid rgba(0, 242, 254, 0.5)'
                      : '1px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {st.isAlert && isActive && (
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 6px #ef4444' }} />
                  )}
                  <span style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '11px',
                    fontWeight: 700,
                    color: isActive ? (st.isAlert ? '#fca5a5' : '#8ed5ff') : '#64748b',
                  }}>
                    {st.time}
                  </span>
                  <span style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '9px',
                    color: isActive ? (st.isAlert ? '#f87171' : '#38bdf8') : '#475569',
                    fontWeight: 600,
                  }}>
                    ({st.label})
                  </span>
                </button>
              );
            })}
          </div>

          <button
            onClick={triggerSimulateSweep}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '6px',
              background: 'rgba(14, 30, 58, 0.9)',
              color: '#38bdf8',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#1a3668')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(14, 30, 58, 0.9)')}
          >
            <PlayCircle size={14} color="#38bdf8" />
            <span>Simulate Sweep</span>
          </button>

          <button
            onClick={resetConsole}
            style={{
              padding: '6px 8px',
              borderRadius: '6px',
              background: 'rgba(14, 30, 58, 0.9)',
              color: '#64748b',
              border: '1px solid rgba(255, 255, 255, 0.1)',
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

      {/* ─────────────────────────────────────────────────────────────
          MAIN OPERATIONS DECK (ENLARGED DIAGRAM DECK & SLIM CONSOLE)
         ───────────────────────────────────────────────────────────── */}
      <div style={{
        flex: 1,
        minHeight: 0,
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) 280px',
        gap: '12px',
      }}>
        {/* ========== COLUMN LEFT: ARCHITECTURE & EXPANDED SENSOR INSPECTOR ========== */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          minHeight: 0,
        }}>
          {/* Two-Tier Bandwidth Architecture Card */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            padding: '10px 14px',
            borderRadius: '8px',
            background: 'rgba(9, 19, 37, 0.7)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(0, 242, 254, 0.18)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Zap size={15} color="#00f2fe" />
                <span style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: '13px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  color: '#e0fdff',
                }}>
                  Two-Tier Ingestion &amp; Bandwidth Architecture
                </span>
              </div>

              <span style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '10.5px',
                color: '#10b981',
                fontWeight: 700,
                background: 'rgba(16, 185, 129, 0.12)',
                padding: '2px 8px',
                borderRadius: '4px',
                border: '1px solid rgba(16, 185, 129, 0.3)',
              }}>
                99.3% BANDWIDTH SAVED
              </span>
            </div>

            {/* Tier 1 & Tier 2 Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {/* Tier 1 Quick Screen */}
              <div style={{
                padding: '8px 10px',
                borderRadius: '6px',
                background: 'rgba(13, 26, 49, 0.8)',
                border: '1px solid rgba(56, 189, 248, 0.2)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '6px',
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{
                      padding: '1px 5px',
                      borderRadius: '3px',
                      background: 'rgba(56, 189, 248, 0.15)',
                      color: '#38bdf8',
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: '10px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                    }}>
                      TIER 1: QUICK SCREEN
                    </span>
                    <span style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: '11px',
                      color: '#7bd0ff',
                      fontWeight: 800,
                    }}>
                      ~2.1 MB
                    </span>
                  </div>
                  <p style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '11px',
                    color: '#94a3b8',
                    lineHeight: 1.4,
                    margin: 0,
                  }}>
                    Low-resolution STAC quicklooks across 14 sea corridors screened via adaptive 2-param CFAR clutter baseline.
                  </p>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '3px 6px',
                  borderRadius: '4px',
                  background: 'rgba(3, 7, 18, 0.6)',
                  border: '1px solid rgba(56, 189, 248, 0.15)',
                }}>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9.5px', color: '#64748b', textTransform: 'uppercase' }}>
                    DECISION
                  </span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9.5px', color: '#10b981', fontWeight: 700 }}>
                    Clean &rarr; Standby / Dark &rarr; BBOX
                  </span>
                </div>
              </div>

              {/* Tier 2 Targeted Patch */}
              <div style={{
                padding: '8px 10px',
                borderRadius: '6px',
                background: 'rgba(13, 26, 49, 0.8)',
                border: '1px solid rgba(168, 85, 247, 0.25)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '6px',
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{
                      padding: '1px 5px',
                      borderRadius: '3px',
                      background: 'rgba(168, 85, 247, 0.15)',
                      color: '#c084fc',
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: '10px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                    }}>
                      TIER 2: TARGETED PATCH
                    </span>
                    <span style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: '11px',
                      color: '#c084fc',
                      fontWeight: 800,
                    }}>
                      ~4.8 MB
                    </span>
                  </div>
                  <p style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '11px',
                    color: '#94a3b8',
                    lineHeight: 1.4,
                    margin: 0,
                  }}>
                    Pulls native 10m SAR sub-bounding box via CDSE Process API for Gamma-MAP filtering, U-Net AI &amp; wind gating.
                  </p>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '3px 6px',
                  borderRadius: '4px',
                  background: 'rgba(3, 7, 18, 0.6)',
                  border: '1px solid rgba(168, 85, 247, 0.2)',
                }}>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9.5px', color: '#64748b', textTransform: 'uppercase' }}>
                    RESOLUTION
                  </span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9.5px', color: '#00f2fe', fontWeight: 700 }}>
                    10m GSD Dual-Pol (VV+VH)
                  </span>
                </div>
              </div>
            </div>

            {/* Bandwidth Comparison Strip */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '5px 10px',
              borderRadius: '6px',
              background: 'rgba(3, 7, 18, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '10.5px',
                  color: '#64748b',
                  textDecoration: 'line-through',
                }}>
                  Full Scene: 1,000 MB Egress
                </span>
                <span style={{ color: '#475569', fontSize: '11px' }}>&rarr;</span>
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '10.5px',
                  color: '#10b981',
                  fontWeight: 700,
                }}>
                  TARANG Ingestion: 6.9 MB Total
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981' }} />
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '10.5px',
                  color: '#10b981',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                }}>
                  993.1 MB BANDWIDTH CONSERVED
                </span>
              </div>
            </div>
          </div>

          {/* Sensor Subsystem Inspector & ENLARGED Visual Input Ingestion Card */}
          <div style={{
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            padding: '8px 12px',
            borderRadius: '8px',
            background: 'rgba(9, 19, 37, 0.65)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(0, 242, 254, 0.15)',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)',
            justifyContent: 'space-between',
            gap: '6px',
          }}>
            {/* Inspector Top Bar */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingBottom: '5px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              flexShrink: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={16} color="#00f2fe" />
                <span style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: '13.5px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.03em',
                  color: '#e0fdff',
                }}>
                  {currentInspector.title}
                </span>
                <span style={{
                  padding: '1px 6px',
                  borderRadius: '3px',
                  background: 'rgba(0, 242, 254, 0.12)',
                  border: '1px solid rgba(0, 242, 254, 0.25)',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '9.5px',
                  color: '#00f2fe',
                  fontWeight: 700,
                }}>
                  {currentInspector.inputMode}
                </span>
              </div>
              <span style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '11.5px',
                color: '#38bdf8',
                fontWeight: 600,
              }}>
                {currentInspector.orbitGeometry}
              </span>
            </div>

            {/* Ingestion Physics & ENLARGED Visual Diagram Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1.3fr 1fr',
              gap: '16px',
              alignItems: 'stretch',
              flex: 1,
              minHeight: 0,
            }}>
              {/* Telemetry, Radiometric Discrimination & Decision Rule Panel */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '7px',
                minHeight: '260px',
                height: '100%',
              }}>
                {/* 1. Header: Mechanism Title, Channel & Confidence Badges */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        background: '#00f2fe',
                        boxShadow: '0 0 8px #00f2fe',
                      }} />
                      <span style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: '10.5px',
                        color: '#00f2fe',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        fontWeight: 700,
                      }}>
                        {currentInspector.mechanismTitle}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span style={{
                        padding: '1px 6px',
                        borderRadius: '3px',
                        background: 'rgba(56, 189, 248, 0.12)',
                        border: '1px solid rgba(56, 189, 248, 0.3)',
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: '9px',
                        color: '#38bdf8',
                        fontWeight: 700,
                        letterSpacing: '0.04em',
                      }}>
                        {currentInspector.channel}
                      </span>
                      <span style={{
                        padding: '1px 6px',
                        borderRadius: '3px',
                        background: 'rgba(16, 185, 129, 0.12)',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: '9px',
                        color: '#10b981',
                        fontWeight: 700,
                      }}>
                        {currentInspector.targetConfidence}
                      </span>
                    </div>
                  </div>

                  {/* Sensor Payload Specification Line */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '9.5px',
                    color: '#94a3b8',
                  }}>
                    <span style={{ color: '#64748b', fontWeight: 700 }}>PAYLOAD:</span>
                    <span>{currentInspector.spec}</span>
                  </div>

                  <p style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '11px',
                    color: '#cbd5e1',
                    lineHeight: 1.4,
                    margin: 0,
                  }}>
                    {currentInspector.summary}
                  </p>
                </div>

                {/* 2. Three-Column Radiometric Discrimination Matrix */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '6px',
                  padding: '6px 8px',
                  borderRadius: '5px',
                  background: 'rgba(3, 7, 18, 0.72)',
                  border: '1px solid rgba(0, 242, 254, 0.18)',
                  fontFamily: "'JetBrains Mono', monospace",
                }}>
                  <div style={{
                    padding: '4px 6px',
                    borderRadius: '4px',
                    background: 'rgba(15, 23, 42, 0.65)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                  }}>
                    <div style={{ color: '#94a3b8', fontSize: '8.5px', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                      {currentInspector.clutterLabel}
                    </div>
                    <div style={{ color: '#e2e8f0', fontWeight: 700, fontSize: '11.5px', marginTop: '2px' }}>
                      {currentInspector.clutter}
                    </div>
                    <div style={{ color: '#64748b', fontSize: '8px', marginTop: '1px' }}>Baseline Environment</div>
                  </div>

                  <div style={{
                    padding: '4px 6px',
                    borderRadius: '4px',
                    background: 'rgba(15, 23, 42, 0.65)',
                    border: '1px solid rgba(251, 191, 36, 0.22)',
                  }}>
                    <div style={{ color: '#fbbf24', fontSize: '8.5px', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                      {currentInspector.slickLabel}
                    </div>
                    <div style={{ color: '#fef08a', fontWeight: 700, fontSize: '11.5px', marginTop: '2px' }}>
                      {currentInspector.slick}
                    </div>
                    <div style={{ color: '#d97706', fontSize: '8px', marginTop: '1px' }}>Hydrocarbon Target</div>
                  </div>

                  <div style={{
                    padding: '4px 6px',
                    borderRadius: '4px',
                    background: 'rgba(0, 242, 254, 0.08)',
                    border: '1px solid rgba(0, 242, 254, 0.35)',
                  }}>
                    <div style={{ color: '#00f2fe', fontSize: '8.5px', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                      {currentInspector.contrastLabel}
                    </div>
                    <div style={{ color: '#00f2fe', fontWeight: 800, fontSize: '11.5px', marginTop: '2px' }}>
                      {currentInspector.contrast}
                    </div>
                    <div style={{ color: '#38bdf8', fontSize: '8px', marginTop: '1px' }}>Signal Contrast Δ</div>
                  </div>
                </div>

                {/* 3. Physics Formula / Decision Rule Tag & Processing Pipeline */}
                <div style={{
                  padding: '5px 8px',
                  borderRadius: '4px',
                  background: 'rgba(3, 7, 18, 0.75)',
                  border: '1px solid rgba(0, 242, 254, 0.15)',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '9.5px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '3px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ color: '#64748b', fontSize: '8.5px', fontWeight: 700 }}>RULE:</span>
                    <span style={{ color: '#8ed5ff', wordBreak: 'break-all', fontWeight: 600 }}>
                      {currentInspector.physicsFormula}
                    </span>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '6px',
                    fontSize: '8.5px',
                    color: '#94a3b8',
                    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                    paddingTop: '3px',
                  }}>
                    <span style={{ color: '#c4b5fd', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      <span style={{ color: '#64748b', fontWeight: 700 }}>PIPE: </span>
                      {currentInspector.pipeline}
                    </span>
                    <span style={{ color: '#38bdf8', whiteSpace: 'nowrap', fontWeight: 600 }}>
                      {currentInspector.processingLatency}
                    </span>
                  </div>
                </div>

                {/* 4. 3 Prominent Sensor Telemetry Metrics */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '6px',
                  padding: '6px 8px',
                  borderRadius: '5px',
                  background: 'rgba(3, 7, 18, 0.6)',
                  border: '1px solid rgba(0, 242, 254, 0.12)',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '10px',
                }}>
                  <div>
                    <div style={{ color: '#64748b', fontSize: '8.5px', textTransform: 'uppercase' }}>{currentInspector.metric1Label}</div>
                    <div style={{ color: '#8ed5ff', fontWeight: 700, fontSize: '10.5px', marginTop: '2px' }}>{currentInspector.metric1Value}</div>
                  </div>
                  <div>
                    <div style={{ color: '#64748b', fontSize: '8.5px', textTransform: 'uppercase' }}>{currentInspector.metric2Label}</div>
                    <div style={{ color: '#fbbf24', fontWeight: 700, fontSize: '10.5px', marginTop: '2px' }}>{currentInspector.metric2Value}</div>
                  </div>
                  <div>
                    <div style={{ color: '#64748b', fontSize: '8.5px', textTransform: 'uppercase' }}>{currentInspector.metric3Label}</div>
                    <div style={{ color: '#10b981', fontWeight: 700, fontSize: '10.5px', marginTop: '2px' }}>{currentInspector.metric3Value}</div>
                  </div>
                </div>
              </div>

              {/* Authentic Satellite Video Stream Deck */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2px',
                borderRadius: '6px',
                background: 'rgba(2, 6, 18, 0.65)',
                border: '1px solid rgba(0, 242, 254, 0.22)',
                height: '280px',
                minHeight: '260px',
                maxHeight: '290px',
                width: '100%',
                maxWidth: '400px',
                justifySelf: 'center',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.45)',
              }}>
                <SatelliteVideoFeed sensor={selectedSensor} />
              </div>
            </div>
          </div>
        </div>

        {/* ========== COLUMN RIGHT: REDUCED TELEMETRY TERMINAL (280px) ========== */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '8px',
          background: 'rgba(9, 19, 37, 0.75)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(0, 242, 254, 0.18)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
          minHeight: 0,
          overflow: 'hidden',
        }}>
          {/* Terminal Window Bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '6px 8px',
            background: 'rgba(3, 7, 18, 0.95)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444' }} />
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f59e0b' }} />
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
              </div>
              <span style={{
                marginLeft: '3px',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '9.5px',
                color: '#64748b',
                letterSpacing: '0.04em',
                fontWeight: 600,
              }}>
                LIVE_STAC_STREAM
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              <button
                onClick={() => setIsStreaming(!isStreaming)}
                style={{
                  padding: '2px 5px',
                  borderRadius: '3px',
                  background: 'rgba(14, 30, 58, 0.9)',
                  color: isStreaming ? '#10b981' : '#f59e0b',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '8.5px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                }}
              >
                {isStreaming ? 'STREAM' : 'PAUSE'}
              </button>

              <button
                onClick={triggerSimulateSweep}
                style={{
                  padding: '2px 5px',
                  borderRadius: '3px',
                  background: 'rgba(14, 30, 58, 0.9)',
                  color: '#00f2fe',
                  border: '1px solid rgba(0, 242, 254, 0.3)',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '8.5px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                }}
              >
                Poll
              </button>

              <button
                onClick={resetConsole}
                style={{
                  padding: '2px 5px',
                  borderRadius: '3px',
                  background: 'rgba(14, 30, 58, 0.9)',
                  color: '#64748b',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '8.5px',
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
              background: 'rgba(2, 6, 18, 0.95)',
              padding: '6px 8px',
              overflowY: 'auto',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '10px',
              lineHeight: 1.45,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {logs.map((log) => (
                <div key={log.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '5px', wordBreak: 'break-word' }}>
                  <span style={{ color: '#475569', fontSize: '9px', flexShrink: 0 }}>[{log.time}]</span>
                  <span style={{
                    color: log.color,
                    fontWeight: 700,
                    fontSize: '9px',
                    flexShrink: 0,
                    background: `${log.color}15`,
                    padding: '0 3px',
                    borderRadius: '2px',
                  }}>
                    {log.tag}
                  </span>
                  <span style={{
                    color: log.tag === 'ALERT' ? '#fca5a5' : '#cbd5e1',
                    fontWeight: log.tag === 'ALERT' ? 700 : 400,
                  }}>
                    {log.message}
                  </span>
                </div>
              ))}
            </div>

            {/* Terminal Prompt Line */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              marginTop: '5px',
              paddingTop: '5px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            }}>
              <span style={{ color: '#00f2fe', fontWeight: 700, fontSize: '10px' }}>● CDSE &gt;</span>
              <span style={{ color: '#8ed5ff', fontFamily: "'JetBrains Mono', monospace", fontSize: '9.5px' }}>
                STANDBY 15:30Z
              </span>
              <span style={{ display: 'inline-block', width: '5px', height: '10px', background: '#00f2fe' }} />
            </div>
          </div>

          {/* Telemetry Ticker Strip Footer */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '4px 8px',
            background: 'rgba(3, 7, 18, 0.95)',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            flexShrink: 0,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '9.5px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div>
                <span style={{ color: '#64748b' }}>DAEMON: </span>
                <span style={{ color: '#10b981', fontWeight: 700 }}>ONLINE</span>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>CADENCE: </span>
                <span style={{ color: '#00f2fe', fontWeight: 700 }}>30m</span>
              </div>
            </div>
            <div>
              <span style={{ color: '#64748b' }}>RATE: </span>
              <span style={{ color: '#8ed5ff', fontWeight: 700 }}>1.2 E/S</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};