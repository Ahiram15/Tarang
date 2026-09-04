"""
AI-Enabled Maritime Oil Spill Investigation and Coastal Early Warning Engine.
Provides spatial-temporal backtracking, multi-tier probable origin zones,
AIS and SAR vessel correlation, explainable multi-factor candidate ranking,
and coastal drift risk early warnings.
"""

from .origin_zones import OriginZoneEngine, ProbableOriginZones
from .vessel_models import CandidateVessel, AISGap, SARVesselDetection, VesselWaypoint, InvestigationCategory
from .gfw_provider import GFWMaritimeDataProvider
from .ranking_engine import VesselRankingEngine, RankedInvestigationResult
from .coastal_warning import CoastalEarlyWarningEngine, CoastalRiskAnalysis, CoastalAlert, CoastalReceptor
from .report_generator import InvestigationReportGenerator, InvestigationPriorityReport
from .orchestrator import InvestigationOrchestrator

__all__ = [
    "OriginZoneEngine",
    "ProbableOriginZones",
    "CandidateVessel",
    "AISGap",
    "SARVesselDetection",
    "VesselWaypoint",
    "InvestigationCategory",
    "GFWMaritimeDataProvider",
    "VesselRankingEngine",
    "RankedInvestigationResult",
    "CoastalEarlyWarningEngine",
    "CoastalRiskAnalysis",
    "CoastalAlert",
    "CoastalReceptor",
    "InvestigationReportGenerator",
    "InvestigationPriorityReport",
    "InvestigationOrchestrator",
]
