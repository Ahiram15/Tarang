import React, { useState, useEffect, useRef } from 'react';
import {
  Globe2,
  ArrowRight,
  PlayCircle,
  RotateCcw,
  CheckCircle2,
  Radar,
  Network,
  Zap,
  Activity,
  Layers,
  Sparkles,
} from 'lucide-react';

interface WatchdogSimulationProps {
  onProceedToGlobe: () => void;
  onLaunchDetection: () => void;
}

type SensorKey = 'sentinel1' | 'sentinel2' | 'landsat' | 'eos06';

interface SensorMetadata {
  title: string;
  spec: string;
  summary: string;
  clutter: string;
  slick: string;
  contrast: string;
  channel: string;
  mechanismTitle: string;
  physicsFormula: string;
  metric1Label: string;
  metric1Value: string;
  metric2Label: string;
  metric2Value: string;
  metric3Label: string;
  metric3Value: string;
  orbitGeometry: string;
  inputMode: string;
}

/* ─────────────────────────────────────────────────────────────
   DIAGRAM 1: SENTINEL-1 C-BAND SAR ACTIVE RADAR WAVE MECHANISM
   ───────────────────────────────────────────────────────────── */
const Sentinel1Diagram: React.FC = () => (
  <svg style={{ width: '100%', height: '100%' }} viewBox="0 0 520 220" fill="none">
    <defs>
      <linearGradient id="s1RadarBeam" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#00f2fe" stopOpacity="0.75" />
        <stop offset="100%" stopColor="#00f2fe" stopOpacity="0.03" />
      </linearGradient>
      <linearGradient id="s1OceanGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#0369a1" stopOpacity="0.4" />
        <stop offset="100%" stopColor="#082f49" stopOpacity="0.85" />
      </linearGradient>
    </defs>

    {/* Background Grid */}
    <line x1="0" y1="42" x2="520" y2="42" stroke="rgba(56, 189, 248, 0.06)" strokeWidth="1" strokeDasharray="4 4" />
    <line x1="0" y1="138" x2="520" y2="138" stroke="rgba(56, 189, 248, 0.06)" strokeWidth="1" strokeDasharray="4 4" />
    <line x1="260" y1="0" x2="260" y2="220" stroke="rgba(56, 189, 248, 0.06)" strokeWidth="1" strokeDasharray="4 4" />

    {/* Sentinel-1 Satellite Platform */}
    <g transform="translate(62, 20)">
      {/* Solar Arrays */}
      <rect x="-44" y="-6" width="34" height="12" rx="1.5" fill="#0284c7" stroke="#38bdf8" strokeWidth="1" />
      <line x1="-27" y1="-6" x2="-27" y2="6" stroke="#38bdf8" strokeWidth="0.8" />
      <rect x="18" y="-6" width="34" height="12" rx="1.5" fill="#0284c7" stroke="#38bdf8" strokeWidth="1" />
      <line x1="35" y1="-6" x2="35" y2="6" stroke="#38bdf8" strokeWidth="0.8" />
      {/* Main Bus */}
      <rect x="-10" y="-8" width="20" height="16" rx="2" fill="#0f172a" stroke="#00f2fe" strokeWidth="1.5" />
      {/* SAR Antenna Array Bar */}
      <rect x="-24" y="8" width="48" height="5" rx="1.5" fill="#38bdf8" stroke="#00f2fe" strokeWidth="1.2" />
      <circle cx="0" cy="0" r="2.5" fill="#00f2fe" />
      <text x="0" y="-12" fill="#00f2fe" fontFamily="'Space Grotesk', sans-serif" fontSize="12" fontWeight="bold" textAnchor="middle">SENTINEL-1A/B SAR (5.405 GHz C-BAND)</text>
    </g>

    {/* Microwave Transmission Cone (Active Pulses) */}
    <polygon points="62,33 125,138 355,138" fill="url(#s1RadarBeam)" />
    {/* Pulsed Wavefront Arcs */}
    <path d="M 78 50 A 30 30 0 0 1 97 66" stroke="#00f2fe" strokeWidth="1.75" strokeLinecap="round" opacity="0.9" />
    <path d="M 98 70 A 60 60 0 0 1 130 98" stroke="#00f2fe" strokeWidth="1.75" strokeLinecap="round" opacity="0.7" />
    <path d="M 120 94 A 100 100 0 0 1 177 132" stroke="#00f2fe" strokeWidth="1.75" strokeLinecap="round" opacity="0.5" />

    {/* Incidence Angle Line & Text */}
    <line x1="62" y1="33" x2="195" y2="138" stroke="rgba(0, 242, 254, 0.6)" strokeWidth="1.2" strokeDasharray="3 3" />
    <text x="120" y="78" fill="#38bdf8" fontFamily="'JetBrains Mono', monospace" fontSize="11" fontWeight="bold">θ = 34.2° INCIDENCE</text>

    {/* Ocean Body */}
    <rect x="0" y="138" width="520" height="82" fill="url(#s1OceanGrad)" />

    {/* ZONE A: Clean Rough Ocean Waves (Left side: 0 to 216) */}
    <path d="M 0 138 Q 18 130, 36 138 T 72 138 T 108 138 T 144 138 T 180 138 T 216 138" stroke="#38bdf8" strokeWidth="2.2" fill="none" />
    {/* Bragg Backscatter Echoes Returning to Satellite */}
    <path d="M 150 138 L 74 33" stroke="#10b981" strokeWidth="1.75" strokeDasharray="5 3" />
    <path d="M 105 138 L 64 33" stroke="#10b981" strokeWidth="1.4" strokeDasharray="5 3" opacity="0.8" />
    <text x="105" y="155" fill="#38bdf8" fontFamily="'Space Grotesk', sans-serif" fontSize="12" fontWeight="bold" textAnchor="middle">ROUGH WATER (Bragg λ=4.8cm)</text>
    <text x="105" y="171" fill="#10b981" fontFamily="'JetBrains Mono', monospace" fontSize="11" fontWeight="bold" textAnchor="middle">BRIGHT ECHO: -14.2 dB</text>

    {/* ZONE B: Oil Spill Monolayer Damping (Right side: 216 to 500) */}
    <line x1="216" y1="138" x2="500" y2="138" stroke="#ef4444" strokeWidth="3.5" />
    {/* Specular Reflection Bouncing Away to Space */}
    <path d="M 285 138 L 455 48" stroke="#ef4444" strokeWidth="1.75" strokeDasharray="5 3" />
    <text x="355" y="155" fill="#ef4444" fontFamily="'Space Grotesk', sans-serif" fontSize="12" fontWeight="bold" textAnchor="middle">OIL SLICK (CAPILLARY DAMPED)</text>
    <text x="355" y="171" fill="#fca5a5" fontFamily="'JetBrains Mono', monospace" fontSize="11" fontWeight="bold" textAnchor="middle">SPECULAR LOSS: -21.8 dB (NO ECHO)</text>

    {/* Annotations Badge */}
    <g transform="translate(340, 50)">
      <rect x="0" y="0" width="172" height="30" rx="4" fill="rgba(3, 7, 18, 0.8)" stroke="rgba(239, 68, 68, 0.35)" strokeWidth="1" />
      <text x="8" y="13" fill="#ef4444" fontFamily="'JetBrains Mono', monospace" fontSize="10.5" fontWeight="bold">● SPECULAR REFLECTION</text>
      <text x="8" y="25" fill="#cbd5e1" fontFamily="'JetBrains Mono', monospace" fontSize="9.5">Radar pulse bounces away</text>
    </g>

    {/* Backscatter Power Trace Inset along bottom */}
    <g transform="translate(10, 184)">
      <rect x="0" y="0" width="500" height="28" rx="4" fill="rgba(2, 6, 18, 0.65)" stroke="rgba(56, 189, 248, 0.12)" strokeWidth="1" />
      <text x="10" y="18" fill="#64748b" fontFamily="'JetBrains Mono', monospace" fontSize="11" fontWeight="bold">SIGMA-0 (dB):</text>
      <path d="M 115 14 L 210 14 Q 225 22, 245 22 L 440 22 Q 460 14, 485 14" stroke="#00f2fe" strokeWidth="1.75" fill="none" />
      <circle cx="210" cy="14" r="2.5" fill="#10b981" />
      <circle cx="340" cy="22" r="3" fill="#ef4444" />
      <text x="145" y="11" fill="#10b981" fontFamily="'JetBrains Mono', monospace" fontSize="10.5" fontWeight="600">-14.2 dB (Sea)</text>
      <text x="295" y="18" fill="#ef4444" fontFamily="'JetBrains Mono', monospace" fontSize="11" fontWeight="bold">-21.8 dB (Δ -7.6 dB DARK SPOT)</text>
    </g>
  </svg>
);

