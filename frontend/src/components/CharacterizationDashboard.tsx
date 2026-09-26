import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  MapContainer, 
  TileLayer, 
  Polygon, 
  Circle, 
  Marker, 
  Popup, 
  Polyline, 
  Tooltip, 
  useMap,
  useMapEvents 
} from 'react-leaflet';
import L from 'leaflet';
import { SpillAnalysis } from '../types';
import { SpillTooltipCard } from './SpillTooltipCard';
import { 
  ArrowLeft, 
  Compass, 
  Wind, 
  Waves, 
  History, 
  TrendingUp, 
  ShieldAlert, 
  Layers, 
  Play, 
  Pause, 
  RotateCcw,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Info,
  SkipBack,
  SkipForward,
  Maximize2,
  Eye,
  Crosshair,
  Satellite,
  Globe,
  Ship,
  Radio,
  MapPin,
  Activity,
  Flame,
  Zap,
  Navigation,
  Anchor,
  Sparkles,
  Clock,
  Target,
  Shield,
  Minimize2,
} from 'lucide-react';

interface CharacterizationDashboardProps {
  analysis: SpillAnalysis;
  onBackToLab: () => void;
  onBackToGlobe: () => void;
  onOpenInvestigation?: (spillId?: string) => void;
}

// Convert GeoJSON Polygon or MultiPolygon to React-Leaflet positions
export const toLeafletPositions = (geoJsonPolygon: any): any => {
  if (!geoJsonPolygon || !geoJsonPolygon.coordinates || !geoJsonPolygon.coordinates.length) return [];
  if (geoJsonPolygon.type === 'MultiPolygon') {
    return geoJsonPolygon.coordinates.map((poly: any[]) =>
      poly[0].map((pt: number[]) => [pt[1], pt[0]] as [number, number])
    );
  }
  return geoJsonPolygon.coordinates[0].map((pt: number[]) => [pt[1], pt[0]] as [number, number]);
};

// Flatten all polygon points for safe LatLngBounds computation
export const extractAllLeafletPoints = (geoJsonPolygon: any): [number, number][] => {
  if (!geoJsonPolygon || !geoJsonPolygon.coordinates) return [];
  const pts: [number, number][] = [];
  const recurse = (arr: any) => {
    if (Array.isArray(arr) && arr.length >= 2 && typeof arr[0] === 'number' && typeof arr[1] === 'number') {
      pts.push([arr[1], arr[0]]);
    } else if (Array.isArray(arr)) {
      for (let i = 0; i < arr.length; i++) {
        recurse(arr[i]);
      }
    }
  };
  recurse(geoJsonPolygon.coordinates);
  return pts;
};

// Formatting helper for lat/lon coordinates
export const formatLatLon = (lat: number, lon: number) => {
  const latStr = `${Math.abs(lat).toFixed(4)}°${lat >= 0 ? 'N' : 'S'}`;
  const lonStr = `${Math.abs(lon).toFixed(4)}°${lon >= 0 ? 'E' : 'W'}`;
  return `${latStr}, ${lonStr}`;
};

// Auto-focus and smoothly track the spill boundary
const MapCameraController: React.FC<{
  bounds: [number, number][];
  activeLat: number;
  activeLon: number;
  isPlaying: boolean;
  focusTrigger: number;
  isMaximized?: boolean;
}> = ({ bounds, activeLat, activeLon, isPlaying, focusTrigger, isMaximized }) => {
  const map = useMap();
  const prevBoundsKey = useRef<string>('');

  // Initial auto-zoom and explicit focus on the spill boundary when incident or trigger changes
  useEffect(() => {
    if (bounds.length > 0) {
      const boundsKey = `${bounds[0]?.[0]}_${bounds[0]?.[1]}_${bounds.length}_${focusTrigger}`;
      if (boundsKey !== prevBoundsKey.current || focusTrigger > 0) {
        prevBoundsKey.current = boundsKey;
        const b = L.latLngBounds(bounds);
        map.fitBounds(b, { padding: [50, 50], maxZoom: 16, animate: true });
      }
    }
  }, [bounds, focusTrigger, map]);

  // When map expands to full screen or restores, invalidate size smoothly
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize({ animate: true });
    }, 180);
    return () => clearTimeout(timer);
  }, [isMaximized, map]);

  // Smoothly pan as the forecast simulation steps forward
  useEffect(() => {
    if (isPlaying) {
      map.panTo([activeLat, activeLon], { animate: true, duration: 0.6 });
    }
  }, [activeLat, activeLon, isPlaying, map]);

  return null;
};

interface MapMouseTrackerProps {
  onMouseMove: (lat: number, lon: number, x: number, y: number) => void;
  onMouseLeave: () => void;
}

const MapMouseTracker: React.FC<MapMouseTrackerProps> = ({ onMouseMove, onMouseLeave }) => {
  const lastUpdateRef = useRef<number>(0);
  const map = useMapEvents({
    mousemove(e) {
      const now = performance.now();
      if (now - lastUpdateRef.current > 30) {
        lastUpdateRef.current = now;
        const pt = map.latLngToContainerPoint(e.latlng);
        onMouseMove(e.latlng.lat, e.latlng.lng, pt.x, pt.y);
      }
    },
    mouseout() {
      onMouseLeave();
    },
  });
  return null;
};

