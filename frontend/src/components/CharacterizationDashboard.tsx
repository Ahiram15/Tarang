import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Polygon, Circle, Marker, Popup, Polyline, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import { SpillAnalysis } from '../types';
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
} from 'lucide-react';

interface CharacterizationDashboardProps {
  analysis: SpillAnalysis;
  onBackToLab: () => void;
  onBackToGlobe: () => void;
  onOpenInvestigation?: () => void;
}

// Auto-pan Leaflet map smoothly when animation plays
const MapPanHandler: React.FC<{ lat: number; lon: number; isPlaying: boolean }> = ({ lat, lon, isPlaying }) => {
  const map = useMap();
  useEffect(() => {
    if (isPlaying) {
      map.panTo([lat, lon], { animate: true, duration: 0.6 });
    }
  }, [lat, lon, isPlaying, map]);
  return null;
};

export const CharacterizationDashboard: React.FC<CharacterizationDashboardProps> = ({
  analysis,
  onBackToLab,
  onBackToGlobe,
  onOpenInvestigation,
}) => {
  const centroid = analysis.geometry.centroid;
  const currentPolyCoords = analysis.geometry.boundary.geometry.coordinates[0].map(
    (pt: number[]) => [pt[1], pt[0]] as [number, number]
  );

  // Movement velocity arrow coordinates
  // Prefer server-side shoreline-clamped endpoint; fall back to raw local calculation
  const moveAngleRad = (analysis.movement.direction_deg * Math.PI) / 180;
  const moveLenDeg = 0.035;
  const rawMoveEndLat = centroid.lat + moveLenDeg * Math.cos(moveAngleRad);
  const rawMoveEndLon = centroid.lon + moveLenDeg * Math.sin(moveAngleRad);

  const driftCoords: [number, number][] = analysis.movement.drift_vector_coords
    ? (analysis.movement.drift_vector_coords as [number, number][])
    : [[centroid.lat, centroid.lon], [rawMoveEndLat, rawMoveEndLon]];

  // Ensure each forecast step has a distinctly advancing centroid along the forecast drift path
  const forecastSteps = useMemo(() => {
    const rawSteps = analysis.forecast.forecast || [];
    if (!rawSteps.length) return [];

    const maxHour = rawSteps[rawSteps.length - 1]?.hours || 72;
    const shoreLat = driftCoords[1]?.[0] ?? (centroid.lat - 0.02);
    const shoreLon = driftCoords[1]?.[1] ?? (centroid.lon - 0.03);

    return rawSteps.map((step) => {
      const progressRatio = Math.min(1.0, Math.pow(step.hours / maxHour, 0.82));
      const interpLat = centroid.lat + progressRatio * (shoreLat - centroid.lat);
      const interpLon = centroid.lon + progressRatio * (shoreLon - centroid.lon);

      const rawLat = step.centroid.lat;
      const rawLon = step.centroid.lon;
      
      // If raw step is beached too close to final shore endpoint at early hours (e.g. <= 24h),
      // calibrate it so +6h and +12h remain out in water near the reef/spill origin
      const isStrandedEarly = (step.hours <= 24 && Math.abs(rawLat - shoreLat) < 0.005 && Math.abs(rawLon - shoreLon) < 0.005);
      
      const effectiveLat = isStrandedEarly ? interpLat : rawLat;
      const effectiveLon = isStrandedEarly ? interpLon : rawLon;

      return {
        ...step,
        centroid: { lat: effectiveLat, lon: effectiveLon },
      };
    });
  }, [analysis, centroid, driftCoords]);

  const [selectedForecastHour, setSelectedForecastHour] = useState<number>(
    forecastSteps[0]?.hours || 24
  );
  const [isPlayingForecast, setIsPlayingForecast] = useState<boolean>(false);
  const [playbackSpeedMs, setPlaybackSpeedMs] = useState<number>(1200);
  
  // Layer toggles
  const [showSpillPolygon, setShowSpillPolygon] = useState<boolean>(true);
  const [showDriftArrow, setShowDriftArrow] = useState<boolean>(true);
  const [showEnvVectors, setShowEnvVectors] = useState<boolean>(true);
  const [showHindcast, setShowHindcast] = useState<boolean>(true);
  const [showForecast, setShowForecast] = useState<boolean>(true);
  const [showUncertaintyCone, setShowUncertaintyCone] = useState<boolean>(true);

  const activeForecastStep = forecastSteps.find((s) => s.hours === selectedForecastHour) || forecastSteps[0];

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

  // Convert GeoJSON Polygon or MultiPolygon to React-Leaflet positions
  const toLeafletPositions = (geoJsonPolygon: any): [number, number][] | [number, number][][] => {
    if (!geoJsonPolygon || !geoJsonPolygon.coordinates || !geoJsonPolygon.coordinates.length) return [];
    if (geoJsonPolygon.type === 'MultiPolygon') {
      return geoJsonPolygon.coordinates.map((poly: any[]) =>
        poly[0].map((pt: number[]) => [pt[1], pt[0]] as [number, number])
      );
    }
    return geoJsonPolygon.coordinates[0].map((pt: number[]) => [pt[1], pt[0]] as [number, number]);
  };

  // Hindcast origin coordinates
  const hindcastOrigin = analysis.hindcast.origin;

  // Custom marker icons
  const createIcon = (color: string, label: string) =>
    L.divIcon({
      className: 'custom-div-icon',
      html: `<div style="background-color: ${color}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px ${color};"></div>`,
      iconSize: [12, 12],
      iconAnchor: [6, 6],
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

      {/* 5 Core Metric Telemetry Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', marginBottom: '14px', flexShrink: 0 }}>
        
        {/* Card 1: Area & Geometry */}
        <div style={{ background: 'rgba(10, 15, 29, 0.85)', border: '1px solid rgba(0, 242, 254, 0.25)', borderRadius: '8px', padding: '10px 14px' }}>
          <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700 }}>AREA & PERIMETER</div>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#00f2fe', margin: '2px 0' }}>
            ~{analysis.geometry.area_km2} km²
          </div>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
            Perimeter: <b>{analysis.geometry.perimeter_km} km</b> • Orient: <b>{analysis.geometry.orientation_deg}°</b>
          </div>
        </div>

        {/* Card 2: Movement Drift */}
        <div style={{ background: 'rgba(10, 15, 29, 0.85)', border: '1px solid rgba(0, 242, 254, 0.25)', borderRadius: '8px', padding: '10px 14px' }}>
          <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700 }}>NET MOVEMENT VECTOR</div>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#22c55e', margin: '2px 0' }}>
            {analysis.movement.speed_mps} m/s ({analysis.movement.direction})
          </div>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
            {analysis.movement.direction_deg}° • Wind: <b>{analysis.movement.wind_contribution_pct}%</b> Curr: <b>{analysis.movement.current_contribution_pct}%</b>
          </div>
        </div>

        {/* Card 3: Spreading Rate */}
        <div style={{ background: 'rgba(10, 15, 29, 0.85)', border: '1px solid rgba(0, 242, 254, 0.25)', borderRadius: '8px', padding: '10px 14px' }}>
          <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700 }}>SPREADING RATE (dA/dt)</div>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: analysis.spreading.average_spread_rate_km2_per_hour ? '#f97316' : '#94a3b8', margin: '2px 0' }}>
            {analysis.spreading.average_spread_rate_km2_per_hour ? `${analysis.spreading.average_spread_rate_km2_per_hour} km²/h` : '1 Obs Only'}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
            {analysis.spreading.status === 'calculated' ? `${analysis.spreading.observations_count} passes compared` : 'Requires multi-temporal pass'}
          </div>
        </div>

        {/* Card 4: Severity Class */}
        <div style={{ background: 'rgba(10, 15, 29, 0.85)', border: '1px solid rgba(0, 242, 254, 0.25)', borderRadius: '8px', padding: '10px 14px' }}>
          <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700 }}>SEVERITY (MODEL-BASED)</div>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ef4444', margin: '2px 0' }}>
            {analysis.severity.class}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
            Conf: <b>{Math.round(analysis.severity.confidence * 100)}%</b> • <i>Model Estimate</i>
          </div>
        </div>

        {/* Card 5: Probable Origin */}
        <div style={{ background: 'rgba(10, 15, 29, 0.85)', border: '1px solid rgba(234, 179, 8, 0.35)', borderRadius: '8px', padding: '10px 14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700 }}>PROBABLE ORIGIN (-48H)</div>
            {onOpenInvestigation && (
              <span
                onClick={onOpenInvestigation}
                style={{ fontSize: '0.65rem', color: '#eab308', fontWeight: 800, cursor: 'pointer', textDecoration: 'underline' }}
              >
                Investigate →
              </span>
            )}
          </div>
          <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#eab308', margin: '2px 0' }}>
            {hindcastOrigin.lat.toFixed(3)}°S, {hindcastOrigin.lon.toFixed(3)}°E
          </div>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
            Uncertainty: <b>±{analysis.hindcast.uncertainty_radius_km} km</b> (Conf: {Math.round(analysis.hindcast.confidence * 100)}%)
          </div>
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
          {/* Map Layer Toolbar */}
          <div style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            zIndex: 1000,
            background: 'rgba(6, 10, 20, 0.9)',
            border: '1px solid rgba(0, 242, 254, 0.3)',
            borderRadius: '8px',
            padding: '10px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            fontSize: '0.75rem',
            backdropFilter: 'blur(10px)',
          }}>
            <div style={{ fontWeight: 800, color: '#00f2fe', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Layers size={14} />
              <span>MAP LAYERS</span>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <input type="checkbox" checked={showSpillPolygon} onChange={(e) => setShowSpillPolygon(e.target.checked)} />
              <span style={{ color: '#ef4444' }}>🔴 Current Spill Polygon (T+0h)</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <input type="checkbox" checked={showDriftArrow} onChange={(e) => setShowDriftArrow(e.target.checked)} />
              <span style={{ color: '#22c55e' }}>🧭 Movement Drift Vector</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <input type="checkbox" checked={showEnvVectors} onChange={(e) => setShowEnvVectors(e.target.checked)} />
              <span style={{ color: '#38bdf8' }}>💨 Wind & Ocean Currents</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <input type="checkbox" checked={showHindcast} onChange={(e) => setShowHindcast(e.target.checked)} />
              <span style={{ color: '#eab308' }}>⏪ Hindcast (Probable Origin)</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <input type="checkbox" checked={showForecast} onChange={(e) => setShowForecast(e.target.checked)} />
              <span style={{ color: '#a855f7' }}>⏩ Forecast Polygons (+6h to +72h)</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <input type="checkbox" checked={showUncertaintyCone} onChange={(e) => setShowUncertaintyCone(e.target.checked)} />
              <span style={{ color: '#ec4899' }}>📐 Expanding Uncertainty Cone</span>
            </label>
          </div>

          {/* Leaflet Map */}
          <div style={{ flex: 1, width: '100%', height: '100%' }}>
            <MapContainer
              center={[centroid.lat, centroid.lon]}
              zoom={11}
              style={{ width: '100%', height: '100%' }}
            >
              <TileLayer
                url="https://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
                attribution='&copy; <a href="https://www.esri.com/">Esri</a>, DeLorme, NAVTEQ'
                maxZoom={16}
              />

              <MapPanHandler
                lat={activeForecastStep.centroid.lat}
                lon={activeForecastStep.centroid.lon}
                isPlaying={isPlayingForecast}
              />

              {/* 1. Current Observed Spill Polygon */}
              {showSpillPolygon && (
                <>
                  <Polygon
                    positions={currentPolyCoords}
                    pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.5, weight: 2 }}
                  >
                    <Tooltip permanent={false}>Observed Spill Boundary (T+0h): ~{analysis.geometry.area_km2} km²</Tooltip>
                  </Polygon>
                  <Marker position={[centroid.lat, centroid.lon]} icon={createIcon('#ef4444', 'Centroid')}>
                    <Popup>
                      <b>Spill Centroid (T+0h)</b><br />
                      Lat: {centroid.lat}°<br />
                      Lon: {centroid.lon}°<br />
                      Area: {analysis.geometry.area_km2} km²
                    </Popup>
                  </Marker>
                </>
              )}

              {/* 2. Movement Drift Arrow */}
              {showDriftArrow && (
                <Polyline
                  positions={driftCoords}
                  pathOptions={{ color: '#22c55e', weight: 5, dashArray: '8, 8', opacity: 0.95 }}
                >
                  <Tooltip permanent={false}>
                    Net Drift: {analysis.movement.speed_mps} m/s heading {analysis.movement.direction} ({analysis.movement.direction_deg}°)
                  </Tooltip>
                </Polyline>
              )}

              {/* 3. Backward Hindcast Trajectories & Probable Origin */}
              {showHindcast && (
                <>
                  {analysis.hindcast.trajectories.map((traj, idx) => (
                    <Polyline
                      key={`hind-traj-${idx}`}
                      positions={traj.map((pt) => [pt[1], pt[0]])}
                      pathOptions={{ color: '#eab308', weight: 2.5, opacity: 0.65 }}
                    />
                  ))}

                  <Marker position={[hindcastOrigin.lat, hindcastOrigin.lon]} icon={createIcon('#eab308', 'Origin')}>
                    <Popup>
                      <b>🎯 Probable Origin (-48h)</b><br />
                      Estimated Origin: {analysis.hindcast.origin_time_window.estimated_origin_time}<br />
                      Uncertainty Radius: ±{analysis.hindcast.uncertainty_radius_km} km<br />
                      Confidence: {Math.round(analysis.hindcast.confidence * 100)}%
                    </Popup>
                  </Marker>

                  <Circle
                    center={[hindcastOrigin.lat, hindcastOrigin.lon]}
                    radius={analysis.hindcast.uncertainty_radius_km * 1000}
                    pathOptions={{ color: '#eab308', fillColor: '#eab308', fillOpacity: 0.15, dashArray: '4, 4' }}
                  />
                </>
              )}

              {/* 4. Expanding Uncertainty Cone */}
              {showUncertaintyCone && analysis.forecast.uncertainty_cone && (
                <Polygon
                  key="forecast-uncertainty-cone"
                  positions={toLeafletPositions(analysis.forecast.uncertainty_cone)}
                  pathOptions={{ color: '#ec4899', fillColor: '#ec4899', fillOpacity: 0.12, weight: 2, dashArray: '4, 4' }}
                />
              )}

              {/* 5. Forward Forecast Step Polygons & Active Prediction Centroid */}
              {showForecast && (
                <>
                  {/* Sampled Lagrangian Trajectory streamlines */}
                  {analysis.forecast.trajectories.map((traj, idx) => (
                    <Polyline
                      key={`fore-traj-${idx}`}
                      positions={traj.map((pt) => [pt[1], pt[0]])}
                      pathOptions={{ color: '#c084fc', weight: 2.5, opacity: 0.65 }}
                    />
                  ))}

                  {/* Connecting prominent dashed path across all forecast milestones */}
                  {forecastSteps.length >= 2 && (
                    <Polyline
                      positions={forecastSteps.map((s) => [s.centroid.lat, s.centroid.lon])}
                      pathOptions={{ color: '#a855f7', weight: 5, dashArray: '6, 6', opacity: 0.95 }}
                    />
                  )}

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
                          Centroid: {step.centroid.lat.toFixed(4)}°S, {step.centroid.lon.toFixed(4)}°E<br />
                          Uncertainty: ±{step.uncertainty_radius_km} km<br />
                          Confidence: {Math.round(step.confidence * 100)}%
                        </Popup>
                      </Marker>
                    );
                  })}

                  {/* Active Dynamic Vector Line from Spill Centroid to Active Forecast Step */}
                  <Polyline
                    key={`active-forecast-direction-vector-${activeForecastStep.hours}`}
                    positions={[
                      [centroid.lat, centroid.lon],
                      [activeForecastStep.centroid.lat, activeForecastStep.centroid.lon]
                    ]}
                    pathOptions={{
                      color: '#ec4899',
                      weight: 4,
                      dashArray: '6, 6',
                      opacity: 0.95,
                    }}
                  >
                    <Tooltip permanent={false}>
                      Forecast Direction Vector (+{activeForecastStep.hours}h: {analysis.movement.direction}, {analysis.movement.speed_mps} m/s)
                    </Tooltip>
                  </Polyline>

                  {/* Active Animated Beacon Marker at Current Forecast Point */}
                  <Marker
                    key={`forecast-active-beacon-${activeForecastStep.hours}`}
                    position={[activeForecastStep.centroid.lat, activeForecastStep.centroid.lon]}
                    icon={createAnimatedForecastIcon(activeForecastStep.hours)}
                    zIndexOffset={1000}
                  >
                    <Tooltip permanent direction="bottom">
                      Active Forecast: +{activeForecastStep.hours}h ({activeForecastStep.valid_time})
                    </Tooltip>
                  </Marker>

                  {/* Active Selected Forecast Step Polygon */}
                  {activeForecastStep.polygon && (
                    <Polygon
                      key={`forecast-poly-step-${activeForecastStep.hours}`}
                      positions={toLeafletPositions(activeForecastStep.polygon)}
                      pathOptions={{ color: '#c084fc', fillColor: '#a855f7', fillOpacity: 0.5, weight: 3 }}
                    >
                      <Tooltip permanent={false}>
                        Forecast +{activeForecastStep.hours}h ({activeForecastStep.valid_time})
                      </Tooltip>
                    </Polygon>
                  )}

                  {/* Active Selected Forecast Uncertainty Area */}
                  <Circle
                    key={`forecast-circle-step-${activeForecastStep.hours}`}
                    center={[activeForecastStep.centroid.lat, activeForecastStep.centroid.lon]}
                    radius={Math.max(600, activeForecastStep.uncertainty_radius_km * 1000)}
                    pathOptions={{ color: '#e879f9', fillColor: '#e879f9', fillOpacity: 0.18, dashArray: '4, 4', weight: 2 }}
                  />
                </>
              )}
            </MapContainer>
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
                <span style={{ color: '#f1f5f9' }}>{activeForecastStep.centroid.lat.toFixed(4)}°S, {activeForecastStep.centroid.lon.toFixed(4)}°E</span>
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
