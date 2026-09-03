"""
Oil Spill Characterization Engine
Modular geospatial intelligence, movement dynamics, Lagrangian particle drift, and uncertainty engine.
"""

from .config import CharacterizationConfig
from .engine import CharacterizationEngine, SpillAnalysisStore

__all__ = ["CharacterizationConfig", "CharacterizationEngine", "SpillAnalysisStore"]
