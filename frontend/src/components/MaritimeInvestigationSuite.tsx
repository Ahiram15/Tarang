import React, { useState } from 'react';
import { MapContainer, TileLayer, Polygon, Circle, Marker, Popup, Polyline, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import { 
  SpillAnalysis, 
  InvestigationPriorityReport, 
  CandidateVessel, 
  CoastalAlert, 
  CoastalReceptor,
  EmailDispatchRequest,
  EmailDispatchResponse
} from '../types';
import { 
  ArrowLeft, 
  ShieldAlert, 
  Layers, 
  Ship, 
  Radar, 
  Radio, 
  AlertTriangle, 
  CheckCircle2, 
  Download, 
  ExternalLink, 
  Info, 
  ChevronDown, 
  ChevronUp, 
  FileText, 
  Clock, 
  Compass, 
  Navigation,
  Anchor,
  Fish,
  Waves,
  Eye,
  Crosshair,
  Loader2,
  Mail,
  Send,
  Copy,
  Check,
  Users,
  X,
  AlertCircle
} from 'lucide-react';

interface CoastalAgencyContact {
  id: string;
  name: string;
  agency: string;
  email: string;
  role: string;
  phone: string;
}

export const COASTAL_OFFICERS_DIRECTORY: CoastalAgencyContact[] = [
  {
    id: 'ncg_ops',
    name: 'National Coast Guard Ops Command',
    agency: 'Mauritius Police & Coast Guard HQ',
    email: 'ncg.ops@coastguard.gov.mu',
    role: 'Lead Tactical Vessel Interception & Sea Patrol',
    phone: '+230 208 1212',
  },
  {
    id: 'port_captain',
    name: 'Port State Control & Port Captain',
    agency: 'Mauritius Ports Authority (MPA)',
    email: 'portcaptain@portsauthority.mu',
    role: 'Harbour Navigation & Vessel Detention Orders',
    phone: '+230 206 5400',
  },
  {
    id: 'blue_economy',
    name: 'Ministry of Blue Economy & Fisheries',
    agency: 'Fisheries Protection & Marine Resources',
    email: 'spill-response@blueeconomy.gov.mu',
    role: 'Fisheries Exclusion Zone & Marine Reserve Defense',
    phone: '+230 211 2470',
  },
  {
    id: 'mpa_warden',
    name: 'Blue Bay Marine Park Ranger Station',
    agency: 'National Parks & Conservation Service (NPCS)',
    email: 'bluebay.warden@wildlife.mu',
    role: 'Lagoon Containment Booms & Coral Reef Protection',
    phone: '+230 631 8974',
  },
  {
    id: 'dept_env',
    name: 'Dept of Environment Emergency Desk',
    agency: 'Ministry of Environment & Climate Emergency',
    email: 'env.emergency@govmu.org',
    role: 'National Oil Spill Contingency Plan (NOSCP) Lead',
    phone: '+230 203 6200',
  },
];

interface MaritimeInvestigationSuiteProps {
  analysis: SpillAnalysis;
  investigationReport: InvestigationPriorityReport;
  onBackToCharacterization: () => void;
  onBackToGlobe: () => void;
}

export const MaritimeInvestigationSuite: React.FC<MaritimeInvestigationSuiteProps> = ({
  analysis,
  investigationReport,
  onBackToCharacterization,
  onBackToGlobe,
}) => {
  const [activeTab, setActiveTab] = useState<'vessels' | 'coastal'>('vessels');
  const [selectedVesselCategory, setSelectedVesselCategory] = useState<string>('all');
  const [expandedVesselId, setExpandedVesselId] = useState<string | null>(
    investigationReport.vessel_investigation.candidates[0]?.vessel_id || null
  );
  const [selectedVessel, setSelectedVessel] = useState<CandidateVessel | null>(
    investigationReport.vessel_investigation.candidates[0] || null
  );
  const [selectedAlert, setSelectedAlert] = useState<CoastalAlert | null>(null);
  const [showReportModal, setShowReportModal] = useState<boolean>(false);

  // Layer toggles
  const [showOriginZones, setShowOriginZones] = useState<boolean>(true);
  const [showVesselTracks, setShowVesselTracks] = useState<boolean>(true);
  const [showAisGaps, setShowAisGaps] = useState<boolean>(true);
  const [showSarDetections, setShowSarDetections] = useState<boolean>(true);
  const [showCoastalReceptors, setShowCoastalReceptors] = useState<boolean>(true);
  const [showCoastalDrift, setShowCoastalDrift] = useState<boolean>(true);

  const originAnalysis = investigationReport.origin_analysis;
  const vesselInv = investigationReport.vessel_investigation;
  const coastalWarning = investigationReport.coastal_warning;
  const centroid = originAnalysis.centroid;

  // Filter candidate vessels
  const filteredCandidates = vesselInv.candidates.filter((v) => {
    if (selectedVesselCategory === 'all') return true;
    if (selectedVesselCategory === 'high_score') return v.total_score >= 70;
    if (selectedVesselCategory === 'cat_a') return v.category.includes('Category A');
    if (selectedVesselCategory === 'cat_b') return v.category.includes('Category B');
    if (selectedVesselCategory === 'cat_c') return v.category.includes('Category C');
    return true;
  });

  // Category C unmatched count
  const unmatchedSarCount = vesselInv.category_counts['Category C: AIS-Unmatched SAR Detection'] || 0;

  // Custom DivIcon factory for generic point features
  const createIcon = (color: string, label: string, shape: 'circle' | 'diamond' | 'square' = 'circle') =>
    L.divIcon({
      className: 'custom-div-icon',
      html: `
        <div style="
          background-color: ${color};
          width: ${shape === 'diamond' ? '14px' : '12px'};
          height: ${shape === 'diamond' ? '14px' : '12px'};
          border-radius: ${shape === 'circle' ? '50%' : shape === 'diamond' ? '2px' : '3px'};
          transform: ${shape === 'diamond' ? 'rotate(45deg)' : 'none'};
          border: 2px solid white;
          box-shadow: 0 0 10px ${color};
        "></div>
      `,
      iconSize: [14, 14],
      iconAnchor: [7, 7],
    });

  // Convert GeoJSON Polygon or MultiPolygon to React-Leaflet positions
  const toLeafletPositions = (geoJsonPolygon: any): [number, number][] | [number, number][][] => {
    if (!geoJsonPolygon || !geoJsonPolygon.coordinates || !geoJsonPolygon.coordinates.length) return [];
    if (geoJsonPolygon.type === 'MultiPolygon') {
      return geoJsonPolygon.coordinates.map((poly: any[]) =>
        poly[0].map((pt: number[]) => [pt[1], pt[0]] as [number, number])
      );
    }
    return geoJsonPolygon.coordinates[0].map((pt: number[]) => [pt[1], pt[0]] as [number, number]);
  };

  // Dynamic Boat Icon for candidate vessels with heading/course rotation and status badges
  const createBoatIcon = ({
    color,
    headingDeg = 0,
    isSelected = false,
    isTopRank = false,
    vesselName = '',
    rank = 0,
    speedKnots = 0,
    isStationary = false,
  }: {
    color: string;
    headingDeg?: number;
    isSelected?: boolean;
    isTopRank?: boolean;
    vesselName?: string;
    rank?: number;
    speedKnots?: number;
    isStationary?: boolean;
  }) => {
    const size = isSelected ? 44 : 38;
    const halfSize = size / 2;
    // Format concise display name
    const shortName = vesselName.replace(/^(MV|MT|AIS-Unmatched|Container Ship)\s*/i, '').trim() || vesselName;
    const displayName = shortName.length > 13 ? shortName.slice(0, 12) + '…' : shortName;

    return L.divIcon({
      className: 'boat-marker-div-icon',
      html: `
        <div style="
          position: relative;
          width: ${size}px;
          height: ${size}px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        ">
          <!-- Pulsing Sonar Ring for Selected Vessel or Top Priority Rank 1 -->
          ${isSelected || isTopRank ? `
            <div style="
              position: absolute;
              top: 50%;
              left: 50%;
              width: ${size + 16}px;
              height: ${size + 16}px;
              border-radius: 50%;
              border: 2px solid ${color};
              transform: translate(-50%, -50%);
              animation: boatSonarPulse 2.2s infinite cubic-bezier(0.2, 0.6, 0.3, 1);
              pointer-events: none;
            "></div>
          ` : ''}

          <!-- Boat Silhouette Hull with Course / Heading Directional Rotation -->
          <div style="
            width: ${size}px;
            height: ${size}px;
            transform: rotate(${headingDeg}deg);
            transition: transform 0.35s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            filter: drop-shadow(0 0 ${isSelected ? '10px' : '5px'} ${color});
          ">
            <svg width="${size - 6}" height="${size - 6}" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <!-- Vessel Hull: Pointed bow at top (0 deg is North), hydrodynamic beam, transom stern at bottom -->
              <path 
                d="M 16 2.5 C 13.2 7.5, 9.2 14.5, 9.2 24 C 9.2 27.6, 12 29.5, 16 29.5 C 20 29.5, 22.8 27.6, 22.8 24 C 22.8 14.5, 18.8 7.5, 16 2.5 Z" 
                fill="${color}" 
                fill-opacity="0.94"
                stroke="#ffffff" 
                stroke-width="1.8" 
                stroke-linejoin="round"
              />
              <!-- Deckhouse / Bridge Superstructure -->
              <rect x="12.5" y="16.5" width="7" height="6.5" rx="1.5" fill="#070c18" stroke="#ffffff" stroke-width="1.2" />
              <!-- Bridge Wings Navigation Line -->
              <line x1="10" y1="18.5" x2="22" y2="18.5" stroke="#ffffff" stroke-width="1.4" stroke-linecap="round" />
              <!-- Forward Cargo Holds / Keel Centerline -->
              <line x1="16" y1="5.5" x2="16" y2="14" stroke="#ffffff" stroke-width="1.4" stroke-linecap="round" />
              <!-- Forward Hatch outline -->
              <rect x="13.5" y="7" width="5" height="4.5" rx="0.8" fill="rgba(255,255,255,0.35)" stroke="#ffffff" stroke-width="0.8" />
              <!-- Bow Beacon Light -->
              <circle cx="16" cy="3.5" r="1.2" fill="#ffffff" />
            </svg>
          </div>

          <!-- Rank Priority Badge (#1, #2, etc.) -->
          ${rank > 0 ? `
            <div style="
              position: absolute;
              top: -5px;
              right: -5px;
              background: ${isTopRank ? '#ef4444' : '#070c18'};
              color: #ffffff;
              border: 1.5px solid ${isTopRank ? '#fca5a5' : color};
              border-radius: 9px;
              padding: 0 4px;
              font-size: 9px;
              font-weight: 800;
              line-height: 14px;
              box-shadow: 0 2px 6px rgba(0,0,0,0.85);
              pointer-events: none;
              white-space: nowrap;
            ">
              #${rank}
            </div>
          ` : ''}

          <!-- Stationary / Grounding Anchor Badge -->
          ${isStationary ? `
            <div style="
              position: absolute;
              top: -5px;
              left: -5px;
              background: #991b1b;
              color: #ffffff;
              border: 1.2px solid #f87171;
              border-radius: 50%;
              width: 15px;
              height: 15px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 8.5px;
              box-shadow: 0 2px 5px rgba(0,0,0,0.9);
              pointer-events: none;
            " title="Stationary / Grounded Craft">
              ⚓
            </div>
          ` : ''}

          <!-- Vessel Label & Speed Pill -->
          <div style="
            position: absolute;
            bottom: -18px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(3, 7, 18, 0.95);
            border: 1px solid ${isSelected ? color : 'rgba(255,255,255,0.25)'};
            color: ${isSelected ? color : '#f1f5f9'};
            border-radius: 4px;
            padding: 1px 6px;
            font-size: 9px;
            font-weight: 700;
            white-space: nowrap;
            pointer-events: none;
            box-shadow: 0 3px 8px rgba(0,0,0,0.9);
            letter-spacing: 0.2px;
            display: flex;
            align-items: center;
            gap: 3px;
          ">
            <span>${displayName}</span>
            ${speedKnots > 0 ? `<span style="color: #94a3b8; font-size: 8px; font-weight: 500;">${speedKnots.toFixed(1)}k</span>` : ''}
          </div>
        </div>
      `,
      iconSize: [size, size],
      iconAnchor: [halfSize, halfSize],
      popupAnchor: [0, -halfSize - 6],
    });
  };

  // Directional Navigation Waypoint Chevron Icon for trajectory history
  const createWaypointIcon = (color: string, courseDeg: number, wpIndex: number) =>
    L.divIcon({
      className: 'wp-marker-div-icon',
      html: `
        <div style="
          width: 18px;
          height: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          transform: rotate(${courseDeg}deg);
          cursor: pointer;
        ">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <polygon points="8,1 14,13 8,10 2,13" fill="${color}" fill-opacity="0.85" stroke="#ffffff" stroke-width="1.2" />
          </svg>
        </div>
      `,
      iconSize: [18, 18],
      iconAnchor: [9, 9],
      popupAnchor: [0, -9],
    });

  // Dedicated SAR Satellite Radar Detection Marker
  const createSarDetectionIcon = (color: string, isMatched: boolean) =>
    L.divIcon({
      className: 'sar-marker-div-icon',
      html: `
        <div style="
          position: relative;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        ">
          <!-- Rotating radar reticle -->
          <div style="
            position: absolute;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            border: 1.5px dashed ${color};
            animation: sarRadarScan 4s linear infinite;
          "></div>
          <!-- Radar vessel echo diamond -->
          <div style="
            transform: rotate(45deg);
            width: 12px;
            height: 12px;
            background: ${color};
            border: 1.5px solid #ffffff;
            box-shadow: 0 0 8px ${color};
          "></div>
          <div style="
            position: absolute;
            top: -12px;
            background: rgba(4, 9, 20, 0.9);
            color: ${color};
            font-size: 7.5px;
            font-weight: 800;
            padding: 0 4px;
            border-radius: 3px;
            border: 1px solid ${color}66;
            white-space: nowrap;
            pointer-events: none;
          ">
            ${isMatched ? 'SAR CORRELATED' : 'SAR RADAR ECHO'}
          </div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -16],
    });


  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const handleDownloadPdf = async () => {
    try {
      setIsExportingPdf(true);
      const response = await fetch(`/api/spill/${analysis.spill_id}/investigation-report/pdf`);
      if (!response.ok) {
        throw new Error(`Failed to generate PDF: ${response.statusText}`);
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${investigationReport.report_id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF export error:', err);
      alert('Could not export PDF report. Please verify backend connection.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleDownloadReport = () => {
    const element = document.createElement('a');
    const file = new Blob([investigationReport.markdown_content], { type: 'text/markdown' });
    element.href = URL.createObjectURL(file);
    element.download = `${investigationReport.report_id}.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Email Coastal Officers Modal states
  const [showEmailModal, setShowEmailModal] = useState<boolean>(false);
  const [selectedAgencyIds, setSelectedAgencyIds] = useState<string[]>([
    'ncg_ops',
    'port_captain',
    'blue_economy',
  ]);
  const [customEmails, setCustomEmails] = useState<string[]>([]);
  const [customEmailInput, setCustomEmailInput] = useState<string>('');
  const [urgencyLevel, setUrgencyLevel] = useState<'CRITICAL' | 'HIGH' | 'TACTICAL'>('CRITICAL');
  const [emailSubject, setEmailSubject] = useState<string>('');
  const [emailMessage, setEmailMessage] = useState<string>('');
  const [attachPdf, setAttachPdf] = useState<boolean>(true);
  const [isDispatching, setIsDispatching] = useState<boolean>(false);
  const [dispatchResult, setDispatchResult] = useState<EmailDispatchResponse | null>(null);
  const [dispatchError, setDispatchError] = useState<string | null>(null);
  const [copiedToast, setCopiedToast] = useState<boolean>(false);

  const getAllRecipients = () => {
    const agencyEmails = COASTAL_OFFICERS_DIRECTORY
      .filter((a) => selectedAgencyIds.includes(a.id))
      .map((a) => a.email);
    return Array.from(new Set([...agencyEmails, ...customEmails]));
  };

  const initEmailDraft = (urgency: 'CRITICAL' | 'HIGH' | 'TACTICAL' = urgencyLevel) => {
    const spillCode = analysis.spill_id.toUpperCase();
    const riskLevel = coastalWarning.overall_risk_level;
    const defaultSubj = `[${urgency} ADVISORY] Oil Spill Alert: ${spillCode} - Coastal Landfall Warning (${riskLevel} Risk)`;

    const earliestAlert = coastalWarning.alerts[0];
    const topVessel = vesselInv.candidates[0];
    const earliestEta = earliestAlert
      ? `${earliestAlert.eta_label} (${earliestAlert.location_name})`
      : 'Under 6 Hours';

    const defaultBody = `======================================================================
URGENT COASTAL EARLY WARNING & MARITIME ADVISORY DISPATCH
======================================================================
ATTENTION: Coastal Officers, Port State Control, and Marine Incident Command
ISSUING SYSTEM: Global Multi-Satellite Oil Spill Early Warning System (SAR / CDSE)
INCIDENT IDENTIFIER: ${spillCode}
DATE OF TRANSMISSION: ${new Date().toUTCString()}
CLASSIFICATION LEVEL: ${urgency} PRIORITY / COASTAL EMERGENCY

1. INCIDENT OBSERVATION & SLICK CHARACTERIZATION:
   • Mission / Incident ID: ${analysis.spill_id}
   • Satellite Scene Acquisition: ${analysis.timestamp}
   • Slick Centroid Coordinates: ${analysis.geometry.centroid.lat.toFixed(6)}° N, ${analysis.geometry.centroid.lon.toFixed(6)}° E
   • Total Detected Surface Area: ${analysis.geometry.area_km2.toFixed(2)} km² (~${(analysis.geometry.area_km2 * 100).toFixed(0)} hectares)
   • Spill Severity Category: ${analysis.severity.class}
   • Current Drift Velocity: ${analysis.movement.speed_knots.toFixed(2)} knots (${analysis.movement.speed_kmh.toFixed(2)} km/h)
   • Drift Heading: ${analysis.movement.direction} (${analysis.movement.direction_deg.toFixed(1)}°)

2. COASTAL IMPACT ASSESSMENT & RECEPTORS AT RISK:
   • Overall Coastal Threat Level: ${riskLevel}
   • Earliest Projected Landfall: ${earliestEta}
${coastalWarning.alerts
  .map(
    (a) =>
      `   - Receptor: ${a.location_name} [${a.risk_level} RISK]\n     ETA Window: ${a.eta_label} | Impact Probability: ${a.impact_probability_pct}%\n     Threat Assessment: ${a.potential_threat}\n     Tactical Containment Action: ${a.recommended_actions[0] || 'Deploy defensive booms'}`
  )
  .join('\n\n')}

3. SUSPECT VESSEL INVESTIGATION INTELLIGENCE:
   • Primary Candidate (Rank #1): ${topVessel ? topVessel.name : 'Unknown Target'}
   • Total Multi-Factor Evidence Score: ${topVessel ? topVessel.total_score.toFixed(1) : 'N/A'}/100
   • MMSI: ${topVessel?.mmsi || 'N/A'} | Flag: ${topVessel?.flag || 'Unknown'} | Type: ${topVessel?.vessel_type || 'Bulk Carrier'}
   • AIS Anomaly Status: ${
     topVessel?.ais_gaps && topVessel.ais_gaps.length > 0
       ? `WARNING: ${topVessel.ais_gaps.length} intentional/unexplained AIS gap(s) recorded in probable origin zone`
       : 'Normal AIS transmission'
   }
${
  topVessel?.explainability_reasons
    ? `   • Corroborating Forensic Evidence:\n${topVessel.explainability_reasons
        .slice(0, 3)
        .map((r) => `     - ${r}`)
        .join('\n')}`
    : ''
}

4. IMMEDIATE COMMAND ACTIONS REQUESTED:
   [ ] 1. Deploy floating containment booms around Blue Bay Marine Park and sensitive lagoons.
   [ ] 2. Issue VHF hazard broadcast to all commercial and artisanal vessels in sector.
   [ ] 3. Dispatch National Coast Guard patrol cutter for on-scene verification & intercept.
   [ ] 4. Direct Port Captaincy to issue formal inspection and detention query for suspect vessel.

Attached: Official PDF Investigation Priority Report (${investigationReport.report_id}.pdf)

======================================================================
Generated automatically by Spill Trace Early Warning Command
Reference ID: ${investigationReport.report_id}
======================================================================`;

    setEmailSubject(defaultSubj);
    setEmailMessage(defaultBody);
  };

  const handleOpenEmailModal = () => {
    initEmailDraft(urgencyLevel);
    setDispatchResult(null);
    setDispatchError(null);
    setShowEmailModal(true);
  };

  const handleToggleAgency = (agencyId: string) => {
    setSelectedAgencyIds((prev) =>
      prev.includes(agencyId) ? prev.filter((id) => id !== agencyId) : [...prev, agencyId]
    );
  };

  const handleAddCustomEmail = () => {
    const trimmed = customEmailInput.trim().toLowerCase();
    if (!trimmed) return;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      alert('Please enter a valid email address (e.g. officer@maritime.org)');
      return;
    }
    if (!customEmails.includes(trimmed)) {
      setCustomEmails([...customEmails, trimmed]);
    }
    setCustomEmailInput('');
  };

  const handleRemoveCustomEmail = (emailToRemove: string) => {
    setCustomEmails((prev) => prev.filter((e) => e !== emailToRemove));
  };

  const handleUrgencyChange = (newUrgency: 'CRITICAL' | 'HIGH' | 'TACTICAL') => {
    setUrgencyLevel(newUrgency);
    const spillCode = analysis.spill_id.toUpperCase();
    const riskLevel = coastalWarning.overall_risk_level;
    setEmailSubject(`[${newUrgency} ADVISORY] Oil Spill Alert: ${spillCode} - Coastal Landfall Warning (${riskLevel} Risk)`);
  };

  const handleOpenMailto = () => {
    const recipients = getAllRecipients();
    if (recipients.length === 0) {
      alert('Please select or specify at least one coastal officer recipient address.');
      return;
    }
    const to = recipients.join(',');
    const encodedSubject = encodeURIComponent(emailSubject);
    const encodedBody = encodeURIComponent(emailMessage);
    window.open(`mailto:${to}?subject=${encodedSubject}&body=${encodedBody}`, '_blank');
  };

  const handleDispatchEmail = async () => {
    const recipients = getAllRecipients();
    if (recipients.length === 0) {
      alert('Please select or specify at least one coastal officer recipient address.');
      return;
    }
    try {
      setIsDispatching(true);
      setDispatchError(null);
      const res = await fetch(`/api/spill/${analysis.spill_id}/dispatch-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipients,
          subject: emailSubject,
          message: emailMessage,
          include_pdf: attachPdf,
          urgency_level: urgencyLevel,
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.detail || `Transmission failed (${res.status} ${res.statusText})`);
      }
      const data: EmailDispatchResponse = await res.json();
      setDispatchResult(data);
    } catch (err: any) {
      console.error('Email dispatch error:', err);
      setDispatchError(err.message || 'Transmission error. Please verify backend connection.');
    } finally {
      setIsDispatching(false);
    }
  };

  const handleCopyDraft = async () => {
    try {
      await navigator.clipboard.writeText(emailMessage);
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2500);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: '#050811',
      color: '#f1f5f9',
      overflow: 'hidden',
      padding: '14px 20px',
      boxSizing: 'border-box',
    }}>
      {/* Top Header & Navigation Breadcrumb */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: '12px',
        borderBottom: '1px solid rgba(0, 242, 254, 0.25)',
        marginBottom: '12px',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={onBackToCharacterization}
            style={{
              background: 'rgba(15, 23, 42, 0.9)',
              border: '1px solid rgba(0, 242, 254, 0.4)',
              color: '#00f2fe',
              borderRadius: '8px',
              padding: '6px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <ArrowLeft size={16} />
            <span>← Spill Characterization</span>
          </button>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Radar size={14} />
                <span>MARITIME INVESTIGATION & COASTAL EARLY WARNING ENGINE</span>
              </span>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>•</span>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{analysis.spill_id.toUpperCase()}</span>
            </div>
            <h2 style={{ margin: '2px 0 0 0', fontSize: '1.18rem', fontWeight: 800, color: '#f1f5f9' }}>
              Spatial-Temporal Origin Backtracking, Candidate Vessel Ranking & Early Warning Alerts
            </h2>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            id="btn-email-coastal-officers"
            onClick={handleOpenEmailModal}
            style={{
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.22) 0%, rgba(245, 158, 11, 0.25) 100%)',
              border: '1px solid #ef4444',
              color: '#fca5a5',
              borderRadius: '8px',
              padding: '6px 14px',
              fontSize: '0.78rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 0 15px rgba(239, 68, 68, 0.3)',
              transition: 'all 0.2s ease',
            }}
          >
            <Mail size={15} color="#ef4444" />
            <span style={{ color: '#ffffff' }}>Email Coastal Officers</span>
            <span style={{
              background: '#ef4444',
              color: '#ffffff',
              fontSize: '0.62rem',
              fontWeight: 900,
              padding: '1px 5px',
              borderRadius: '6px',
              letterSpacing: '0.4px',
            }}>
              ALERT
            </span>
          </button>

          <button
            onClick={() => setShowReportModal(true)}
            style={{
              background: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid #38bdf8',
              color: '#38bdf8',
              borderRadius: '8px',
              padding: '6px 12px',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <FileText size={15} />
            <span>View Briefing</span>
          </button>

          <button
            onClick={handleDownloadPdf}
            disabled={isExportingPdf}
            style={{
              background: 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)',
              border: 'none',
              color: '#030712',
              borderRadius: '8px',
              padding: '6px 14px',
              fontSize: '0.78rem',
              fontWeight: 800,
              cursor: isExportingPdf ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 0 15px rgba(0, 242, 254, 0.3)',
              opacity: isExportingPdf ? 0.7 : 1,
            }}
          >
            {isExportingPdf ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
            <span>{isExportingPdf ? 'Generating PDF...' : 'Export Report (PDF)'}</span>
          </button>
        </div>
      </div>

      {/* 5 Core Telemetry Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px', marginBottom: '12px', flexShrink: 0 }}>
        {/* Card 1: Probable Release Window */}
        <div style={{ background: 'rgba(10, 15, 29, 0.85)', border: '1px solid rgba(0, 242, 254, 0.25)', borderRadius: '8px', padding: '9px 12px' }}>
          <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={12} color="#00f2fe" />
            <span>PROBABLE RELEASE WINDOW</span>
          </div>
          <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#00f2fe', margin: '2px 0' }}>
            {originAnalysis.time_window.window_duration_hours}h Duration
          </div>
          <div style={{ fontSize: '0.70rem', color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {originAnalysis.time_window.window_earliest.split(' ')[1]} – {originAnalysis.time_window.window_latest.split(' ')[1]} UTC
          </div>
        </div>

        {/* Card 2: Probable Origin Spatial Boundary */}
        <div style={{ background: 'rgba(10, 15, 29, 0.85)', border: '1px solid rgba(234, 179, 8, 0.35)', borderRadius: '8px', padding: '9px 12px' }}>
          <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Crosshair size={12} color="#eab308" />
            <span>ORIGIN SPATIAL ZONES</span>
          </div>
          <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#eab308', margin: '2px 0' }}>
            1σ Core: ±{originAnalysis.zones.high.radius_km} km
          </div>
          <div style={{ fontSize: '0.70rem', color: '#94a3b8' }}>
            Outer 3σ Envelope: <b>±{originAnalysis.zones.low.radius_km} km</b>
          </div>
        </div>

        {/* Card 3: Evaluated Candidates */}
        <div style={{ background: 'rgba(10, 15, 29, 0.85)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '8px', padding: '9px 12px' }}>
          <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Ship size={12} color="#38bdf8" />
            <span>EVALUATED CANDIDATES</span>
          </div>
          <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#38bdf8', margin: '2px 0' }}>
            {vesselInv.total_evaluated} Maritime Targets
          </div>
          <div style={{ fontSize: '0.70rem', color: '#94a3b8' }}>
            Top: <b>{vesselInv.top_candidate.name.split(' ')[0]}</b> ({vesselInv.top_candidate.score}/100)
          </div>
        </div>

        {/* Card 4: AIS-Unmatched SAR Detections */}
        <div style={{ background: 'rgba(10, 15, 29, 0.85)', border: '1px solid rgba(239, 68, 68, 0.35)', borderRadius: '8px', padding: '9px 12px' }}>
          <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Radar size={12} color="#ef4444" />
            <span>AIS-UNMATCHED SAR</span>
          </div>
          <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#ef4444', margin: '2px 0' }}>
            {unmatchedSarCount} Potential Dark Echoes
          </div>
          <div style={{ fontSize: '0.70rem', color: '#94a3b8' }}>
            Category C Sentinel-1 radar returns
          </div>
        </div>

        {/* Card 5: Coastal Threat Level */}
        <div style={{ 
          background: coastalWarning.overall_risk_level === 'HIGH' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(234, 179, 8, 0.15)', 
          border: coastalWarning.overall_risk_level === 'HIGH' ? '1px solid #ef4444' : '1px solid #eab308', 
          borderRadius: '8px', 
          padding: '9px 12px' 
        }}>
          <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <ShieldAlert size={12} color={coastalWarning.overall_risk_level === 'HIGH' ? '#ef4444' : '#eab308'} />
            <span>COASTAL THREAT LEVEL</span>
          </div>
          <div style={{ 
            fontSize: '0.95rem', 
            fontWeight: 800, 
            color: coastalWarning.overall_risk_level === 'HIGH' ? '#ef4444' : '#eab308', 
            margin: '2px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <span>{coastalWarning.overall_risk_level} RISK</span>
            {coastalWarning.overall_risk_level === 'HIGH' && (
              <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444', animation: 'pulse 1.5s infinite' }}></span>
            )}
          </div>
          <div style={{ fontSize: '0.70rem', color: '#94a3b8' }}>
            {coastalWarning.earliest_eta_hours ? `Impact in ~${coastalWarning.earliest_eta_hours.toFixed(1)}h` : 'No immediate landfall'}
          </div>
        </div>
      </div>

      {/* Main Grid: Interactive Map (58%) vs Intelligence & Early Warning Deck (42%) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 0.75fr', gap: '14px', flex: 1, minHeight: 0 }}>
        
        {/* LEFT: Geospatial Tactical Leaflet Map */}
        <div style={{
          background: '#020617',
          border: '1px solid rgba(0, 242, 254, 0.3)',
          borderRadius: '10px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}>
          {/* Map Layer Toolbar */}
          <div style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            zIndex: 1000,
            background: 'rgba(6, 10, 20, 0.92)',
            border: '1px solid rgba(0, 242, 254, 0.35)',
            borderRadius: '8px',
            padding: '8px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '5px',
            fontSize: '0.72rem',
            backdropFilter: 'blur(8px)',
          }}>
            <div style={{ fontWeight: 800, color: '#00f2fe', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Layers size={13} />
              <span>INVESTIGATION LAYERS</span>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <input type="checkbox" checked={showOriginZones} onChange={(e) => setShowOriginZones(e.target.checked)} />
              <span style={{ color: '#eab308' }}>🎯 Probable Origin (1σ/2σ/3σ)</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <input type="checkbox" checked={showVesselTracks} onChange={(e) => setShowVesselTracks(e.target.checked)} />
              <span style={{ color: '#00f2fe' }}>🚢 Candidate Vessel Trajectories</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <input type="checkbox" checked={showAisGaps} onChange={(e) => setShowAisGaps(e.target.checked)} />
              <span style={{ color: '#f59e0b' }}>⚡ AIS Transmission Blackouts</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <input type="checkbox" checked={showSarDetections} onChange={(e) => setShowSarDetections(e.target.checked)} />
              <span style={{ color: '#ef4444' }}>🛰️ SAR Radar Vessel Detections</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <input type="checkbox" checked={showCoastalReceptors} onChange={(e) => setShowCoastalReceptors(e.target.checked)} />
              <span style={{ color: '#ec4899' }}>🚨 Threatened Coastal Assets</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <input type="checkbox" checked={showCoastalDrift} onChange={(e) => setShowCoastalDrift(e.target.checked)} />
              <span style={{ color: '#22c55e' }}>🧭 Projected Coastal Drift Vector</span>
            </label>

            {/* Maritime Vessel Icon Legend */}
            <div style={{
              marginTop: '6px',
              paddingTop: '6px',
              borderTop: '1px solid rgba(255, 255, 255, 0.12)',
              fontSize: '0.67rem',
              color: '#94a3b8',
              display: 'flex',
              flexDirection: 'column',
              gap: '3px',
            }}>
              <div style={{ fontWeight: 800, color: '#e2e8f0', fontSize: '0.68rem', letterSpacing: '0.3px' }}>
                VESSEL SYMBOLOGY
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ color: '#00f2fe', fontSize: '11px', fontWeight: 'bold' }}>▲</span>
                <span>Cat A: AIS Broadcast Craft</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ color: '#c084fc', fontSize: '11px', fontWeight: 'bold' }}>▲</span>
                <span>Cat B: SAR-Correlated Vessel</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ color: '#ef4444', fontSize: '11px', fontWeight: 'bold' }}>▲</span>
                <span>Cat C: Unmatched SAR Dark Target</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '10px' }}>⚓</span>
                <span>Stationary / Grounded Vessel</span>
              </div>
            </div>
          </div>

          {/* Leaflet Map Canvas */}
          <div style={{ flex: 1, width: '100%', height: '100%' }}>
            <MapContainer
              center={[centroid.lat, centroid.lon]}
              zoom={11}
              style={{ width: '100%', height: '100%' }}
            >
              <TileLayer
                url="https://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
                attribution='&copy; <a href="https://www.esri.com/">Esri</a>, DeLorme, NAVTEQ'
                maxZoom={16}
              />

              {/* 1. Multi-Tier Probable Origin Zones */}
              {showOriginZones && (
                <>
                  {/* High Probability Zone (1σ Core Boundary) */}
                  {originAnalysis.zones.high?.polygon && (
                    <Polygon
                      key="origin-zone-high"
                      positions={toLeafletPositions(originAnalysis.zones.high.polygon)}
                      pathOptions={{ color: '#ef4444', fillColor: 'transparent', fillOpacity: 0, weight: 2 }}
                    >
                      <Tooltip permanent={false}>High Probability Zone (1σ Core Boundary): ±{originAnalysis.zones.high.radius_km} km</Tooltip>
                    </Polygon>
                  )}

                  {/* Medium Probability Zone (2σ Region Boundary) */}
                  {originAnalysis.zones.medium?.polygon && (
                    <Polygon
                      key="origin-zone-med"
                      positions={toLeafletPositions(originAnalysis.zones.medium.polygon)}
                      pathOptions={{ color: '#f59e0b', fillColor: 'transparent', fillOpacity: 0, weight: 1.5, dashArray: '4, 4' }}
                    >
                      <Tooltip permanent={false}>Medium Probability Zone (2σ Region Boundary): ±{originAnalysis.zones.medium.radius_km} km</Tooltip>
                    </Polygon>
                  )}

                  {/* Low Probability Zone (3σ Boundary Outline) */}
                  {originAnalysis.zones.low?.polygon && (
                    <Polygon
                      key="origin-zone-low"
                      positions={toLeafletPositions(originAnalysis.zones.low.polygon)}
                      pathOptions={{ color: '#94a3b8', fillColor: 'transparent', fillOpacity: 0, weight: 1, dashArray: '6, 6' }}
                    >
                      <Tooltip permanent={false}>Outer Spatial Uncertainty Boundary (3σ): ±{originAnalysis.zones.low.radius_km} km</Tooltip>
                    </Polygon>
                  )}

                  {/* Centroid Marker */}
                  <Marker position={[centroid.lat, centroid.lon]} icon={createIcon('#eab308', 'Origin', 'diamond')}>
                    <Popup>
                      <b>🎯 Probable Origin Centroid</b><br />
                      Lat: {centroid.lat.toFixed(5)}°N<br />
                      Lon: {centroid.lon.toFixed(5)}°E<br />
                      Release Window: {originAnalysis.time_window.window_earliest} – {originAnalysis.time_window.window_latest}<br />
                      Confidence: {Math.round(originAnalysis.time_window.confidence_level * 100)}%
                    </Popup>
                  </Marker>
                </>
              )}

              {/* 2. Projected Coastal Drift Vector */}
              {showCoastalDrift && coastalWarning.coastal_drift_vector?.coordinates && (
                <Polyline
                  positions={coastalWarning.coastal_drift_vector.coordinates.map((pt: number[]) => [pt[1], pt[0]])}
                  pathOptions={{ color: '#22c55e', weight: 3, dashArray: '6, 6' }}
                >
                  <Tooltip permanent={false}>Projected Coastal Drift Path ({analysis.movement.speed_mps} m/s towards shore)</Tooltip>
                </Polyline>
              )}

              {/* 3. Candidate Vessel Trajectories & Waypoints */}
              {showVesselTracks && filteredCandidates.map((vessel) => {
                const isSelected = selectedVessel?.vessel_id === vessel.vessel_id;
                const trackColor = vessel.category.includes('Category C') 
                  ? '#ef4444' 
                  : vessel.category.includes('Category B') 
                  ? '#c084fc' 
                  : '#00f2fe';

                return (
                  <React.Fragment key={vessel.vessel_id}>
                    {vessel.trajectory.length >= 2 && (
                      <Polyline
                        positions={vessel.trajectory.map((wp) => [wp.lat, wp.lon])}
                        pathOptions={{ 
                          color: trackColor, 
                          weight: isSelected ? 4 : 2, 
                          opacity: isSelected ? 1 : 0.65 
                        }}
                        eventHandlers={{
                          click: () => {
                            setSelectedVessel(vessel);
                            setExpandedVesselId(vessel.vessel_id);
                          }
                        }}
                      >
                        <Tooltip permanent={false}>
                          Rank #{vessel.investigation_rank}: {vessel.name} ({vessel.total_score}/100)
                        </Tooltip>
                      </Polyline>
                    )}

                    {/* Waypoint Markers and Primary Boat Icon */}
                    {vessel.trajectory.map((wp, wIdx) => {
                      const isLatest = wIdx === vessel.trajectory.length - 1;
                      const latestWp = vessel.trajectory[vessel.trajectory.length - 1];
                      // Avoid stacking identical coordinate waypoints under the main boat
                      const isDuplicateCoord = !isLatest && wp.lat === latestWp.lat && wp.lon === latestWp.lon;
                      if (isDuplicateCoord) return null;

                      if (isLatest) {
                        return (
                          <Marker
                            key={`${vessel.vessel_id}-boat`}
                            position={[wp.lat, wp.lon]}
                            icon={createBoatIcon({
                              color: trackColor,
                              headingDeg: wp.course_deg || 0,
                              isSelected,
                              isTopRank: vessel.investigation_rank === 1,
                              vesselName: vessel.name,
                              rank: vessel.investigation_rank,
                              speedKnots: wp.speed_knots,
                              isStationary: wp.speed_knots === 0,
                            })}
                            eventHandlers={{
                              click: () => {
                                setSelectedVessel(vessel);
                                setExpandedVesselId(vessel.vessel_id);
                              }
                            }}
                          >
                            <Popup>
                              <div style={{ color: '#0f172a', fontSize: '12px', minWidth: '220px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                                  <b style={{ fontSize: '13px', color: '#0f172a' }}>🚢 {vessel.name}</b>
                                  <span style={{ 
                                    background: vessel.investigation_rank === 1 ? '#ef4444' : '#0284c7', 
                                    color: '#fff', 
                                    padding: '1px 6px', 
                                    borderRadius: '4px', 
                                    fontWeight: 700, 
                                    fontSize: '10px' 
                                  }}>
                                    Rank #{vessel.investigation_rank}
                                  </span>
                                </div>
                                <div><b>Category:</b> {vessel.category.split(':')[0]}</div>
                                <div><b>Vessel Type:</b> {vessel.vessel_type}</div>
                                <div><b>Flag / MMSI:</b> {vessel.flag || 'Unknown'} • {vessel.mmsi || 'N/A'}</div>
                                <div><b>Status:</b> {wp.speed_knots === 0 ? '⚓ Stationary / Grounded on Reef' : `${wp.speed_knots} kts • ${wp.course_deg}° heading`}</div>
                                <div><b>Dimensions:</b> {vessel.length_m}m × {vessel.beam_m}m</div>
                                <div style={{ marginTop: '5px', paddingTop: '4px', borderTop: '1px solid #e2e8f0', color: '#0369a1', fontWeight: 700 }}>
                                  Priority Score: {vessel.total_score}/100
                                </div>
                              </div>
                            </Popup>
                          </Marker>
                        );
                      }

                      return (
                        <Marker
                          key={`${vessel.vessel_id}-wp-${wIdx}`}
                          position={[wp.lat, wp.lon]}
                          icon={createWaypointIcon(trackColor, wp.course_deg || 0, wIdx + 1)}
                          eventHandlers={{
                            click: () => {
                              setSelectedVessel(vessel);
                              setExpandedVesselId(vessel.vessel_id);
                            }
                          }}
                        >
                          <Popup>
                            <div style={{ color: '#0f172a', fontSize: '11px' }}>
                              <b>{vessel.name}</b> (Waypoint #{wIdx + 1})<br />
                              Time: {wp.timestamp}<br />
                              Speed: {wp.speed_knots} kts • Heading: {wp.course_deg}°
                            </div>
                          </Popup>
                        </Marker>
                      );
                    })}
                  </React.Fragment>
                );
              })}

              {/* 4. AIS Transmission Gaps */}
              {showAisGaps && filteredCandidates.map((vessel) =>
                vessel.ais_gaps.map((gap, gIdx) => (
                  <Polyline
                    key={`gap-${vessel.vessel_id}-${gIdx}`}
                    positions={[
                      [gap.last_known_pos.lat, gap.last_known_pos.lon],
                      [gap.first_known_pos.lat, gap.first_known_pos.lon],
                    ]}
                    pathOptions={{ color: '#f59e0b', weight: 4, dashArray: '8, 8' }}
                  >
                    <Tooltip permanent={false}>
                      ⚡ AIS Blackout ({vessel.name}): {gap.duration_hours}h duration
                    </Tooltip>
                  </Polyline>
                ))
              )}

              {/* 5. SAR Vessel Detections */}
              {showSarDetections && filteredCandidates.map((vessel) =>
                vessel.sar_detections.map((sar) => {
                  const isUnmatched = !sar.is_ais_matched;
                  const sarColor = isUnmatched ? '#ef4444' : '#c084fc';
                  return (
                    <Marker
                      key={sar.detection_id}
                      position={[sar.lat, sar.lon]}
                      icon={createSarDetectionIcon(sarColor, sar.is_ais_matched)}
                    >
                      <Popup>
                        <div style={{ color: '#0f172a', fontSize: '12px' }}>
                          <b style={{ color: sarColor }}>🛰️ SAR Satellite Vessel Detection</b><br />
                          <b>ID:</b> {sar.detection_id}<br />
                          <b>Time:</b> {sar.timestamp}<br />
                          <b>Dimensions:</b> ~{sar.estimated_length_m}m × {sar.estimated_width_m}m<br />
                          <b>Confidence:</b> {Math.round(sar.confidence * 100)}%<br />
                          <b>Correlation:</b> {sar.is_ais_matched ? `Matched MMSI ${sar.matched_mmsi}` : '⚠️ AIS-UNMATCHED TARGET'}<br />
                          <div style={{ fontSize: '11px', color: '#475569', marginTop: '4px' }}>{sar.notes}</div>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })
              )}

              {/* 6. Threatened Coastal Receptors */}
              {showCoastalReceptors && coastalWarning.receptors.map((rec) => {
                const alert = coastalWarning.alerts.find((a) => a.receptor_id === rec.receptor_id);
                const isHighRisk = alert?.risk_level === 'HIGH';
                const recColor = isHighRisk ? '#ef4444' : alert?.risk_level === 'MODERATE' ? '#f59e0b' : '#38bdf8';

                return (
                  <Marker
                    key={rec.receptor_id}
                    position={[rec.lat, rec.lon]}
                    icon={createIcon(recColor, rec.name, 'square')}
                    eventHandlers={{
                      click: () => {
                        if (alert) setSelectedAlert(alert);
                        setActiveTab('coastal');
                      }
                    }}
                  >
                    <Popup>
                      <b>🚨 Coastal Receptor: {rec.name}</b><br />
                      Type: {rec.receptor_type}<br />
                      Sensitivity: <b>{rec.sensitivity_level}</b><br />
                      Distance to Slick: {rec.distance_to_slick_km} km<br />
                      Risk Level: <b style={{ color: recColor }}>{alert?.risk_level || 'MONITORED'}</b><br />
                      ETA to Landfall: {alert?.eta_label || 'Calculating...'}
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          </div>
        </div>

        {/* RIGHT: Dual Intelligence & Early Warning Deck */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          background: 'rgba(10, 15, 29, 0.92)',
          border: '1px solid rgba(0, 242, 254, 0.3)',
          borderRadius: '10px',
          overflow: 'hidden',
          minHeight: 0,
        }}>
          {/* Tabs Selector */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            borderBottom: '1px solid rgba(0, 242, 254, 0.25)',
            flexShrink: 0,
          }}>
            <button
              onClick={() => setActiveTab('vessels')}
              style={{
                padding: '10px 12px',
                border: 'none',
                background: activeTab === 'vessels' ? 'rgba(0, 242, 254, 0.15)' : 'transparent',
                color: activeTab === 'vessels' ? '#00f2fe' : '#94a3b8',
                borderBottom: activeTab === 'vessels' ? '2px solid #00f2fe' : '2px solid transparent',
                fontSize: '0.80rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <Ship size={15} />
              <span>CANDIDATE VESSELS ({vesselInv.candidates.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('coastal')}
              style={{
                padding: '10px 12px',
                border: 'none',
                background: activeTab === 'coastal' ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
                color: activeTab === 'coastal' ? '#ef4444' : '#94a3b8',
                borderBottom: activeTab === 'coastal' ? '2px solid #ef4444' : '2px solid transparent',
                fontSize: '0.80rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <ShieldAlert size={15} />
              <span>COASTAL ALERTS ({coastalWarning.alerts.length})</span>
            </button>
          </div>

          {/* TAB 1: CANDIDATE VESSELS RANKING DECK */}
          {activeTab === 'vessels' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, padding: '12px', overflowY: 'auto' }}>
              
              {/* Category Filter Pills */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px', flexShrink: 0 }}>
                {[
                  { id: 'all', label: `All (${vesselInv.candidates.length})` },
                  { id: 'high_score', label: 'Priority > 70' },
                  { id: 'cat_a', label: 'Cat A: AIS' },
                  { id: 'cat_b', label: 'Cat B: SAR Match' },
                  { id: 'cat_c', label: `Cat C: Unmatched (${unmatchedSarCount})` },
                ].map((pill) => (
                  <button
                    key={pill.id}
                    onClick={() => setSelectedVesselCategory(pill.id)}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      border: selectedVesselCategory === pill.id ? '1px solid #00f2fe' : '1px solid rgba(255,255,255,0.1)',
                      background: selectedVesselCategory === pill.id ? 'rgba(0, 242, 254, 0.2)' : 'rgba(0,0,0,0.3)',
                      color: selectedVesselCategory === pill.id ? '#00f2fe' : '#94a3b8',
                    }}
                  >
                    {pill.label}
                  </button>
                ))}
              </div>

              {/* Candidates List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {filteredCandidates.map((vessel) => {
                  const isExpanded = expandedVesselId === vessel.vessel_id;
                  const isCategoryC = vessel.category.includes('Category C');

                  return (
                    <div
                      key={vessel.vessel_id}
                      style={{
                        background: 'rgba(6, 10, 20, 0.85)',
                        border: isExpanded ? '1px solid #00f2fe' : '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {/* Candidate Card Header */}
                      <div
                        onClick={() => {
                          setExpandedVesselId(isExpanded ? null : vessel.vessel_id);
                          setSelectedVessel(vessel);
                        }}
                        style={{
                          padding: '10px 12px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: isExpanded ? 'rgba(0, 242, 254, 0.08)' : 'transparent',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {/* Rank Badge */}
                          <div style={{
                            background: vessel.investigation_rank === 1 ? '#eab308' : vessel.investigation_rank === 2 ? '#94a3b8' : '#38bdf8',
                            color: '#030712',
                            width: '26px',
                            height: '26px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 900,
                            fontSize: '0.78rem',
                            flexShrink: 0,
                          }}>
                            #{vessel.investigation_rank}
                          </div>

                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontWeight: 800, fontSize: '0.85rem', color: isCategoryC ? '#f87171' : '#f1f5f9' }}>
                                {vessel.name}
                              </span>
                              {vessel.ais_gaps.length > 0 && (
                                <span style={{
                                  background: 'rgba(245, 158, 11, 0.2)',
                                  border: '1px solid #f59e0b',
                                  color: '#f59e0b',
                                  fontSize: '0.62rem',
                                  fontWeight: 800,
                                  padding: '1px 5px',
                                  borderRadius: '4px',
                                }}>
                                  ⚡ AIS GAP
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                              {vessel.vessel_type} • {vessel.flag}
                            </div>
                          </div>
                        </div>

                        {/* Priority Score Bar */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ 
                              fontSize: '1rem', 
                              fontWeight: 900, 
                              color: vessel.total_score >= 80 ? '#22c55e' : vessel.total_score >= 60 ? '#eab308' : '#94a3b8' 
                            }}>
                              {vessel.total_score.toFixed(1)}
                              <span style={{ fontSize: '0.65rem', color: '#64748b' }}>/100</span>
                            </div>
                            <div style={{ fontSize: '0.62rem', color: '#64748b' }}>
                              Evidence Score
                            </div>
                          </div>
                          {isExpanded ? <ChevronUp size={16} color="#00f2fe" /> : <ChevronDown size={16} color="#64748b" />}
                        </div>
                      </div>

                      {/* Expanded Explainable AI Evidence Drawer */}
                      {isExpanded && (
                        <div style={{ padding: '12px', borderTop: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.3)' }}>
                          
                          {/* Score Breakdown Bars */}
                          <div style={{ marginBottom: '10px' }}>
                            <div style={{ fontSize: '0.70rem', fontWeight: 800, color: '#00f2fe', marginBottom: '6px' }}>
                              MULTI-FACTOR EVIDENCE WEIGHTING:
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '0.68rem' }}>
                              <div style={{ background: 'rgba(0,0,0,0.4)', padding: '4px 8px', borderRadius: '4px', display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#94a3b8' }}>Spatial Proximity:</span>
                                <span style={{ color: '#00f2fe', fontWeight: 700 }}>{vessel.score_breakdown.spatial}/25</span>
                              </div>
                              <div style={{ background: 'rgba(0,0,0,0.4)', padding: '4px 8px', borderRadius: '4px', display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#94a3b8' }}>Release Window:</span>
                                <span style={{ color: '#00f2fe', fontWeight: 700 }}>{vessel.score_breakdown.temporal}/25</span>
                              </div>
                              <div style={{ background: 'rgba(0,0,0,0.4)', padding: '4px 8px', borderRadius: '4px', display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#94a3b8' }}>Trajectory Lingering:</span>
                                <span style={{ color: '#00f2fe', fontWeight: 700 }}>{vessel.score_breakdown.trajectory}/20</span>
                              </div>
                              <div style={{ background: 'rgba(0,0,0,0.4)', padding: '4px 8px', borderRadius: '4px', display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#94a3b8' }}>Drift Consistency:</span>
                                <span style={{ color: '#00f2fe', fontWeight: 700 }}>{vessel.score_breakdown.drift}/15</span>
                              </div>
                              <div style={{ background: 'rgba(0,0,0,0.4)', padding: '4px 8px', borderRadius: '4px', display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#94a3b8' }}>AIS Gap / SAR Echo:</span>
                                <span style={{ color: '#f59e0b', fontWeight: 700 }}>{vessel.score_breakdown.ais_gap}/10</span>
                              </div>
                              <div style={{ background: 'rgba(0,0,0,0.4)', padding: '4px 8px', borderRadius: '4px', display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#94a3b8' }}>Vessel Risk Profile:</span>
                                <span style={{ color: '#ef4444', fontWeight: 700 }}>{vessel.score_breakdown.vessel_type}/5</span>
                              </div>
                            </div>
                          </div>

                          {/* Explainable Reasons Bullet Points */}
                          <div style={{ fontSize: '0.72rem', color: '#cbd5e1' }}>
                            <div style={{ fontWeight: 800, color: '#f59e0b', marginBottom: '4px' }}>
                              EVIDENTIARY JUSTIFICATIONS:
                            </div>
                            <ul style={{ margin: 0, paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                              {vessel.explainability_reasons.map((reason, rIdx) => (
                                <li key={rIdx}>{reason}</li>
                              ))}
                            </ul>
                          </div>

                          {/* Telemetry Footer */}
                          <div style={{ marginTop: '8px', paddingTop: '6px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: '#64748b' }}>
                            <span>MMSI: {vessel.mmsi || 'N/A (Radar Echo Only)'}</span>
                            <span>Length: {vessel.length_m}m • Beam: {vessel.beam_m}m</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

            </div>
          )}

          {/* TAB 2: COASTAL EARLY WARNING ALERT CENTER */}
          {activeTab === 'coastal' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, padding: '12px', overflowY: 'auto' }}>
              
              {/* Alert Summary Banner */}
              <div style={{
                background: coastalWarning.overall_risk_level === 'HIGH' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(234, 179, 8, 0.12)',
                border: coastalWarning.overall_risk_level === 'HIGH' ? '1px solid #ef4444' : '1px solid #eab308',
                borderRadius: '8px',
                padding: '10px 12px',
                marginBottom: '12px',
                fontSize: '0.74rem',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800, color: coastalWarning.overall_risk_level === 'HIGH' ? '#ef4444' : '#eab308' }}>
                    <ShieldAlert size={16} />
                    <span>EMERGENCY COASTAL DRIFT ADVISORY</span>
                  </div>
                  <button
                    onClick={handleOpenEmailModal}
                    style={{
                      background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                      border: 'none',
                      color: '#ffffff',
                      borderRadius: '6px',
                      padding: '4px 10px',
                      fontSize: '0.70rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      boxShadow: '0 0 10px rgba(239, 68, 68, 0.4)',
                    }}
                  >
                    <Mail size={12} />
                    <span>Email Coastal Officers</span>
                  </button>
                </div>
                <div style={{ color: '#e2e8f0' }}>
                  {coastalWarning.summary}
                </div>
              </div>

              {/* Alerts List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {coastalWarning.alerts.map((alert) => {
                  const isHigh = alert.risk_level === 'HIGH';

                  return (
                    <div
                      key={alert.alert_id}
                      style={{
                        background: 'rgba(6, 10, 20, 0.85)',
                        border: isHigh ? '1px solid rgba(239, 68, 68, 0.5)' : '1px solid rgba(234, 179, 8, 0.4)',
                        borderRadius: '8px',
                        padding: '12px',
                      }}
                    >
                      {/* Alert Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{
                              background: isHigh ? '#ef4444' : '#eab308',
                              color: '#030712',
                              fontWeight: 900,
                              fontSize: '0.65rem',
                              padding: '2px 6px',
                              borderRadius: '4px',
                            }}>
                              {alert.risk_level} RISK
                            </span>
                            <span style={{ fontWeight: 800, fontSize: '0.85rem', color: '#f1f5f9' }}>
                              {alert.location_name}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '2px' }}>
                            {alert.receptor_type}
                          </div>
                        </div>

                        {/* ETA Banner */}
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '0.85rem', fontWeight: 800, color: isHigh ? '#ef4444' : '#eab308' }}>
                            {alert.eta_label}
                          </div>
                          <div style={{ fontSize: '0.62rem', color: '#64748b' }}>
                            Prob: {alert.impact_probability_pct}%
                          </div>
                        </div>
                      </div>

                      {/* Potential Threat Narrative */}
                      <div style={{ fontSize: '0.72rem', color: '#cbd5e1', marginBottom: '8px', background: 'rgba(0,0,0,0.3)', padding: '6px 8px', borderRadius: '4px' }}>
                        {alert.potential_threat}
                      </div>

                      {/* Tactical Response Actions */}
                      <div>
                        <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#38bdf8', marginBottom: '4px' }}>
                          RECOMMENDED MITIGATION ACTIONS:
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {alert.recommended_actions.map((action, aIdx) => (
                            <label key={aIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '0.68rem', color: '#94a3b8', cursor: 'pointer' }}>
                              <input type="checkbox" defaultChecked={aIdx === 0} style={{ marginTop: '2px' }} />
                              <span>{action}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          )}

        </div>
      </div>

      {/* MODAL: Full Investigation Briefing Viewer */}
      {showReportModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(8px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          boxSizing: 'border-box',
        }}>
          <div style={{
            background: '#090d1a',
            border: '1px solid #00f2fe',
            borderRadius: '12px',
            width: '800px',
            maxWidth: '95vw',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 0 40px rgba(0, 242, 254, 0.3)',
            overflow: 'hidden',
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '14px 20px',
              borderBottom: '1px solid rgba(0, 242, 254, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(15, 23, 42, 0.8)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={18} color="#00f2fe" />
                <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#f1f5f9' }}>
                  Explainable Investigation Priority Briefing ({investigationReport.report_id})
                </span>
              </div>
              <button
                onClick={() => setShowReportModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: '1.2rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Content (Markdown text rendered) */}
            <div style={{
              flex: 1,
              padding: '20px',
              overflowY: 'auto',
              fontSize: '0.80rem',
              lineHeight: 1.6,
              color: '#cbd5e1',
              fontFamily: 'monospace',
              whiteSpace: 'pre-wrap',
              background: '#040711',
            }}>
              {investigationReport.markdown_content}
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '12px 20px',
              borderTop: '1px solid rgba(255,255,255,0.1)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px',
              background: 'rgba(15, 23, 42, 0.8)',
            }}>
              <button
                onClick={handleDownloadPdf}
                disabled={isExportingPdf}
                style={{
                  background: 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)',
                  border: 'none',
                  color: '#030712',
                  borderRadius: '6px',
                  padding: '6px 16px',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  cursor: isExportingPdf ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  opacity: isExportingPdf ? 0.7 : 1,
                }}
              >
                {isExportingPdf ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
                <span>{isExportingPdf ? 'Generating PDF...' : 'Export Official PDF'}</span>
              </button>
              <button
                onClick={() => {
                  setShowReportModal(false);
                  handleOpenEmailModal();
                }}
                style={{
                  background: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid #ef4444',
                  color: '#fca5a5',
                  borderRadius: '6px',
                  padding: '6px 14px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Mail size={14} color="#ef4444" />
                <span>Email Coastal Officers</span>
              </button>
              <button
                onClick={handleDownloadReport}
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: '#e2e8f0',
                  borderRadius: '6px',
                  padding: '6px 14px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Download size={14} />
                <span>Save Markdown (.md)</span>
              </button>
              <button
                onClick={() => setShowReportModal(false)}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: 'none',
                  color: '#f1f5f9',
                  borderRadius: '6px',
                  padding: '6px 14px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Email Coastal Officers & Maritime Authorities Dispatch Center */}
      {showEmailModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0, 0, 0, 0.88)',
          backdropFilter: 'blur(10px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          boxSizing: 'border-box',
        }}>
          <div style={{
            background: '#070c18',
            border: '1px solid rgba(239, 68, 68, 0.5)',
            borderRadius: '14px',
            width: '880px',
            maxWidth: '96vw',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 0 50px rgba(239, 68, 68, 0.25)',
            overflow: 'hidden',
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '14px 20px',
              borderBottom: '1px solid rgba(239, 68, 68, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(15, 23, 42, 0.9)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  background: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid #ef4444',
                  borderRadius: '8px',
                  padding: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Mail size={18} color="#ef4444" />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.98rem', color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>Emergency Coastal Advisory Dispatch Gateway</span>
                    <span style={{
                      background: 'rgba(239, 68, 68, 0.2)',
                      border: '1px solid #ef4444',
                      color: '#f87171',
                      fontSize: '0.62rem',
                      fontWeight: 900,
                      padding: '1px 6px',
                      borderRadius: '4px',
                      textTransform: 'uppercase',
                    }}>
                      Official Channel
                    </span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '1px' }}>
                    Sector Incident: {analysis.spill_id.toUpperCase()} • Direct transmission to Maritime Authorities & Coastal Command
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowEmailModal(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#94a3b8',
                  width: '28px',
                  height: '28px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div style={{
              flex: 1,
              padding: '20px',
              overflowY: 'auto',
              background: '#040711',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}>
              {/* SUCCESS CONFIRMATION RECEIPT (when dispatchResult != null) */}
              {dispatchResult ? (
                <div style={{
                  background: 'rgba(34, 197, 94, 0.08)',
                  border: '1px solid #22c55e',
                  borderRadius: '10px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <CheckCircle2 size={32} color="#22c55e" />
                    <div>
                      <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#22c55e' }}>
                        Advisory Dispatched & Recorded Successfully
                      </div>
                      <div style={{ fontSize: '0.76rem', color: '#94a3b8', marginTop: '2px' }}>
                        {dispatchResult.message}
                      </div>
                    </div>
                  </div>

                  {/* Transmission Telemetry Card */}
                  <div style={{
                    background: 'rgba(0, 0, 0, 0.5)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    padding: '14px',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '12px',
                    fontSize: '0.74rem',
                  }}>
                    <div>
                      <div style={{ color: '#64748b', fontSize: '0.68rem', fontWeight: 700 }}>TRACKING REFERENCE ID</div>
                      <div style={{ color: '#00f2fe', fontFamily: 'monospace', fontWeight: 800, fontSize: '0.85rem', marginTop: '2px' }}>
                        {dispatchResult.tracking_id}
                      </div>
                    </div>

                    <div>
                      <div style={{ color: '#64748b', fontSize: '0.68rem', fontWeight: 700 }}>TRANSMISSION TIMESTAMP</div>
                      <div style={{ color: '#f1f5f9', fontWeight: 700, marginTop: '2px' }}>
                        {dispatchResult.timestamp}
                      </div>
                    </div>

                    <div>
                      <div style={{ color: '#64748b', fontSize: '0.68rem', fontWeight: 700 }}>GATEWAY DISPATCH MODE</div>
                      <div style={{ color: dispatchResult.mode === 'smtp' ? '#22c55e' : '#eab308', fontWeight: 700, marginTop: '2px' }}>
                        {dispatchResult.mode === 'smtp' ? '✓ Live Authenticated SMTP Gateway' : '⚡ Simulated SAR Emergency Broadcast Network'}
                      </div>
                    </div>

                    <div>
                      <div style={{ color: '#64748b', fontSize: '0.68rem', fontWeight: 700 }}>OFFICIAL PDF ATTACHMENT</div>
                      <div style={{ color: dispatchResult.pdf_attached ? '#38bdf8' : '#94a3b8', fontWeight: 700, marginTop: '2px' }}>
                        {dispatchResult.pdf_attached
                          ? `✓ Attached (${investigationReport.report_id}.pdf)`
                          : 'None'}
                      </div>
                    </div>

                    <div style={{ gridColumn: 'span 2' }}>
                      <div style={{ color: '#64748b', fontSize: '0.68rem', fontWeight: 700, marginBottom: '6px' }}>
                        CONFIRMED NOTIFIED RECIPIENT AGENCIES ({dispatchResult.recipients.length})
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {dispatchResult.recipients.map((rec, idx) => (
                          <div
                            key={idx}
                            style={{
                              background: 'rgba(34, 197, 94, 0.15)',
                              border: '1px solid rgba(34, 197, 94, 0.4)',
                              color: '#86efac',
                              fontSize: '0.70rem',
                              padding: '3px 8px',
                              borderRadius: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontFamily: 'monospace',
                            }}
                          >
                            <Check size={11} color="#22c55e" />
                            <span>{rec}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '6px' }}>
                    <button
                      onClick={handleOpenMailto}
                      style={{
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        color: '#f1f5f9',
                        borderRadius: '6px',
                        padding: '6px 14px',
                        fontSize: '0.76rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <ExternalLink size={13} />
                      <span>Open in Email App (Backup)</span>
                    </button>

                    <button
                      onClick={() => setDispatchResult(null)}
                      style={{
                        background: 'rgba(0, 242, 254, 0.15)',
                        border: '1px solid #00f2fe',
                        color: '#00f2fe',
                        borderRadius: '6px',
                        padding: '6px 14px',
                        fontSize: '0.76rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Prepare Another Advisory
                    </button>

                    <button
                      onClick={() => setShowEmailModal(false)}
                      style={{
                        background: '#22c55e',
                        border: 'none',
                        color: '#030712',
                        borderRadius: '6px',
                        padding: '6px 18px',
                        fontSize: '0.76rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                      }}
                    >
                      Done / Close
                    </button>
                  </div>
                </div>
              ) : (
                /* DISPATCH CONFIGURATION & DRAFTING VIEW */
                <>
                  {/* Error Notification */}
                  {dispatchError && (
                    <div style={{
                      background: 'rgba(239, 68, 68, 0.15)',
                      border: '1px solid #ef4444',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      fontSize: '0.75rem',
                      color: '#fca5a5',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}>
                      <AlertCircle size={16} color="#ef4444" />
                      <span>{dispatchError}</span>
                    </div>
                  )}

                  {/* Section 1: Target Coastal Officers Directory */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Users size={14} color="#00f2fe" />
                        <span>SELECT COASTAL OFFICERS & AGENCIES TO NOTIFY:</span>
                      </div>
                      <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                        {getAllRecipients().length} recipient(s) selected
                      </span>
                    </div>

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                      gap: '8px',
                      marginBottom: '10px',
                    }}>
                      {COASTAL_OFFICERS_DIRECTORY.map((contact) => {
                        const isSelected = selectedAgencyIds.includes(contact.id);
                        return (
                          <div
                            key={contact.id}
                            onClick={() => handleToggleAgency(contact.id)}
                            style={{
                              background: isSelected ? 'rgba(0, 242, 254, 0.12)' : 'rgba(15, 23, 42, 0.6)',
                              border: isSelected ? '1px solid #00f2fe' : '1px solid rgba(255, 255, 255, 0.08)',
                              borderRadius: '8px',
                              padding: '8px 10px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: '8px',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}} // Handled by parent div
                              style={{ marginTop: '3px', cursor: 'pointer', accentColor: '#00f2fe' }}
                            />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: '0.74rem', fontWeight: 800, color: isSelected ? '#00f2fe' : '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {contact.name}
                              </div>
                              <div style={{ fontSize: '0.65rem', color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {contact.agency}
                              </div>
                              <div style={{ fontSize: '0.65rem', color: '#64748b', fontFamily: 'monospace', marginTop: '2px' }}>
                                {contact.email}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Custom Email Input */}
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input
                        type="email"
                        value={customEmailInput}
                        onChange={(e) => setCustomEmailInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddCustomEmail();
                          }
                        }}
                        placeholder="Add custom coastal officer email (e.g. duty.officer@coastguard.gov)..."
                        style={{
                          flex: 1,
                          background: 'rgba(15, 23, 42, 0.8)',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          borderRadius: '6px',
                          padding: '6px 10px',
                          color: '#f1f5f9',
                          fontSize: '0.74rem',
                          outline: 'none',
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomEmail}
                        style={{
                          background: 'rgba(255, 255, 255, 0.1)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          color: '#f1f5f9',
                          borderRadius: '6px',
                          padding: '6px 12px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        + Add Recipient
                      </button>
                    </div>

                    {/* Custom Recipient Chips */}
                    {customEmails.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                        {customEmails.map((email) => (
                          <div
                            key={email}
                            style={{
                              background: 'rgba(56, 189, 248, 0.15)',
                              border: '1px solid #38bdf8',
                              color: '#38bdf8',
                              fontSize: '0.68rem',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '5px',
                              fontFamily: 'monospace',
                            }}
                          >
                            <span>{email}</span>
                            <button
                              onClick={() => handleRemoveCustomEmail(email)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#38bdf8',
                                cursor: 'pointer',
                                padding: 0,
                                display: 'flex',
                                alignItems: 'center',
                              }}
                            >
                              <X size={11} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Section 2: Urgency Classification & Subject */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <label style={{ fontSize: '0.72rem', fontWeight: 800, color: '#f1f5f9' }}>
                        URGENCY CLASSIFICATION:
                      </label>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => handleUrgencyChange('CRITICAL')}
                          style={{
                            background: urgencyLevel === 'CRITICAL' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(255,255,255,0.05)',
                            border: urgencyLevel === 'CRITICAL' ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.1)',
                            color: urgencyLevel === 'CRITICAL' ? '#ef4444' : '#94a3b8',
                            borderRadius: '4px',
                            padding: '3px 8px',
                            fontSize: '0.68rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                          }}
                        >
                          CRITICAL (Landfall &lt; 6h)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUrgencyChange('HIGH')}
                          style={{
                            background: urgencyLevel === 'HIGH' ? 'rgba(234, 179, 8, 0.25)' : 'rgba(255,255,255,0.05)',
                            border: urgencyLevel === 'HIGH' ? '1px solid #eab308' : '1px solid rgba(255,255,255,0.1)',
                            color: urgencyLevel === 'HIGH' ? '#eab308' : '#94a3b8',
                            borderRadius: '4px',
                            padding: '3px 8px',
                            fontSize: '0.68rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                          }}
                        >
                          HIGH ADVISORY
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUrgencyChange('TACTICAL')}
                          style={{
                            background: urgencyLevel === 'TACTICAL' ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255,255,255,0.05)',
                            border: urgencyLevel === 'TACTICAL' ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)',
                            color: urgencyLevel === 'TACTICAL' ? '#38bdf8' : '#94a3b8',
                            borderRadius: '4px',
                            padding: '3px 8px',
                            fontSize: '0.68rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                          }}
                        >
                          TACTICAL BULLETIN
                        </button>
                      </div>
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <label style={{ fontSize: '0.72rem', fontWeight: 800, color: '#94a3b8' }}>
                          SUBJECT LINE:
                        </label>
                        <button
                          type="button"
                          onClick={() => initEmailDraft(urgencyLevel)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#00f2fe',
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            padding: 0,
                          }}
                        >
                          Reset to Default
                        </button>
                      </div>
                      <input
                        type="text"
                        value={emailSubject}
                        onChange={(e) => setEmailSubject(e.target.value)}
                        style={{
                          width: '100%',
                          background: 'rgba(15, 23, 42, 0.8)',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          borderRadius: '6px',
                          padding: '7px 10px',
                          color: '#f1f5f9',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                  </div>

                  {/* Section 3: Official Briefing Message Body */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <label style={{ fontSize: '0.72rem', fontWeight: 800, color: '#94a3b8' }}>
                        OFFICIAL BRIEFING MESSAGE (EDITABLE):
                      </label>
                      <span style={{ fontSize: '0.65rem', color: '#64748b' }}>
                        Pre-populated with Sentinel-1 SAR, Hindcast & GFW Intelligence
                      </span>
                    </div>
                    <textarea
                      value={emailMessage}
                      onChange={(e) => setEmailMessage(e.target.value)}
                      rows={10}
                      style={{
                        width: '100%',
                        background: '#02040a',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        borderRadius: '6px',
                        padding: '10px 12px',
                        color: '#cbd5e1',
                        fontSize: '0.72rem',
                        fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                        lineHeight: 1.5,
                        outline: 'none',
                        resize: 'vertical',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  {/* Section 4: Attachments */}
                  <div style={{
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.74rem', color: '#f1f5f9' }}>
                      <input
                        type="checkbox"
                        checked={attachPdf}
                        onChange={(e) => setAttachPdf(e.target.checked)}
                        style={{ accentColor: '#00f2fe' }}
                      />
                      <span style={{ fontWeight: 700 }}>
                        Attach Official Investigation Priority Report PDF
                      </span>
                    </label>
                    <span style={{
                      background: 'rgba(56, 189, 248, 0.15)',
                      color: '#38bdf8',
                      fontSize: '0.65rem',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontFamily: 'monospace',
                    }}>
                      {investigationReport.report_id}.pdf (~140 KB)
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            {!dispatchResult && (
              <div style={{
                padding: '12px 20px',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'rgba(15, 23, 42, 0.9)',
              }}>
                {/* Left Utility Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={handleCopyDraft}
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      color: '#e2e8f0',
                      borderRadius: '6px',
                      padding: '6px 12px',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    {copiedToast ? <Check size={13} color="#22c55e" /> : <Copy size={13} />}
                    <span>{copiedToast ? 'Copied to Clipboard!' : 'Copy Briefing'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenMailto}
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      color: '#e2e8f0',
                      borderRadius: '6px',
                      padding: '6px 12px',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    <ExternalLink size={13} />
                    <span>Open in Email App (mailto)</span>
                  </button>
                </div>

                {/* Right CTA Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setShowEmailModal(false)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: 'none',
                      color: '#94a3b8',
                      borderRadius: '6px',
                      padding: '6px 14px',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleDispatchEmail}
                    disabled={isDispatching || getAllRecipients().length === 0}
                    style={{
                      background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                      border: 'none',
                      color: '#ffffff',
                      borderRadius: '6px',
                      padding: '6px 18px',
                      fontSize: '0.76rem',
                      fontWeight: 800,
                      cursor: isDispatching || getAllRecipients().length === 0 ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: '0 0 15px rgba(239, 68, 68, 0.4)',
                      opacity: isDispatching || getAllRecipients().length === 0 ? 0.6 : 1,
                    }}
                  >
                    {isDispatching ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                    <span>{isDispatching ? 'Transmitting...' : `Transmit to ${getAllRecipients().length} Officer(s)`}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
