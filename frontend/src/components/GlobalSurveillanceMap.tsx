import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { HistoricalIncident } from '../types';

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

export const GlobalSurveillanceMap: React.FC<GlobalMapProps> = ({
  lat,
  lon,
  onMapClick,
  historicalList,
  onSelectIncident,
}) => {
  return (
    <div className="map-wrapper">
      <MapContainer
        center={[lat, lon]}
        zoom={3}
        minZoom={2}
        maxZoom={12}
        style={{ height: '100%', width: '100%' }}
      >
        <MapController lat={lat} lon={lon} />
        <MapClickHandler onClick={onMapClick} />

        {/* ESRI Dark Gray Canvas Basemap (Free, No API Key, No Watermark) */}
        <TileLayer
          attribution='&copy; <a href="https://www.esri.com/">Esri</a>, DeLorme, NAVTEQ'
          url="https://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
          maxZoom={16}
        />

        {/* Real Single Incident (Pulsing Red Marker Dot with Transparent Waves) */}
        {historicalList.map((inc) => (
          <Marker
            key={inc.id}
            position={[inc.lat, inc.lon]}
            icon={radarPulseIcon}
            eventHandlers={{
              click: () => onSelectIncident(inc.lat, inc.lon, inc.date),
            }}
          >
            <Tooltip direction="top" offset={[0, -18]} opacity={1}>
              <div style={{ background: '#070a13', color: '#fff', padding: '6px 10px', borderRadius: '6px', fontSize: '11px', border: '1px solid #ef4444', boxShadow: '0 0 15px rgba(239, 68, 68, 0.4)' }}>
                <strong style={{ color: '#ef4444' }}>🚨 {inc.shortName}</strong>
                <div style={{ color: '#94a3b8', fontSize: '10px' }}>Date: {inc.date}</div>
                <div style={{ color: '#f1f5f9', fontWeight: 600 }}>Est. Slick: ~{inc.area_km2} km²</div>
                <div style={{ color: '#00f2fe', fontSize: '10px', marginTop: '2px' }}>👉 Click to Inspect Incident</div>
              </div>
            </Tooltip>
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
                  🔍 Inspect Incident & Launch AI →
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