/* ─────────────────────────────────────────────────────────────
   DIAGRAM 2: SENTINEL-2 OPTICAL MSI MULTISPECTRAL & FAI
   ───────────────────────────────────────────────────────────── */
const Sentinel2Diagram: React.FC = () => (
  <svg style={{ width: '100%', height: '100%' }} viewBox="0 0 520 220" fill="none">
    <defs>
      <linearGradient id="s2SunRays" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fde047" stopOpacity="0.65" />
        <stop offset="100%" stopColor="#fde047" stopOpacity="0.03" />
      </linearGradient>
      <linearGradient id="s2OceanGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#0284c7" stopOpacity="0.35" />
        <stop offset="100%" stopColor="#082f49" stopOpacity="0.85" />
      </linearGradient>
    </defs>

    {/* Background Grid */}
    <line x1="0" y1="42" x2="520" y2="42" stroke="rgba(56, 189, 248, 0.06)" strokeWidth="1" strokeDasharray="4 4" />
    <line x1="0" y1="138" x2="520" y2="138" stroke="rgba(56, 189, 248, 0.06)" strokeWidth="1" strokeDasharray="4 4" />
    <line x1="260" y1="0" x2="260" y2="220" stroke="rgba(56, 189, 248, 0.06)" strokeWidth="1" strokeDasharray="4 4" />

    {/* Solar Source */}
    <g transform="translate(50, 22)">
      <circle cx="0" cy="0" r="14" fill="#eab308" opacity="0.25" />
      <circle cx="0" cy="0" r="9" fill="#facc15" />
      <line x1="-15" y1="0" x2="15" y2="0" stroke="#fef08a" strokeWidth="1.2" />
      <line x1="0" y1="-15" x2="0" y2="15" stroke="#fef08a" strokeWidth="1.2" />
      <line x1="-11" y1="-11" x2="11" y2="11" stroke="#fef08a" strokeWidth="1" />
      <line x1="-11" y1="11" x2="11" y2="-11" stroke="#fef08a" strokeWidth="1" />
      <text x="0" y="-14" fill="#facc15" fontFamily="'Space Grotesk', sans-serif" fontSize="12" fontWeight="bold" textAnchor="middle">SOLAR BROADBAND FLUX (E₀)</text>
    </g>

    {/* Solar Illumination Cone */}
    <polygon points="50,26 10,138 350,138" fill="url(#s2SunRays)" />
    <line x1="50" y1="26" x2="160" y2="138" stroke="rgba(250, 204, 21, 0.5)" strokeWidth="1.2" strokeDasharray="3 3" />
    <line x1="50" y1="26" x2="300" y2="138" stroke="rgba(250, 204, 21, 0.5)" strokeWidth="1.2" strokeDasharray="3 3" />

    {/* Sentinel-2 Satellite Platform with Multispectral Payload */}
    <g transform="translate(420, 20)">
      <rect x="-42" y="-6" width="28" height="12" rx="1.5" fill="#0284c7" stroke="#38bdf8" strokeWidth="1" />
      <rect x="-12" y="-9" width="24" height="18" rx="2" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.5" />
      <polygon points="-8,9 8,9 12,16 -12,16" fill="#38bdf8" stroke="#00f2fe" strokeWidth="1" />
      <circle cx="0" cy="0" r="2.5" fill="#38bdf8" />
      <text x="0" y="-12" fill="#38bdf8" fontFamily="'Space Grotesk', sans-serif" fontSize="12" fontWeight="bold" textAnchor="middle">SENTINEL-2 MSI TELESCOPE</text>

      {/* Internal Prism / Dispersive Sensor Simulation */}
      <g transform="translate(0, 18)">
        <polygon points="0,0 -9,12 9,12" fill="rgba(56, 189, 248, 0.4)" stroke="#38bdf8" strokeWidth="0.8" />
        <line x1="-4" y1="12" x2="-16" y2="24" stroke="#ef4444" strokeWidth="1.75" />
        <line x1="0" y1="12" x2="0" y2="24" stroke="#a855f7" strokeWidth="1.75" />
        <line x1="4" y1="12" x2="16" y2="24" stroke="#fbbf24" strokeWidth="1.75" />
        <text x="-18" y="34" fill="#ef4444" fontFamily="'JetBrains Mono', monospace" fontSize="9.5" fontWeight="600">B4(665)</text>
        <text x="0" y="34" fill="#a855f7" fontFamily="'JetBrains Mono', monospace" fontSize="9.5" fontWeight="600" textAnchor="middle">B8(842)</text>
        <text x="18" y="34" fill="#fbbf24" fontFamily="'JetBrains Mono', monospace" fontSize="9.5" fontWeight="600">B11(1.6µ)</text>
      </g>
    </g>

    {/* Ocean Body */}
    <rect x="0" y="138" width="520" height="82" fill="url(#s2OceanGrad)" />

    {/* Clean Water (Left: 0 to 210) -> NIR Absorbed */}
    <path d="M 0 138 Q 24 133, 48 138 T 96 138 T 144 138 T 210 138" stroke="#38bdf8" strokeWidth="1.75" fill="none" />
    <path d="M 110 138 L 110 168" stroke="#0284c7" strokeWidth="1.5" strokeDasharray="3 2" />
    <text x="105" y="155" fill="#38bdf8" fontFamily="'Space Grotesk', sans-serif" fontSize="12" fontWeight="bold" textAnchor="middle">CLEAN SEAWATER</text>
    <text x="105" y="171" fill="#94a3b8" fontFamily="'JetBrains Mono', monospace" fontSize="11" textAnchor="middle">Deep NIR Absorption (R ≈ 0.01)</text>

    {/* Hydrocarbon Slick (Right: 210 to 495) -> High Sunglint & FAI */}
    <rect x="210" y="136" width="285" height="5" rx="2.5" fill="url(#s2OceanGrad)" stroke="#f59e0b" strokeWidth="2.5" />
    <path d="M 285 136 L 415 38" stroke="#f59e0b" strokeWidth="1.75" strokeDasharray="5 3" />
    <path d="M 350 136 L 422 38" stroke="#a855f7" strokeWidth="1.75" strokeDasharray="5 3" />
    <text x="350" y="155" fill="#f59e0b" fontFamily="'Space Grotesk', sans-serif" fontSize="12" fontWeight="bold" textAnchor="middle">OIL EMULSION SUNGLINT</text>
    <text x="350" y="171" fill="#c084fc" fontFamily="'JetBrains Mono', monospace" fontSize="11" fontWeight="bold" textAnchor="middle">FAI INDEX PEAK: +0.072 (B8 NIR)</text>

    {/* Spectral Signature Profile Inset along bottom */}
    <g transform="translate(10, 184)">
      <rect x="0" y="0" width="500" height="28" rx="4" fill="rgba(2, 6, 18, 0.65)" stroke="rgba(56, 189, 248, 0.12)" strokeWidth="1" />
      <text x="10" y="18" fill="#64748b" fontFamily="'JetBrains Mono', monospace" fontSize="11" fontWeight="bold">SPECTRAL FAI:</text>
      <path d="M 115 19 L 200 19 L 290 20 L 480 20" stroke="#38bdf8" strokeWidth="1.4" strokeDasharray="4 2" />
      <path d="M 115 19 L 200 16 L 290 6 L 390 13 L 480 17" stroke="#f59e0b" strokeWidth="2" fill="none" />
      <circle cx="290" cy="6" r="3" fill="#a855f7" />
      <text x="135" y="12" fill="#38bdf8" fontFamily="'JetBrains Mono', monospace" fontSize="10.5">Water Baseline</text>
      <text x="305" y="10" fill="#f59e0b" fontFamily="'JetBrains Mono', monospace" fontSize="11" fontWeight="bold">Oil FAI Peak (0.084) @ 842nm B8</text>
    </g>
  </svg>
);

