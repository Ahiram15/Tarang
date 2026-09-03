import React, { useState } from 'react';
import { OceanGlobe } from './components/OceanGlobe';
import { SatelliteVisionSuite } from './components/SatelliteVisionSuite';
import { CharacterizationDashboard } from './components/CharacterizationDashboard';
import { ScanResponse, SpillAnalysis } from './types';
import { Satellite } from 'lucide-react';

export const App: React.FC = () => {
  const [view, setView] = useState<'globe' | 'satellite_lab' | 'characterization'>('globe');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [scanResult, setScanResult] = useState<ScanResponse | null>(null);
  const [analysis, setAnalysis] = useState<SpillAnalysis | null>(null);
  const [activePalette, setActivePalette] = useState<string>('False-Color RGB Composite (VV+VH+Ratio)');

  const targetLat = -20.438119;
  const targetLon = 57.744631;

  const handleSelectIncident = async (lat: number, lon: number, customPalette?: string) => {
    const paletteToUse = customPalette || activePalette;
    setIsLoading(true);
    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat: lat,
          lon: lon,
          date: '2020-08-10',
          buffer: 0.06,
          threshold: 0.5,
          palette: paletteToUse,
          enable_dsp: true,
          force_mock: false,
        }),
      });

      if (res.ok) {
        const data: ScanResponse = await res.json();
        setScanResult(data);
        if (data.characterization) {
          setAnalysis(data.characterization);
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
    // Fetch full analysis from backend API if not yet in state
    try {
      const spillId = scanResult?.characterization_id || 'wakashio';
      const res = await fetch(`/api/spill/${spillId}/analysis`);
      if (res.ok) {
        const charData: SpillAnalysis = await res.json();
        setAnalysis(charData);
        setView('characterization');
      }
    } catch (err) {
      console.error('Failed to load spill analysis:', err);
    }
  };

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#070a13', color: '#f1f5f9', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      
      {/* 1. GLOBE VIEW (Act 1: Space Surveillance) */}
      {view === 'globe' && (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
          <OceanGlobe
            onSelectIncident={(lat, lon) => handleSelectIncident(lat, lon)}
            targetLat={targetLat}
            targetLon={targetLon}
          />

          {/* Loading Overlay */}
          {isLoading && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background: 'rgba(6, 10, 20, 0.92)',
              border: '1px solid #00f2fe',
              borderRadius: '12px',
              padding: '24px 36px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
              boxShadow: '0 0 35px rgba(0, 242, 254, 0.35)',
              zIndex: 3000,
            }}>
              <Satellite size={40} color="#00f2fe" className="animate-spin" />
              <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f1f5f9' }}>
                Fetching Raw Satellite SAR & Running AI Denoising...
              </span>
            </div>
          )}
        </div>
      )}

      {/* 2. SATELLITE AI VISION LAB (Act 2: Evidence & Deep Learning Suite) */}
      {view === 'satellite_lab' && scanResult && (
        <SatelliteVisionSuite
          scanResult={scanResult}
          onBackToGlobe={() => setView('globe')}
          onPaletteChange={handlePaletteChange}
          activePalette={activePalette}
          onOpenCharacterization={handleOpenCharacterization}
        />
      )}

      {/* 3. OIL SPILL CHARACTERIZATION & DRIFT INTELLIGENCE (Act 3: Movement & Hindcast) */}
      {view === 'characterization' && analysis && (
        <CharacterizationDashboard
          analysis={analysis}
          onBackToLab={() => setView('satellite_lab')}
          onBackToGlobe={() => setView('globe')}
        />
      )}
    </div>
  );
};

export default App;
