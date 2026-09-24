import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { HistoricalIncident } from '../types';
import { SpillTooltipCard } from './SpillTooltipCard';

// Custom glowing pulsing radar dot with transparent ripple waves
const radarPulseIcon = L.divIcon({
  className: 'custom-radar-pulse-icon',
  html: `
    <div class="radar-pulse-container">
      <div class="radar-wave-1"></div>
      <div class="radar-wave-2"></div>
      <div class="radar-dot-core"></div>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

interface GlobalMapProps {
  lat: number;
  lon: number;
  zoom?: number;
  onMapClick: (lat: number, lon: number) => void;
  historicalList: HistoricalIncident[];
  onSelectIncident: (lat: number, lon: number, date?: string) => void;
  activeIncidentId?: string;
}

// Controller to smoothly pan map when coordinates change
function MapController({ lat, lon }: { lat: number; lon: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lon], map.getZoom(), { duration: 1.2 });
  }, [lat, lon, map]);
  return null;
}

// Component to capture clicks on map
function MapClickHandler({ onClick }: { onClick: (lat: number, lon: number) => void }) {
  useMapEvents({
    click(e) {
      onClick(parseFloat(e.latlng.lat.toFixed(4)), parseFloat(e.latlng.lng.toFixed(4)));
    },
  });
  return null;
}

// Component to dynamically track mouse moves across global map
const MapMouseTracker: React.FC<{
  onMouseMove: (lat: number, lon: number, x: number, y: number) => void;
  onMouseLeave: () => void;
}> = ({ onMouseMove, onMouseLeave }) => {
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

export const GlobalSurveillanceMap: React.FC<GlobalMapProps> = ({
  lat,
  lon,
  onMapClick,
  historicalList,
  onSelectIncident,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [cursorState, setCursorState] = useState<{
    lat: number;
    lon: number;
    x: number;
    y: number;
    hoveredIncident: HistoricalIncident | null;
    isVisible: boolean;
  }>({
    lat,
    lon,
    x: 0,
    y: 0,
    hoveredIncident: null,
    isVisible: false,
  });

  const handleMouseMove = (cLat: number, cLon: number, x: number, y: number) => {
    setCursorState((prev) => ({
      ...prev,
      lat: cLat,
      lon: cLon,
      x,
      y,
      isVisible: true,
    }));
  };

  const handleMouseLeave = () => {
    setCursorState((prev) => ({
      ...prev,
      isVisible: false,
      hoveredIncident: null,
    }));
  };

  return (
    <div className="map-wrapper" ref={containerRef} style={{ position: 'relative', width: '100%', height: '100%' }}>
      <MapContainer
        center={[lat, lon]}
        zoom={3}
        minZoom={1}
        maxZoom={20}
        worldCopyJump={true}
        style={{ height: '100%', width: '100%' }}
      >
        <MapController lat={lat} lon={lon} />
        <MapClickHandler onClick={onMapClick} />
        <MapMouseTracker onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave} />

        {/* ESRI Dark Gray Canvas Basemap (maxNativeZoom={13} caps ocean tile requests at zoom 13 so scaling works seamlessly without watermarks) */}
        <TileLayer
          attribution='&copy; <a href="https://www.esri.com/">Esri</a>, DeLorme, NAVTEQ'
          url="https://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
          maxZoom={20}
          maxNativeZoom={13}
        />

        {/* Real Single Incident (Pulsing Red Marker Dot with Transparent Waves) */}
        {historicalList.map((inc) => (
          <Marker
            key={inc.id}
            position={[inc.lat, inc.lon]}
            icon={radarPulseIcon}
            eventHandlers={{
              click: () => onSelectIncident(inc.lat, inc.lon, inc.date),
              mouseover: () => setCursorState((prev) => ({ ...prev, hoveredIncident: inc })),
              mouseout: () => setCursorState((prev) => ({ ...prev, hoveredIncident: null })),
            }}
          >
            <Popup>
              <div style={{ color: '#070a13', fontSize: '12px', minWidth: '200px' }}>
                <h4 style={{ margin: '0 0 4px 0', color: '#b91c1c' }}>🚨 {inc.name}</h4>
                <p style={{ margin: '0 0 4px 0' }}><b>Date:</b> {inc.date}</p>
                <p style={{ margin: '0 0 4px 0' }}><b>Contaminated Area:</b> ~{inc.area_km2} km²</p>
                <p style={{ margin: '0 0 8px 0', fontSize: '11px', color: '#444' }}>{inc.desc}</p>
                <button
                  onClick={() => onSelectIncident(inc.lat, inc.lon, inc.date)}
                  style={{
                    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '6px 12px',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: 700,
                    width: '100%',
                    boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)'
                  }}
                >
                  Inspect Telemetry
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Fixed Corner HUD / Telemetry Card Overlay (Bottom-Left Elevated) */}
      {cursorState.isVisible && (
        <div
          style={{
            position: 'absolute',
            bottom: '5.2rem',
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
            mode={cursorState.hoveredIncident ? 'spill' : 'inspector'}
            title={cursorState.hoveredIncident ? `🚨 Active Spill Target (+0h)` : '🌐 Live Maritime Telemetry'}
            lat={cursorState.lat}
            lon={cursorState.lon}
            areaKm2={cursorState.hoveredIncident?.area_km2}
            timestamp={cursorState.hoveredIncident ? `${cursorState.hoveredIncident.date} UTC` : undefined}
            spillId={cursorState.hoveredIncident?.id}
            badge={cursorState.hoveredIncident ? 'SAR S1/S2' : 'LIVE GPS'}
            customSubtitle={cursorState.hoveredIncident ? '👉 Click pin to inspect full telemetry' : undefined}
          />
        </div>
      )}
    </div>
  );
};
