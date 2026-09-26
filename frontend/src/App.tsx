import React, { useState } from 'react';
import { CinematicLanding } from './components/CinematicLanding';
import { WatchdogSimulation } from './components/WatchdogSimulation';
import { OceanGlobe } from './components/OceanGlobe';
import { SatelliteVisionSuite } from './components/SatelliteVisionSuite';
import { CharacterizationDashboard } from './components/CharacterizationDashboard';
import { MaritimeInvestigationSuite } from './components/MaritimeInvestigationSuite';
import { ScanResponse, SpillAnalysis, InvestigationPriorityReport, IncidentLocation } from './types';
import { Satellite, Globe2, Microscope, Waves, Radar, Radio, Sparkles, Ship } from 'lucide-react';

export const INCIDENTS: IncidentLocation[] = [
  {
    id: 'emerald',
    name: 'MT Emerald Mystery Spill (Levantine Basin, Mediterranean)',
    badge: 'MT EMERALD (33.38°N, 34.52°E)',
    lat: 33.38,
    lon: 34.52,
    date: '2021-02-05',
    spillId: 'emerald',
  },
  {
    id: 'wakashio',
    name: 'MV Wakashio Grounding & Bunker Spill (Pointe d\'Esny, Mauritius)',
    badge: 'MV WAKASHIO (20.44°S, 57.74°E)',
    lat: -20.437,
    lon: 57.742,
    date: '2020-08-06',
    spillId: 'wakashio',
  },
];

