import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Polygon, Circle, Marker, Popup, Polyline, Tooltip } from 'react-leaflet';
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
  Info
} from 'lucide-react';

interface CharacterizationDashboardProps {
  analysis: SpillAnalysis;
  onBackToLab: () => void;
  onBackToGlobe: () => void;
}

export const CharacterizationDashboard: React.FC<CharacterizationDashboardProps> = ({
  analysis,
  onBackToLab,
  onBackToGlobe,
}) => {
  const [selectedForecastHour, setSelectedForecastHour] = useState<number>(24);
  const [isPlayingForecast, setIsPlayingForecast] = useState<boolean>(false);
  
  // Layer toggles
  const [showSpillPolygon, setShowSpillPolygon] = useState<boolean>(true);
  const [showDriftArrow, setShowDriftArrow] = useState<boolean>(true);
  const [showEnvVectors, setShowEnvVectors] = useState<boolean>(true);
  const [showHindcast, setShowHindcast] = useState<boolean>(true);
  const [showForecast, setShowForecast] = useState<boolean>(true);
  const [showUncertaintyCone, setShowUncertaintyCone] = useState<boolean>(true);

  const centroid = analysis.geometry.centroid;
  const currentPolyCoords = analysis.geometry.boundary.geometry.coordinates[0].map(
    (pt: number[]) => [pt[1], pt[0]] as [number, number]
  );

  const forecastSteps = analysis.forecast.forecast;
  const activeForecastStep = forecastSteps.find((s) => s.hours === selectedForecastHour) || forecastSteps[0];

  // Auto-play forecast animation
  useEffect(() => {
    let interval: any;
    if (isPlayingForecast) {
      const hoursList = forecastSteps.map((s) => s.hours);
      interval = setInterval(() => {
        setSelectedForecastHour((prev) => {
          const curIdx = hoursList.indexOf(prev);
          const nextIdx = (curIdx + 1) % hoursList.length;
          return hoursList[nextIdx];
        });
      }, 1800);
    }
    return () => clearInterval(interval);
  }, [isPlayingForecast, forecastSteps]);

  // Movement velocity arrow coordinates
  const moveAngleRad = (analysis.movement.direction_deg * Math.PI) / 180;
  const moveLenDeg = 0.035;
  const moveEndLat = centroid.lat + moveLenDeg * Math.cos(moveAngleRad);
  const moveEndLon = centroid.lon + moveLenDeg * Math.sin(moveAngleRad);

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
        <div style={{ background: 'rgba(10, 15, 29, 0.85)', border: '1px solid rgba(0, 242, 254, 0.25)', borderRadius: '8px', padding: '10px 14px' }}>
          <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700 }}>PROBABLE ORIGIN (-48H)</div>
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
                  positions={[[centroid.lat, centroid.lon], [moveEndLat, moveEndLon]]}
                  pathOptions={{ color: '#22c55e', weight: 4, dashArray: '6, 6' }}
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
                      pathOptions={{ color: '#eab308', weight: 1.5, opacity: 0.4 }}
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
              {showUncertaintyCone && analysis.forecast.uncertainty_cone?.coordinates && (
                <Polygon
                  positions={analysis.forecast.uncertainty_cone.coordinates[0].map((pt: number[]) => [pt[1], pt[0]])}
                  pathOptions={{ color: '#ec4899', fillColor: '#ec4899', fillOpacity: 0.1, weight: 1, dashArray: '3, 3' }}
                />
              )}

              {/* 5. Forward Forecast Step Polygons */}
              {showForecast && (
                <>
                  {analysis.forecast.trajectories.map((traj, idx) => (
                    <Polyline
                      key={`fore-traj-${idx}`}
                      positions={traj.map((pt) => [pt[1], pt[0]])}
                      pathOptions={{ color: '#a855f7', weight: 1.5, opacity: 0.35 }}
                    />
                  ))}

                  {/* Active Selected Forecast Step */}
                  {activeForecastStep.polygon?.coordinates && (
                    <Polygon
                      positions={activeForecastStep.polygon.coordinates[0].map((pt: number[]) => [pt[1], pt[0]])}
                      pathOptions={{ color: '#a855f7', fillColor: '#a855f7', fillOpacity: 0.4, weight: 2 }}
                    >
                      <Tooltip permanent={false}>
                        Forecast +{activeForecastStep.hours}h ({activeForecastStep.valid_time})
                      </Tooltip>
                    </Polygon>
                  )}

                  <Marker
                    position={[activeForecastStep.centroid.lat, activeForecastStep.centroid.lon]}
                    icon={createIcon('#a855f7', `T+${activeForecastStep.hours}h`)}
                  >
                    <Popup>
                      <b>Predicted Centroid (+{activeForecastStep.hours}h)</b><br />
                      Valid Time: {activeForecastStep.valid_time}<br />
                      Uncertainty: ±{activeForecastStep.uncertainty_radius_km} km<br />
                      Confidence: {Math.round(activeForecastStep.confidence * 100)}%
                    </Popup>
                  </Marker>
                </>
              )}
            </MapContainer>
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
              <button
                onClick={() => setIsPlayingForecast(!isPlayingForecast)}
                style={{
                  background: isPlayingForecast ? 'rgba(239, 68, 68, 0.2)' : 'rgba(168, 85, 247, 0.2)',
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
                }}
              >
                {isPlayingForecast ? <Pause size={12} /> : <Play size={12} />}
                <span>{isPlayingForecast ? 'Pause' : 'Play Animation'}</span>
              </button>
            </div>

            {/* Hour Milestone Buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '4px', marginBottom: '12px' }}>
              {forecastSteps.map((step) => (
                <button
                  key={step.hours}
                  onClick={() => {
                    setIsPlayingForecast(false);
                    setSelectedForecastHour(step.hours);
                  }}
                  style={{
                    padding: '6px 2px',
                    borderRadius: '6px',
                    border: selectedForecastHour === step.hours ? '1px solid #a855f7' : '1px solid rgba(255,255,255,0.08)',
                    background: selectedForecastHour === step.hours ? 'rgba(168, 85, 247, 0.25)' : 'rgba(0,0,0,0.3)',
                    color: selectedForecastHour === step.hours ? '#fff' : '#94a3b8',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  +{step.hours}h
                </button>
              ))}
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