export const CharacterizationDashboard: React.FC<CharacterizationDashboardProps> = ({
  analysis,
  onBackToLab,
  onBackToGlobe,
  onOpenInvestigation,
}) => {
  const centroid = analysis.geometry.centroid;
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const [cursorState, setCursorState] = useState<{
    lat: number;
    lon: number;
    x: number;
    y: number;
    isHoveringSpill: boolean;
    isVisible: boolean;
  }>({
    lat: centroid.lat,
    lon: centroid.lon,
    x: 0,
    y: 0,
    isHoveringSpill: false,
    isVisible: false,
  });

  const handleMapMouseMove = (lat: number, lon: number, x: number, y: number) => {
    setCursorState((prev) => ({
      ...prev,
      lat,
      lon,
      x,
      y,
      isVisible: true,
    }));
  };

  const handleMapMouseLeave = () => {
    setCursorState((prev) => ({
      ...prev,
      isVisible: false,
      isHoveringSpill: false,
    }));
  };
  const currentPolyPositions = useMemo(() => {
    return toLeafletPositions(analysis.geometry.boundary.geometry);
  }, [analysis]);

  const allPolyPoints: [number, number][] = useMemo(() => {
    const pts = extractAllLeafletPoints(analysis.geometry.boundary.geometry);
    return pts.length > 0 ? pts : [[centroid.lat, centroid.lon]];
  }, [analysis, centroid]);

  // Movement velocity arrow coordinates (strictly contained within marine lagoon water)
  const moveAngleRad = (analysis.movement.direction_deg * Math.PI) / 180;
  const moveLenDeg = 0.012; // Scaled to Grand Port lagoon water width, never crosses onto land
  const rawMoveEndLat = centroid.lat + moveLenDeg * Math.cos(moveAngleRad);
  const rawMoveEndLon = centroid.lon + moveLenDeg * Math.sin(moveAngleRad);

  const driftCoords: [number, number][] = analysis.movement.drift_vector_coords
    ? (analysis.movement.drift_vector_coords as [number, number][])
    : [[centroid.lat, centroid.lon], [rawMoveEndLat, rawMoveEndLon]];

  // Ensure each forecast step has a distinctly advancing centroid along the forecast drift path
  const forecastSteps = useMemo(() => {
    const rawSteps = analysis.forecast.forecast || [];

    const maxHour = rawSteps[rawSteps.length - 1]?.hours || 72;
    const shoreLat = driftCoords[1]?.[0] ?? (centroid.lat - 0.012);
    const shoreLon = driftCoords[1]?.[1] ?? (centroid.lon - 0.015);

    const mappedSteps = rawSteps.map((step) => {
      const progressRatio = Math.min(1.0, Math.pow(step.hours / maxHour, 0.82));
      const interpLat = centroid.lat + progressRatio * (shoreLat - centroid.lat);
      const interpLon = centroid.lon + progressRatio * (shoreLon - centroid.lon);

      const rawLat = step.centroid.lat;
      const rawLon = step.centroid.lon;
      
      const isStrandedEarly = (step.hours <= 24 && Math.abs(rawLat - shoreLat) < 0.005 && Math.abs(rawLon - shoreLon) < 0.005);
      
      const effectiveLat = isStrandedEarly ? interpLat : rawLat;
      const effectiveLon = isStrandedEarly ? interpLon : rawLon;

      return {
        ...step,
        centroid: { lat: effectiveLat, lon: effectiveLon },
      };
    });

    // Explicit T+0h observed initial state so user sees the authentic initial boundary first
    const t0Step = {
      hours: 0,
      valid_time: analysis.timestamp ? new Date(analysis.timestamp).toUTCString().slice(5, 22) : 'T+0h Observed',
      centroid: { lat: centroid.lat, lon: centroid.lon },
      uncertainty_radius_km: 0.1,
      confidence: 0.98,
      polygon: analysis.geometry.boundary.geometry as any,
    };

    return [t0Step, ...mappedSteps];
  }, [analysis, centroid, driftCoords]);

  const [selectedForecastHour, setSelectedForecastHour] = useState<number>(0);

  const [isPlayingForecast, setIsPlayingForecast] = useState<boolean>(false);
  const [playbackSpeedMs, setPlaybackSpeedMs] = useState<number>(1200);
  
  // View mode switcher: 'all' | 'hindcast' | 'forecast'
  const [viewMode, setViewMode] = useState<'all' | 'hindcast' | 'forecast'>('all');
  const [isMapMaximized, setIsMapMaximized] = useState<boolean>(false);

  // Display Toggles
  const [showRadarSweep, setShowRadarSweep] = useState<boolean>(true);
  const [focusTrigger, setFocusTrigger] = useState<number>(0);
  const [cameraTarget, setCameraTarget] = useState<'spill' | 'origin' | 'extent' | null>(null);

  // Layer toggles
  const [showSpillPolygon, setShowSpillPolygon] = useState<boolean>(true);
  const [showDriftArrow, setShowDriftArrow] = useState<boolean>(true);
  const [showHindcast, setShowHindcast] = useState<boolean>(true);
  const [showForecast, setShowForecast] = useState<boolean>(true);
  const [showUncertaintyCone, setShowUncertaintyCone] = useState<boolean>(true);
  const [showFlowlines, setShowFlowlines] = useState<boolean>(true);
  const [isLayersOpen, setIsLayersOpen] = useState<boolean>(false);

  const activeLayersCount = [
    showSpillPolygon,
    showDriftArrow,
    showRadarSweep,
    showHindcast,
    showForecast,
    showUncertaintyCone,
    showFlowlines,
  ].filter(Boolean).length;

  const activeForecastStep = forecastSteps.find((s) => s.hours === selectedForecastHour) || forecastSteps[0];

  // Dynamically calculate the drifting slick coordinates as time advances
  const driftingSlickPositions = useMemo(() => {
    if (!activeForecastStep || activeForecastStep.hours === 0) {
      return currentPolyPositions;
    }
    const dLat = activeForecastStep.centroid.lat - centroid.lat;
    const dLon = activeForecastStep.centroid.lon - centroid.lon;
    const expansionFactor = 1.0 + (activeForecastStep.hours / 72.0) * 0.35;

    const shiftCoords = (item: any): any => {
      if (Array.isArray(item) && item.length >= 2 && typeof item[0] === 'number' && typeof item[1] === 'number') {
        const lat = item[0];
        const lon = item[1];
        const relLat = (lat - centroid.lat) * expansionFactor;
        const relLon = (lon - centroid.lon) * expansionFactor;
        return [
          activeForecastStep.centroid.lat + relLat,
          activeForecastStep.centroid.lon + relLon,
        ] as [number, number];
      }
      if (Array.isArray(item)) {
        return item.map(shiftCoords);
      }
      return item;
    };

    return shiftCoords(currentPolyPositions);
  }, [activeForecastStep, centroid, currentPolyPositions]);



  // Auto-play forecast animation loop
  useEffect(() => {
    let interval: any;
    if (isPlayingForecast && forecastSteps.length > 0) {
      const hoursList = forecastSteps.map((s) => s.hours);
      interval = setInterval(() => {
        setSelectedForecastHour((prev) => {
          const curIdx = hoursList.indexOf(prev);
          const nextIdx = (curIdx + 1) % hoursList.length;
          return hoursList[nextIdx];
        });
      }, playbackSpeedMs);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlayingForecast, forecastSteps, playbackSpeedMs]);

  const handleStepForward = () => {
    const hoursList = forecastSteps.map((s) => s.hours);
    const curIdx = hoursList.indexOf(selectedForecastHour);
    const nextIdx = (curIdx + 1) % hoursList.length;
    setSelectedForecastHour(hoursList[nextIdx]);
  };

  const handleStepBackward = () => {
    const hoursList = forecastSteps.map((s) => s.hours);
    const curIdx = hoursList.indexOf(selectedForecastHour);
    const prevIdx = (curIdx - 1 + hoursList.length) % hoursList.length;
    setSelectedForecastHour(hoursList[prevIdx]);
  };

  // Reconstructed Hindcast origin coordinates (aligned with Probable Origin in Investigation Suite)
  const hindcastOrigin = useMemo(() => {
    if ((analysis as any)?.investigation?.origin_analysis?.centroid) {
      return (analysis as any).investigation.origin_analysis.centroid;
    }
    if (analysis?.hindcast?.origin) {
      return analysis.hindcast.origin;
    }
    return { lat: centroid.lat, lon: centroid.lon };
  }, [analysis, centroid]);

  const createObservedPinIcon = () =>
    L.divIcon({
      className: 'custom-observed-pin-icon',
      html: `
        <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
          <div class="sonar-ring-pulse" style="position: absolute; width: 34px; height: 34px; border-radius: 50%; background: rgba(239, 68, 68, 0.35); border: 1.5px solid #ef4444;"></div>
          <div style="width: 24px; height: 24px; border-radius: 50%; background: linear-gradient(135deg, #ef4444, #dc2626); border: 2px solid #ffffff; box-shadow: 0 0 16px rgba(239, 68, 68, 0.9); display: flex; align-items: center; justify-content: center; color: #fff; z-index: 10;">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10" stroke="#ffffff"/>
              <circle cx="12" cy="12" r="3" fill="#ffffff"/>
            </svg>
          </div>
        </div>
      `,
      iconSize: [34, 34],
      iconAnchor: [17, 17],
    });

  const createOriginReticleIcon = () =>
    L.divIcon({
      className: 'custom-origin-reticle-icon',
      html: `
        <div style="position: relative; width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
          <div class="sonar-ring-pulse" style="position: absolute; width: 38px; height: 38px; border-radius: 50%; border: 2px dashed #f59e0b; background: rgba(245, 158, 11, 0.15);"></div>
          <div style="position: absolute; width: 22px; height: 22px; border-radius: 50%; border: 2px solid #f59e0b; background: rgba(245, 158, 11, 0.35);"></div>
          <div style="position: absolute; width: 2px; height: 34px; background: #f59e0b;"></div>
          <div style="position: absolute; width: 34px; height: 2px; background: #f59e0b;"></div>
          <div style="width: 8px; height: 8px; border-radius: 50%; background: #ffffff; box-shadow: 0 0 12px #f59e0b; z-index: 10;"></div>
        </div>
      `,
      iconSize: [38, 38],
      iconAnchor: [19, 19],
    });

  const createRadarSweepOverlayIcon = () =>
    L.divIcon({
      className: 'custom-radar-sweep-icon',
      html: `
        <div style="position: relative; width: 220px; height: 220px; pointer-events: none; transform: translate(-50%, -50%);">
          <svg viewBox="0 0 220 220" width="220" height="220" style="overflow: visible;">
            <circle cx="110" cy="110" r="100" fill="rgba(0, 242, 254, 0.03)" stroke="rgba(0, 242, 254, 0.25)" stroke-width="1" stroke-dasharray="3, 3" />
            <circle cx="110" cy="110" r="65" fill="none" stroke="rgba(0, 242, 254, 0.2)" stroke-width="1" stroke-dasharray="2, 4" />
            <circle cx="110" cy="110" r="30" fill="none" stroke="rgba(0, 242, 254, 0.3)" stroke-width="1" />
            <line x1="110" y1="5" x2="110" y2="215" stroke="rgba(0, 242, 254, 0.2)" stroke-width="1" stroke-dasharray="2, 4" />
            <line x1="5" y1="110" x2="215" y2="110" stroke="rgba(0, 242, 254, 0.2)" stroke-width="1" stroke-dasharray="2, 4" />
            <g class="radar-sweep-beam" style="transform-origin: 110px 110px;">
              <path d="M 110 110 L 210 110 A 100 100 0 0 0 180 39 Z" fill="url(#radarGradient)" opacity="0.65" />
            </g>
            <defs>
              <linearGradient id="radarGradient" gradientTransform="rotate(45)">
                <stop offset="0%" stop-color="rgba(0, 242, 254, 0)" />
                <stop offset="100%" stop-color="rgba(0, 242, 254, 0.45)" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      `,
      iconSize: [0, 0],
      iconAnchor: [0, 0],
    });


  const createMilestoneIcon = (hours: number, isSelected: boolean) =>
    L.divIcon({
      className: 'custom-milestone-icon',
      html: `
        <div style="
          background: ${isSelected ? '#a855f7' : 'rgba(15, 23, 42, 0.95)'};
          border: 2px solid ${isSelected ? '#ffffff' : '#c084fc'};
          color: ${isSelected ? '#ffffff' : '#e9d5ff'};
          border-radius: 12px;
          padding: 2px 6px;
          font-size: 10px;
          font-weight: 800;
          box-shadow: ${isSelected ? '0 0 16px #a855f7' : '0 2px 6px rgba(0,0,0,0.6)'};
          display: flex;
          align-items: center;
          gap: 2px;
          white-space: nowrap;
          cursor: pointer;
          transform: scale(${isSelected ? 1.15 : 0.95});
          transition: transform 0.2s ease;
        ">
          <span>+${hours}h</span>
        </div>
      `,
      iconSize: [40, 20],
      iconAnchor: [20, 10],
    });

  const createAnimatedForecastIcon = (hours: number) =>
    L.divIcon({
      className: 'custom-active-forecast-icon',
      html: `
        <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;">
          <div class="sonar-ring-pulse" style="position: absolute; width: 34px; height: 34px; border-radius: 50%; border: 2px solid #a855f7; background: rgba(168, 85, 247, 0.25);"></div>
          <div style="width: 22px; height: 22px; border-radius: 50%; background: linear-gradient(135deg, #a855f7, #7c3aed); border: 2px solid #ffffff; box-shadow: 0 0 14px #a855f7; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 10px; font-weight: 900; z-index: 10;">
            +${hours}
          </div>
        </div>
      `,
      iconSize: [34, 34],
      iconAnchor: [17, 17],
    });

  const createDriftArrowheadIcon = (angleDeg: number) =>
    L.divIcon({
      className: 'custom-drift-arrowhead-icon',
      html: `
        <div class="vector-arrow-glow" style="
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          transform: rotate(${angleDeg}deg);
        ">
          <svg viewBox="0 0 32 32" width="32" height="32" fill="none">
            <polygon points="16,3 27,27 16,21 5,27" fill="#22c55e" stroke="#ffffff" stroke-width="2" />
          </svg>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

  const createReserveIcon = () =>
    L.divIcon({
      className: 'custom-reserve-icon',
      html: `
        <div style="background: rgba(16, 185, 129, 0.9); border: 2px solid #ffffff; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 12px rgba(16, 185, 129, 0.7);">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });

  // Calculate full mission bounding box (Origin + Observed + 72h Forecast)
  const fullMissionBounds = useMemo(() => {
    const pts: [number, number][] = [
      [centroid.lat, centroid.lon],
      [hindcastOrigin.lat, hindcastOrigin.lon],
      ...forecastSteps.map((s) => [s.centroid.lat, s.centroid.lon] as [number, number]),
    ];
    return pts;
  }, [centroid, hindcastOrigin, forecastSteps]);

  // Vector compass geometry calculations
  const windDir = analysis.movement.wind.direction_deg;
  const currentDir = analysis.movement.current.direction_deg;
  const netDir = analysis.movement.direction_deg;

  const windRad = ((windDir - 90) * Math.PI) / 180;
  const currentRad = ((currentDir - 90) * Math.PI) / 180;
  const netRad = ((netDir - 90) * Math.PI) / 180;

  const compassRadius = 42;
  const windTipX = 50 + compassRadius * 0.75 * Math.cos(windRad);
  const windTipY = 50 + compassRadius * 0.75 * Math.sin(windRad);
  const curTipX = 50 + compassRadius * 0.65 * Math.cos(currentRad);
  const curTipY = 50 + compassRadius * 0.65 * Math.sin(currentRad);
  const netTipX = 50 + compassRadius * 0.9 * Math.cos(netRad);
  const netTipY = 50 + compassRadius * 0.9 * Math.sin(netRad);

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: '#070a13',
      color: '#f1f5f9',
      overflow: 'hidden',
      padding: '16px 24px',
      boxSizing: 'border-box',
    }}>
      {/* Top Header */}
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
          <button
            onClick={onBackToLab}
            style={{
              background: 'rgba(15, 23, 42, 0.85)',
              border: '1px solid rgba(0, 242, 254, 0.4)',
              color: '#00f2fe',
              borderRadius: '8px',
              padding: '6px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <ArrowLeft size={16} />
            <span>← Back to Satellite Lab</span>
          </button>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#00f2fe', textTransform: 'uppercase', letterSpacing: '0.8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Activity size={14} /> OIL SPILL CHARACTERIZATION & MOVEMENT ENGINE
              </span>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>•</span>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{analysis.spill_id.toUpperCase()}</span>
            </div>
            <h2 style={{ margin: '2px 0 0 0', fontSize: '1.15rem', fontWeight: 800, color: '#f1f5f9' }}>
              Geospatial Intelligence, Hindcasting & Predictive Drift Simulation
            </h2>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Simulation Mode Indicator */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(56, 189, 248, 0.12)',
            border: '1px solid rgba(56, 189, 248, 0.4)',
            borderRadius: '6px',
            padding: '6px 12px',
          }}>
            <Info size={16} color="#38bdf8" />
            <span style={{ fontSize: '0.78rem', color: '#38bdf8', fontWeight: 700 }}>
              {analysis.movement.mode_label || 'Demo / Simulated Environmental Data'}
            </span>
          </div>

          {/* Launch Investigation & Coastal Warning Button */}
          {onOpenInvestigation && (
            <button
              onClick={() => onOpenInvestigation(analysis.spill_id)}
              style={{
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                border: 'none',
                color: '#030712',
                borderRadius: '6px',
                padding: '7px 14px',
                fontSize: '0.80rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 0 15px rgba(245, 158, 11, 0.35)',
              }}
            >
              <Ship size={15} />
              <span>Multi-Source Investigation & Alerts →</span>
            </button>
          )}
        </div>
      </div>

      {/* Sleek Compact Telemetry Bar */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: '8px',
        marginBottom: '10px',
        flexShrink: 0,
        background: 'rgba(8, 14, 26, 0.85)',
        border: '1px solid rgba(0, 242, 254, 0.25)',
        borderRadius: '8px',
        padding: '8px 14px',
        backdropFilter: 'blur(8px)',
      }}>
        {/* Cell 1: Area */}
        <div style={{ display: 'flex', flexDirection: 'column', borderRight: '1px solid rgba(255,255,255,0.08)', paddingRight: '8px' }}>
          <span style={{ fontSize: '0.66rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Surface Slick Area</span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', margin: '1px 0' }}>
            <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#00f2fe' }}>~{analysis.geometry.area_km2}</span>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>km²</span>
          </div>
          <span style={{ fontSize: '0.66rem', color: '#94a3b8' }}>Perimeter: <b>{analysis.geometry.perimeter_km} km</b> • Orient: <b>{analysis.geometry.orientation_deg}°</b></span>
        </div>

        {/* Cell 2: Net Drift */}
        <div style={{ display: 'flex', flexDirection: 'column', borderRight: '1px solid rgba(255,255,255,0.08)', paddingRight: '8px' }}>
          <span style={{ fontSize: '0.66rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Net Movement Drift</span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', margin: '1px 0' }}>
            <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#22c55e' }}>{analysis.movement.speed_mps}</span>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>m/s ({analysis.movement.direction})</span>
          </div>
          <span style={{ fontSize: '0.66rem', color: '#94a3b8' }}>Heading: <b>{analysis.movement.direction_deg}°</b> • Wind: <b>{analysis.movement.wind_contribution_pct}%</b></span>
        </div>

        {/* Cell 3: Spreading Rate */}
        <div style={{ display: 'flex', flexDirection: 'column', borderRight: '1px solid rgba(255,255,255,0.08)', paddingRight: '8px' }}>
          <span style={{ fontSize: '0.66rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Spreading Rate (dA/dt)</span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', margin: '1px 0' }}>
            <span style={{ fontSize: '1.1rem', fontWeight: 800, color: analysis.spreading.average_spread_rate_km2_per_hour ? '#f97316' : '#94a3b8' }}>
              {analysis.spreading.average_spread_rate_km2_per_hour ? `${analysis.spreading.average_spread_rate_km2_per_hour}` : 'Active'}
            </span>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>km²/h</span>
          </div>
          <span style={{ fontSize: '0.66rem', color: '#94a3b8' }}>Fay Hydrodynamic Dispersion</span>
        </div>

        {/* Cell 4: Severity */}
        <div style={{ display: 'flex', flexDirection: 'column', borderRight: '1px solid rgba(255,255,255,0.08)', paddingRight: '8px' }}>
          <span style={{ fontSize: '0.66rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Severity Classification</span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', margin: '1px 0' }}>
            <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ef4444' }}>{analysis.severity.class}</span>
          </div>
          <span style={{ fontSize: '0.66rem', color: '#94a3b8' }}>Model Conf: <b>{Math.round(analysis.severity.confidence * 100)}%</b></span>
        </div>

        {/* Cell 5: Origin */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.66rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Probable Origin (-48H)</span>
            {onOpenInvestigation && (
              <span
                onClick={() => onOpenInvestigation(analysis.spill_id)}
                style={{ fontSize: '0.65rem', color: '#eab308', fontWeight: 800, cursor: 'pointer', textDecoration: 'underline' }}
              >
                Inspect Sources →
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', margin: '1px 0' }}>
            <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#eab308' }}>
              {formatLatLon(hindcastOrigin.lat, hindcastOrigin.lon)}
            </span>
          </div>
          <span style={{ fontSize: '0.66rem', color: '#94a3b8' }}>Uncertainty: <b>±{analysis.hindcast.uncertainty_radius_km} km</b></span>
        </div>
      </div>

      {/* Main Grid: Interactive Geospatial Map vs Intelligence Controls Deck */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMapMaximized ? '1fr' : '1.38fr 0.62fr',
        gap: '14px',
        flex: 1,
        minHeight: 0,
        transition: 'grid-template-columns 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
      }}>
        
        {/* Left Map View */}
        <div style={{
          background: '#030712',
          border: '1px solid rgba(0, 242, 254, 0.3)',
          borderRadius: '10px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}>
          {/* Unified Top Control Bar (Non-overlapping Flex Layout) */}
          <div style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            right: '10px',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
            pointerEvents: 'none',
          }}>
            {/* Left Controls: View Mode & Camera Actions */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              pointerEvents: 'auto',
              flexWrap: 'nowrap',
            }}>
              {/* View Mode Segmented Controller */}
              <div style={{
                background: 'rgba(6, 10, 20, 0.94)',
                border: '1px solid rgba(0, 242, 254, 0.35)',
                borderRadius: '8px',
                padding: '3px',
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
              }}>
                <button
                  onClick={() => setViewMode('all')}
                  style={{
                    background: viewMode === 'all' ? 'linear-gradient(135deg, #00f2fe 0%, #0284c7 100%)' : 'transparent',
                    color: viewMode === 'all' ? '#030712' : '#94a3b8',
                    border: 'none',
                    borderRadius: '5px',
                    padding: '4px 8px',
                    fontSize: '0.70rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Globe size={12} />
                  <span>Overview</span>
                </button>
                <button
                  onClick={() => setViewMode('hindcast')}
                  style={{
                    background: viewMode === 'hindcast' ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : 'transparent',
                    color: viewMode === 'hindcast' ? '#030712' : '#94a3b8',
                    border: 'none',
                    borderRadius: '5px',
                    padding: '4px 8px',
                    fontSize: '0.70rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <History size={12} />
                  <span>Hindcast</span>
                </button>
                <button
                  onClick={() => setViewMode('forecast')}
                  style={{
                    background: viewMode === 'forecast' ? 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)' : 'transparent',
                    color: viewMode === 'forecast' ? '#ffffff' : '#94a3b8',
                    border: 'none',
                    borderRadius: '5px',
                    padding: '4px 8px',
                    fontSize: '0.70rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <TrendingUp size={12} />
                  <span>Forecast</span>
                </button>
              </div>

              {/* Quick Action: Focus Camera on Spill */}
              <button
                onClick={() => {
                  setCameraTarget('spill');
                  setFocusTrigger((prev) => prev + 1);
                }}
                className="map-hud-btn"
                title="Auto-center camera directly onto the observed oil spill"
                style={{
                  background: 'rgba(6, 10, 20, 0.94)',
                  border: '1px solid #00f2fe',
                  color: '#00f2fe',
                  padding: '5px 9px',
                  borderRadius: '8px',
                  fontSize: '0.70rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer',
                  backdropFilter: 'blur(8px)',
                }}
              >
                <Crosshair size={12} />
                <span>Spill</span>
              </button>

              {/* Quick Action: Focus Camera on Reconstructed Origin */}
              <button
                onClick={() => {
                  setCameraTarget('origin');
                  setFocusTrigger((prev) => prev + 1);
                }}
                className="map-hud-btn"
                title="Focus camera on reconstructed probable origin"
                style={{
                  background: 'rgba(6, 10, 20, 0.94)',
                  border: '1px solid #f59e0b',
                  color: '#f59e0b',
                  padding: '5px 9px',
                  borderRadius: '8px',
                  fontSize: '0.70rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer',
                  backdropFilter: 'blur(8px)',
                }}
              >
                <History size={12} />
                <span>Origin</span>
              </button>

              {/* Quick Action: Fit Full Mission Extent */}
              <button
                onClick={() => {
                  setCameraTarget('extent');
                  setFocusTrigger((prev) => prev + 1);
                }}
                className="map-hud-btn"
                title="Fit map extent to cover entire trajectory (Origin to +72h)"
                style={{
                  background: 'rgba(6, 10, 20, 0.94)',
                  border: '1px solid rgba(255,255,255,0.25)',
                  color: '#f1f5f9',
                  padding: '5px 9px',
                  borderRadius: '8px',
                  fontSize: '0.70rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer',
                  backdropFilter: 'blur(8px)',
                }}
              >
                <Maximize2 size={12} />
                <span>Fit</span>
              </button>
            </div>

            {/* Center Live Coordinates & Status Pill */}
            <div style={{
              background: 'rgba(6, 11, 25, 0.94)',
              border: '1px solid rgba(0, 242, 254, 0.35)',
              borderRadius: '20px',
              padding: '4px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backdropFilter: 'blur(12px)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
              fontSize: '0.70rem',
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span className="badge-pulse-dot" style={{ backgroundColor: '#00f2fe' }}></span>
                <span style={{ color: '#00f2fe', fontWeight: 800 }}>POS:</span>
                <span style={{ color: '#f1f5f9', fontFamily: 'var(--font-mono)' }}>
                  {cursorState.isVisible ? formatLatLon(cursorState.lat, cursorState.lon) : formatLatLon(centroid.lat, centroid.lon)}
                </span>
              </div>
              <span style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                <span style={{ color: '#94a3b8' }}>SPEED:</span>
                <span style={{ color: '#22c55e', fontWeight: 800 }}>{analysis.movement.speed_mps} m/s</span>
              </div>
            </div>

            {/* Right Controls: Basemap, Layers Popover Toggle & Maximize */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              pointerEvents: 'auto',
              position: 'relative',
            }}>
              {/* Satellite Basemap Indicator */}
              <div
                className="map-hud-btn"
                style={{
                  background: 'rgba(6, 10, 20, 0.94)',
                  border: '1px solid rgba(0, 242, 254, 0.35)',
                  color: '#00f2fe',
                  padding: '5px 9px',
                  borderRadius: '8px',
                  fontSize: '0.70rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  backdropFilter: 'blur(8px)',
                }}
              >
                <Satellite size={12} color="#00f2fe" />
                <span>Satellite</span>
              </div>

              {/* Collapsible Layers Menu Button */}
              <button
                onClick={() => setIsLayersOpen((prev) => !prev)}
                className="map-hud-btn"
                title="Toggle layer visibility menu"
                style={{
                  background: isLayersOpen ? 'rgba(0, 242, 254, 0.25)' : 'rgba(6, 10, 20, 0.94)',
                  border: isLayersOpen ? '1.5px solid #00f2fe' : '1px solid rgba(0, 242, 254, 0.35)',
                  color: isLayersOpen ? '#00f2fe' : '#f1f5f9',
                  padding: '5px 9px',
                  borderRadius: '8px',
                  fontSize: '0.70rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  cursor: 'pointer',
                  backdropFilter: 'blur(8px)',
                  boxShadow: isLayersOpen ? '0 0 12px rgba(0, 242, 254, 0.4)' : 'none',
                }}
              >
                <Layers size={12} />
                <span>Layers ({activeLayersCount})</span>
              </button>

              {/* Maximize Map Toggle */}
              <button
                onClick={() => setIsMapMaximized((prev) => !prev)}
                className="map-hud-btn"
                title={isMapMaximized ? "Restore split dashboard view" : "Maximize map screen size"}
                style={{
                  background: isMapMaximized ? 'rgba(0, 242, 254, 0.25)' : 'rgba(6, 10, 20, 0.94)',
                  border: isMapMaximized ? '1.5px solid #00f2fe' : '1px solid rgba(0, 242, 254, 0.4)',
                  color: isMapMaximized ? '#00f2fe' : '#f1f5f9',
                  padding: '5px 9px',
                  borderRadius: '8px',
                  fontSize: '0.70rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer',
                  backdropFilter: 'blur(8px)',
                  boxShadow: isMapMaximized ? '0 0 12px rgba(0, 242, 254, 0.5)' : 'none',
                }}
              >
                {isMapMaximized ? (
                  <>
                    <Minimize2 size={12} color="#00f2fe" />
                    <span>Restore</span>
                  </>
                ) : (
                  <>
                    <Maximize2 size={12} color="#00f2fe" />
                    <span>Maximize</span>
                  </>
                )}
              </button>

              {/* Clean Floating Layers Dropdown Popover */}
              {isLayersOpen && (
                <div style={{
                  position: 'absolute',
                  top: '38px',
                  right: '0px',
                  width: '210px',
                  zIndex: 1100,
                  background: 'rgba(6, 10, 22, 0.97)',
                  border: '1px solid rgba(0, 242, 254, 0.4)',
                  borderRadius: '10px',
                  padding: '10px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  fontSize: '0.72rem',
                  backdropFilter: 'blur(16px)',
                  boxShadow: '0 12px 36px rgba(0,0,0,0.8), 0 0 20px rgba(0, 242, 254, 0.2)',
                  animation: 'fadeIn 0.15s ease-out',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '6px', marginBottom: '2px' }}>
                    <div style={{ fontWeight: 800, color: '#00f2fe', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Layers size={13} />
                      <span>MAP LAYERS</span>
                    </div>
                    <button
                      onClick={() => setIsLayersOpen(false)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#94a3b8',
                        cursor: 'pointer',
                        fontSize: '0.65rem',
                        padding: '2px',
                      }}
                    >
                      Close
                    </button>
                  </div>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={showSpillPolygon} onChange={(e) => setShowSpillPolygon(e.target.checked)} />
                    <span style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Crosshair size={12} /> Observed Spill
                    </span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={showDriftArrow} onChange={(e) => setShowDriftArrow(e.target.checked)} />
                    <span style={{ color: '#22c55e', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Compass size={12} /> Movement Vector
                    </span>
                  </label>


                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={showRadarSweep} onChange={(e) => setShowRadarSweep(e.target.checked)} />
                    <span style={{ color: '#00f2fe', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Radio size={12} /> Radar Sweep
                    </span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={showHindcast} onChange={(e) => setShowHindcast(e.target.checked)} />
                    <span style={{ color: '#eab308', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <History size={12} /> Hindcast Reticle
                    </span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={showForecast} onChange={(e) => setShowForecast(e.target.checked)} />
                    <span style={{ color: '#a855f7', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <TrendingUp size={12} /> Forecast (+72h)
                    </span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={showUncertaintyCone} onChange={(e) => setShowUncertaintyCone(e.target.checked)} />
                    <span style={{ color: '#ec4899', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <ShieldAlert size={12} /> Uncertainty Cone
                    </span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '4px' }}>
                    <input type="checkbox" checked={showFlowlines} onChange={(e) => setShowFlowlines(e.target.checked)} />
                    <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Waves size={12} /> Streamlines (40)
                    </span>
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Leaflet Map */}
          <div ref={mapContainerRef} style={{ flex: 1, width: '100%', height: '100%', position: 'relative' }}>
            <MapContainer
              center={[centroid.lat, centroid.lon]}
              zoom={13}
              minZoom={1}
              maxZoom={20}
              worldCopyJump={true}
              style={{ width: '100%', height: '100%' }}
            >
              {/* Live Mouse Coordinate & Spill Boundary Tracker */}
              <MapMouseTracker
                onMouseMove={handleMapMouseMove}
                onMouseLeave={handleMapMouseLeave}
              />

              {/* Dynamic Camera Controller: Zooms directly into spill on demand without locking user view */}
              <MapCameraController
                bounds={
                  cameraTarget === 'origin'
                    ? [[hindcastOrigin.lat, hindcastOrigin.lon]]
                    : cameraTarget === 'extent'
                    ? fullMissionBounds
                    : allPolyPoints
                }
                activeLat={activeForecastStep.centroid.lat}
                activeLon={activeForecastStep.centroid.lon}
                isPlaying={isPlayingForecast}
                focusTrigger={focusTrigger}
                isMaximized={isMapMaximized}
              />

              {/* Satellite Basemap Layer */}
              <TileLayer
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                attribution='&copy; <a href="https://www.esri.com/">Esri</a>, Earthstar Geographics'
                maxZoom={20}
                maxNativeZoom={13}
              />

              {/* 📡 Radar Scanning Sweep Overlay around Centroid */}
              {showRadarSweep && (
                <Marker
                  position={[centroid.lat, centroid.lon]}
                  icon={createRadarSweepOverlayIcon()}
                  interactive={false}
                />
              )}



              {/* 1. Current Observed Spill Boundary (T+0h Reference) & Pin Marker */}
              {showSpillPolygon && (
                <>
                  <Polygon
                    positions={currentPolyPositions}
                    pathOptions={{
                      color: '#ef4444',
                      fillColor: '#ef4444',
                      fillOpacity: activeForecastStep.hours > 0 ? 0.12 : 0.28,
                      weight: activeForecastStep.hours > 0 ? 2.5 : 3.8,
                      opacity: 1.0,
                    }}
                    eventHandlers={{
                      mouseover: () => setCursorState((prev) => ({ ...prev, isHoveringSpill: true })),
                      mouseout: () => setCursorState((prev) => ({ ...prev, isHoveringSpill: false })),
                    }}
                  >
                    <Popup>
                      <div style={{ color: '#0f172a', fontSize: '11px', lineHeight: 1.4 }}>
                        <b style={{ color: '#dc2626' }}>Observed Oil Spill Slick Boundary</b><br />
                        <b>Surface Area:</b> {analysis.geometry.area_km2} km²<br />
                        <b>Perimeter:</b> {analysis.geometry.perimeter_km} km<br />
                        <b>Centroid:</b> {formatLatLon(centroid.lat, centroid.lon)}<br />
                        <b>Zone:</b> {analysis.spill_id === 'emerald' || centroid.lat > 0 ? 'Eastern Mediterranean Sea (Levantine Basin)' : "Grand Port Lagoon (Between Barrier Reef & Pointe d'Esny Coastline)"}
                      </div>
                    </Popup>
                  </Polygon>

                  <Marker
                    position={[centroid.lat, centroid.lon]}
                    icon={createObservedPinIcon()}
                    eventHandlers={{
                      mouseover: () => setCursorState((prev) => ({ ...prev, isHoveringSpill: true })),
                      mouseout: () => setCursorState((prev) => ({ ...prev, isHoveringSpill: false })),
                    }}
                  />
                </>
              )}

              {/* Active Moving Slick with Advection Ribbon (T+th) */}
              {showSpillPolygon && activeForecastStep.hours > 0 && (
                <>
                  <Polyline
                    positions={[
                      [centroid.lat, centroid.lon],
                      [activeForecastStep.centroid.lat, activeForecastStep.centroid.lon],
                    ]}
                    pathOptions={{
                      color: '#f43f5e',
                      weight: 3.5,
                      dashArray: '4, 6',
                      opacity: 0.85,
                    }}
                  >
                    <Tooltip permanent={false}>
                      Advection Drift Path (+{activeForecastStep.hours}h)
                    </Tooltip>
                  </Polyline>

                  <Polygon
                    positions={driftingSlickPositions}
                    pathOptions={{
                      color: '#f43f5e',
                      fillColor: '#f43f5e',
                      fillOpacity: 0.22,
                      weight: 3.5,
                      className: 'slick-drifting-boundary',
                    }}
                  >
                    <Tooltip permanent direction="top" offset={[0, -10]}>
                      Active Moving Slick (+{activeForecastStep.hours}h)
                    </Tooltip>
                    <Popup>
                      <b>Predicted Moving Slick (+{activeForecastStep.hours}h)</b><br />
                      Valid Time: {activeForecastStep.valid_time}<br />
                      Predicted Centroid: {formatLatLon(activeForecastStep.centroid.lat, activeForecastStep.centroid.lon)}<br />
                      Predicted Area: ~{(analysis.geometry.area_km2 * (1 + (activeForecastStep.hours / 72) * 0.35)).toFixed(3)} km²<br />
                      Shoreline Distance: ~{(Math.max(0.1, 1.8 - (activeForecastStep.hours / 72) * 1.6)).toFixed(2)} km
                    </Popup>
                  </Polygon>
                </>
              )}

              {/* 2. Movement Drift Arrow & Directional Arrowhead */}
              {showDriftArrow && (
                <>
                  <Polyline
                    positions={driftCoords}
                    pathOptions={{ color: '#22c55e', weight: 4, dashArray: '6, 6', opacity: 0.95 }}
                  >
                    <Tooltip permanent={false}>
                      Net Drift: {analysis.movement.speed_mps} m/s heading {analysis.movement.direction} ({analysis.movement.direction_deg}°)
                    </Tooltip>
                  </Polyline>

                  {driftCoords.length >= 2 && (
                    <Marker
                      position={driftCoords[1]}
                      icon={createDriftArrowheadIcon(analysis.movement.direction_deg)}
                    >
                      <Tooltip permanent={false} direction="top">
                        <b>Shoreline Contact Point</b><br />
                        Heading: {analysis.movement.direction} ({analysis.movement.direction_deg}°)<br />
                        {analysis.spill_id === 'emerald' || centroid.lat > 0 ? 'Levantine Coastal Intercept' : "Lagoon Water Edge (Pointe d'Esny)"}
                      </Tooltip>
                      <Popup>
                        <div style={{ color: '#0f172a', fontSize: '11px', lineHeight: 1.4 }}>
                          <b style={{ color: '#16a34a' }}>Net Drift Vector Terminal</b><br />
                          <b>Location:</b> {analysis.spill_id === 'emerald' || centroid.lat > 0 ? 'Levantine Coastal Waterline' : "Lagoon Waterline Intercept (Pointe d'Esny Coast)"}<br />
                          <b>Velocity:</b> {analysis.movement.speed_mps} m/s ({analysis.movement.speed_kmh} km/h)<br />
                          <b>Drift Heading:</b> {analysis.movement.direction} ({analysis.movement.direction_deg}°)<br />
                          <b>Coordinates:</b> {formatLatLon(driftCoords[1][0], driftCoords[1][1])}<br />
                          <span style={{ color: '#059669', fontWeight: 600 }}>✓ Strictly Clamped to Coastal Water Boundary</span>
                        </div>
                      </Popup>
                    </Marker>
                  )}
                </>
              )}

              {/* Sensitive Nature Reserves */}
              {(analysis.spill_id === 'wakashio' || centroid.lat < 0) && (
                <Marker
                  position={[-20.4202, 57.7303]}
                  icon={createReserveIcon()}
                >
                  <Tooltip direction="top" offset={[0, -12]}>
                    <b>Ile aux Aigrettes Nature Reserve</b><br />
                    Endangered endemic fauna & coastal mangrove sanctuary
                  </Tooltip>
                  <Popup>
                    <div style={{ color: '#0f172a', fontSize: '11px', lineHeight: 1.4 }}>
                      <b style={{ color: '#059669' }}>Ile aux Aigrettes Nature Reserve</b><br />
                      <b>Ecological Status:</b> High-Priority Conservation Sanctuary<br />
                      <b>Key Risk:</b> Oil slick advection entering the northern lagoon channels
                    </div>
                  </Popup>
                </Marker>
              )}

              {(analysis.spill_id === 'emerald' || centroid.lat > 0) && (
                <Marker
                  position={[33.090, 35.105]}
                  icon={createReserveIcon()}
                >
                  <Tooltip direction="top" offset={[0, -12]}>
                    <b>Rosh HaNikra & Achziv Marine Reserves</b><br />
                    Protected Mediterranean marine canyon & turtle nesting sanctuary
                  </Tooltip>
                  <Popup>
                    <div style={{ color: '#0f172a', fontSize: '11px', lineHeight: 1.4 }}>
                      <b style={{ color: '#059669' }}>Mediterranean Coastal Sanctuaries</b><br />
                      <b>Ecological Status:</b> High-Priority Marine Protected Area<br />
                      <b>Key Risk:</b> Heavy crude slick shoreline washup along coastal belt
                    </div>
                  </Popup>
                </Marker>
              )}

              {/* 3. Backward Hindcast (Probable Origin -48h) */}
              {showHindcast && viewMode !== 'forecast' && (
                <>
                  <Polyline
                    positions={[
                      [hindcastOrigin.lat, hindcastOrigin.lon],
                      [centroid.lat, centroid.lon],
                    ]}
                    pathOptions={{ color: '#f59e0b', weight: 3.5, dashArray: '5, 5', opacity: 0.9 }}
                  >
                    <Tooltip permanent={false}>
                      Backward Advection Spine (-48h to T0)
                    </Tooltip>
                  </Polyline>

                  {showFlowlines && analysis.hindcast.trajectories.map((traj, idx) => (
                    <Polyline
                      key={`hind-traj-${idx}`}
                      positions={traj.map((pt) => [pt[1], pt[0]])}
                      pathOptions={{ color: '#f59e0b', weight: 1.2, opacity: 0.22, dashArray: '4, 4' }}
                    />
                  ))}

                  <Marker position={[hindcastOrigin.lat, hindcastOrigin.lon]} icon={createOriginReticleIcon()}>
                    <Tooltip direction="top" offset={[0, -18]}>
                      <b>Grounding / Origin Zone (-48h)</b><br />
                      {analysis.hindcast.origin_time_window.estimated_origin_time}
                    </Tooltip>
                    <Popup>
                      <b>Reconstructed Probable Origin (-48h)</b><br />
                      Estimated Event: {analysis.hindcast.origin_time_window.estimated_origin_time}<br />
                      Coordinates: {formatLatLon(hindcastOrigin.lat, hindcastOrigin.lon)}<br />
                      Uncertainty: ±{analysis.hindcast.uncertainty_radius_km} km<br />
                      Confidence: {Math.round(analysis.hindcast.confidence * 100)}%
                    </Popup>
                  </Marker>

                  {/* 5 km Distance Ring */}
                  <Circle
                    center={[hindcastOrigin.lat, hindcastOrigin.lon]}
                    radius={5000}
                    pathOptions={{ color: '#f59e0b', fillColor: 'rgba(245, 158, 11, 0.04)', fillOpacity: 0.04, weight: 1, dashArray: '4, 4' }}
                  />

                  {/* 1-Sigma Confidence Boundary */}
                  <Circle
                    center={[hindcastOrigin.lat, hindcastOrigin.lon]}
                    radius={Math.max(400, (analysis.hindcast.uncertainty_radius_km * 0.6) * 1000)}
                    pathOptions={{ color: '#f59e0b', fillColor: 'transparent', fillOpacity: 0, weight: 1.5, dashArray: '4, 4' }}
                  />

                  {/* 2-Sigma Confidence Boundary */}
                  <Circle
                    center={[hindcastOrigin.lat, hindcastOrigin.lon]}
                    radius={Math.max(700, analysis.hindcast.uncertainty_radius_km * 1000)}
                    pathOptions={{ color: '#f59e0b', fillColor: 'transparent', fillOpacity: 0, dashArray: '4, 4', weight: 1 }}
                  />
                </>
              )}

              {/* 4. Expanding Uncertainty Cone */}
              {showUncertaintyCone && viewMode !== 'hindcast' && analysis.forecast.uncertainty_cone && (
                <Polygon
                  key="forecast-uncertainty-cone"
                  positions={toLeafletPositions(analysis.forecast.uncertainty_cone)}
                  pathOptions={{ color: '#c084fc', fillColor: 'transparent', fillOpacity: 0, weight: 1.5, dashArray: '5, 5' }}
                >
                  <Tooltip permanent={false}>Forecast Uncertainty Cone (72h Horizon)</Tooltip>
                </Polygon>
              )}

              {/* 5. Forward Forecast Trajectory & Active Horizon */}
              {showForecast && viewMode !== 'hindcast' && (
                <>
                  {forecastSteps.length >= 2 && (
                    <Polyline
                      positions={[
                        [centroid.lat, centroid.lon],
                        ...forecastSteps.map((s) => [s.centroid.lat, s.centroid.lon] as [number, number]),
                      ]}
                      pathOptions={{ color: '#a855f7', weight: 3.5, dashArray: '6, 6', opacity: 0.95 }}
                    />
                  )}

                  {showFlowlines && analysis.forecast.trajectories.map((traj, idx) => (
                    <Polyline
                      key={`fore-traj-${idx}`}
                      positions={traj.map((pt) => [pt[1], pt[0]])}
                      pathOptions={{ color: '#c084fc', weight: 1.2, opacity: 0.22, dashArray: '4, 4' }}
                    />
                  ))}

                  {forecastSteps.map((step) => {
                    const isSelected = step.hours === activeForecastStep.hours;
                    return (
                      <Marker
                        key={`step-milestone-marker-${step.hours}`}
                        position={[step.centroid.lat, step.centroid.lon]}
                        icon={createMilestoneIcon(step.hours, isSelected)}
                        eventHandlers={{
                          click: () => {
                            setIsPlayingForecast(false);
                            setSelectedForecastHour(step.hours);
                          }
                        }}
                      >
                        <Tooltip permanent={isSelected} direction="top">
                          +{step.hours}h ({step.valid_time})
                        </Tooltip>
                        <Popup>
                          <b>Predicted Horizon: +{step.hours} Hours</b><br />
                          Valid Time: {step.valid_time}<br />
                          Centroid: {formatLatLon(step.centroid.lat, step.centroid.lon)}<br />
                          Uncertainty: ±{step.uncertainty_radius_km} km<br />
                          Confidence: {Math.round(step.confidence * 100)}%
                        </Popup>
                      </Marker>
                    );
                  })}

                  <Marker
                    key={`forecast-active-beacon-${activeForecastStep.hours}`}
                    position={[activeForecastStep.centroid.lat, activeForecastStep.centroid.lon]}
                    icon={createAnimatedForecastIcon(activeForecastStep.hours)}
                    zIndexOffset={1000}
                  />

                  {activeForecastStep.polygon && (
                    <Polygon
                      key={`forecast-poly-step-${activeForecastStep.hours}`}
                      positions={toLeafletPositions(activeForecastStep.polygon)}
                      pathOptions={{ color: '#c084fc', fillColor: 'transparent', fillOpacity: 0, weight: 2.5, dashArray: '5, 5' }}
                    >
                      <Tooltip permanent={false}>
                        Forecast Boundary +{activeForecastStep.hours}h ({activeForecastStep.valid_time})
                      </Tooltip>
                    </Polygon>
                  )}

                  <Circle
                    key={`forecast-circle-step-${activeForecastStep.hours}`}
                    center={[activeForecastStep.centroid.lat, activeForecastStep.centroid.lon]}
                    radius={Math.max(500, activeForecastStep.uncertainty_radius_km * 1000)}
                    pathOptions={{ color: '#e879f9', fillColor: 'transparent', fillOpacity: 0, dashArray: '4, 4', weight: 1.5 }}
                  />
                </>
              )}
            </MapContainer>

            {/* Bottom-Left Live Maritime Telemetry HUD Card */}
            {cursorState.isVisible && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '4.8rem',
                  left: '1rem',
                  zIndex: 1000,
                  margin: 0,
                  transform: 'none',
                  pointerEvents: 'none',
                  boxSizing: 'border-box',
                  transition: 'opacity 0.2s ease-in-out',
                }}
              >
                <SpillTooltipCard
                  mode={cursorState.isHoveringSpill ? 'spill' : 'inspector'}
                  title={cursorState.isHoveringSpill ? 'Active Spill Target (+0h)' : 'Live Maritime Telemetry'}
                  lat={cursorState.lat}
                  lon={cursorState.lon}
                  areaKm2={analysis.geometry.area_km2}
                  timestamp={analysis.timestamp ? new Date(analysis.timestamp).toUTCString().slice(5, 22) + ' UTC' : '05 Feb 2021 03:50 UTC'}
                  spillId={analysis.spill_id}
                />
              </div>
            )}

            {/* Compact Live Map Timeline Player HUD Overlay (Bottom-Right) */}
            <div
              style={{
                position: 'absolute',
                bottom: '10px',
                right: '10px',
                zIndex: 1000,
                margin: 0,
                transform: 'none',
                maxWidth: 'calc(100% - 320px)',
                boxSizing: 'border-box',
                pointerEvents: 'auto',
                background: 'rgba(6, 10, 20, 0.94)',
                border: isPlayingForecast ? '1px solid #a855f7' : '1px solid rgba(0, 242, 254, 0.4)',
                boxShadow: isPlayingForecast ? '0 0 25px rgba(168, 85, 247, 0.5)' : '0 8px 32px rgba(0,0,0,0.65)',
                borderRadius: '12px',
                padding: '0.4rem 0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                transition: 'all 0.3s ease',
              }}
            >
              {/* Play / Pause button */}
              <button
                onClick={() => setIsPlayingForecast(!isPlayingForecast)}
                title={isPlayingForecast ? 'Pause Animation' : 'Play Timeline Animation'}
                style={{
                  background: isPlayingForecast ? 'rgba(239, 68, 68, 0.35)' : 'rgba(168, 85, 247, 0.35)',
                  border: isPlayingForecast ? '2px solid #ef4444' : '2px solid #a855f7',
                  color: '#ffffff',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: isPlayingForecast ? '0 0 14px #ef4444' : '0 0 14px #a855f7',
                  flexShrink: 0,
                }}
              >
                {isPlayingForecast ? <Pause size={15} /> : <Play size={15} style={{ marginLeft: '2px' }} />}
              </button>

              {/* Stepper buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                <button
                  onClick={handleStepBackward}
                  title="Previous Milestone"
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: '#94a3b8',
                    borderRadius: '6px',
                    padding: '4px 6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <SkipBack size={12} />
                </button>
                <button
                  onClick={handleStepForward}
                  title="Next Milestone"
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: '#94a3b8',
                    borderRadius: '6px',
                    padding: '4px 6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <SkipForward size={12} />
                </button>
              </div>

              {/* Horizon Milestones Pills */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                {forecastSteps.map((step) => {
                  const isActive = selectedForecastHour === step.hours;
                  return (
                    <button
                      key={`map-hud-step-${step.hours}`}
                      onClick={() => {
                        setIsPlayingForecast(false);
                        setSelectedForecastHour(step.hours);
                      }}
                      style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: '6px',
                        border: isActive ? '2px solid #a855f7' : '1px solid rgba(255,255,255,0.1)',
                        background: isActive ? 'rgba(168, 85, 247, 0.45)' : 'rgba(0,0,0,0.4)',
                        color: isActive ? '#ffffff' : '#94a3b8',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        boxShadow: isActive ? '0 0 10px rgba(168, 85, 247, 0.5)' : 'none',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      +{step.hours}h
                    </button>
                  );
                })}
              </div>

              {/* Active Status Info */}
              <div style={{ borderLeft: '1px solid rgba(255,255,255,0.15)', paddingLeft: '8px', marginLeft: '4px', display: 'flex', flexDirection: 'column', gap: '1px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.7rem', fontWeight: 800 }}>
                  <span style={{ color: isPlayingForecast ? '#22c55e' : '#a855f7', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {isPlayingForecast ? (
                      <>
                        <span className="badge-pulse-dot" style={{ backgroundColor: '#22c55e' }}></span>
                        LIVE SIM
                      </>
                    ) : 'HORIZON'}
                  </span>
                  <span style={{ color: '#ffffff', background: 'rgba(168,85,247,0.35)', padding: '1px 5px', borderRadius: '4px' }}>
                    +{activeForecastStep.hours}h
                  </span>
                </div>
                <div style={{ fontSize: '0.62rem', color: '#94a3b8' }}>
                  {activeForecastStep.valid_time}
                </div>
              </div>

              {/* Speed Toggle */}
              <button
                onClick={() => setPlaybackSpeedMs((prev) => (prev === 1200 ? 600 : prev === 600 ? 300 : prev === 300 ? 150 : 1200))}
                title="Toggle playback speed"
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: '#38bdf8',
                  borderRadius: '6px',
                  padding: '3px 6px',
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                {playbackSpeedMs === 150 ? '8x' : playbackSpeedMs === 300 ? '4x' : playbackSpeedMs === 600 ? '2x' : '1x'}
              </button>
            </div>
          </div>
        </div>

        {/* Right Intelligence & Forecast Controls Deck */}
        {!isMapMaximized && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            overflowY: 'auto',
          }}>
          {/* Interactive Drift Physics Vector Compass Widget */}
          <div style={{
            background: 'rgba(10, 15, 29, 0.90)',
            border: '1px solid rgba(0, 242, 254, 0.35)',
            borderRadius: '10px',
            padding: '12px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.80rem', fontWeight: 800, color: '#00f2fe', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Compass size={15} />
                <span>DRIFT PHYSICS VECTOR ADDITION</span>
              </span>
              <span style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 700 }}>LAGRANGIAN ENGINE</span>
            </div>

            {/* Compass Vector Diagram */}
            <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '10px', alignItems: 'center' }}>
              {/* Polar Compass SVG */}
              <div style={{ width: '100px', height: '100px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg viewBox="0 0 100 100" width="100" height="100" style={{ overflow: 'visible' }}>
                  {/* Compass Outer Ring */}
                  <circle cx="50" cy="50" r="44" fill="rgba(6, 11, 25, 0.85)" stroke="rgba(0, 242, 254, 0.3)" strokeWidth="1.5" />
                  <circle cx="50" cy="50" r="28" fill="none" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="1" strokeDasharray="2, 2" />
                  <circle cx="50" cy="50" r="14" fill="none" stroke="rgba(255, 255, 255, 0.06)" strokeWidth="1" />
                  
                  {/* Cardinal Compass Labels */}
                  <text x="50" y="12" textAnchor="middle" fill="#f87171" fontSize="7" fontWeight="bold">N</text>
                  <text x="90" y="52.5" textAnchor="middle" fill="#94a3b8" fontSize="6.5" fontWeight="bold">E</text>
                  <text x="50" y="93" textAnchor="middle" fill="#94a3b8" fontSize="6.5" fontWeight="bold">S</text>
                  <text x="10" y="52.5" textAnchor="middle" fill="#94a3b8" fontSize="6.5" fontWeight="bold">W</text>

                  {/* Wind Vector (Blue) */}
                  <line x1="50" y1="50" x2={windTipX} y2={windTipY} stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />
                  <circle cx={windTipX} cy={windTipY} r="2.5" fill="#38bdf8" />

                  {/* Current Vector (Green) */}
                  <line x1="50" y1="50" x2={curTipX} y2={curTipY} stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" />
                  <circle cx={curTipX} cy={curTipY} r="2.5" fill="#22c55e" />

                  {/* Resultant Net Drift Vector (Neon Cyan Glowing) */}
                  <line x1="50" y1="50" x2={netTipX} y2={netTipY} stroke="#00f2fe" strokeWidth="3" strokeLinecap="round" strokeDasharray="3, 1" />
                  <circle cx={netTipX} cy={netTipY} r="3.5" fill="#00f2fe" stroke="#ffffff" strokeWidth="1" />

                  {/* Center origin dot */}
                  <circle cx="50" cy="50" r="2.5" fill="#ffffff" />
                </svg>
              </div>

              {/* Vector Stats & Equations */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.70rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(56, 189, 248, 0.1)', padding: '3px 6px', borderRadius: '4px', borderLeft: '2px solid #38bdf8' }}>
                  <span style={{ color: '#38bdf8', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Wind size={12} /> Wind (3% Leeway):
                  </span>
                  <span style={{ color: '#f1f5f9', fontWeight: 800 }}>{(analysis.movement.wind.speed_mps * 0.03).toFixed(2)} m/s @ {analysis.movement.wind.direction_deg}°</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(34, 197, 94, 0.1)', padding: '3px 6px', borderRadius: '4px', borderLeft: '2px solid #22c55e' }}>
                  <span style={{ color: '#22c55e', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Waves size={12} /> Current Advection:
                  </span>
                  <span style={{ color: '#f1f5f9', fontWeight: 800 }}>{analysis.movement.current.speed_mps} m/s @ {analysis.movement.current.direction_deg}°</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0, 242, 254, 0.15)', padding: '3px 6px', borderRadius: '4px', borderLeft: '2px solid #00f2fe' }}>
                  <span style={{ color: '#00f2fe', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Compass size={12} /> Resultant Net Drift:
                  </span>
                  <span style={{ color: '#00f2fe', fontWeight: 800 }}>{analysis.movement.speed_mps} m/s @ {analysis.movement.direction_deg}°</span>
                </div>
              </div>
            </div>
          </div>

          {/* Forecast Horizon Timeline Controller */}
          <div style={{
            background: 'rgba(10, 15, 29, 0.85)',
            border: '1px solid rgba(0, 242, 254, 0.3)',
            borderRadius: '10px',
            padding: '12px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.80rem', fontWeight: 800, color: '#a855f7', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <TrendingUp size={15} />
                <span>PREDICTIVE FORECAST TIMELINE</span>
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <button
                  onClick={() => setIsPlayingForecast(!isPlayingForecast)}
                  style={{
                    background: isPlayingForecast ? 'rgba(239, 68, 68, 0.25)' : 'rgba(168, 85, 247, 0.25)',
                    border: isPlayingForecast ? '1px solid #ef4444' : '1px solid #a855f7',
                    color: isPlayingForecast ? '#ef4444' : '#a855f7',
                    borderRadius: '4px',
                    padding: '3px 8px',
                    fontSize: '0.70rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  {isPlayingForecast ? <Pause size={11} /> : <Play size={11} />}
                  <span>{isPlayingForecast ? 'Pause' : 'Play'}</span>
                </button>
              </div>
            </div>

            {/* Stepper buttons & Milestone Pills */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px' }}>
              <button
                onClick={handleStepBackward}
                title="Previous forecast milestone"
                style={{
                  background: 'rgba(0,0,0,0.4)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#94a3b8',
                  borderRadius: '4px',
                  padding: '5px 4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <SkipBack size={11} />
              </button>

              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${forecastSteps.length}, 1fr)`, gap: '3px', flex: 1 }}>
                {forecastSteps.map((step) => {
                  const isActive = selectedForecastHour === step.hours;
                  return (
                    <button
                      key={step.hours}
                      onClick={() => {
                        setIsPlayingForecast(false);
                        setSelectedForecastHour(step.hours);
                      }}
                      style={{
                        padding: '5px 2px',
                        borderRadius: '5px',
                        border: isActive ? '1px solid #a855f7' : '1px solid rgba(255,255,255,0.08)',
                        background: isActive ? 'rgba(168, 85, 247, 0.35)' : 'rgba(0,0,0,0.3)',
                        color: isActive ? '#fff' : '#94a3b8',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      +{step.hours}h
                    </button>
                  );
                })}
              </div>

              <button
                onClick={handleStepForward}
                title="Next forecast milestone"
                style={{
                  background: 'rgba(0,0,0,0.4)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#94a3b8',
                  borderRadius: '4px',
                  padding: '5px 4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <SkipForward size={11} />
              </button>
            </div>

            {/* Selected Horizon Status */}
            <div style={{ background: 'rgba(0,0,0,0.4)', padding: '8px 10px', borderRadius: '6px', fontSize: '0.72rem', display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Forecast Horizon:</span>
                <span style={{ color: '#a855f7', fontWeight: 800 }}>+{activeForecastStep.hours} Hours</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Valid Time:</span>
                <span style={{ color: '#f1f5f9' }}>{activeForecastStep.valid_time}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Predicted Centroid:</span>
                <span style={{ color: '#f1f5f9' }}>{formatLatLon(activeForecastStep.centroid.lat, activeForecastStep.centroid.lon)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Uncertainty Radius:</span>
                <span style={{ color: '#ec4899', fontWeight: 700 }}>±{activeForecastStep.uncertainty_radius_km} km</span>
              </div>
            </div>
          </div>

          {/* Environmental Hydrodynamic Forcing Card */}
          <div style={{
            background: 'rgba(10, 15, 29, 0.85)',
            border: '1px solid rgba(0, 242, 254, 0.25)',
            borderRadius: '10px',
            padding: '12px',
          }}>
            <div style={{ fontSize: '0.80rem', fontWeight: 800, color: '#38bdf8', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Wind size={15} />
              <span>HYDRODYNAMIC FORCING VECTORS</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '6px 8px', borderRadius: '6px' }}>
                <div style={{ fontSize: '0.65rem', color: '#64748b' }}>WIND VELOCITY</div>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#38bdf8' }}>
                  {analysis.movement.wind.speed_mps} m/s ({analysis.movement.wind.cardinal})
                </div>
                <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>{analysis.movement.wind.direction_deg}° • 3% Leeway</div>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '6px 8px', borderRadius: '6px' }}>
                <div style={{ fontSize: '0.65rem', color: '#64748b' }}>OCEAN CURRENT</div>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#22c55e' }}>
                  {analysis.movement.current.speed_mps} m/s ({analysis.movement.current.cardinal})
                </div>
                <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>{analysis.movement.current.direction_deg}° • Advection</div>
              </div>
            </div>
          </div>

          {/* Spreading Observation Series Card */}
          <div style={{
            background: 'rgba(10, 15, 29, 0.85)',
            border: '1px solid rgba(0, 242, 254, 0.25)',
            borderRadius: '10px',
            padding: '12px',
          }}>
            <div style={{ fontSize: '0.80rem', fontWeight: 800, color: '#f97316', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <History size={15} />
              <span>MULTI-TEMPORAL OBSERVATION SERIES</span>
            </div>

            {analysis.spreading.observations?.map((obs, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', padding: '3px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ color: '#94a3b8' }}>Pass #{idx + 1} ({obs.timestamp.split('T')[0]}):</span>
                <span style={{ color: '#f1f5f9', fontWeight: 700 }}>{obs.area_km2} km²</span>
              </div>
            ))}
          </div>

        </div>
        )}

      </div>
    </div>
  );
};
