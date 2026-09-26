import React, { useState } from 'react';
import { HistoricalIncident, SimulatedHotspot } from '../types';
import { Search, Globe, Flame, MapPin, Database } from 'lucide-react';

interface IncidentsTableProps {
  historicalList: HistoricalIncident[];
  simulatedList: SimulatedHotspot[];
  onSelectTarget: (lat: number, lon: number, date?: string) => void;
}

export const IncidentsTable: React.FC<IncidentsTableProps> = ({
  historicalList,
  simulatedList,
  onSelectTarget,
}) => {
  const [filter, setFilter] = useState<string>('');

  const rows = [
    ...historicalList.map((h) => ({
      id: h.id,
      name: h.name,
      type: 'Real Historical Disaster',
      lat: h.lat,
      lon: h.lon,
      date: h.date,
      area: `${h.area_km2} km²`,
      status: h.severity,
      isReal: true,
    })),
    ...simulatedList.map((s) => ({
      id: s.id,
      name: s.name,
      type: 'Active Simulated Hotspot',
      lat: s.lat,
      lon: s.lon,
      date: 'Live Feed',
      area: `${s.area_km2} km²`,
      status: `${s.confidence}% Conf`,
      isReal: false,
    })),
  ].filter(
    (item) =>
      item.name.toLowerCase().includes(filter.toLowerCase()) ||
      item.type.toLowerCase().includes(filter.toLowerCase()) ||
      item.status.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div style={{ marginTop: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Database size={16} color="#00f2fe" />
          <span>Global Incident Registry & Benchmark Database</span>
        </h3>

        <div style={{ position: 'relative', width: '220px' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '9px', color: '#64748b' }} />
          <input
            type="text"
            placeholder="Search incidents..."
            className="control-input"
            style={{ paddingLeft: '30px', fontSize: '0.75rem', height: '32px' }}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
      </div>

      <div className="table-wrapper">
        <table className="incident-table">
          <thead>
            <tr>
              <th>Incident Name</th>
              <th>Surveillance Type</th>
              <th>Coordinates</th>
              <th>Date</th>
              <th>Contaminated Area</th>
              <th>Classification</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} onClick={() => onSelectTarget(row.lat, row.lon, row.isReal ? row.date : undefined)}>
                <td style={{ fontWeight: 600 }}>{row.name}</td>
                <td>
                  <span
                    style={{
                      fontSize: '0.725rem',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: row.isReal ? 'rgba(239, 68, 68, 0.15)' : 'rgba(249, 115, 22, 0.15)',
                      color: row.isReal ? '#f87171' : '#fb923c',
                      border: `1px solid ${row.isReal ? 'rgba(239, 68, 68, 0.3)' : 'rgba(249, 115, 22, 0.3)'}`,
                    }}
                  >
                    {row.type}
                  </span>
                </td>
                <td style={{ fontFamily: 'monospace', color: '#38bdf8' }}>
                  {row.lat.toFixed(4)}°, {row.lon.toFixed(4)}°
                </td>
                <td style={{ color: '#94a3b8' }}>{row.date}</td>
                <td style={{ fontWeight: 600 }}>{row.area}</td>
                <td>
                  <span style={{ color: row.isReal ? '#ef4444' : '#22c55e', fontWeight: 600 }}>
                    {row.status}
                  </span>
                </td>
                <td>
                  <button
                    className="btn-secondary"
                    style={{ padding: '3px 8px', fontSize: '0.7rem' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectTarget(row.lat, row.lon, row.isReal ? row.date : undefined);
                    }}
                  >
                    <MapPin size={12} />
                    <span>Target</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
