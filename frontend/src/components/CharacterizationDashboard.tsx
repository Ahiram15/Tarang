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
} from 'lucide-react';

interface CharacterizationDashboardProps {
  analysis: SpillAnalysis;
  onBackToLab: () => void;
  onBackToGlobe: () => void;
  onOpenInvestigation?: () => void;
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
}> = ({ bounds, activeLat, activeLon, isPlaying, focusTrigger }) => {
  const map = useMap();
  const hasInitialFit = useRef(false);

  // Initial auto-zoom and explicit focus on the spill boundary
  useEffect(() => {
    if (bounds.length > 0 && (!hasInitialFit.current || focusTrigger > 0)) {
      const b = L.latLngBounds(bounds);
      map.fitBounds(b, { padding: [50, 50], maxZoom: 16, animate: true });
      hasInitialFit.current = true;
    }
  }, [focusTrigger, map]);

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

  // Basemap and Display Toggles
  const [basemapType, setBasemapType] = useState<'satellite' | 'ocean' | 'positron' | 'dark'>('satellite');
  const [showWindWaves, setShowWindWaves] = useState<boolean>(false);
  const [focusTrigger, setFocusTrigger] = useState<number>(0);

  // Layer toggles
  const [showSpillPolygon, setShowSpillPolygon] = useState<boolean>(true);
  const [showDriftArrow, setShowDriftArrow] = useState<boolean>(false);
  const [showHindcast, setShowHindcast] = useState<boolean>(false);
  const [showForecast, setShowForecast] = useState<boolean>(false);
  const [showUncertaintyCone, setShowUncertaintyCone] = useState<boolean>(false);
  const [showFlowlines, setShowFlowlines] = useState<boolean>(false);

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

  // Generate ocean swell wave crests traveling directly along the drift trajectory
  const trajectoryWaveData = useMemo(() => {
    // Build full trajectory polyline vertices: T0 -> forecast milestones
    const points: [number, number][] = [
      [centroid.lat, centroid.lon],
      ...forecastSteps.map((s) => [s.centroid.lat, s.centroid.lon] as [number, number]),
    ];

    if (points.length < 2) return [];

    const waves: { lat: number; lon: number; angleDeg: number; delay: number; scale: number }[] = [];
    let cumulativeDelay = 0;

    for (let i = 0; i < points.length - 1; i++) {
      const [lat1, lon1] = points[i];
      const [lat2, lon2] = points[i + 1];

      const dLat = lat2 - lat1;
      const dLon = lon2 - lon1;
      const segDist = Math.sqrt(dLat * dLat + dLon * dLon);
      if (segDist < 0.0001) continue;

      // Screen angle pointing from (lat1, lon1) to (lat2, lon2)
      // Screen X: lon, Screen Y: -lat
      const screenAngleDeg = (Math.atan2(lat1 - lat2, lon2 - lon1) * 180) / Math.PI;

      // Perpendicular unit vector for lateral wave crest spread
      const perpLat = -dLon / segDist;
      const perpLon = dLat / segDist;

      // Number of wave pulses along this segment
      const numSteps = Math.max(2, Math.min(4, Math.round(segDist / 0.006)));

      for (let s = 1; s <= numSteps; s++) {
        const t = (s - 0.5) / numSteps;
        const centerLat = lat1 + t * dLat;
        const centerLon = lon1 + t * dLon;

        // Primary wave right on the center spine of the trajectory
        waves.push({
          lat: centerLat,
          lon: centerLon,
          angleDeg: screenAngleDeg,
          delay: cumulativeDelay % 2.2,
          scale: 1.0,
        });

        // Flanking wave crest on left flank (~120m)
        waves.push({
          lat: centerLat + perpLat * 0.0018,
          lon: centerLon + perpLon * 0.0018,
          angleDeg: screenAngleDeg,
          delay: (cumulativeDelay + 0.3) % 2.2,
          scale: 0.82,
        });

        // Flanking wave crest on right flank (~120m)
        waves.push({
          lat: centerLat - perpLat * 0.0018,
          lon: centerLon - perpLon * 0.0018,
          angleDeg: screenAngleDeg,
          delay: (cumulativeDelay + 0.3) % 2.2,
          scale: 0.82,
        });

        cumulativeDelay += 0.45;
      }
    }

    return waves;
  }, [centroid, forecastSteps]);

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

  // Hindcast origin coordinates
  const hindcastOrigin = analysis.hindcast.origin;

  const createObservedPinIcon = () =>
    L.divIcon({
      className: 'custom-observed-pin-icon',
      html: `
        <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
          <div style="position: absolute; width: 30px; height: 30px; border-radius: 50%; background: rgba(239, 68, 68, 0.25); border: 1.5px solid #ef4444;"></div>
          <div style="width: 22px; height: 22px; border-radius: 50%; background: linear-gradient(135deg, #ef4444, #dc2626); border: 2px solid #ffffff; box-shadow: 0 0 14px rgba(239, 68, 68, 0.8); display: flex; align-items: center; justify-content: center; color: #fff; font-size: 11px; font-weight: 800; z-index: 10;">
            📍
          </div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });


  const createOriginReticleIcon = () =>
    L.divIcon({
      className: 'custom-origin-reticle-icon',
      html: `
        <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
          <div style="position: absolute; width: 34px; height: 34px; border-radius: 50%; border: 1.5px dashed #f59e0b; opacity: 0.85;"></div>
          <div style="position: absolute; width: 22px; height: 22px; border-radius: 50%; border: 2px solid #f59e0b; background: rgba(245, 158, 11, 0.28);"></div>
          <div style="position: absolute; width: 2px; height: 30px; background: #f59e0b;"></div>
          <div style="position: absolute; width: 30px; height: 2px; background: #f59e0b;"></div>
          <div style="width: 8px; height: 8px; border-radius: 50%; background: #ffffff; box-shadow: 0 0 10px #f59e0b; z-index: 10;"></div>
        </div>
      `,
      iconSize: [34, 34],
      iconAnchor: [17, 17],
    });

  const createWindWaveIcon = (angleDeg: number, delay: number, scale: number = 1.0) =>
    L.divIcon({
      className: 'custom-wind-wave-icon',
      html: `
        <div style="
          width: 44px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          transform: rotate(${angleDeg}deg) scale(${scale});
          pointer-events: none;
        ">
          <div class="trajectory-wave-crest" style="
            animation-delay: -${delay.toFixed(2)}s;
            width: 40px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <svg viewBox="0 0 40 24" width="40" height="24" fill="none" style="overflow: visible;">
              <!-- Primary Leading Wave Crest (concave curve surging forward in trajectory heading) -->
              <path d="M 25,2 Q 37,12 25,22" stroke="#38bdf8" stroke-width="2.2" stroke-linecap="round" opacity="0.95" />
              <!-- Secondary Trailing Swell Ripple -->
              <path d="M 17,5 Q 27,12 17,19" stroke="#00f2fe" stroke-width="1.6" stroke-linecap="round" opacity="0.7" />
              <!-- Third Soft Wake Ripple -->
              <path d="M 9,8 Q 17,12 9,16" stroke="#7dd3fc" stroke-width="1.1" stroke-linecap="round" opacity="0.45" />
            </svg>
          </div>
        </div>
      `,
      iconSize: [44, 28],
      iconAnchor: [22, 14],
    });

  const createMilestoneIcon = (hours: number, isSelected: boolean) =>
    L.divIcon({
      className: 'custom-milestone-icon',
      html: `
        <div style="position: relative; width: ${isSelected ? 36 : 24}px; height: ${isSelected ? 36 : 24}px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
          ${isSelected ? `
            <div style="position: absolute; top: 50%; left: 50%; width: 36px; height: 36px; border-radius: 50%; border: 2px solid #a855f7; transform: translate(-50%, -50%); animation: sonarPulse 1.6s infinite cubic-bezier(0.2, 0.6, 0.3, 1);"></div>
          ` : ''}
          <div style="
            background: ${isSelected ? '#a855f7' : 'rgba(15, 23, 42, 0.88)'};
            color: ${isSelected ? '#ffffff' : '#c084fc'};
            border: ${isSelected ? '2px solid #ffffff' : '1px solid #a855f7'};
            border-radius: 50%;
            width: ${isSelected ? 22 : 18}px;
            height: ${isSelected ? 22 : 18}px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: ${isSelected ? '9px' : '8px'};
            font-weight: 900;
            box-shadow: ${isSelected ? '0 0 14px #a855f7' : '0 0 6px rgba(168,85,247,0.4)'};
            transition: all 0.25s ease;
          ">
            +${hours}h
          </div>
        </div>
      `,
      iconSize: [isSelected ? 36 : 24, isSelected ? 36 : 24],
      iconAnchor: [isSelected ? 18 : 12, isSelected ? 18 : 12],
    });

  const createAnimatedForecastIcon = (hours: number) =>
    L.divIcon({
      className: 'custom-forecast-active-beacon',
      html: `
        <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; width: 44px; height: 44px; border-radius: 50%; background: rgba(168, 85, 247, 0.45); animation: sonarPulse 1.4s infinite cubic-bezier(0.2, 0.6, 0.3, 1);"></div>
          <div style="position: absolute; width: 28px; height: 28px; border-radius: 50%; border: 2px solid #ec4899; background: rgba(236, 72, 153, 0.35); animation: forecastPulse 2s infinite ease-in-out;"></div>
          <div style="background: linear-gradient(135deg, #a855f7 0%, #ec4899 100%); width: 20px; height: 20px; border-radius: 50%; border: 2.5px solid #ffffff; box-shadow: 0 0 18px #ec4899, 0 0 8px #a855f7; display: flex; align-items: center; justify-content: center; color: white; font-size: 8.5px; font-weight: 900; z-index: 10;">
            +${hours}
          </div>
        </div>
      `,
      iconSize: [44, 44],
      iconAnchor: [22, 22],
    });


  // Net Drift Vector Arrowhead Beacon
  const createDriftArrowheadIcon = (angleDeg: number) =>
    L.divIcon({
      className: 'custom-drift-arrowhead-icon',
      html: `
        <div style="
          width: 30px; 
          height: 30px; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          transform: rotate(${angleDeg}deg);
          pointer-events: none;
        ">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="#22c55e" style="filter: drop-shadow(0 0 6px rgba(34,197,94,0.9));">
            <polygon points="12,2 22,20 12,15 2,20" />
          </svg>
        </div>
      `,
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    });

  // Sensitive Marine Nature Reserve Marker
  const createReserveIcon = () =>
    L.divIcon({
      className: 'custom-reserve-icon',
      html: `
        <div style="display: flex; align-items: center; gap: 4px; background: rgba(15,23,42,0.88); border: 1px solid #10b981; border-radius: 12px; padding: 2px 8px; font-size: 10px; font-weight: 700; color: #34d399; box-shadow: 0 0 8px rgba(16,185,129,0.4); white-space: nowrap;">
          <span>🏝️</span>
          <span>Ile aux Aigrettes</span>
        </div>
      `,
      iconSize: [110, 24],
      iconAnchor: [55, 12],
    });

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
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#00f2fe', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                🔬 OIL SPILL CHARACTERIZATION & MOVEMENT ENGINE
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
              onClick={onOpenInvestigation}
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
              <span>⚓ Vessel Investigation & Alerts →</span>
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
                onClick={onOpenInvestigation}
                style={{ fontSize: '0.65rem', color: '#eab308', fontWeight: 800, cursor: 'pointer', textDecoration: 'underline' }}
              >
                Vessel AIS →
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', margin: '1px 0' }}>
            <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#eab308' }}>
              {hindcastOrigin.lat.toFixed(3)}°S, {hindcastOrigin.lon.toFixed(3)}°E
            </span>
          </div>
          <span style={{ fontSize: '0.66rem', color: '#94a3b8' }}>Uncertainty: <b>±{analysis.hindcast.uncertainty_radius_km} km</b></span>
        </div>
      </div>

      {/* Main Grid: Interactive Geospatial Map (70%) vs Intelligence Controls Deck (30%) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.6fr', gap: '16px', flex: 1, minHeight: 0 }}>
        
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
          {/* View Mode & Camera Toolbar (Top-Left HUD) */}
          <div style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap',
          }}>
            {/* View Mode Segmented Controller */}
            <div style={{
              background: 'rgba(6, 10, 20, 0.92)',
              border: '1px solid rgba(0, 242, 254, 0.35)',
              borderRadius: '8px',
              padding: '3px',
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
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
                  padding: '5px 10px',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                🌐 Mission Overview
              </button>
              <button
                onClick={() => setViewMode('hindcast')}
                style={{
                  background: viewMode === 'hindcast' ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : 'transparent',
                  color: viewMode === 'hindcast' ? '#030712' : '#94a3b8',
                  border: 'none',
                  borderRadius: '5px',
                  padding: '5px 10px',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                ⏪ Hindcast (-48h)
              </button>
              <button
                onClick={() => setViewMode('forecast')}
                style={{
                  background: viewMode === 'forecast' ? 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)' : 'transparent',
                  color: viewMode === 'forecast' ? '#ffffff' : '#94a3b8',
                  border: 'none',
                  borderRadius: '5px',
                  padding: '5px 10px',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                ⏩ Forecast (+72h)
              </button>
            </div>

            {/* Quick Action: Focus Camera Directly on Spill */}
            <button
              onClick={() => setFocusTrigger((prev) => prev + 1)}
              className="map-hud-btn"
              title="Auto-center and zoom camera directly onto the oil spill boundary"
              style={{
                background: 'rgba(6, 10, 20, 0.92)',
                border: '1px solid #00f2fe',
                color: '#00f2fe',
                padding: '6px 12px',
                borderRadius: '8px',
                boxShadow: '0 0 14px rgba(0, 242, 254, 0.35)',
              }}
            >
              <Crosshair size={14} />
              <span>🎯 Focus Spill (Zoom 100%)</span>
            </button>

            {/* Basemap Toggle */}
            <button
              onClick={() => {
                const nextBasemap = 
                  basemapType === 'satellite' ? 'ocean' :
                  basemapType === 'ocean' ? 'positron' :
                  basemapType === 'positron' ? 'dark' : 'satellite';
                setBasemapType(nextBasemap);
              }}
              className="map-hud-btn"
              title="Cycle basemaps (Satellite, Ocean Blue, Positron Light, Dark Canvas)"
              style={{
                background: 'rgba(6, 10, 20, 0.92)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: '#f1f5f9',
                padding: '6px 10px',
                borderRadius: '8px',
              }}
            >
              {basemapType === 'satellite' && '🛰️ Satellite Map'}
              {basemapType === 'ocean' && '🌊 Ocean Blue'}
              {basemapType === 'positron' && '☀️ Positron Light'}
              {basemapType === 'dark' && '🌑 Dark Canvas'}
            </button>

            {/* Wind Waves Animation Toggle */}
            <button
              onClick={() => setShowWindWaves(!showWindWaves)}
              className="map-hud-btn"
              title="Toggle animated ocean wind waves"
              style={{
                background: showWindWaves ? 'rgba(56, 189, 248, 0.2)' : 'rgba(6, 10, 20, 0.92)',
                border: showWindWaves ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.2)',
                color: showWindWaves ? '#38bdf8' : '#94a3b8',
                padding: '6px 10px',
                borderRadius: '8px',
              }}
            >
              <Waves size={14} />
              <span>🌊 Wind Waves: {showWindWaves ? 'ON' : 'OFF'}</span>
            </button>
          </div>

          {/* Map Layer Toolbar (Top-Right HUD) */}
          <div style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            zIndex: 1000,
            background: 'rgba(6, 10, 20, 0.92)',
            border: '1px solid rgba(0, 242, 254, 0.3)',
            borderRadius: '8px',
            padding: '10px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            fontSize: '0.74rem',
            backdropFilter: 'blur(10px)',
          }}>
            <div style={{ fontWeight: 800, color: '#00f2fe', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Layers size={14} />
              <span>MAP LAYERS</span>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <input type="checkbox" checked={showSpillPolygon} onChange={(e) => setShowSpillPolygon(e.target.checked)} />
              <span style={{ color: '#ef4444' }}>🔴 Drifting Spill Boundary</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <input type="checkbox" checked={showDriftArrow} onChange={(e) => setShowDriftArrow(e.target.checked)} />
              <span style={{ color: '#22c55e' }}>🧭 Movement Drift Vector</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <input type="checkbox" checked={showWindWaves} onChange={(e) => setShowWindWaves(e.target.checked)} />
              <span style={{ color: '#38bdf8' }}>🌊 Animated Wind Waves</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <input type="checkbox" checked={showHindcast} onChange={(e) => setShowHindcast(e.target.checked)} />
              <span style={{ color: '#eab308' }}>⏪ Hindcast Origin Reticle</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <input type="checkbox" checked={showForecast} onChange={(e) => setShowForecast(e.target.checked)} />
              <span style={{ color: '#a855f7' }}>⏩ Forecast Drift & Milestones</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <input type="checkbox" checked={showUncertaintyCone} onChange={(e) => setShowUncertaintyCone(e.target.checked)} />
              <span style={{ color: '#ec4899' }}>📐 NOAA Uncertainty Cone</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', borderTop: '1px solid rgba(255,255,255,0.12)', paddingTop: '5px', marginTop: '2px' }}>
              <input type="checkbox" checked={showFlowlines} onChange={(e) => setShowFlowlines(e.target.checked)} />
              <span style={{ color: '#94a3b8' }}>🌊 Streamlines (40 paths)</span>
            </label>
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
                bounds={allPolyPoints}
                activeLat={activeForecastStep.centroid.lat}
                activeLon={activeForecastStep.centroid.lon}
                isPlaying={isPlayingForecast}
                focusTrigger={focusTrigger}
              />

              {/* Dynamic Basemap Layer: maxNativeZoom={13} ensures ocean tile requests cap out at zoom 13 and scale smoothly without "Map data not yet available" watermarks */}
              {basemapType === 'satellite' && (
                <TileLayer
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                  attribution='&copy; <a href="https://www.esri.com/">Esri</a>, Earthstar Geographics'
                  maxZoom={20}
                  maxNativeZoom={13}
                />
              )}
              {basemapType === 'ocean' && (
                <TileLayer
                  url="https://services.arcgisonline.com/arcgis/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}"
                  attribution='&copy; <a href="https://www.esri.com/">Esri</a>, GEBCO, NOAA'
                  maxZoom={20}
                  maxNativeZoom={13}
                />
              )}
              {basemapType === 'positron' && (
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}{r}.png"
                  attribution='&copy; <a href="https://carto.com/">CARTO</a>, &copy; OpenStreetMap'
                  maxZoom={20}
                  maxNativeZoom={13}
                />
              )}
              {basemapType === 'dark' && (
                <TileLayer
                  url="https://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
                  attribution='&copy; <a href="https://www.esri.com/">Esri</a>, DeLorme, NAVTEQ'
                  maxZoom={20}
                  maxNativeZoom={13}
                />
              )}

              {/* 🌊 Ocean Wind & Swell Waves Flowing Directly Along the Drift Trajectory */}
              {showWindWaves && (
                <>
                  {/* Subtle Advection Flow Guideline along Trajectory */}
                  {forecastSteps.length >= 2 && (
                    <Polyline
                      positions={[
                        [centroid.lat, centroid.lon],
                        ...forecastSteps.map((s) => [s.centroid.lat, s.centroid.lon] as [number, number]),
                      ]}
                      pathOptions={{
                        color: '#38bdf8',
                        weight: 2,
                        dashArray: '4, 8',
                        opacity: 0.5,
                      }}
                    />
                  )}

                  {/* Trajectory Wave Crests Rolling in Direction of Drift */}
                  {trajectoryWaveData.map((wave, idx) => (
                    <Marker
                      key={`traj-wave-${idx}`}
                      position={[wave.lat, wave.lon]}
                      icon={createWindWaveIcon(wave.angleDeg, wave.delay, wave.scale)}
                      interactive={false}
                    />
                  ))}
                </>
              )}

              {/* 1. Current Observed Spill Boundary (T+0h Reference) & Pin Marker */}
              {showSpillPolygon && (
                <>
                  <Polygon
                    positions={currentPolyPositions}
                    pathOptions={{
                      color: '#ef4444',
                      fillColor: '#ef4444',
                      fillOpacity: activeForecastStep.hours > 0 ? 0.10 : 0.22,
                      weight: activeForecastStep.hours > 0 ? 3.0 : 4.0,
                      opacity: 1.0,
                    }}
                    eventHandlers={{
                      mouseover: () => setCursorState((prev) => ({ ...prev, isHoveringSpill: true })),
                      mouseout: () => setCursorState((prev) => ({ ...prev, isHoveringSpill: false })),
                    }}
                  >
                    <Popup>
                      <div style={{ color: '#0f172a', fontSize: '11px', lineHeight: 1.4 }}>
                        <b style={{ color: '#dc2626' }}>🚨 Observed Oil Spill Slick Boundary</b><br />
                        <b>Surface Area:</b> {analysis.geometry.area_km2} km²<br />
                        <b>Perimeter:</b> {analysis.geometry.perimeter_km} km<br />
                        <b>Centroid:</b> {formatLatLon(centroid.lat, centroid.lon)}<br />
                        <b>Zone:</b> {analysis.spill_id === 'emerald' || centroid.lat > 0 ? 'Eastern Mediterranean Sea (Levantine Basin)' : "Grand Port Lagoon (Between Barrier Reef & Pointe d'Esny Coastline)"}
                      </div>
                    </Popup>
                  </Polygon>

                  {/* 📍 Observed Incident Pin Marker at Centroid */}
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

              {/* 🛢️ Active Moving Slick with Advection Ribbon (T+th) */}
              {showSpillPolygon && activeForecastStep.hours > 0 && (
                <>
                  {/* Dynamic Motion Ribbon connecting T0 to Active Centroid */}
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

                  {/* Active Drifting Slick Boundary */}
                  <Polygon
                    positions={driftingSlickPositions}
                    pathOptions={{
                      color: '#f43f5e',
                      fillColor: '#f43f5e',
                      fillOpacity: 0.18,
                      weight: 4.0,
                      className: 'slick-drifting-boundary',
                    }}
                  >
                    <Tooltip permanent direction="top" offset={[0, -10]}>
                      🚨 Active Moving Slick (+{activeForecastStep.hours}h)
                    </Tooltip>
                    <Popup>
                      <b>🚨 Predicted Moving Slick (+{activeForecastStep.hours}h)</b><br />
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

                  {/* Directional Arrowhead / Waterline Intercept Beacon */}
                  {driftCoords.length >= 2 && (
                    <Marker
                      position={driftCoords[1]}
                      icon={createDriftArrowheadIcon(analysis.movement.direction_deg)}
                    >
                      <Tooltip permanent={false} direction="top">
                        <b>🧭 Shoreline Contact Point</b><br />
                        Heading: {analysis.movement.direction} ({analysis.movement.direction_deg}°)<br />
                        {analysis.spill_id === 'emerald' || centroid.lat > 0 ? 'Levantine Coastal Intercept' : "Lagoon Water Edge (Pointe d'Esny)"}
                      </Tooltip>
                      <Popup>
                        <div style={{ color: '#0f172a', fontSize: '11px', lineHeight: 1.4 }}>
                          <b style={{ color: '#16a34a' }}>🧭 Net Drift Vector Terminal</b><br />
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

              {/* 🏝️ Sensitive Nature Reserves */}
              {(analysis.spill_id === 'wakashio' || centroid.lat < 0) && (
                <Marker
                  position={[-20.4202, 57.7303]}
                  icon={createReserveIcon()}
                >
                  <Tooltip direction="top" offset={[0, -12]}>
                    <b>🏝️ Ile aux Aigrettes Nature Reserve</b><br />
                    Endangered endemic fauna & coastal mangrove sanctuary
                  </Tooltip>
                  <Popup>
                    <div style={{ color: '#0f172a', fontSize: '11px', lineHeight: 1.4 }}>
                      <b style={{ color: '#059669' }}>🏝️ Ile aux Aigrettes Nature Reserve</b><br />
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
                    <b>🏝️ Rosh HaNikra & Achziv Marine Reserves</b><br />
                    Protected Mediterranean marine canyon & turtle nesting sanctuary
                  </Tooltip>
                  <Popup>
                    <div style={{ color: '#0f172a', fontSize: '11px', lineHeight: 1.4 }}>
                      <b style={{ color: '#059669' }}>🏝️ Mediterranean Coastal Sanctuaries</b><br />
                      <b>Ecological Status:</b> High-Priority Marine Protected Area<br />
                      <b>Key Risk:</b> Heavy crude slick shoreline washup along coastal belt
                    </div>
                  </Popup>
                </Marker>
              )}

              {/* 3. Backward Hindcast (Probable Origin -48h) */}
              {showHindcast && viewMode !== 'forecast' && (
                <>
                  {/* Backward Central Drift Spine */}
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

                  {/* Optional Delicate Streamline Fibers */}
                  {showFlowlines && analysis.hindcast.trajectories.map((traj, idx) => (
                    <Polyline
                      key={`hind-traj-${idx}`}
                      positions={traj.map((pt) => [pt[1], pt[0]])}
                      pathOptions={{ color: '#f59e0b', weight: 1.2, opacity: 0.22, dashArray: '4, 4' }}
                    />
                  ))}

                  {/* Precision Reticle Marker at Probable Origin */}
                  <Marker position={[hindcastOrigin.lat, hindcastOrigin.lon]} icon={createOriginReticleIcon()}>
                    <Tooltip direction="top" offset={[0, -18]}>
                      <b>🎯 Grounding / Origin Zone (-48h)</b><br />
                      {analysis.hindcast.origin_time_window.estimated_origin_time}
                    </Tooltip>
                    <Popup>
                      <b>🎯 Reconstructed Probable Origin (-48h)</b><br />
                      Estimated Event: {analysis.hindcast.origin_time_window.estimated_origin_time}<br />
                      Coordinates: {formatLatLon(hindcastOrigin.lat, hindcastOrigin.lon)}<br />
                      Uncertainty: ±{analysis.hindcast.uncertainty_radius_km} km<br />
                      Confidence: {Math.round(analysis.hindcast.confidence * 100)}%
                    </Popup>
                  </Marker>

                  {/* 1-Sigma Inner Confidence Boundary (68% CI) */}
                  <Circle
                    center={[hindcastOrigin.lat, hindcastOrigin.lon]}
                    radius={Math.max(400, (analysis.hindcast.uncertainty_radius_km * 0.6) * 1000)}
                    pathOptions={{ color: '#f59e0b', fillColor: 'transparent', fillOpacity: 0, weight: 1.5, dashArray: '4, 4' }}
                  />

                  {/* 2-Sigma Outer Confidence Boundary (95% CI) */}
                  <Circle
                    center={[hindcastOrigin.lat, hindcastOrigin.lon]}
                    radius={Math.max(700, analysis.hindcast.uncertainty_radius_km * 1000)}
                    pathOptions={{ color: '#f59e0b', fillColor: 'transparent', fillOpacity: 0, dashArray: '4, 4', weight: 1 }}
                  />
                </>
              )}

              {/* 4. Expanding Uncertainty Cone (NOAA NHC style boundary) */}
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
                  {/* Connecting Central Trajectory Spine */}
                  {forecastSteps.length >= 2 && (
                    <Polyline
                      positions={[
                        [centroid.lat, centroid.lon],
                        ...forecastSteps.map((s) => [s.centroid.lat, s.centroid.lon] as [number, number]),
                      ]}
                      pathOptions={{ color: '#a855f7', weight: 3.5, dashArray: '6, 6', opacity: 0.95 }}
                    />
                  )}

                  {/* Optional Delicate Streamline Fibers */}
                  {showFlowlines && analysis.forecast.trajectories.map((traj, idx) => (
                    <Polyline
                      key={`fore-traj-${idx}`}
                      positions={traj.map((pt) => [pt[1], pt[0]])}
                      pathOptions={{ color: '#c084fc', weight: 1.2, opacity: 0.22, dashArray: '4, 4' }}
                    />
                  ))}

                  {/* Milestone Markers along the forecast path */}
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
                          <b>🎯 Predicted Horizon: +{step.hours} Hours</b><br />
                          Valid Time: {step.valid_time}<br />
                          Centroid: {formatLatLon(step.centroid.lat, step.centroid.lon)}<br />
                          Uncertainty: ±{step.uncertainty_radius_km} km<br />
                          Confidence: {Math.round(step.confidence * 100)}%
                        </Popup>
                      </Marker>
                    );
                  })}

                  {/* Active Animated Beacon Marker at Current Forecast Point */}
                  <Marker
                    key={`forecast-active-beacon-${activeForecastStep.hours}`}
                    position={[activeForecastStep.centroid.lat, activeForecastStep.centroid.lon]}
                    icon={createAnimatedForecastIcon(activeForecastStep.hours)}
                    zIndexOffset={1000}
                  />

                  {/* Active Selected Forecast Step Boundary Outline (No Covering Fill) */}
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

                  {/* Active Selected Forecast Uncertainty Area */}
                  <Circle
                    key={`forecast-circle-step-${activeForecastStep.hours}`}
                    center={[activeForecastStep.centroid.lat, activeForecastStep.centroid.lon]}
                    radius={Math.max(500, activeForecastStep.uncertainty_radius_km * 1000)}
                    pathOptions={{ color: '#e879f9', fillColor: 'transparent', fillOpacity: 0, dashArray: '4, 4', weight: 1.5 }}
                  />
                </>
              )}
            </MapContainer>

            {/* Dynamic Mouse Cursor Tracking Card Overlay */}
            {cursorState.isVisible && (
              <div
                style={{
                  position: 'absolute',
                  left: `${Math.min(cursorState.x + 18, (mapContainerRef.current?.clientWidth || 800) - 320)}px`,
                  top: `${Math.max(12, Math.min(cursorState.y - 10, (mapContainerRef.current?.clientHeight || 600) - 210))}px`,
                  pointerEvents: 'none',
                  zIndex: 1000,
                  transition: 'left 0.03s ease-out, top 0.03s ease-out',
                }}
              >
                <SpillTooltipCard
                  mode={cursorState.isHoveringSpill ? 'spill' : 'inspector'}
                  lat={cursorState.lat}
                  lon={cursorState.lon}
                  areaKm2={analysis.geometry.area_km2}
                  timestamp={analysis.timestamp ? new Date(analysis.timestamp).toUTCString().slice(5, 22) + ' UTC' : '05 Feb 2021 03:50 UTC'}
                  spillId={analysis.spill_id}
                />
              </div>
            )}
          </div>

          {/* Floating Live Map Timeline Player HUD Overlay */}
          <div style={{
            position: 'absolute',
            bottom: '16px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            background: 'rgba(6, 10, 20, 0.94)',
            border: isPlayingForecast ? '1px solid #a855f7' : '1px solid rgba(0, 242, 254, 0.4)',
            boxShadow: isPlayingForecast ? '0 0 25px rgba(168, 85, 247, 0.5)' : '0 8px 32px rgba(0,0,0,0.65)',
            borderRadius: '12px',
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            backdropFilter: 'blur(12px)',
            maxWidth: '92%',
            transition: 'all 0.3s ease',
          }}>
            {/* Play / Pause button */}
            <button
              onClick={() => setIsPlayingForecast(!isPlayingForecast)}
              title={isPlayingForecast ? 'Pause Animation' : 'Play Timeline Animation'}
              style={{
                background: isPlayingForecast ? 'rgba(239, 68, 68, 0.35)' : 'rgba(168, 85, 247, 0.35)',
                border: isPlayingForecast ? '2px solid #ef4444' : '2px solid #a855f7',
                color: '#ffffff',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: isPlayingForecast ? '0 0 14px #ef4444' : '0 0 14px #a855f7',
                flexShrink: 0,
              }}
            >
              {isPlayingForecast ? <Pause size={17} /> : <Play size={17} style={{ marginLeft: '2px' }} />}
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
                  padding: '5px 7px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <SkipBack size={13} />
              </button>
              <button
                onClick={handleStepForward}
                title="Next Milestone"
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#94a3b8',
                  borderRadius: '6px',
                  padding: '5px 7px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <SkipForward size={13} />
              </button>
            </div>

            {/* Horizon Milestones Pills */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
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
                      padding: '4px 8px',
                      borderRadius: '6px',
                      border: isActive ? '2px solid #a855f7' : '1px solid rgba(255,255,255,0.1)',
                      background: isActive ? 'rgba(168, 85, 247, 0.45)' : 'rgba(0,0,0,0.4)',
                      color: isActive ? '#ffffff' : '#94a3b8',
                      fontSize: '0.74rem',
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
            <div style={{ borderLeft: '1px solid rgba(255,255,255,0.15)', paddingLeft: '10px', display: 'flex', flexDirection: 'column', gap: '1px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.70rem', fontWeight: 800 }}>
                <span style={{ color: isPlayingForecast ? '#22c55e' : '#a855f7', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {isPlayingForecast ? '🟢 ANIMATING' : 'FORECAST HORIZON'}
                </span>
                <span style={{ color: '#ffffff', background: 'rgba(168,85,247,0.35)', padding: '1px 5px', borderRadius: '4px' }}>
                  +{activeForecastStep.hours} Hours
                </span>
              </div>
              <div style={{ fontSize: '0.66rem', color: '#94a3b8' }}>
                {activeForecastStep.valid_time} • ±{activeForecastStep.uncertainty_radius_km} km
              </div>
            </div>

            {/* Speed Toggle */}
            <button
              onClick={() => setPlaybackSpeedMs((prev) => (prev === 1200 ? 600 : prev === 600 ? 350 : 1200))}
              title="Toggle playback speed"
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: '#38bdf8',
                borderRadius: '6px',
                padding: '4px 7px',
                fontSize: '0.68rem',
                fontWeight: 800,
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              {playbackSpeedMs === 350 ? '3x' : playbackSpeedMs === 600 ? '2x' : '1x'}
            </button>
          </div>
        </div>

        {/* Right Intelligence & Forecast Controls Deck */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          overflowY: 'auto',
        }}>
          {/* Forecast Horizon Timeline Controller */}
          <div style={{
            background: 'rgba(10, 15, 29, 0.85)',
            border: '1px solid rgba(0, 242, 254, 0.3)',
            borderRadius: '10px',
            padding: '14px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#a855f7', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <TrendingUp size={16} />
                <span>PREDICTIVE FORECAST TIMELINE</span>
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {/* Speed toggle */}
                <button
                  onClick={() => setPlaybackSpeedMs((prev) => (prev === 1200 ? 600 : 1200))}
                  title="Toggle animation playback speed"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: '#94a3b8',
                    borderRadius: '4px',
                    padding: '3px 6px',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {playbackSpeedMs === 600 ? '2x Fast' : '1x Normal'}
                </button>
                {/* Play / Pause button */}
                <button
                  onClick={() => setIsPlayingForecast(!isPlayingForecast)}
                  style={{
                    background: isPlayingForecast ? 'rgba(239, 68, 68, 0.25)' : 'rgba(168, 85, 247, 0.25)',
                    border: isPlayingForecast ? '1px solid #ef4444' : '1px solid #a855f7',
                    color: isPlayingForecast ? '#ef4444' : '#a855f7',
                    borderRadius: '4px',
                    padding: '3px 8px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    boxShadow: isPlayingForecast ? '0 0 10px rgba(239,68,68,0.3)' : '0 0 10px rgba(168,85,247,0.3)',
                  }}
                >
                  {isPlayingForecast ? <Pause size={12} /> : <Play size={12} />}
                  <span>{isPlayingForecast ? 'Pause' : 'Play Animation'}</span>
                </button>
              </div>
            </div>

            {/* Stepper buttons & Milestone Pills */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '12px' }}>
              <button
                onClick={handleStepBackward}
                title="Previous forecast milestone"
                style={{
                  background: 'rgba(0,0,0,0.4)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#94a3b8',
                  borderRadius: '4px',
                  padding: '6px 4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <SkipBack size={12} />
              </button>

              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${forecastSteps.length}, 1fr)`, gap: '4px', flex: 1 }}>
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
                        padding: '6px 2px',
                        borderRadius: '6px',
                        border: isActive ? '1px solid #a855f7' : '1px solid rgba(255,255,255,0.08)',
                        background: isActive ? 'rgba(168, 85, 247, 0.35)' : 'rgba(0,0,0,0.3)',
                        color: isActive ? '#fff' : '#94a3b8',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        boxShadow: isActive ? '0 0 10px rgba(168, 85, 247, 0.4)' : 'none',
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
                  padding: '6px 4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <SkipForward size={12} />
              </button>
            </div>

            {/* Selected Horizon Status */}
            <div style={{ background: 'rgba(0,0,0,0.4)', padding: '10px', borderRadius: '6px', fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
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
            padding: '14px',
          }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#38bdf8', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Wind size={16} />
              <span>HYDRODYNAMIC FORCING VECTORS</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '8px', borderRadius: '6px' }}>
                <div style={{ fontSize: '0.68rem', color: '#64748b' }}>WIND VELOCITY</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#38bdf8' }}>
                  {analysis.movement.wind.speed_mps} m/s ({analysis.movement.wind.cardinal})
                </div>
                <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>{analysis.movement.wind.direction_deg}° • 3% Leeway</div>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '8px', borderRadius: '6px' }}>
                <div style={{ fontSize: '0.68rem', color: '#64748b' }}>OCEAN CURRENT</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#22c55e' }}>
                  {analysis.movement.current.speed_mps} m/s ({analysis.movement.current.cardinal})
                </div>
                <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>{analysis.movement.current.direction_deg}° • Advection</div>
              </div>
            </div>
          </div>

          {/* Spreading Observation Series Card */}
          <div style={{
            background: 'rgba(10, 15, 29, 0.85)',
            border: '1px solid rgba(0, 242, 254, 0.25)',
            borderRadius: '10px',
            padding: '14px',
          }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#f97316', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <History size={16} />
              <span>MULTI-TEMPORAL OBSERVATION SERIES</span>
            </div>

            {analysis.spreading.observations?.map((obs, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ color: '#94a3b8' }}>Pass #{idx + 1} ({obs.timestamp.split('T')[0]}):</span>
                <span style={{ color: '#f1f5f9', fontWeight: 700 }}>{obs.area_km2} km²</span>
              </div>
            ))}
          </div>

        </div>

      </div>
    </div>
  );
};
