import React from 'react';
import { resolveGeographicContext } from '../utils/spatialLookup';

export interface SpillTooltipCardProps {
  mode?: 'inspector' | 'spill';
  title?: string;
  lat: number;
  lon: number;
  areaKm2?: number | string;
  timestamp?: string;
  spillId?: string;
  badge?: string;
  customSubtitle?: string;
}

export const SpillTooltipCard: React.FC<SpillTooltipCardProps> = ({
  mode = 'spill',
  title,
  lat,
  lon,
  areaKm2,
  timestamp = '05 Feb 2021 03:50 UTC',
  spillId,
  badge,
  customSubtitle,
}) => {
  const geoContext = resolveGeographicContext(lat, lon, spillId);
  const isInspector = mode === 'inspector';

  const defaultTitle = isInspector ? '📍 Marine Coordinate Inspector' : '🚨 Observed Spill Slick (+0h)';
  const defaultBadge = isInspector ? 'LIVE GPS' : 'SAR S1/S2';

  const cardTitle = title || defaultTitle;
  const cardBadge = badge || defaultBadge;
  const formattedArea =
    areaKm2 !== undefined ? (typeof areaKm2 === 'number' ? areaKm2.toFixed(3) : areaKm2) : null;

  return (
    <div
      style={{
        background: 'rgba(7, 10, 19, 0.96)',
        backdropFilter: 'blur(10px)',
        color: '#f8fafc',
        padding: '10px 14px',
        borderRadius: '10px',
        fontSize: '11px',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        border: isInspector ? '1px solid rgba(0, 242, 254, 0.45)' : '1px solid rgba(239, 68, 68, 0.55)',
        boxShadow: isInspector
          ? '0 8px 24px rgba(0, 0, 0, 0.6), 0 0 15px rgba(0, 242, 254, 0.2)'
          : '0 8px 24px rgba(0, 0, 0, 0.6), 0 0 15px rgba(239, 68, 68, 0.25)',
        minWidth: '250px',
        maxWidth: '310px',
        lineHeight: '1.45',
        textAlign: 'left',
        pointerEvents: 'none',
        userSelect: 'none',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
          paddingBottom: '6px',
          marginBottom: '6px',
        }}
      >
        <span
          style={{
            color: isInspector ? '#00f2fe' : '#ef4444',
            fontWeight: 800,
            fontSize: '11.5px',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
          }}
        >
          {cardTitle}
        </span>
        <span
          style={{
            background: isInspector ? 'rgba(0, 242, 254, 0.15)' : 'rgba(239, 68, 68, 0.2)',
            color: isInspector ? '#00f2fe' : '#f87171',
            border: isInspector ? '1px solid rgba(0, 242, 254, 0.35)' : '1px solid rgba(239, 68, 68, 0.4)',
            padding: '1px 6px',
            borderRadius: '4px',
            fontSize: '9px',
            fontWeight: 700,
            letterSpacing: '0.3px',
          }}
        >
          {cardBadge}
        </span>
      </div>

      {customSubtitle && (
        <div style={{ color: '#00f2fe', fontSize: '10px', fontWeight: 600, marginBottom: '4px' }}>
          {customSubtitle}
        </div>
      )}

      {/* Location / Sea Basin */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', marginBottom: '4px' }}>
        <span style={{ color: '#00f2fe', fontSize: '12px', lineHeight: '1', width: '14px', flexShrink: 0, marginTop: '1px' }}>
          🌊
        </span>
        <div>
          <span style={{ color: '#94a3b8', fontSize: '10px' }}>Sea Basin: </span>
          <span style={{ color: '#f1f5f9', fontWeight: 700 }}>{geoContext.seaBasin}</span>
        </div>
      </div>

      {/* GPS Coordinates (DMS + Decimal) */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', marginBottom: '4px' }}>
        <span style={{ color: '#38bdf8', fontSize: '12px', lineHeight: '1', width: '14px', flexShrink: 0, marginTop: '1px' }}>
          📍
        </span>
        <div>
          <span style={{ color: '#94a3b8', fontSize: '10px' }}>GPS Coords: </span>
          <span style={{ color: '#e2e8f0', fontWeight: 600, fontFamily: 'monospace', fontSize: '10.5px' }}>
            {geoContext.dms}
          </span>
          <div style={{ color: '#64748b', fontSize: '9.5px' }}>({geoContext.decimal})</div>
        </div>
      </div>

      {/* Proximity / Nearest Coast / Port */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', marginBottom: '4px' }}>
        <span style={{ color: '#f59e0b', fontSize: '12px', lineHeight: '1', width: '14px', flexShrink: 0, marginTop: '1px' }}>
          ⚓
        </span>
        <div>
          <span style={{ color: '#94a3b8', fontSize: '10px' }}>Proximity: </span>
          <span style={{ color: '#fbbf24', fontWeight: 600 }}>{geoContext.nearestCoast}</span>
        </div>
      </div>

      {/* State B: Area & Detection Timestamp (Only shown when hovering over spill / incident) */}
      {!isInspector && formattedArea !== null && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: '6px',
            paddingTop: '6px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            fontSize: '10px',
          }}
        >
          <div>
            <span style={{ color: '#94a3b8' }}>📐 Area: </span>
            <span style={{ color: '#34d399', fontWeight: 800, fontSize: '11px' }}>~{formattedArea} km²</span>
          </div>
          <div style={{ color: '#cbd5e1', fontSize: '9.5px', display: 'flex', alignItems: 'center', gap: '3px' }}>
            <span>🕒</span>
            <span>{timestamp}</span>
          </div>
        </div>
      )}
    </div>
  );
};