export const App: React.FC = () => {
  const [selectedIncident, setSelectedIncident] = useState<IncidentLocation>(INCIDENTS[0]); // Default to MT Emerald!
  const [view, setView] = useState<'landing' | 'simulation' | 'globe' | 'satellite_lab' | 'characterization' | 'investigation'>('landing');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [scanResult, setScanResult] = useState<ScanResponse | null>(null);
  const [analysis, setAnalysis] = useState<SpillAnalysis | null>(null);
  const [investigationReport, setInvestigationReport] = useState<InvestigationPriorityReport | null>(null);
  const [activePalette, setActivePalette] = useState<string>('False-Color RGB Composite (VV+VH+Ratio)');
  const [useLiveSat, setUseLiveSat] = useState<boolean>(false); // False: instant calibrated benchmark data (<1s), True: live ESA Copernicus API

  const targetLat = selectedIncident.lat;
  const targetLon = selectedIncident.lon;

  const handleSelectIncident = async (
    lat: number,
    lon: number,
    customPalette?: string,
    overrideLive?: boolean,
    incidentOverride?: IncidentLocation
  ) => {
    const inc = incidentOverride || INCIDENTS.find(i => Math.abs(i.lat - lat) < 1.0 && Math.abs(i.lon - lon) < 1.0) || selectedIncident;
    if (inc.id !== selectedIncident.id) {
      setSelectedIncident(inc);
      setScanResult(null);
      setAnalysis(null);
      setInvestigationReport(null);
    }
    const isLive = overrideLive !== undefined ? overrideLive : useLiveSat;
    const paletteToUse = customPalette || activePalette;
    setIsLoading(true);
    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat: inc.lat,
          lon: inc.lon,
          date: inc.date,
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
        } else {
          try {
            const charRes = await fetch(`/api/spill/${inc.spillId}/analysis`);
            if (charRes.ok) {
              const charData: SpillAnalysis = await charRes.json();
              setAnalysis(charData);
              if (charData.investigation) {
                setInvestigationReport(charData.investigation);
              }
            }
          } catch (charErr) {
            console.warn('Analysis fetch notice:', charErr);
          }
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

  const handleOpenCharacterization = async (targetSpillId?: any) => {
    const validSpillId = (typeof targetSpillId === 'string' && (targetSpillId === 'emerald' || targetSpillId === 'wakashio'))
      ? targetSpillId
      : selectedIncident.spillId;
    const matchingInc = INCIDENTS.find(i => i.spillId === validSpillId) || selectedIncident;
    if (matchingInc.id !== selectedIncident.id) {
      setSelectedIncident(matchingInc);
    }
    if (analysis && analysis.spill_id === validSpillId) {
      setView('characterization');
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(`/api/spill/${validSpillId}/analysis`);
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
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenInvestigation = async (targetSpillId?: any) => {
    const validSpillId = (typeof targetSpillId === 'string' && (targetSpillId === 'emerald' || targetSpillId === 'wakashio'))
      ? targetSpillId
      : selectedIncident.spillId;
    const matchingInc = INCIDENTS.find(i => i.spillId === validSpillId) || selectedIncident;
    if (matchingInc.id !== selectedIncident.id) {
      setSelectedIncident(matchingInc);
    }
    if (investigationReport && analysis && analysis.spill_id === validSpillId) {
      setView('investigation');
      return;
    }
    setIsLoading(true);
    try {
      if (!analysis || analysis.spill_id !== validSpillId) {
        const charRes = await fetch(`/api/spill/${validSpillId}/analysis`);
        if (charRes.ok) {
          const charData: SpillAnalysis = await charRes.json();
          setAnalysis(charData);
          if (charData.investigation) {
            setInvestigationReport(charData.investigation);
          }
        }
      }
      const invRes = await fetch(`/api/spill/${validSpillId}/investigation-report`);
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

  const switchIncident = async (inc: IncidentLocation) => {
    setSelectedIncident(inc);
    if (view === 'characterization') {
      await handleOpenCharacterization(inc.spillId);
    } else if (view === 'investigation') {
      await handleOpenInvestigation(inc.spillId);
    } else if (view === 'satellite_lab') {
      await handleSelectIncident(inc.lat, inc.lon, undefined, undefined, inc);
    }
  };

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#050811', color: '#f1f5f9', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

      {/* Global Top Navigation Bar - Only visible in active Mission Control modes */}
      {view !== 'landing' && (
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
          {/* Left Title / Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem' }}>
            <span style={{ fontWeight: 900, color: '#00f2fe', letterSpacing: '1px', fontSize: '0.86rem' }}>TARANG</span>
            <span style={{ color: '#64748b' }}>|</span>
            <span style={{ color: '#64748b', fontSize: '0.68rem', letterSpacing: '0.5px' }}>OCEAN SPILL INTELLIGENCE</span>
          </div>

          {/* Center 5-Stage Mission Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button
              onClick={() => setView('landing')}
              style={{
                background: 'transparent',
                border: '1px solid transparent',
                color: '#94a3b8',
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
              <Sparkles size={13} />
              <span>Landing / Hero</span>
            </button>

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
              onClick={() => handleOpenCharacterization(selectedIncident.spillId)}
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
              onClick={() => handleOpenInvestigation(selectedIncident.spillId)}
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

          {/* Center-Right: Dedicated Incident Switcher */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '3px',
            background: 'rgba(6, 11, 25, 0.92)',
            border: '1px solid rgba(0, 242, 254, 0.35)',
            borderRadius: '8px',
            padding: '2px 4px',
          }}>
            <span style={{ fontSize: '0.64rem', color: '#64748b', fontWeight: 800, padding: '0 4px' }}>INCIDENT:</span>
            {INCIDENTS.map((inc) => {
              const isSelected = selectedIncident.id === inc.id;
              const isEmerald = inc.id === 'emerald';
              return (
                <button
                  key={inc.id}
                  onClick={() => switchIncident(inc)}
                  title={`Switch active mission to ${inc.name}`}
                  style={{
                    background: isSelected
                      ? isEmerald
                        ? 'linear-gradient(135deg, #00f2fe 0%, #0284c7 100%)'
                        : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                      : 'transparent',
                    color: isSelected ? '#030712' : '#94a3b8',
                    border: 'none',
                    borderRadius: '5px',
                    padding: '3px 8px',
                    fontSize: '0.68rem',
                    fontWeight: isSelected ? 800 : 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Ship size={11} />
                  <span>{inc.id === 'emerald' ? 'MT EMERALD (MED)' : 'MV WAKASHIO (MRI)'}</span>
                </button>
              );
            })}
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
      )}

      {/* LANDING / HERO SCENE */}
      {view === 'landing' && (
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <CinematicLanding
            onEnterMissionControl={() => setView('simulation')}
            onNavigateToGlobe={() => setView('globe')}
            onNavigateToLab={() => {
              if (scanResult) {
                setView('satellite_lab');
              } else {
                handleSelectIncident(targetLat, targetLon);
              }
            }}
          />
        </div>
      )}

      {/* 0. AUTONOMOUS SATELLITE WATCHDOG SIMULATION (Act 0: Scheduled Catalog Polling) */}
      {view === 'simulation' && (
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <WatchdogSimulation
            onProceedToGlobe={() => setView('globe')}
            onLaunchDetection={() => handleSelectIncident(selectedIncident.lat, selectedIncident.lon, undefined, undefined, selectedIncident)}
            selectedIncident={selectedIncident}
            onSelectIncident={switchIncident}
            incidents={INCIDENTS}
          />
        </div>
      )}

      {/* 1. GLOBE VIEW (Act 1: Space Surveillance) */}
      {view === 'globe' && (
        <div style={{ position: 'relative', width: '100%', height: '100%', flex: 1 }}>
          <OceanGlobe
            incidents={INCIDENTS}
            selectedIncident={selectedIncident}
            onSelectIncident={(_lat, _lon, inc) => {
              if (inc) {
                setSelectedIncident(inc);
              }
            }}
            onInspectIncident={(lat, lon, inc) => {
              if (inc) {
                setSelectedIncident(inc);
              }
              handleSelectIncident(lat, lon, undefined, undefined, inc);
            }}
            onOpenCharacterization={(inc) => {
              if (inc) {
                setSelectedIncident(inc);
                handleOpenCharacterization(inc.spillId);
              } else {
                handleOpenCharacterization();
              }
            }}
            onOpenInvestigation={(inc) => {
              if (inc) {
                setSelectedIncident(inc);
                handleOpenInvestigation(inc.spillId);
              } else {
                handleOpenInvestigation();
              }
            }}
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
