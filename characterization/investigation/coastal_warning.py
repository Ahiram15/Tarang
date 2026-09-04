import math
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import List, Dict, Any, Optional
from shapely.geometry import Point, LineString, Polygon, mapping

from ..drift.coastal_boundary import CoastalBoundaryService


class ReceptorType(str, Enum):
    MARINE_PROTECTED_AREA = "Marine Protected Area (MPA)"
    PORT_HARBOR = "Commercial Port & Harbor"
    FISHING_GROUND = "Artisanal & Commercial Fishing Grounds"
    BEACH_TOURISM = "Public Beach & Tourism Corridor"
    COASTAL_COMMUNITY = "Coastal Village & Settlement"
    MANGROVE_CORAL = "Coral Reef & Mangrove Ecosystem"


@dataclass
class CoastalReceptor:
    receptor_id: str
    name: str
    receptor_type: str
    lat: float
    lon: float
    sensitivity_level: str  # "CRITICAL", "HIGH", "MODERATE"
    distance_to_slick_km: float
    description: str

    def to_dict(self) -> Dict[str, Any]:
        return {
            "receptor_id": self.receptor_id,
            "name": self.name,
            "receptor_type": self.receptor_type,
            "lat": self.lat,
            "lon": self.lon,
            "sensitivity_level": self.sensitivity_level,
            "distance_to_slick_km": round(self.distance_to_slick_km, 2),
            "description": self.description,
        }


@dataclass
class CoastalAlert:
    alert_id: str
    receptor_id: str
    location_name: str
    receptor_type: str
    risk_level: str  # "HIGH", "MODERATE", "LOW"
    eta_hours_min: float
    eta_hours_max: float
    eta_label: str  # e.g. "12–24 Hours"
    impact_probability_pct: float
    potential_threat: str
    recommended_actions: List[str]
    alert_timestamp: str
    status: str = "ACTIVE"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "alert_id": self.alert_id,
            "receptor_id": self.receptor_id,
            "location_name": self.location_name,
            "receptor_type": self.receptor_type,
            "risk_level": self.risk_level,
            "eta_hours_min": round(self.eta_hours_min, 1),
            "eta_hours_max": round(self.eta_hours_max, 1),
            "eta_label": self.eta_label,
            "impact_probability_pct": round(self.impact_probability_pct, 1),
            "potential_threat": self.potential_threat,
            "recommended_actions": self.recommended_actions,
            "alert_timestamp": self.alert_timestamp,
            "status": self.status,
        }


@dataclass
class CoastalRiskAnalysis:
    overall_risk_level: str  # "HIGH", "MODERATE", "LOW"
    earliest_eta_hours: Optional[float]
    earliest_impact_location: Optional[str]
    active_alerts: List[CoastalAlert]
    monitored_receptors: List[CoastalReceptor]
    coastal_drift_vector_geojson: Dict[str, Any]
    summary_markdown: str

    def to_dict(self) -> Dict[str, Any]:
        return {
            "overall_risk_level": self.overall_risk_level,
            "earliest_eta_hours": round(self.earliest_eta_hours, 1) if self.earliest_eta_hours is not None else None,
            "earliest_impact_location": self.earliest_impact_location,
            "active_alerts_count": len(self.active_alerts),
            "alerts": [a.to_dict() for a in self.active_alerts],
            "receptors": [r.to_dict() for r in self.monitored_receptors],
            "coastal_drift_vector": self.coastal_drift_vector_geojson,
            "summary": self.summary_markdown,
        }