/* ─────────────────────────────────────────────────────────────
   DIAGRAM 3: LANDSAT-8/9 TIRS THERMAL INFRARED SPLIT-WINDOW
   ───────────────────────────────────────────────────────────── */
const LandsatDiagram: React.FC = () => (
  <svg style={{ width: '100%', height: '100%' }} viewBox="0 0 520 220" fill="none">
    <defs>
      <linearGradient id="lsThermalHeat" x1="0%" y1="100%" x2="0%" y2="0%">
        <stop offset="0%" stopColor="#ef4444" stopOpacity="0.85" />
        <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.45" />
        <stop offset="100%" stopColor="#ef4444" stopOpacity="0.0" />
      </linearGradient>
      <linearGradient id="lsCoolSea" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#0369a1" stopOpacity="0.5" />
        <stop offset="100%" stopColor="#082f49" stopOpacity="0.85" />
      </linearGradient>
    </defs>

    {/* Background Grid */}
    <line x1="0" y1="42" x2="520" y2="42" stroke="rgba(56, 189, 248, 0.06)" strokeWidth="1" strokeDasharray="4 4" />
    <line x1="0" y1="138" x2="520" y2="138" stroke="rgba(56, 189, 248, 0.06)" strokeWidth="1" strokeDasharray="4 4" />
    <line x1="260" y1="0" x2="260" y2="220" stroke="rgba(56, 189, 248, 0.06)" strokeWidth="1" strokeDasharray="4 4" />

    {/* Landsat-8/9 Satellite Platform with Cryogenic TIRS */}
    <g transform="translate(410, 20)">
      <rect x="-46" y="-7" width="30" height="14" rx="1.5" fill="#0284c7" stroke="#38bdf8" strokeWidth="1" />
      <rect x="-12" y="-10" width="26" height="20" rx="2" fill="#0f172a" stroke="#fbbf24" strokeWidth="1.5" />
      <rect x="-9" y="10" width="20" height="9" rx="1.5" fill="#1e293b" stroke="#f59e0b" strokeWidth="1.2" />
      <circle cx="1" cy="0" r="2.5" fill="#fbbf24" />
      <text x="0" y="-13" fill="#fbbf24" fontFamily="'Space Grotesk', sans-serif" fontSize="12" fontWeight="bold" textAnchor="middle">LANDSAT TIRS (43K QWIP)</text>

      {/* Split-Window Detector Array Badge */}
      <g transform="translate(0, 22)">
        <rect x="-42" y="2" width="84" height="17" rx="3" fill="rgba(3, 7, 18, 0.8)" stroke="rgba(251, 191, 36, 0.4)" strokeWidth="0.9" />
        <text x="-36" y="14" fill="#fbbf24" fontFamily="'JetBrains Mono', monospace" fontSize="10" fontWeight="600">B10(10.8µm)</text>
        <text x="8" y="14" fill="#38bdf8" fontFamily="'JetBrains Mono', monospace" fontSize="10" fontWeight="600">B11(12.0µm)</text>
      </g>
    </g>

    {/* Ocean Body */}
    <rect x="0" y="138" width="520" height="82" fill="url(#lsCoolSea)" />

    {/* Ambient Seawater (Left: 0 to 210) -> 19.4°C SST */}
    <path d="M 0 138 Q 24 134, 48 138 T 96 138 T 144 138 T 210 138" stroke="#38bdf8" strokeWidth="1.75" fill="none" />
    <path d="M 100 132 Q 105 106, 100 80 T 105 46" stroke="#38bdf8" strokeWidth="1.2" strokeDasharray="4 3" opacity="0.6" />
    <text x="105" y="155" fill="#38bdf8" fontFamily="'Space Grotesk', sans-serif" fontSize="12" fontWeight="bold" textAnchor="middle">AMBIENT SEA SKIN: 19.4°C</text>
    <text x="105" y="171" fill="#94a3b8" fontFamily="'JetBrains Mono', monospace" fontSize="11" textAnchor="middle">Baseline Blackbody Flux (292.5 K)</text>

    {/* Thick Crude Emulsion (Right: 210 to 495) -> Solar Heat Absorption -> Hotspot */}
    <rect x="210" y="135" width="285" height="7" rx="3.5" fill="url(#lsThermalHeat)" stroke="#ef4444" strokeWidth="2.5" />
    <path d="M 260 132 Q 265 94, 272 60 T 340 32" stroke="#ef4444" strokeWidth="2" strokeDasharray="5 3" />
    <path d="M 330 132 Q 338 94, 350 60 T 400 32" stroke="#f59e0b" strokeWidth="2" strokeDasharray="5 3" />
    <path d="M 390 132 Q 396 94, 408 60 T 415 32" stroke="#ef4444" strokeWidth="1.75" strokeDasharray="5 3" />

    <text x="350" y="155" fill="#ef4444" fontFamily="'Space Grotesk', sans-serif" fontSize="12" fontWeight="bold" textAnchor="middle">THICK CRUDE CORE: 20.6°C</text>
    <text x="350" y="171" fill="#fbbf24" fontFamily="'JetBrains Mono', monospace" fontSize="11" fontWeight="bold" textAnchor="middle">THERMAL ANOMALY: +1.2 K (Solar Absorber)</text>

    {/* Thermal Gradient Inset along bottom */}
    <g transform="translate(10, 184)">
      <rect x="0" y="0" width="500" height="28" rx="4" fill="rgba(2, 6, 18, 0.65)" stroke="rgba(251, 191, 36, 0.12)" strokeWidth="1" />
      <text x="10" y="18" fill="#64748b" fontFamily="'JetBrains Mono', monospace" fontSize="11" fontWeight="bold">SST TRANSECT (°C):</text>
      <path d="M 135 18 L 220 18 Q 245 6, 325 6 Q 405 6, 430 18 L 485 18" stroke="#fbbf24" strokeWidth="2" fill="none" />
      <circle cx="325" cy="6" r="3" fill="#ef4444" />
      <text x="155" y="13" fill="#38bdf8" fontFamily="'JetBrains Mono', monospace" fontSize="10.5">19.4°C Water</text>
      <text x="338" y="12" fill="#ef4444" fontFamily="'JetBrains Mono', monospace" fontSize="11" fontWeight="bold">20.6°C Slick Core (+1.2 K ΔT)</text>
    </g>
  </svg>
);

/* ─────────────────────────────────────────────────────────────
   DIAGRAM 4: ISRO EOS-06 SCATTEROMETER & CONICAL WIND GATING
   ───────────────────────────────────────────────────────────── */
