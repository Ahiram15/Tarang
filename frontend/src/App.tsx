import React, { useState } from 'react';
import { WatchdogSimulation } from './components/WatchdogSimulation';
import { OceanGlobe } from './components/OceanGlobe';
import { SatelliteVisionSuite } from './components/SatelliteVisionSuite';
import { CharacterizationDashboard } from './components/CharacterizationDashboard';
import { MaritimeInvestigationSuite } from './components/MaritimeInvestigationSuite';
import { ScanResponse, SpillAnalysis, InvestigationPriorityReport } from './types';
import { Satellite, Globe2, Microscope, Waves, Radar, Radio } from 'lucide-react';

interface IncidentLocation {
  id: string;
  name: string;
  badge: string;
  lat: number;
  lon: number;
  date: string;
  spillId: string;
}

const INCIDENTS: IncidentLocation[] = [
  {
    id: 'emerald',
    name: 'MT Emerald Mystery Spill (Levantine Basin, Mediterranean)',
    badge: '🇵🇦 MT EMERALD (33.15°N, 34.20°E)',
    lat: 33.15,
    lon: 34.20,
    date: '2021-02-05',
    spillId: 'emerald',
  },
];

export const App: React.FC = () => {
  const [selectedIncident, setSelectedIncident] = useState<IncidentLocation>(INCIDENTS[0]); // Default to MT Emerald!
  const [view, setView] = useState<'simulation' | 'globe' | 'satellite_lab' | 'characterization' | 'investigation'>('simulation');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [scanResult, setScanResult] = useState<ScanResponse | null>(null);
  const [analysis, setAnalysis] = useState<SpillAnalysis | null>(null);
  const [investigationReport, setInvestigationReport] = useState<InvestigationPriorityReport | null>(null);
  const [activePalette, setActivePalette] = useState<string>('False-Color RGB Composite (VV+VH+Ratio)');
  const [useLiveSat, setUseLiveSat] = useState<boolean>(false); // False: instant calibrated benchmark data (<1s), True: live ESA Copernicus API

  const targetLat = selectedIncident.lat;
  const targetLon = selectedIncident.lon;

  const handleSelectIncident = async (lat: number, lon: number, customPalette?: string, overrideLive?: boolean) => {
    const isLive = overrideLive !== undefined ? overrideLive : useLiveSat;
    const paletteToUse = customPalette || activePalette;
    setIsLoading(true);
    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat: lat,
          lon: lon,
          date: selectedIncident.date,
          buffer: 0.08,
          threshold: 0.5,
          palette: paletteToUse,
          enable_dsp: true,
          force_mock: !isLive,
        }),
      });

      if (res.ok) {
        const data: ScanResponse = await res.json();
        setScanResult(data);
        if (data.characterization) {
          setAnalysis(data.characterization);
        }
        if (data.investigation) {
          setInvestigationReport(data.investigation);
        }
        setView('satellite_lab');
      }
    } catch (e) {
      console.error('Failed to load satellite scan:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaletteChange = (newPalette: string) => {
    setActivePalette(newPalette);
    handleSelectIncident(targetLat, targetLon, newPalette);
  };

  const handleOpenCharacterization = async () => {
    if (analysis) {
      setView('characterization');
      return;
    }
    try {
      const spillId = scanResult?.characterization_id || selectedIncident.spillId;
      const res = await fetch(`/api/spill/${spillId}/analysis`);
      if (res.ok) {
        const charData: SpillAnalysis = await res.json();
        setAnalysis(charData);
        if (charData.investigation) {
          setInvestigationReport(charData.investigation);
        }
        setView('characterization');
      }
    } catch (err) {
      console.error('Failed to load spill analysis:', err);
    }
  };

  const handleOpenInvestigation = async () => {
    if (investigationReport && analysis) {
      setView('investigation');
      return;
    }
    const spillId = scanResult?.characterization_id || analysis?.spill_id || selectedIncident.spillId;
    setIsLoading(true);
    try {
      // Ensure characterization is loaded
      if (!analysis) {
        const charRes = await fetch(`/api/spill/${spillId}/analysis`);
        if (charRes.ok) {
          const charData: SpillAnalysis = await charRes.json();
          setAnalysis(charData);
        }
      }
      // Fetch full investigation report
      const invRes = await fetch(`/api/spill/${spillId}/investigation-report`);
      if (invRes.ok) {
        const invData: InvestigationPriorityReport = await invRes.json();
        setInvestigationReport(invData);
        setView('investigation');
      }
    } catch (err) {
      console.error('Failed to load investigation report:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#050811', color: '#f1f5f9', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      
      {/* Global Top Navigation Bar */}
      <div style={{
        height: '42px',
        background: 'rgba(3, 7, 18, 0.95)',
        borderBottom: '1px solid rgba(0, 242, 254, 0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        zIndex: 4000,
        flexShrink: 0,
        backdropFilter: 'blur(10px)',
      }}>
        {/* Left Title / Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem' }}>
          <span style={{ fontWeight: 900, color: '#00f2fe', letterSpacing: '0.8px' }}>TARANG</span>
          <span style={{ color: '#64748b' }}>|</span>
          <span style={{ color: '#94a3b8', fontWeight: 600 }}>{selectedIncident.name.toUpperCase()}</span>
        </div>

        {/* Location Switcher */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          background: 'rgba(255, 255, 255, 0.04)',
          padding: '2px 6px',
          borderRadius: '6px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}>
          <span style={{ fontSize: '0.66rem', color: '#64748b', fontWeight: 700, paddingRight: '4px' }}>LOCATION:</span>
          {INCIDENTS.map((inc) => (
            <button
              key={inc.id}
              onClick={() => {
                setSelectedIncident(inc);
                setScanResult(null);
                setAnalysis(null);
                setInvestigationReport(null);
              }}
              style={{
                background: selectedIncident.id === inc.id ? 'rgba(0, 242, 254, 0.2)' : 'transparent',
                border: selectedIncident.id === inc.id ? '1px solid #00f2fe' : '1px solid transparent',
                color: selectedIncident.id === inc.id ? '#00f2fe' : '#94a3b8',
                borderRadius: '4px',
                padding: '3px 8px',
                fontSize: '0.70rem',
                fontWeight: selectedIncident.id === inc.id ? 800 : 500,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {inc.badge}
            </button>
          ))}
        </div>

        {/* Center 5-Stage Mission Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            onClick={() => setView('simulation')}
            style={{
              background: view === 'simulation' ? 'rgba(0, 242, 254, 0.2)' : 'transparent',
              border: view === 'simulation' ? '1px solid #00f2fe' : '1px solid transparent',
              color: view === 'simulation' ? '#00f2fe' : '#94a3b8',
              borderRadius: '6px',
              padding: '3px 10px',
              fontSize: '0.72rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
            }}
          >
            <Radio size={13} />
            <span>0. Watchdog Sim</span>
          </button>

          <button
            onClick={() => setView('globe')}
            style={{
              background: view === 'globe' ? 'rgba(0, 242, 254, 0.2)' : 'transparent',
              border: view === 'globe' ? '1px solid #00f2fe' : '1px solid transparent',
              color: view === 'globe' ? '#00f2fe' : '#94a3b8',
              borderRadius: '6px',
              padding: '3px 10px',
              fontSize: '0.72rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
            }}
          >
            <Globe2 size={13} />
            <span>1. Globe</span>
          </button>

          <button
            onClick={() => {
              if (scanResult) {
                setView('satellite_lab');
              } else {
                handleSelectIncident(targetLat, targetLon);
              }
            }}
            style={{
              background: view === 'satellite_lab' ? 'rgba(0, 242, 254, 0.2)' : 'transparent',
              border: view === 'satellite_lab' ? '1px solid #00f2fe' : '1px solid transparent',
              color: view === 'satellite_lab' ? '#00f2fe' : '#94a3b8',
              borderRadius: '6px',
              padding: '3px 10px',
              fontSize: '0.72rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
            }}
          >
            <Microscope size={13} />
            <span>2. ML Detection & Satellite Lab</span>
          </button>

          <button
            onClick={handleOpenCharacterization}
            style={{
              background: view === 'characterization' ? 'rgba(0, 242, 254, 0.2)' : 'transparent',
              border: view === 'characterization' ? '1px solid #00f2fe' : '1px solid transparent',
              color: view === 'characterization' ? '#00f2fe' : '#94a3b8',
              borderRadius: '6px',
              padding: '3px 10px',
              fontSize: '0.72rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
            }}
          >
            <Waves size={13} />
            <span>3. Characterization</span>
          </button>

          <button
            onClick={handleOpenInvestigation}
            style={{
              background: view === 'investigation' ? 'rgba(245, 158, 11, 0.25)' : 'transparent',
              border: view === 'investigation' ? '1px solid #f59e0b' : '1px solid transparent',
              color: view === 'investigation' ? '#f59e0b' : '#94a3b8',
              borderRadius: '6px',
              padding: '3px 10px',
              fontSize: '0.72rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
            }}
          >
            <Radar size={13} color={view === 'investigation' ? '#f59e0b' : '#94a3b8'} />
            <span>4. Maritime Investigation & Warning</span>
          </button>
        </div>

        {/* Right Status Indicator */}
        <div style={{ fontSize: '0.70rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: useLiveSat ? '#f59e0b' : '#00f2fe',
            boxShadow: useLiveSat ? '0 0 8px #f59e0b' : '0 0 8px #00f2fe'
          }} />
          <span style={{ color: useLiveSat ? '#f59e0b' : '#00f2fe', fontWeight: 600 }}>
            {useLiveSat ? 'CDSE Live Radar + GFW' : 'Instant Calibrated SAR + AI'}
          </span>
        </div>
      </div>

      {/* 0. AUTONOMOUS SATELLITE WATCHDOG SIMULATION (Act 0: Scheduled Catalog Polling) */}
      {view === 'simulation' && (
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <WatchdogSimulation
            onProceedToGlobe={() => setView('globe')}
            onLaunchDetection={() => handleSelectIncident(targetLat, targetLon)}
          />
        </div>
      )}

      {/* 1. GLOBE VIEW (Act 1: Space Surveillance) */}
      {view === 'globe' && (
        <div style={{ position: 'relative', width: '100%', height: '100%', flex: 1 }}>
          <OceanGlobe
            onSelectIncident={(lat, lon) => handleSelectIncident(lat, lon)}
            targetLat={targetLat}
            targetLon={targetLon}
            useLiveSat={useLiveSat}
            onToggleLiveSat={setUseLiveSat}
            onOpenSimulation={() => setView('simulation')}
          />

          {/* Loading Overlay */}
          {isLoading && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background: 'rgba(6, 10, 20, 0.94)',
              border: useLiveSat ? '1px solid #f59e0b' : '1px solid #00f2fe',
              borderRadius: '12px',
              padding: '24px 36px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
              boxShadow: useLiveSat ? '0 0 35px rgba(245, 158, 11, 0.35)' : '0 0 35px rgba(0, 242, 254, 0.35)',
              zIndex: 3000,
            }}>
              <Satellite size={40} color={useLiveSat ? '#f59e0b' : '#00f2fe'} className="animate-spin" />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f1f5f9' }}>
                  {useLiveSat
                    ? 'Querying ESA Copernicus CDSE APIs & Ingesting Maritime Intelligence...'
                    : 'Processing Calibrated SAR & Running AI Characterization Pipeline...'}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>
                  {useLiveSat
                    ? 'Downloading satellite scenes over the web (~15-20s)...'
                    : 'Sub-second benchmark pipeline with U-Net, Hindcast & GFW ranking'}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. SATELLITE AI VISION LAB (Act 2: Evidence & Deep Learning Suite) */}
      {view === 'satellite_lab' && scanResult && (
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <SatelliteVisionSuite
            scanResult={scanResult}
            onBackToGlobe={() => setView('globe')}
            onPaletteChange={handlePaletteChange}
            activePalette={activePalette}
            onOpenCharacterization={handleOpenCharacterization}
          />
        </div>
      )}

      {/* 3. OIL SPILL CHARACTERIZATION & DRIFT INTELLIGENCE (Act 3: Movement & Hindcast) */}
      {view === 'characterization' && analysis && (
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <CharacterizationDashboard
            analysis={analysis}
            onBackToLab={() => setView('satellite_lab')}
            onBackToGlobe={() => setView('globe')}
            onOpenInvestigation={handleOpenInvestigation}
          />
        </div>
      )}

      {/* 4. MARITIME INVESTIGATION & COASTAL EARLY WARNING (Act 4: Origin Backtracking & Vessel Ranking) */}
      {view === 'investigation' && analysis && investigationReport && (
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <MaritimeInvestigationSuite
            analysis={analysis}
            investigationReport={investigationReport}
            onBackToCharacterization={() => setView('characterization')}
            onBackToGlobe={() => setView('globe')}
          />
        </div>
      )}
    </div>
  );
};

export default App;