class CoastalEarlyWarningEngine:
    """
    Simulates oil movement toward coastal areas and evaluates intersections
    with vulnerable maritime receptors (MPAs, ports, fishing grounds, beaches, settlements).
    Generates operational Coastal Early Warning Alerts with tactical response actions.
    """

    @staticmethod
    def _haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        R = 6371.0
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = (
            math.sin(dlat / 2.0) ** 2
            + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2.0) ** 2
        )
        c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
        return R * c

    def _get_receptors_catalog(self, center_lat: float, center_lon: float) -> List[CoastalReceptor]:
        """Returns coastal receptors for Mauritius, Mumbai, or dynamic locations."""
        # 1. Mauritius MV Wakashio Coastal Receptors
        if abs(center_lat - (-20.438119)) < 1.0 and abs(center_lon - 57.744631) < 1.0:
            return [
                CoastalReceptor(
                    receptor_id="MU-REC-01",
                    name="Blue Bay Marine Park & RAMSAR Wetland",
                    receptor_type=ReceptorType.MARINE_PROTECTED_AREA.value,
                    lat=-20.4430,
                    lon=57.7180,
                    sensitivity_level="CRITICAL",
                    distance_to_slick_km=0.0,
                    description="Protected marine sanctuary containing 38 coral species and endangered green sea turtles (Chelonia mydas).",
                ),
                CoastalReceptor(
                    receptor_id="MU-REC-02",
                    name="Pointe d'Esny Lagoon & Mangrove Estuary",
                    receptor_type=ReceptorType.MANGROVE_CORAL.value,
                    lat=-20.4250,
                    lon=57.7320,
                    sensitivity_level="CRITICAL",
                    distance_to_slick_km=0.0,
                    description="Pristine coastal lagoon with dense tidal mangrove forests vulnerable to heavy oil adhesion.",
                ),
                CoastalReceptor(
                    receptor_id="MU-REC-03",
                    name="Mahébourg Artisanal Fishing Grounds & Waterfront",
                    receptor_type=ReceptorType.FISHING_GROUND.value,
                    lat=-20.4080,
                    lon=57.7050,
                    sensitivity_level="HIGH",
                    distance_to_slick_km=0.0,
                    description="Key regional artisanal fishing haven supporting over 1,200 registered coastal fishermen.",
                ),
                CoastalReceptor(
                    receptor_id="MU-REC-04",
                    name="Île aux Aigrettes Nature Reserve Island",
                    receptor_type=ReceptorType.MARINE_PROTECTED_AREA.value,
                    lat=-20.4200,
                    lon=57.7300,
                    sensitivity_level="CRITICAL",
                    distance_to_slick_km=0.0,
                    description="Coastal coral limestone islet harboring the critically endangered Pink Pigeon and Aldabra giant tortoises.",
                ),
                CoastalReceptor(
                    receptor_id="MU-REC-05",
                    name="Grand Port Maritime Channel",
                    receptor_type=ReceptorType.PORT_HARBOR.value,
                    lat=-20.3850,
                    lon=57.7400,
                    sensitivity_level="MODERATE",
                    distance_to_slick_km=0.0,
                    description="Historic deep-water navigable pass connecting inner bay to the open Indian Ocean.",
                ),
            ]

        # 2. Mumbai / Arabian Sea Receptors
        if abs(center_lat - 18.9) < 2.0 and abs(center_lon - 72.8) < 2.0:
            return [
                CoastalReceptor(
                    receptor_id="BOM-REC-01",
                    name="Mumbai Port Trust & Naval Dockyard",
                    receptor_type=ReceptorType.PORT_HARBOR.value,
                    lat=18.9300,
                    lon=72.8500,
                    sensitivity_level="HIGH",
                    distance_to_slick_km=0.0,
                    description="Major commercial shipping harbor and naval base.",
                ),
                CoastalReceptor(
                    receptor_id="BOM-REC-02",
                    name="Versova Coastal Fishing Harbor",
                    receptor_type=ReceptorType.FISHING_GROUND.value,
                    lat=19.1300,
                    lon=72.8100,
                    sensitivity_level="HIGH",
                    distance_to_slick_km=0.0,
                    description="Traditional Koli fishing village with over 800 mechanized trawlers.",
                ),
                CoastalReceptor(
                    receptor_id="BOM-REC-03",
                    name="Girgaon & Juhu Public Beach Corridor",
                    receptor_type=ReceptorType.BEACH_TOURISM.value,
                    lat=18.9500,
                    lon=72.8100,
                    sensitivity_level="MODERATE",
                    distance_to_slick_km=0.0,
                    description="High-density public recreation and tourism beach.",
                ),
                CoastalReceptor(
                    receptor_id="BOM-REC-04",
                    name="Thane Creek Flamingo Sanctuary",
                    receptor_type=ReceptorType.MARINE_PROTECTED_AREA.value,
                    lat=19.0800,
                    lon=72.9800,
                    sensitivity_level="CRITICAL",
                    distance_to_slick_km=0.0,
                    description="Designated Ramsar tidal wetland sheltering hundreds of thousands of migratory flamingos.",
                ),
            ]

        # 3. Dynamic Receptors generated around arbitrary ocean location
        return [
            CoastalReceptor(
                receptor_id="DYN-REC-01",
                name="Coastal Fishing Sector Alpha",
                receptor_type=ReceptorType.FISHING_GROUND.value,
                lat=center_lat + 0.05,
                lon=center_lon - 0.04,
                sensitivity_level="HIGH",
                distance_to_slick_km=0.0,
                description="Nearshore commercial and artisanal fishing zone.",
            ),
            CoastalReceptor(
                receptor_id="DYN-REC-02",
                name="Regional Port & Navigation Channel",
                receptor_type=ReceptorType.PORT_HARBOR.value,
                lat=center_lat + 0.08,
                lon=center_lon - 0.06,
                sensitivity_level="HIGH",
                distance_to_slick_km=0.0,
                description="Maritime shipping route and port entrance channel.",
            ),
            CoastalReceptor(
                receptor_id="DYN-REC-03",
                name="Coastal Lagoon & Coral Sanctuary",
                receptor_type=ReceptorType.MARINE_PROTECTED_AREA.value,
                lat=center_lat + 0.03,
                lon=center_lon - 0.02,
                sensitivity_level="CRITICAL",
                distance_to_slick_km=0.0,
                description="Ecologically sensitive coral reef and mangrove fringe.",
            ),
        ]

    def evaluate_coastal_risk(
        self,
        slick_lat: float,
        slick_lon: float,
        drift_speed_mps: float,
        drift_direction_deg: float,
        observation_time: str,
    ) -> CoastalRiskAnalysis:
        receptors = self._get_receptors_catalog(slick_lat, slick_lon)
        alerts: List[CoastalAlert] = []

        # Effective drift speed in km/h
        drift_speed_kmh = max(0.4, drift_speed_mps * 3.6)

        # Movement direction vector
        rad = math.radians(drift_direction_deg)
        drift_u = math.sin(rad)  # East component
        drift_v = math.cos(rad)  # North component

        earliest_eta = None
        earliest_location = None

        # Build projected coastal drift line GeoJSON (clipped at shoreline so it terminates on the coast and never crosses land)
        drift_pts = CoastalBoundaryService.clip_drift_vector(
            start_lat=slick_lat,
            start_lon=slick_lon,
            drift_u=drift_u,
            drift_v=drift_v,
            max_dist_km=25.0,
        )
        drift_line_geojson = mapping(LineString(drift_pts))

        for rec in receptors:
            dist_km = self._haversine_distance_km(slick_lat, slick_lon, rec.lat, rec.lon)
            rec.distance_to_slick_km = dist_km

            # Vector from slick to receptor
            d_lat = rec.lat - slick_lat
            d_lon = (rec.lon - slick_lon) * math.cos(math.radians(slick_lat))
            mag = math.sqrt(d_lat**2 + d_lon**2)
            if mag > 1e-6:
                vec_u = d_lon / mag
                vec_v = d_lat / mag
                cosine_align = (vec_u * drift_u) + (vec_v * drift_v)
            else:
                cosine_align = 1.0

            # Calculate ETA in hours
            raw_eta = dist_km / drift_speed_kmh
            # Adjust ETA based on alignment (if moving directly towards it)
            eta_hours = raw_eta / max(0.35, cosine_align) if cosine_align > 0 else raw_eta * 3.0

            # Determine Risk Level based on distance, alignment, and ETA
            if (eta_hours < 24.0 and cosine_align > 0.3) or dist_km < 4.0:
                risk_level = "HIGH"
                prob_pct = min(96.0, 75.0 + (25.0 * cosine_align))
                min_eta = max(1.0, eta_hours * 0.7)
                max_eta = max(3.0, eta_hours * 1.3)
                eta_label = f"{int(min_eta)}–{int(max_eta)} Hours"
                
                threat = (
                    f"Direct coastal trajectory intersection. Surface oil slick is drifting at "
                    f"{drift_speed_mps:.2f} m/s towards {rec.name}. Expected shoreline stranding within {eta_label}."
                )
                actions = [
                    f"Immediate Boom Deployment: Position ~1,500m of containment booms across access channels to {rec.name}.",
                    "Environmental Alert: Notify Marine Environment Protection and local fisheries management.",
                    "Dispersant Exclusion: Prohibit chemical dispersants inside shallow reef/lagoon boundary.",
                    "Emergency Skimmers: Stage vacuum trucks and disc skimmers at nearest roadhead staging area.",
                ]
            elif (eta_hours <= 48.0 and cosine_align > 0.0) or dist_km < 12.0:
                risk_level = "MODERATE"
                prob_pct = min(72.0, 45.0 + (20.0 * max(0.0, cosine_align)))
                min_eta = max(12.0, eta_hours * 0.8)
                max_eta = max(24.0, eta_hours * 1.25)
                eta_label = f"{int(min_eta)}–{int(max_eta)} Hours"

                threat = (
                    f"Secondary dispersion threat. Current leeway vector may bring weathered sheen into "
                    f"proximity of {rec.name} under sustained wind conditions."
                )
                actions = [
                    "Enhanced Shoreline Patrol: Dispatch daily monitoring teams to inspect high-water mark.",
                    "Pre-stage Booms: Place deflection booms in standby ready-state at local boat ramp.",
                    "Fisheries Warning: Issue precautionary navigation advisory to local fleet.",
                ]
            else:
                risk_level = "LOW"
                prob_pct = 25.0
                eta_label = "> 48 Hours"
                threat = f"Low immediate probability. Trajectory is currently diverging from {rec.name}."
                actions = [
                    "Continuous Monitoring: Retain satellite radar surveillance across upcoming orbital passes.",
                    "Maintain general maritime incident readiness.",
                ]

            alert = CoastalAlert(
                alert_id=f"ALERT-{rec.receptor_id}-{risk_level}",
                receptor_id=rec.receptor_id,
                location_name=rec.name,
                receptor_type=rec.receptor_type,
                risk_level=risk_level,
                eta_hours_min=raw_eta * 0.8,
                eta_hours_max=raw_eta * 1.3,
                eta_label=eta_label,
                impact_probability_pct=prob_pct,
                potential_threat=threat,
                recommended_actions=actions,
                alert_timestamp=datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC"),
            )
            alerts.append(alert)

            if risk_level == "HIGH":
                if earliest_eta is None or raw_eta < earliest_eta:
                    earliest_eta = raw_eta
                    earliest_location = rec.name

        # Determine overall coastal risk level
        if any(a.risk_level == "HIGH" for a in alerts):
            overall_risk = "HIGH"
        elif any(a.risk_level == "MODERATE" for a in alerts):
            overall_risk = "MODERATE"
        else:
            overall_risk = "LOW"

        summary = (
            f"**Overall Coastal Threat Level: {overall_risk}**. "
            f"Evaluated {len(receptors)} sensitive coastal receptors. "
            f"Identified {sum(1 for a in alerts if a.risk_level == 'HIGH')} HIGH-RISK coastal alert(s). "
            + (f"Earliest projected impact: **{earliest_location}** in ~{earliest_eta:.1f} hours." if earliest_location else "No immediate landfall detected within 48h.")
        )

        return CoastalRiskAnalysis(
            overall_risk_level=overall_risk,
            earliest_eta_hours=earliest_eta,
            earliest_impact_location=earliest_location,
            active_alerts=alerts,
            monitored_receptors=receptors,
            coastal_drift_vector_geojson=drift_line_geojson,
            summary_markdown=summary,
        )
