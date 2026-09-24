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
  style?: React.CSSProperties;
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
  style,
}) => {
  const geoContext = resolveGeographicContext(lat, lon, spillId);
  const isSpill = mode === 'spill';

  const defaultTitle = isSpill ? '🚨 Active Spill Target (+0h)' : '🌐 Live Maritime Telemetry';
  const defaultBadge = isSpill ? 'SAR S1/S2' : 'LIVE GPS';

  const cardTitle = title || defaultTitle;
  const cardBadge = badge || defaultBadge;
  const formattedArea =
    areaKm2 !== undefined ? (typeof areaKm2 === 'number' ? areaKm2.toFixed(3) : areaKm2) : null;

  return (
    <div
      style={{
        boxSizing: 'border-box',
        background: isSpill ? 'rgba(17, 24, 39, 0.88)' : 'rgba(13, 23, 42, 0.85)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        color: '#f8fafc',
        padding: '0.6rem 0.85rem',
        borderRadius: '10px',
        fontSize: '0.72rem',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        border: isSpill ? '1px solid rgba(239, 68, 68, 0.55)' : '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow: isSpill
          ? '0 8px 32px rgba(0, 0, 0, 0.45), 0 0 15px rgba(239, 68, 68, 0.25)'
          : '0 8px 32px rgba(0, 0, 0, 0.37)',
        width: 'auto',
        maxWidth: '320px',
        lineHeight: '1.35',
        textAlign: 'left',
        pointerEvents: 'none',
        userSelect: 'none',
        transition: 'border-color 0.25s ease, background 0.25s ease, box-shadow 0.25s ease',
        ...style,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: isSpill ? '1px solid rgba(239, 68, 68, 0.25)' : '1px solid rgba(255, 255, 255, 0.12)',
          paddingBottom: '5px',
          marginBottom: '6px',
        }}
      >
        <span
          style={{
            color: isSpill ? '#ef4444' : '#00f2fe',
            fontWeight: 800,
            fontSize: '0.8rem',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            letterSpacing: '0.2px',
          }}
        >
          {cardTitle}
        </span>
        <span
          style={{
            background: isSpill ? 'rgba(239, 68, 68, 0.2)' : 'rgba(0, 242, 254, 0.15)',
            color: isSpill ? '#f87171' : '#00f2fe',
            border: isSpill ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(0, 242, 254, 0.35)',
            padding: '1px 6px',
            borderRadius: '4px',
            fontSize: '8.5px',
            fontWeight: 700,
            letterSpacing: '0.5px',
          }}
        >
          {cardBadge}
        </span>
      </div>

      {customSubtitle && (
        <div style={{ color: '#00f2fe', fontSize: '0.68rem', fontWeight: 600, marginBottom: '4px' }}>
          {customSubtitle}
        </div>
      )}

      {/* Sea Basin */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '5px', marginBottom: '4px' }}>
        <span style={{ color: '#00f2fe', fontSize: '11px', lineHeight: '1', width: '13px', flexShrink: 0, marginTop: '1px' }}>
          🌊
        </span>
        <div>
          <span style={{ color: '#94a3b8', fontSize: '0.68rem' }}>Sea Basin: </span>
          <span style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '0.72rem' }}>{geoContext.seaBasin}</span>
        </div>
      </div>

      {/* Real-time Cursor Coordinates (DMS + Decimal) */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '5px', marginBottom: '4px' }}>
        <span style={{ color: '#38bdf8', fontSize: '11px', lineHeight: '1', width: '13px', flexShrink: 0, marginTop: '1px' }}>
          📍
        </span>
        <div>
          <span style={{ color: '#94a3b8', fontSize: '0.68rem' }}>Coordinates: </span>
          <span style={{ color: '#e2e8f0', fontWeight: 600, fontFamily: 'monospace', fontSize: '0.72rem' }}>
            {geoContext.dms}
          </span>
          <div style={{ color: '#64748b', fontSize: '0.65rem', fontFamily: 'monospace' }}>({geoContext.decimal})</div>
        </div>
      </div>

      {/* Proximity / Distance to nearest coast */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '5px', marginBottom: '3px' }}>
        <span style={{ color: '#f59e0b', fontSize: '11px', lineHeight: '1', width: '13px', flexShrink: 0, marginTop: '1px' }}>
          ⚓
        </span>
        <div>
          <span style={{ color: '#94a3b8', fontSize: '0.68rem' }}>Proximity: </span>
          <span style={{ color: '#fbbf24', fontWeight: 600, fontSize: '0.72rem' }}>{geoContext.nearestCoast}</span>
        </div>
      </div>

      {/* Active Spill Target Details (Shown when cursor enters spill polygon or hovering spill target) */}
      {isSpill && (
        <div
          style={{
            marginTop: '6px',
            paddingTop: '6px',
            borderTop: '1px solid rgba(239, 68, 68, 0.25)',
            display: 'flex',
            flexDirection: 'column',
            gap: '3px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.68rem' }}>
            <div>
              <span style={{ color: '#94a3b8' }}>📐 Observed Area: </span>
              <span style={{ color: '#ef4444', fontWeight: 800, fontSize: '0.72rem' }}>
                ~{formattedArea !== null ? formattedArea : '2.805'} km²
              </span>
            </div>
            <div style={{ color: '#cbd5e1', fontSize: '0.65rem', display: 'flex', alignItems: 'center', gap: '3px' }}>
              <span>🕒</span>
              <span>Observed: {timestamp}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

