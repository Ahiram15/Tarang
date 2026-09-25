import React from 'react';
import { resolveGeographicContext } from '../utils/spatialLookup';
import { Waves, MapPin, Anchor, Crosshair, Clock, ShieldAlert, Activity } from 'lucide-react';

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

  const defaultTitle = isSpill ? 'Active Spill Target (+0h)' : 'Live Maritime Telemetry';
  const defaultBadge = isSpill ? 'SAR S1/S2' : 'LIVE GPS';

  const cardTitle = title || defaultTitle;
  const cardBadge = badge || defaultBadge;
  const formattedArea =
    areaKm2 !== undefined ? (typeof areaKm2 === 'number' ? areaKm2.toFixed(3) : areaKm2) : null;

  return (
    <div
      style={{
        boxSizing: 'border-box',
        background: isSpill ? 'rgba(15, 23, 42, 0.94)' : 'rgba(10, 15, 29, 0.92)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        color: '#f8fafc',
        padding: '0.65rem 0.9rem',
        borderRadius: '10px',
        fontSize: '0.72rem',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        border: isSpill ? '1px solid rgba(239, 68, 68, 0.6)' : '1px solid rgba(0, 242, 254, 0.35)',
        boxShadow: isSpill
          ? '0 8px 32px rgba(0, 0, 0, 0.5), 0 0 16px rgba(239, 68, 68, 0.25)'
          : '0 8px 32px rgba(0, 0, 0, 0.45)',
        width: 'auto',
        maxWidth: '320px',
        lineHeight: '1.35',
        textAlign: 'left',
        pointerEvents: 'none',
        userSelect: 'none',
        transition: 'all 0.25s ease',
        ...style,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: isSpill ? '1px solid rgba(239, 68, 68, 0.25)' : '1px solid rgba(0, 242, 254, 0.2)',
          paddingBottom: '5px',
          marginBottom: '6px',
        }}
      >
        <span
          style={{
            color: isSpill ? '#ef4444' : '#00f2fe',
            fontWeight: 800,
            fontSize: '0.78rem',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            letterSpacing: '0.2px',
          }}
        >
          {isSpill ? <ShieldAlert size={14} color="#ef4444" /> : <Activity size={14} color="#00f2fe" />}
          {cardTitle.replace(/^[^\w\s]+\s*/, '')}
        </span>
        <span
          style={{
            background: isSpill ? 'rgba(239, 68, 68, 0.2)' : 'rgba(0, 242, 254, 0.15)',
            color: isSpill ? '#f87171' : '#00f2fe',
            border: isSpill ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(0, 242, 254, 0.35)',
            padding: '1px 6px',
            borderRadius: '4px',
            fontSize: '8.5px',
            fontWeight: 800,
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
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', marginBottom: '4px' }}>
        <Waves size={13} color="#38bdf8" style={{ marginTop: '1px', flexShrink: 0 }} />
        <div>
          <span style={{ color: '#94a3b8', fontSize: '0.68rem' }}>Sea Basin: </span>
          <span style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '0.72rem' }}>{geoContext.seaBasin}</span>
        </div>
      </div>

      {/* Real-time Cursor Coordinates */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', marginBottom: '4px' }}>
        <MapPin size={13} color="#00f2fe" style={{ marginTop: '1px', flexShrink: 0 }} />
        <div>
          <span style={{ color: '#94a3b8', fontSize: '0.68rem' }}>Coordinates: </span>
          <span style={{ color: '#e2e8f0', fontWeight: 600, fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}>
            {geoContext.dms}
          </span>
          <div style={{ color: '#64748b', fontSize: '0.65rem', fontFamily: 'var(--font-mono)' }}>({geoContext.decimal})</div>
        </div>
      </div>

      {/* Proximity / Distance to nearest coast */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', marginBottom: '3px' }}>
        <Anchor size={13} color="#f59e0b" style={{ marginTop: '1px', flexShrink: 0 }} />
        <div>
          <span style={{ color: '#94a3b8', fontSize: '0.68rem' }}>Proximity: </span>
          <span style={{ color: '#fbbf24', fontWeight: 600, fontSize: '0.72rem' }}>{geoContext.nearestCoast}</span>
        </div>
      </div>

      {/* Active Spill Target Details */}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Crosshair size={12} color="#ef4444" />
              <span style={{ color: '#94a3b8' }}>Observed Area: </span>
              <span style={{ color: '#ef4444', fontWeight: 800, fontSize: '0.72rem' }}>
                ~{formattedArea !== null ? formattedArea : '2.805'} km²
              </span>
            </div>
            <div style={{ color: '#cbd5e1', fontSize: '0.65rem', display: 'flex', alignItems: 'center', gap: '3px' }}>
              <Clock size={11} color="#94a3b8" />
              <span>{timestamp}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