const EOS06Diagram: React.FC = () => (
  <svg style={{ width: '100%', height: '100%' }} viewBox="0 0 520 220" fill="none">
    <defs>
      <linearGradient id="eosInnerCone" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#00f2fe" stopOpacity="0.45" />
        <stop offset="100%" stopColor="#00f2fe" stopOpacity="0.03" />
      </linearGradient>
      <linearGradient id="eosOuterCone" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#c084fc" stopOpacity="0.45" />
        <stop offset="100%" stopColor="#c084fc" stopOpacity="0.03" />
      </linearGradient>
      <linearGradient id="eosOceanGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#0369a1" stopOpacity="0.4" />
        <stop offset="100%" stopColor="#082f49" stopOpacity="0.85" />
      </linearGradient>
    </defs>

    {/* Background Grid */}
    <line x1="0" y1="42" x2="520" y2="42" stroke="rgba(56, 189, 248, 0.06)" strokeWidth="1" strokeDasharray="4 4" />
    <line x1="0" y1="138" x2="520" y2="138" stroke="rgba(56, 189, 248, 0.06)" strokeWidth="1" strokeDasharray="4 4" />
    <line x1="260" y1="0" x2="260" y2="220" stroke="rgba(56, 189, 248, 0.06)" strokeWidth="1" strokeDasharray="4 4" />

    {/* ISRO EOS-06 Satellite Platform with Rotating Scatterometer Dish */}
    <g transform="translate(260, 18)">
      <rect x="-65" y="-6" width="34" height="12" rx="1.5" fill="#0284c7" stroke="#38bdf8" strokeWidth="1" />
      <rect x="31" y="-6" width="34" height="12" rx="1.5" fill="#0284c7" stroke="#38bdf8" strokeWidth="1" />
      <rect x="-14" y="-8" width="28" height="16" rx="2" fill="#0f172a" stroke="#c084fc" strokeWidth="1.5" />
      <ellipse cx="0" cy="13" rx="17" ry="5" fill="#1e293b" stroke="#c084fc" strokeWidth="1.5" />
      <line x1="0" y1="8" x2="0" y2="13" stroke="#c084fc" strokeWidth="1.5" />
      <circle cx="0" cy="0" r="2.5" fill="#c084fc" />
      <text x="0" y="-12" fill="#c084fc" fontFamily="'Space Grotesk', sans-serif" fontSize="12" fontWeight="bold" textAnchor="middle">ISRO EOS-06 OSCAT (13.515 GHz Ku-Band)</text>
      <text x="0" y="26" fill="#38bdf8" fontFamily="'JetBrains Mono', monospace" fontSize="10.5" fontWeight="600" textAnchor="middle">⟳ 20.5 RPM CONICAL SCAN</text>
    </g>

    {/* Dual Conical Rotating Radar Beams */}
    <polygon points="260,31 150,138 370,138" fill="url(#eosInnerCone)" />
    <line x1="260" y1="31" x2="150" y2="138" stroke="#00f2fe" strokeWidth="1.2" strokeDasharray="4 3" />
    <line x1="260" y1="31" x2="370" y2="138" stroke="#00f2fe" strokeWidth="1.2" strokeDasharray="4 3" />
    <polygon points="260,31 70,138 450,138" fill="url(#eosOuterCone)" />
    <line x1="260" y1="31" x2="70" y2="138" stroke="#c084fc" strokeWidth="1.4" strokeDasharray="5 3" />
    <line x1="260" y1="31" x2="450" y2="138" stroke="#c084fc" strokeWidth="1.4" strokeDasharray="5 3" />

    {/* Ocean Body */}
    <rect x="0" y="138" width="520" height="82" fill="url(#eosOceanGrad)" />

    {/* Conical Swath Footprint Ellipses on Ocean */}
    <ellipse cx="260" cy="138" rx="110" ry="9" fill="none" stroke="#00f2fe" strokeWidth="1.75" />
    <ellipse cx="260" cy="138" rx="190" ry="14" fill="none" stroke="#c084fc" strokeWidth="1.75" strokeDasharray="5 3" />

    {/* 2D Wind Vector Field Grid on Sea Surface */}
    <g transform="translate(100, 154)">
      <line x1="14" y1="7" x2="-10" y2="-7" stroke="#38bdf8" strokeWidth="1.75" />
      <polygon points="-10,-7 -4,-3 -7,0" fill="#38bdf8" />
    </g>
    <g transform="translate(220, 154)">
      <line x1="14" y1="7" x2="-10" y2="-7" stroke="#10b981" strokeWidth="2.2" />
      <polygon points="-10,-7 -4,-3 -7,0" fill="#10b981" />
    </g>
    <g transform="translate(340, 154)">
      <line x1="14" y1="7" x2="-10" y2="-7" stroke="#10b981" strokeWidth="2.2" />
      <polygon points="-10,-7 -4,-3 -7,0" fill="#10b981" />
    </g>
    <g transform="translate(430, 154)">
      <line x1="14" y1="7" x2="-10" y2="-7" stroke="#38bdf8" strokeWidth="1.75" />
      <polygon points="-10,-7 -4,-3 -7,0" fill="#38bdf8" />
    </g>

    <text x="260" y="167" fill="#10b981" fontFamily="'Space Grotesk', sans-serif" fontSize="11.5" fontWeight="bold" textAnchor="middle">
      SURFACE WIND FIELD: 4.8 m/s @ 312° NW (VALIDATED GMF INVERSION)
    </text>

    {/* Wind Speed Gating Status Gauge Inset along bottom */}
    <g transform="translate(10, 184)">
      <rect x="0" y="0" width="500" height="28" rx="4" fill="rgba(2, 6, 18, 0.65)" stroke="rgba(192, 132, 252, 0.12)" strokeWidth="1" />
      <text x="8" y="18" fill="#64748b" fontFamily="'JetBrains Mono', monospace" fontSize="10.5" fontWeight="bold">WIND GATE:</text>
      <rect x="90" y="5" width="80" height="18" rx="2.5" fill="rgba(239, 68, 68, 0.2)" stroke="rgba(239, 68, 68, 0.4)" strokeWidth="1" />
      <text x="130" y="17" fill="#ef4444" fontFamily="'JetBrains Mono', monospace" fontSize="9.5" textAnchor="middle">&lt;3m/s (Calm)</text>

      <rect x="176" y="4" width="220" height="20" rx="2.5" fill="rgba(16, 185, 129, 0.25)" stroke="#10b981" strokeWidth="1.2" />
      <text x="286" y="18" fill="#10b981" fontFamily="'JetBrains Mono', monospace" fontSize="10.5" fontWeight="bold" textAnchor="middle">● 3–12 m/s VALID OIL WINDOW [4.8 m/s NW]</text>

      <rect x="402" y="5" width="90" height="18" rx="2.5" fill="rgba(100, 116, 139, 0.2)" stroke="rgba(100, 116, 139, 0.3)" strokeWidth="1" />
      <text x="447" y="17" fill="#94a3b8" fontFamily="'JetBrains Mono', monospace" fontSize="9.5" textAnchor="middle">&gt;12m/s (Dispersion)</text>
    </g>
  </svg>
);

