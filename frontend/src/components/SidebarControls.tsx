import React from 'react';
import { 
  Compass, 
  Layers, 
  Sliders, 
  Sparkles, 
  Calendar, 
  Play, 
  Globe, 
  Flame, 
  MapPin, 
  Eye 
} from 'lucide-react';
import { HistoricalIncident, SimulatedHotspot } from '../types';

interface SidebarControlsProps {
  mode: 'historical' | 'simulated' | 'custom';
  setMode: (mode: 'historical' | 'simulated' | 'custom') => void;
  historicalList: HistoricalIncident[];
  simulatedList: SimulatedHotspot[];
  selectedHistId: string;
  onSelectHistorical: (id: string) => void;
  selectedSimId: string;
  onSelectSimulated: (id: string) => void;
  lat: number;
  setLat: (lat: number) => void;
  lon: number;
  setLon: (lon: number) => void;
  dateStr: string;
  setDateStr: (date: string) => void;
  buffer: number;
  setBuffer: (buffer: number) => void;
  threshold: number;
  setThreshold: (threshold: number) => void;
  palette: string;
  setPalette: (palette: string) => void;
  enableDsp: boolean;
  setEnableDsp: (dsp: boolean) => void;
  onRunScan: () => void;
  isScanning: boolean;
}

export const SidebarControls: React.FC<SidebarControlsProps> = ({
  mode,
  setMode,
  historicalList,
  simulatedList,
  selectedHistId,
  onSelectHistorical,
  selectedSimId,
  onSelectSimulated,
  lat,
  setLat,
  lon,
  setLon,
  dateStr,
  setDateStr,
  buffer,
  setBuffer,
  threshold,
  setThreshold,
  palette,
  setPalette,
  enableDsp,
  setEnableDsp,
  onRunScan,
  isScanning,
}) => {
  return (
    <aside className="sidebar">
      {/* Mode Selection */}
      <div className="glass-panel">
        <div className="panel-title">
          <Compass size={16} />
          <span>Surveillance Mode</span>
        </div>

        <div className="mode-pills">
          <button
            className={`mode-pill-btn ${mode === 'historical' ? 'active' : ''}`}
            onClick={() => setMode('historical')}
          >
            <Globe size={16} />
            <span>Historical Incidents</span>
          </button>

          <button
            className={`mode-pill-btn ${mode === 'simulated' ? 'active' : ''}`}
            onClick={() => setMode('simulated')}
          >
            <Flame size={16} />
            <span>Simulated Hotspots</span>
          </button>

          <button
            className={`mode-pill-btn ${mode === 'custom' ? 'active' : ''}`}
            onClick={() => setMode('custom')}
          >
            <MapPin size={16} />
            <span>Custom GPS Target</span>
          </button>
        </div>

        {/* Dynamic selector based on mode */}
        {mode === 'historical' && (
          <div className="control-group">
            <label className="control-label">Select Disaster Incident</label>
            <select
              className="control-select"
              value={selectedHistId}
              onChange={(e) => onSelectHistorical(e.target.value)}
            >
              {historicalList.map((inc) => (
                <option key={inc.id} value={inc.id}>
                  {inc.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {mode === 'simulated' && (
          <div className="control-group">
            <label className="control-label">Select Simulated Hotspot</label>
            <select
              className="control-select"
              value={selectedSimId}
              onChange={(e) => onSelectSimulated(e.target.value)}
            >
              {simulatedList.map((sim) => (
                <option key={sim.id} value={sim.id}>
                  {sim.name} ({sim.region})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Target Parameters */}
      <div className="glass-panel">
        <div className="panel-title">
          <MapPin size={16} />
          <span>Target Coordinates & Date</span>
        </div>

        <div className="coords-grid control-group">
          <div>
            <label className="control-label">Latitude (°)</label>
            <input
              type="number"
              step="0.0001"
              min="-90"
              max="90"
              className="control-input"
              value={lat}
              onChange={(e) => setLat(parseFloat(e.target.value) || 0)}
            />
          </div>
          <div>
            <label className="control-label">Longitude (°)</label>
            <input
              type="number"
              step="0.0001"
              min="-180"
              max="180"
              className="control-input"
              value={lon}
              onChange={(e) => setLon(parseFloat(e.target.value) || 0)}
            />
          </div>
        </div>

        <div className="control-group">
          <label className="control-label">
            <span>Pass Acquisition Date</span>
            <Calendar size={14} />
          </label>
          <input
            type="date"
            className="control-input"
            value={dateStr}
            onChange={(e) => setDateStr(e.target.value)}
          />
        </div>

        <div className="control-group">
          <div className="control-label">
            <span>Footprint Buffer (°)</span>
            <span className="slider-val">±{buffer.toFixed(2)}°</span>
          </div>
          <div className="slider-container">
            <input
              type="range"
              min="0.02"
              max="0.20"
              step="0.01"
              className="control-slider"
              value={buffer}
              onChange={(e) => setBuffer(parseFloat(e.target.value))}
            />
          </div>
        </div>
      </div>

      {/* Visual & Model Tuning */}
      <div className="glass-panel">
        <div className="panel-title">
          <Layers size={16} />
          <span>Radar Rendering & AI Sensitivity</span>
        </div>

        <div className="control-group">
          <label className="control-label">SAR Color Mode</label>
          <select
            className="control-select"
            value={palette}
            onChange={(e) => setPalette(e.target.value)}
          >
            <option value="False-Color RGB Composite (VV+VH+Ratio)">False-Color RGB Composite (VV+VH+Ratio)</option>
            <option value="Deep Ocean Marine Palette">Deep Ocean Marine Palette</option>
            <option value="Turbo Thermal Radar Palette">Turbo Thermal Radar Palette</option>
            <option value="Viridis Oceanographic Palette">Viridis Oceanographic Palette</option>
            <option value="Classic Grayscale Radar">Classic Grayscale Radar</option>
          </select>
        </div>

        <div className="control-group">
          <div className="control-label">
            <span>Spill Sensitivity Threshold</span>
            <span className="slider-val">{(threshold * 100).toFixed(0)}%</span>
          </div>
          <div className="slider-container">
            <input
              type="range"
              min="0.1"
              max="0.9"
              step="0.05"
              className="control-slider"
              value={threshold}
              onChange={(e) => setThreshold(parseFloat(e.target.value))}
            />
          </div>
        </div>

        <div style={{ marginTop: '12px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.825rem' }}>
            <input
              type="checkbox"
              checked={enableDsp}
              onChange={(e) => setEnableDsp(e.target.checked)}
              style={{ accentColor: '#00f2fe', width: '16px', height: '16px' }}
            />
            <Sparkles size={14} color="#00f2fe" />
            <span>HD Despeckling & CLAHE Contrast</span>
          </label>
        </div>
      </div>

      {/* Trigger Action */}
      <button
        className="btn-primary"
        onClick={onRunScan}
        disabled={isScanning}
      >
        {isScanning ? (
          <>
            <div className="badge-pulse-dot" style={{ width: '12px', height: '12px' }} />
            <span>Scanning Satellites & U-Net...</span>
          </>
        ) : (
          <>
            <Play size={18} fill="#000" />
            <span>Launch Satellite Radar Scan</span>
          </>
        )}
      </button>
    </aside>
  );
};
