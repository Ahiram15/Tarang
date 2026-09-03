import React from 'react';
import { Satellite, ShieldCheck, Radio, AlertTriangle } from 'lucide-react';
import { SystemStatus } from '../types';

interface NavbarProps {
  status: SystemStatus | null;
  loading: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ status, loading }) => {
  return (
    <header className="app-header">
      <div className="header-brand">
        <div className="satellite-icon-box">
          <Satellite size={24} color="#00f2fe" />
        </div>
        <div>
          <h1 className="brand-title">TARANG • Oil Spill Early Warning System</h1>
          <p className="brand-subtitle">
            Autonomous Sentinel-1 SAR & Sentinel-2 Optical Deep Learning Marine Surveillance
          </p>
        </div>
      </div>

      <div className="header-status-group">
        {status?.copernicus_cdse_active ? (
          <div className="badge badge-live">
            <span className="badge-pulse-dot" />
            <ShieldCheck size={14} />
            <span>Copernicus CDSE API Active</span>
          </div>
        ) : (
          <div className="badge badge-mock">
            <AlertTriangle size={14} />
            <span>Synthetic Engine (Offline / Mock Mode)</span>
          </div>
        )}

        <div className="badge" style={{ background: 'rgba(0, 210, 255, 0.1)', border: '1px solid rgba(0, 210, 255, 0.3)', color: '#00f2fe' }}>
          <Radio size={14} />
          <span>AI Model: U-Net (256x256)</span>
        </div>
      </div>
    </header>
  );
};
