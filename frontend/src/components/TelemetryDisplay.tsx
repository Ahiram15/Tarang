import React from 'react';
import { 
  AlertOctagon, 
  CheckCircle2, 
  Download, 
  FileJson, 
  FileImage, 
  Radio, 
  Layers, 
  Activity, 
  ShieldAlert 
} from 'lucide-react';
import { ScanResponse } from '../types';

interface TelemetryDisplayProps {
  scanResult: ScanResponse;
}

export const TelemetryDisplay: React.FC<TelemetryDisplayProps> = ({ scanResult }) => {
  const { telemetry, satellite_metadata, coordinates, requested_date, oil_detected, visual_layers } = scanResult;

  const downloadFile = (url: string | null, filename: string) => {
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const downloadJsonReport = () => {
    const jsonStr = JSON.stringify(scanResult, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    downloadFile(url, `oil_spill_telemetry_${coordinates.lat}_${coordinates.lon}.json`);
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ marginTop: '14px' }}>
      {/* Dynamic Status Alert Banner */}
      {oil_detected ? (
        <div className="alert-banner alert-danger">
          <AlertOctagon size={24} color="#ef4444" />
          <div>
            <div style={{ fontWeight: 800 }}>MARINE OIL SPILL ANOMALY CONFIRMED</div>
            <div style={{ fontSize: '0.825rem', opacity: 0.9 }}>
              Detected surface slick covering {telemetry.spill_coverage_percent}% of footprint ({telemetry.spill_pixels.toLocaleString()} pixels, ~{telemetry.estimated_spill_area_km2} km²). Cross-verification with optical pass recommended.
            </div>
          </div>
        </div>
      ) : (
        <div className="alert-banner alert-safe">
          <CheckCircle2 size={24} color="#22c55e" />
          <div>
            <div style={{ fontWeight: 800 }}>CLEAR OCEAN SURFACE: NO ANOMALY DETECTED</div>
            <div style={{ fontSize: '0.825rem', opacity: 0.9 }}>
              Calibrated microwave backscatter is consistent with baseline clean water. Zero pixels exceed the {telemetry.threshold_used * 100}% threshold.
            </div>
          </div>
        </div>
      )}

      {/* Primary KPI Metric Cards */}
      <div className="metrics-row">
        <div className="metric-card">
          <span className="metric-lbl">Radar Classification</span>
          <span
            className="metric-val"
            style={{ color: oil_detected ? '#ef4444' : '#22c55e' }}
          >
            {telemetry.status}
          </span>
        </div>

        <div className="metric-card">
          <span className="metric-lbl">Spill Footprint Area</span>
          <span className="metric-val">
            {telemetry.estimated_spill_area_km2} <span style={{ fontSize: '0.9rem', color: '#94a3b8' }}>km²</span>
          </span>
        </div>

        <div className="metric-card">
          <span className="metric-lbl">Contaminated Pixels</span>
          <span className="metric-val">
            {telemetry.spill_pixels.toLocaleString()} <span style={{ fontSize: '0.8rem', color: '#64748b' }}>/ {telemetry.total_pixels.toLocaleString()}</span>
          </span>
        </div>

        <div className="metric-card">
          <span className="metric-lbl">AI Model Confidence</span>
          <span className="metric-val" style={{ color: '#00f2fe' }}>
            {telemetry.confidence_score}%
          </span>
        </div>
      </div>

      {/* Dual Orbit Metadata Cards */}
      <div className="telemetry-row">
        <div className="satellite-card">
          <div className="satellite-card-title" style={{ color: '#00f2fe' }}>
            <Radio size={16} />
            <span>Sentinel-1 C-Band SAR</span>
          </div>
          <div className="satellite-meta-item">
            <b>Acquisition UTC:</b> <code>{satellite_metadata.sentinel1_radar?.acquisition_time_utc || requested_date}</code>
          </div>
          <div className="satellite-meta-item">
            <b>Polarization:</b> <code>Dual-Pol VV + VH (Wave Damping)</code>
          </div>
          <div className="satellite-meta-item" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            <b>Product:</b> <code>{satellite_metadata.sentinel1_radar?.product_name || 'S1A_IW_GRDH_1SDV'}</code>
          </div>
        </div>

        <div className="satellite-card optical">
          <div className="satellite-card-title" style={{ color: '#ffaa00' }}>
            <Layers size={16} />
            <span>Sentinel-2 MSI Optical</span>
          </div>
          <div className="satellite-meta-item">
            <b>Acquisition UTC:</b> <code>{satellite_metadata.sentinel2_optical?.acquisition_time_utc || requested_date}</code>
          </div>
          <div className="satellite-meta-item">
            <b>Spectral Mode:</b> <code>True-Color RGB (B04, B03, B02)</code>
          </div>
          <div className="satellite-meta-item" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            <b>Product:</b> <code>{satellite_metadata.sentinel2_optical?.product_name || 'S2B_MSIL2A'}</code>
          </div>
        </div>
      </div>

      {/* Export & Download Bar */}
      <div className="export-panel">
        <button
          className="btn-secondary"
          onClick={() => downloadFile(visual_layers.binary_mask, `spill_mask_${coordinates.lat}_${coordinates.lon}.png`)}
          disabled={!visual_layers.binary_mask}
        >
          <FileImage size={15} />
          <span>Download Binary Mask (PNG)</span>
        </button>

        <button
          className="btn-secondary"
          onClick={() => downloadFile(visual_layers.red_overlay, `spill_overlay_${coordinates.lat}_${coordinates.lon}.png`)}
          disabled={!visual_layers.red_overlay}
        >
          <FileImage size={15} />
          <span>Download Red Overlay (PNG)</span>
        </button>

        <button
          className="btn-secondary"
          onClick={downloadJsonReport}
        >
          <FileJson size={15} />
          <span>Download Telemetry Report (JSON)</span>
        </button>
      </div>
    </div>
  );
};