export const WatchdogSimulation: React.FC<WatchdogSimulationProps> = ({
  onProceedToGlobe,
  onLaunchDetection,
}) => {
  const [selectedSensor, setSelectedSensor] = useState<SensorKey>('sentinel1');
  const [activeCycle, setActiveCycle] = useState<number>(2); // 0: 14:00Z, 1: 14:30Z, 2: 15:00Z
  const [isStreaming, setIsStreaming] = useState<boolean>(true);
  const terminalScreenRef = useRef<HTMLDivElement>(null);

  const sensorData: Record<SensorKey, SensorMetadata> = {
    sentinel1: {
      title: 'Sentinel-1A/B C-Band SAR Payload',
      spec: '5.405 GHz • VV+VH Dual-Pol • 250km Swath',
      summary: 'Hydrocarbon viscoelastic monolayer dampens high-frequency ocean capillary-gravity ripples, eliminating Bragg scatter to produce dark radar signatures (< -22 dB).',
      clutter: '-14.2 dB',
      slick: '-21.8 dB',
      contrast: '-7.6 dB',
      channel: 'PRIMARY RADAR',
      mechanismTitle: 'ACTIVE MICROWAVE BRAGG BACKSCATTER & CAPILLARY DAMPING',
      physicsFormula: 'λ_Bragg = λ_radar / (2·sin θ) ≈ 4.8 cm | σ₀ Drop: -7.6 dB',
      metric1Label: 'Bragg Resonance',
      metric1Value: '4.8 cm (C-Band)',
      metric2Label: 'Incidence Angle',
      metric2Value: '20° – 45° (IW)',
      metric3Label: 'Polarization',
      metric3Value: 'VV + VH Dual-Pol',
      orbitGeometry: 'Sun-sync 693 km • 12d repeat',
      inputMode: 'Active Microwave SAR (5.405 GHz)',
    },
    sentinel2: {
      title: 'Sentinel-2A/B MSI Optical Multispectral',
      spec: 'B2, B3, B4, B8, B11 • 13 Spectral Bands • 290km Swath',
      summary: 'Measures sunglint reflectance gradients and Floating Algae Index (FAI) to cross-validate SAR dark spots against biogenic algae and cloud shadows.',
      clutter: '0.012 FAI',
      slick: '0.084 FAI',
      contrast: '+0.072 FAI',
      channel: 'OPTICAL MSI',
      mechanismTitle: 'PASSIVE SOLAR REFLECTANCE & FLOATING ALGAE INDEX (FAI)',
      physicsFormula: 'FAI = R_842 - [R_665 + (R_1610 - R_665) · (842-665)/(1610-665)]',
      metric1Label: 'B4 (Red)',
      metric1Value: '665 nm (10m)',
      metric2Label: 'B8 (NIR)',
      metric2Value: '842 nm (10m)',
      metric3Label: 'B11 (SWIR)',
      metric3Value: '1610 nm (20m)',
      orbitGeometry: 'Sun-sync 786 km • 5d repeat',
      inputMode: 'Passive Solar Reflectance (13 Bands)',
    },
    landsat: {
      title: 'Landsat-8/9 TIRS Thermal Infrared',
      spec: 'B10 (10.8 µm) & B11 (12.0 µm) • 185km Swath',
      summary: 'Calibrated surface thermal infrared: Thick crude emulsions absorb solar radiation, appearing 0.5K–1.8K warmer than ambient seawater during daytime passes.',
      clutter: '19.4°C SST',
      slick: '20.6°C Core',
      contrast: '+1.2 K Δ',
      channel: 'THERMAL IR',
      mechanismTitle: 'PASSIVE LONGWAVE THERMAL INFRARED (TIRS) SPLIT-WINDOW',
      physicsFormula: 'ΔT_surface = T_B10 - T_SST = +1.2 K (Daytime Solar Absorber)',
      metric1Label: 'TIRS Band 10',
      metric1Value: '10.60 – 11.19 µm',
      metric2Label: 'TIRS Band 11',
      metric2Value: '11.50 – 12.51 µm',
      metric3Label: 'Cryo Cooling',
      metric3Value: '43 K QWIP Array',
      orbitGeometry: 'Sun-sync 705 km • 16d repeat',
      inputMode: 'Passive Thermal Blackbody Radiation',
    },
    eos06: {
      title: 'ISRO EOS-06 (Oceansat-3) Scatterometer',
      spec: '13.515 GHz Ku-Band • 1400km Conical Swath',
      summary: 'Real-time 10m ocean surface wind vectors: Winds between 3–12 m/s confirm valid petroleum damping; calm winds < 3 m/s reject biogenic look-alikes.',
      clutter: '4.8 m/s NW',
      slick: 'Vector Valid',
      contrast: 'Wind Verified',
      channel: 'OCEAN WINDS',
      mechanismTitle: 'ACTIVE Ku-BAND CONICAL SCATTEROMETRY & WIND VECTOR GATING',
      physicsFormula: 'σ₀ = f(U₁₀, ϕ, θ) | Valid SAR Oil Gate: 3.0 m/s ≤ U₁₀ ≤ 12.0 m/s',
      metric1Label: 'Conical Beams',
      metric1Value: 'Inner HH 49° / Outer VV 57°',
      metric2Label: 'Rotational Rate',
      metric2Value: '20.5 RPM (Ku-Band)',
      metric3Label: 'Wind Gate Status',
      metric3Value: '4.8 m/s (Optimal 3-12 m/s)',
      orbitGeometry: 'Sun-sync 720 km • 2d repeat',
      inputMode: 'Active Ku-Band Conical Radar',
    },
  };

  const [logs, setLogs] = useState<Array<{
    id: string;
    time: string;
    tag: string;
    color: string;
    message: string;
  }>>([
    { id: '1', time: '15:00:01Z', tag: 'DAEMON', color: '#00f2fe', message: 'Copernicus STAC Daemon v4.8 active. 14 corridor regions synchronized.' },
    { id: '2', time: '15:00:14Z', tag: 'STAC', color: '#38bdf8', message: 'Querying OpenSearch catalogue: [T-30m → T-0m] ingestion window.' },
    { id: '3', time: '15:00:26Z', tag: 'TIER-1', color: '#38bdf8', message: 'Screened 2.1 MB quicklook preview. GSHHG shoreline vector mask applied.' },
    { id: '4', time: '15:00:40Z', tag: 'CFAR', color: '#fbbf24', message: 'Adaptive 2-param CFAR anomaly flagged: -8.4 dB dip below clutter baseline.' },
    { id: '5', time: '15:01:05Z', tag: 'TIER-2', color: '#a855f7', message: 'CDSE Process API: Targeted 10m sub-patch extracted (4.8 MB payload).' },
    { id: '6', time: '15:01:28Z', tag: 'AI-UNET', color: '#10b981', message: '7x7 Gamma-MAP despeckled. Dual-pol U-Net segmentation complete (IoU: 0.887).' },
    { id: '7', time: '15:01:42Z', tag: 'ALERT', color: '#ef4444', message: 'Marine petroleum slick confirmed. Area: 42.6 km² | Confidence: 96.4%.' },
    { id: '8', time: '15:02:10Z', tag: 'WIND', color: '#38bdf8', message: 'ISRO scatterometer wind: 4.8 m/s @ 312° NW. Look-alike rejection passed.' },
  ]);

  // Auto-scroll terminal
  useEffect(() => {
    if (terminalScreenRef.current) {
      terminalScreenRef.current.scrollTop = terminalScreenRef.current.scrollHeight;
    }
  }, [logs]);

  // Live background log emission
  useEffect(() => {
    if (!isStreaming) return;
    const pool = [
      { tag: 'STAC', color: '#00f2fe', message: 'Heartbeat: Copernicus OpenSearch gateway responsive (190ms latency).' },
      { tag: 'EOS-06', color: '#38bdf8', message: 'ISRO scatterometer wind vector: 4.8 m/s @ 312° NW across shipping lane.' },
      { tag: 'CFAR', color: '#fbbf24', message: 'Background clutter recalibrated: μ = -14.2 dB, σ = 1.84 dB.' },
      { tag: 'SAVINGS', color: '#10b981', message: 'Bandwidth optimization active: 99.3% transfer conserved.' },
      { tag: 'TIRS', color: '#fbbf24', message: 'Landsat-8 Band 10 thermal calibrated: Sea surface baseline 19.4°C.' },
      { tag: 'MSI', color: '#38bdf8', message: 'Sentinel-2 optical cloud-screening index nominal across target BBOX.' },
      { tag: 'CDSE', color: '#a855f7', message: 'Process API sub-patch bounding box cache warm and ready.' },
      { tag: 'AIS', color: '#00f2fe', message: 'Corridor vessel transponder stream active: 18 commercial vessels tracked.' },
    ];

    const timer = setInterval(() => {
      const now = new Date();
      const timeStr = now.toISOString().substring(11, 19) + 'Z';
      const item = pool[Math.floor(Math.random() * pool.length)];
      setLogs((prev) => [
        ...prev.slice(-35),
        {
          id: `log-${Date.now()}-${Math.random()}`,
          time: timeStr,
          tag: item.tag,
          color: item.color,
          message: item.message,
        },
      ]);
    }, 3000);

    return () => clearInterval(timer);
  }, [isStreaming]);

  const triggerSimulateSweep = () => {
    const now = new Date().toISOString().substring(11, 19) + 'Z';
    setLogs((prev) => [
      ...prev,
      { id: `swp-${Date.now()}`, time: now, tag: 'SWEEP', color: '#00f2fe', message: 'Manual 30-min orbit cycle triggered across 4 constellations...' },
    ]);
    setTimeout(() => {
      const t1 = new Date().toISOString().substring(11, 19) + 'Z';
      setLogs((prev) => [
        ...prev,
        { id: `t1-${Date.now()}`, time: t1, tag: 'TIER-1', color: '#38bdf8', message: 'GSHHG coastline mask applied. BBOX: -20.438°S, 57.745°E identified dark anomaly.' },
      ]);
    }, 450);
    setTimeout(() => {
      const t2 = new Date().toISOString().substring(11, 19) + 'Z';
      setLogs((prev) => [
        ...prev,
        { id: `t2-${Date.now()}`, time: t2, tag: 'TIER-2', color: '#a855f7', message: 'CDSE API retrieved 4.8 MB targeted sub-patch. U-Net score: 96.4% confident.' },
      ]);
    }, 900);
  };

  const resetConsole = () => {
    const now = new Date().toISOString().substring(11, 19) + 'Z';
    setLogs([
      { id: `r1-${Date.now()}`, time: now, tag: 'RESET', color: '#00f2fe', message: 'Daemon telemetry reset. Baseline cleared.' },
      { id: `r2-${Date.now()}`, time: now, tag: 'STAC', color: '#10b981', message: 'Reconnected to Copernicus OpenSearch Gateway.' },
    ]);
  };

  const handleSelectSensor = (key: SensorKey) => {
    setSelectedSensor(key);
    const now = new Date().toISOString().substring(11, 19) + 'Z';
    setLogs((prev) => [
      ...prev,
      { id: `usr-${Date.now()}`, time: now, tag: 'INSPECT', color: '#00f2fe', message: `Telemetry focused on: ${key.toUpperCase()} sensor payload.` },
    ]);
  };

  const handleSelectInterval = (index: number) => {
    setActiveCycle(index);
    const times = ['14:00Z', '14:30Z', '15:00Z'];
    const now = new Date().toISOString().substring(11, 19) + 'Z';
    setLogs((prev) => [
      ...prev,
      { id: `time-${Date.now()}`, time: now, tag: 'TIMELINE', color: '#38bdf8', message: `Timeline shifted to lookback cycle: ${times[index]}.` },
    ]);
  };

  const currentInspector = sensorData[selectedSensor];

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'radial-gradient(circle at 50% 0%, #08142a 0%, #030712 100%)',
      color: '#e2e8f0',
      overflow: 'hidden',
      userSelect: 'none',
      padding: '16px 22px',
      gap: '12px',
      boxSizing: 'border-box',
      fontFamily: "'Inter', -apple-system, sans-serif",
    }}>
      {/* ─────────────────────────────────────────────────────────────
          SECTION [A]: TACTICAL TOP BAR
         ───────────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 18px',
        borderRadius: '8px',
        background: 'rgba(9, 19, 37, 0.75)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(0, 242, 254, 0.2)',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* Glowing Cyber Radar Icon */}
          <div style={{
            position: 'relative',
            width: '38px',
            height: '38px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.2) 0%, rgba(56, 189, 248, 0.05) 100%)',
            border: '1px solid rgba(0, 242, 254, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 16px rgba(0, 242, 254, 0.25)',
          }}>
            <Radar size={20} color="#00f2fe" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '0.1em',
                color: '#38bdf8',
                textTransform: 'uppercase',
              }}>
                STAGE 0 // AUTONOMOUS WATCHDOG
              </span>
              <span style={{ color: '#334155' }}>•</span>
              <span style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '10px',
                color: '#94a3b8',
              }}>
                EPSG:4326 WGS-84
              </span>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '1px 6px',
                borderRadius: '9999px',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '9px',
                color: '#10b981',
                fontWeight: 700,
              }}>
                <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981' }} />
                DAEMON ONLINE
              </span>
            </div>

            <h1 style={{
              fontFamily: "'Space Grotesk', -apple-system, sans-serif",
              fontSize: '17px',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              background: 'linear-gradient(180deg, #ffffff 30%, #93c5fd 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              margin: '2px 0 0 0',
            }}>
              Multi-Constellation Continuous Ocean Watchdog
            </h1>
          </div>
        </div>

        {/* Global Action Cluster */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={onProceedToGlobe}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 18px',
              borderRadius: '6px',
              background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.15) 0%, rgba(56, 189, 248, 0.08) 100%)',
              color: '#e0fdff',
              border: '1px solid rgba(0, 242, 254, 0.4)',
              boxShadow: '0 0 16px rgba(0, 242, 254, 0.15)',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '12px',
              fontWeight: 700,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 0 24px rgba(0, 242, 254, 0.4)';
              e.currentTarget.style.borderColor = '#00f2fe';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 0 16px rgba(0, 242, 254, 0.15)';
              e.currentTarget.style.borderColor = 'rgba(0, 242, 254, 0.4)';
            }}
          >
            <Globe2 size={15} color="#00f2fe" />
            <span>Open 3D Ocean Globe</span>
            <ArrowRight size={14} color="#00f2fe" />
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION [B]: SENSOR RIBBON & NRT TIMELINE
         ───────────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 14px',
        borderRadius: '8px',
        background: 'rgba(9, 19, 37, 0.65)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        flexShrink: 0,
        gap: '12px',
      }}>
        {/* Sensor Instrument Selector Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {[
            { key: 'sentinel1' as SensorKey, name: 'Sentinel-1A/B', band: 'C-SAR Radar', color: '#00f2fe', tag: 'ACTIVE' },
            { key: 'sentinel2' as SensorKey, name: 'Sentinel-2A/B', band: 'Optical MSI', color: '#38bdf8', tag: 'POLLING' },
            { key: 'landsat' as SensorKey, name: 'Landsat-8/9', band: 'Thermal TIRS', color: '#fbbf24', tag: 'STANDBY' },
            { key: 'eos06' as SensorKey, name: 'EOS-06 Oceansat', band: 'Scatterometer', color: '#c084fc', tag: 'WINDS' },
          ].map((item) => {
            const isSelected = selectedSensor === item.key;
            return (
              <button
                key={item.key}
                onClick={() => handleSelectSensor(item.key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  background: isSelected ? 'rgba(14, 30, 58, 0.9)' : 'rgba(255, 255, 255, 0.03)',
                  border: isSelected ? `1px solid ${item.color}` : '1px solid rgba(255, 255, 255, 0.06)',
                  boxShadow: isSelected ? `0 0 14px ${item.color}35` : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <span style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  background: item.color,
                  boxShadow: isSelected ? `0 0 8px ${item.color}` : 'none',
                }} />
                <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', lineHeight: 1.15 }}>
                  <span style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: '12px',
                    fontWeight: 700,
                    color: isSelected ? '#ffffff' : '#94a3b8',
                  }}>
                    {item.name}
                  </span>
                  <span style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '10px',
                    color: isSelected ? item.color : '#64748b',
                  }}>
                    {item.band}
                  </span>
                </div>
                <span style={{
                  marginLeft: '4px',
                  padding: '2px 5px',
                  borderRadius: '3px',
                  background: 'rgba(0, 0, 0, 0.4)',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '9px',
                  fontWeight: 700,
                  color: isSelected ? item.color : '#64748b',
                  border: `1px solid ${isSelected ? item.color + '40' : 'rgba(255, 255, 255, 0.08)'}`,
                }}>
                  {item.tag}
                </span>
              </button>
            );
          })}
        </div>

        {/* 30-Min Lookback Stepper & Sweep Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: 'rgba(3, 7, 18, 0.85)',
            padding: '3px 5px',
            borderRadius: '6px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}>
            {[
              { cycle: 0, time: '14:00Z', label: '0 Candidates' },
              { cycle: 1, time: '14:30Z', label: 'Clean Transit' },
              { cycle: 2, time: '15:00Z', label: 'SAR SPILL DETECTED', isAlert: true },
            ].map((st) => {
              const isActive = activeCycle === st.cycle;
              return (
                <button
                  key={st.cycle}
                  onClick={() => handleSelectInterval(st.cycle)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '4px 10px',
                    borderRadius: '4px',
                    background: isActive
                      ? st.isAlert ? 'rgba(239, 68, 68, 0.2)' : 'rgba(0, 242, 254, 0.18)'
                      : 'transparent',
                    border: isActive
                      ? st.isAlert ? '1px solid #ef4444' : '1px solid rgba(0, 242, 254, 0.5)'
                      : '1px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {st.isAlert && isActive && (
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 6px #ef4444' }} />
                  )}
                  <span style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '11px',
                    fontWeight: 700,
                    color: isActive ? (st.isAlert ? '#fca5a5' : '#8ed5ff') : '#64748b',
                  }}>
                    {st.time}
                  </span>
                  <span style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '9px',
                    color: isActive ? (st.isAlert ? '#f87171' : '#38bdf8') : '#475569',
                    fontWeight: 600,
                  }}>
                    ({st.label})
                  </span>
                </button>
              );
            })}
          </div>

          <button
            onClick={triggerSimulateSweep}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '6px',
              background: 'rgba(14, 30, 58, 0.9)',
              color: '#38bdf8',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#1a3668')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(14, 30, 58, 0.9)')}
          >
            <PlayCircle size={14} color="#38bdf8" />
            <span>Simulate Sweep</span>
          </button>

          <button
            onClick={resetConsole}
            style={{
              padding: '6px 8px',
              borderRadius: '6px',
              background: 'rgba(14, 30, 58, 0.9)',
              color: '#64748b',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
            title="Reset Simulation"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          MAIN OPERATIONS DECK (ENLARGED DIAGRAM DECK & SLIM CONSOLE)
         ───────────────────────────────────────────────────────────── */}
      <div style={{
        flex: 1,
        minHeight: 0,
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) 280px',
        gap: '12px',
      }}>
        {/* ========== COLUMN LEFT: ARCHITECTURE & EXPANDED SENSOR INSPECTOR ========== */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          minHeight: 0,
        }}>
          {/* Two-Tier Bandwidth Architecture Card */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            padding: '10px 14px',
            borderRadius: '8px',
            background: 'rgba(9, 19, 37, 0.7)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(0, 242, 254, 0.18)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Zap size={15} color="#00f2fe" />
                <span style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: '13px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  color: '#e0fdff',
                }}>
                  Two-Tier Ingestion &amp; Bandwidth Architecture
                </span>
              </div>

              <span style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '10.5px',
                color: '#10b981',
                fontWeight: 700,
                background: 'rgba(16, 185, 129, 0.12)',
                padding: '2px 8px',
                borderRadius: '4px',
                border: '1px solid rgba(16, 185, 129, 0.3)',
              }}>
                99.3% BANDWIDTH SAVED
              </span>
            </div>

            {/* Tier 1 & Tier 2 Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {/* Tier 1 Quick Screen */}
              <div style={{
                padding: '8px 10px',
                borderRadius: '6px',
                background: 'rgba(13, 26, 49, 0.8)',
                border: '1px solid rgba(56, 189, 248, 0.2)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '6px',
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{
                      padding: '1px 5px',
                      borderRadius: '3px',
                      background: 'rgba(56, 189, 248, 0.15)',
                      color: '#38bdf8',
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: '10px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                    }}>
                      TIER 1: QUICK SCREEN
                    </span>
                    <span style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: '11px',
                      color: '#7bd0ff',
                      fontWeight: 800,
                    }}>
                      ~2.1 MB
                    </span>
                  </div>
                  <p style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '11px',
                    color: '#94a3b8',
                    lineHeight: 1.4,
                    margin: 0,
                  }}>
                    Low-resolution STAC quicklooks across 14 sea corridors screened via adaptive 2-param CFAR clutter baseline.
                  </p>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '3px 6px',
                  borderRadius: '4px',
                  background: 'rgba(3, 7, 18, 0.6)',
                  border: '1px solid rgba(56, 189, 248, 0.15)',
                }}>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9.5px', color: '#64748b', textTransform: 'uppercase' }}>
                    DECISION
                  </span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9.5px', color: '#10b981', fontWeight: 700 }}>
                    Clean &rarr; Standby / Dark &rarr; BBOX
                  </span>
                </div>
              </div>

              {/* Tier 2 Targeted Patch */}
              <div style={{
                padding: '8px 10px',
                borderRadius: '6px',
                background: 'rgba(13, 26, 49, 0.8)',
                border: '1px solid rgba(168, 85, 247, 0.25)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '6px',
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{
                      padding: '1px 5px',
                      borderRadius: '3px',
                      background: 'rgba(168, 85, 247, 0.15)',
                      color: '#c084fc',
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: '10px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                    }}>
                      TIER 2: TARGETED PATCH
                    </span>
                    <span style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: '11px',
                      color: '#c084fc',
                      fontWeight: 800,
                    }}>
                      ~4.8 MB
                    </span>
                  </div>
                  <p style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '11px',
                    color: '#94a3b8',
                    lineHeight: 1.4,
                    margin: 0,
                  }}>
                    Pulls native 10m SAR sub-bounding box via CDSE Process API for Gamma-MAP filtering, U-Net AI &amp; wind gating.
                  </p>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '3px 6px',
                  borderRadius: '4px',
                  background: 'rgba(3, 7, 18, 0.6)',
                  border: '1px solid rgba(168, 85, 247, 0.2)',
                }}>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9.5px', color: '#64748b', textTransform: 'uppercase' }}>
                    RESOLUTION
                  </span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9.5px', color: '#00f2fe', fontWeight: 700 }}>
                    10m GSD Dual-Pol (VV+VH)
                  </span>
                </div>
              </div>
            </div>

            {/* Bandwidth Comparison Strip */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '5px 10px',
              borderRadius: '6px',
              background: 'rgba(3, 7, 18, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '10.5px',
                  color: '#64748b',
                  textDecoration: 'line-through',
                }}>
                  Full Scene: 1,000 MB Egress
                </span>
                <span style={{ color: '#475569', fontSize: '11px' }}>&rarr;</span>
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '10.5px',
                  color: '#10b981',
                  fontWeight: 700,
                }}>
                  TARANG Ingestion: 6.9 MB Total
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981' }} />
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '10.5px',
                  color: '#10b981',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                }}>
                  993.1 MB BANDWIDTH CONSERVED
                </span>
              </div>
            </div>
          </div>

          {/* Sensor Subsystem Inspector & ENLARGED Visual Input Ingestion Card */}
          <div style={{
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            padding: '8px 12px',
            borderRadius: '8px',
            background: 'rgba(9, 19, 37, 0.65)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(0, 242, 254, 0.15)',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)',
            justifyContent: 'space-between',
            gap: '6px',
          }}>
            {/* Inspector Top Bar */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingBottom: '5px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              flexShrink: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={16} color="#00f2fe" />
                <span style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: '13.5px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.03em',
                  color: '#e0fdff',
                }}>
                  {currentInspector.title}
                </span>
                <span style={{
                  padding: '1px 6px',
                  borderRadius: '3px',
                  background: 'rgba(0, 242, 254, 0.12)',
                  border: '1px solid rgba(0, 242, 254, 0.25)',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '9.5px',
                  color: '#00f2fe',
                  fontWeight: 700,
                }}>
                  {currentInspector.inputMode}
                </span>
              </div>
              <span style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '11.5px',
                color: '#38bdf8',
                fontWeight: 600,
              }}>
                {currentInspector.orbitGeometry}
              </span>
            </div>

            {/* Ingestion Physics & ENLARGED Visual Diagram Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1.75fr',
              gap: '12px',
              alignItems: 'stretch',
              flex: 1,
              minHeight: 0,
            }}>
              {/* Textual Physics Readout & Metric Badges */}
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '6px', minHeight: 0 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: '#00f2fe',
                      boxShadow: '0 0 6px #00f2fe',
                    }} />
                    <span style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: '10.5px',
                      color: '#00f2fe',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      fontWeight: 700,
                    }}>
                      {currentInspector.mechanismTitle}
                    </span>
                  </div>

                  <p style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '11.5px',
                    color: '#cbd5e1',
                    lineHeight: 1.42,
                    margin: 0,
                  }}>
                    {currentInspector.summary}
                  </p>
                </div>

                {/* Physics Formula / Decision Rule Tag */}
                <div style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  background: 'rgba(3, 7, 18, 0.65)',
                  border: '1px solid rgba(0, 242, 254, 0.15)',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '10px',
                  color: '#8ed5ff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}>
                  <span style={{ color: '#64748b', fontSize: '9px', fontWeight: 700 }}>RULE:</span>
                  <span style={{ wordBreak: 'break-all' }}>{currentInspector.physicsFormula}</span>
                </div>

                {/* 3 Prominent Sensor Telemetry Metrics */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '5px',
                  padding: '5px 8px',
                  borderRadius: '6px',
                  background: 'rgba(3, 7, 18, 0.6)',
                  border: '1px solid rgba(0, 242, 254, 0.12)',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '10px',
                }}>
                  <div>
                    <div style={{ color: '#64748b', fontSize: '9px' }}>{currentInspector.metric1Label}</div>
                    <div style={{ color: '#8ed5ff', fontWeight: 700, fontSize: '11px', marginTop: '2px' }}>{currentInspector.metric1Value}</div>
                  </div>
                  <div>
                    <div style={{ color: '#64748b', fontSize: '9px' }}>{currentInspector.metric2Label}</div>
                    <div style={{ color: '#fbbf24', fontWeight: 700, fontSize: '11px', marginTop: '2px' }}>{currentInspector.metric2Value}</div>
                  </div>
                  <div>
                    <div style={{ color: '#64748b', fontSize: '9px' }}>{currentInspector.metric3Label}</div>
                    <div style={{ color: '#10b981', fontWeight: 700, fontSize: '11px', marginTop: '2px' }}>{currentInspector.metric3Value}</div>
                  </div>
                </div>
              </div>

              {/* Dynamic ENLARGED Visual Ingestion Diagram with Reduced Outer Box */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2px',
                borderRadius: '6px',
                background: 'rgba(2, 6, 18, 0.65)',
                border: '1px solid rgba(0, 242, 254, 0.12)',
                height: '100%',
                minHeight: '190px',
                position: 'relative',
                overflow: 'hidden',
              }}>
                {selectedSensor === 'sentinel1' && <Sentinel1Diagram />}
                {selectedSensor === 'sentinel2' && <Sentinel2Diagram />}
                {selectedSensor === 'landsat' && <LandsatDiagram />}
                {selectedSensor === 'eos06' && <EOS06Diagram />}
              </div>
            </div>
          </div>
        </div>

        {/* ========== COLUMN RIGHT: REDUCED TELEMETRY TERMINAL (280px) ========== */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '8px',
          background: 'rgba(9, 19, 37, 0.75)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(0, 242, 254, 0.18)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
          minHeight: 0,
          overflow: 'hidden',
        }}>
          {/* Terminal Window Bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '6px 8px',
            background: 'rgba(3, 7, 18, 0.95)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444' }} />
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f59e0b' }} />
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
              </div>
              <span style={{
                marginLeft: '3px',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '9.5px',
                color: '#64748b',
                letterSpacing: '0.04em',
                fontWeight: 600,
              }}>
                LIVE_STAC_STREAM
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              <button
                onClick={() => setIsStreaming(!isStreaming)}
                style={{
                  padding: '2px 5px',
                  borderRadius: '3px',
                  background: 'rgba(14, 30, 58, 0.9)',
                  color: isStreaming ? '#10b981' : '#f59e0b',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '8.5px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                }}
              >
                {isStreaming ? 'STREAM' : 'PAUSE'}
              </button>

              <button
                onClick={triggerSimulateSweep}
                style={{
                  padding: '2px 5px',
                  borderRadius: '3px',
                  background: 'rgba(14, 30, 58, 0.9)',
                  color: '#00f2fe',
                  border: '1px solid rgba(0, 242, 254, 0.3)',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '8.5px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                }}
              >
                Poll
              </button>

              <button
                onClick={resetConsole}
                style={{
                  padding: '2px 5px',
                  borderRadius: '3px',
                  background: 'rgba(14, 30, 58, 0.9)',
                  color: '#64748b',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '8.5px',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                }}
              >
                Clear
              </button>
            </div>
          </div>

          {/* Realtime Log Stream Screen */}
          <div
            ref={terminalScreenRef}
            style={{
              flex: 1,
              minHeight: 0,
              background: 'rgba(2, 6, 18, 0.95)',
              padding: '6px 8px',
              overflowY: 'auto',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '10px',
              lineHeight: 1.45,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {logs.map((log) => (
                <div key={log.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '5px', wordBreak: 'break-word' }}>
                  <span style={{ color: '#475569', fontSize: '9px', flexShrink: 0 }}>[{log.time}]</span>
                  <span style={{
                    color: log.color,
                    fontWeight: 700,
                    fontSize: '9px',
                    flexShrink: 0,
                    background: `${log.color}15`,
                    padding: '0 3px',
                    borderRadius: '2px',
                  }}>
                    {log.tag}
                  </span>
                  <span style={{
                    color: log.tag === 'ALERT' ? '#fca5a5' : '#cbd5e1',
                    fontWeight: log.tag === 'ALERT' ? 700 : 400,
                  }}>
                    {log.message}
                  </span>
                </div>
              ))}
            </div>

            {/* Terminal Prompt Line */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              marginTop: '5px',
              paddingTop: '5px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            }}>
              <span style={{ color: '#00f2fe', fontWeight: 700, fontSize: '10px' }}>● CDSE &gt;</span>
              <span style={{ color: '#8ed5ff', fontFamily: "'JetBrains Mono', monospace", fontSize: '9.5px' }}>
                STANDBY 15:30Z
              </span>
              <span style={{ display: 'inline-block', width: '5px', height: '10px', background: '#00f2fe' }} />
            </div>
          </div>

          {/* Telemetry Ticker Strip Footer */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '4px 8px',
            background: 'rgba(3, 7, 18, 0.95)',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            flexShrink: 0,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '9.5px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div>
                <span style={{ color: '#64748b' }}>DAEMON: </span>
                <span style={{ color: '#10b981', fontWeight: 700 }}>ONLINE</span>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>CADENCE: </span>
                <span style={{ color: '#00f2fe', fontWeight: 700 }}>30m</span>
              </div>
            </div>
            <div>
              <span style={{ color: '#64748b' }}>RATE: </span>
              <span style={{ color: '#8ed5ff', fontWeight: 700 }}>1.2 E/S</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION [E]: COMPACT TELEMETRY VERIFICATION FOOTER
         ───────────────────────────────────────────────────────────── */}
      <div style={{
        height: '38px',
        padding: '0 16px',
        borderRadius: '8px',
        background: 'rgba(9, 19, 37, 0.75)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(0, 242, 254, 0.18)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.35)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <CheckCircle2 size={16} color="#10b981" />
          <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: '#e2e8f0' }}>
            <strong style={{ color: '#8ed5ff', fontWeight: 700 }}>Autonomous Pipeline Status:</strong> Sentinel-1 SAR anomaly confirmed with ISRO Oceansat-3 wind gating (4.8 m/s). Ready for 3D Globe &amp; Lagrangian drift modeling.
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '3px 10px',
            borderRadius: '4px',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.35)',
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px rgba(16, 185, 129, 0.8)' }} />
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: '#10b981', fontWeight: 700, letterSpacing: '0.05em' }}>
              CONFIDENCE: 96.4%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
