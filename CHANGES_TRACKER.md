# 📝 CHANGES TRACKER — TARANG

**Branch**: `task3`  
**Last Updated**: September 23, 2026

---

## 📅 Changes Log

### 1. Repository & Branch Setup
- Cloned `https://github.com/Ahiram15/Tarang.git`
- Created and switched to branch `task3`

### 2. Environment & Local Servers
- Installed frontend dependencies (`npm install`)
- Installed backend dependencies (`pip install -r requirements.txt`)
- Launched Frontend: `http://127.0.0.1:5173/`
- Launched Backend API: `http://127.0.0.1:8000/`

### 3. Globe Hover Tooltip Fix
- File updated: [`frontend/src/components/OceanGlobe.tsx`](file:///d:/Project/Tarang/frontend/src/components/OceanGlobe.tsx)
- Moved the red dot hover location tooltip so it displays directly next to the hovered point instead of at the bottom of the globe.

### 4. Overall Investigation Pipeline Flow Definition
- Defined the end-to-end 11-Phase Maritime Oil-Spill Investigation Flow architecture:
  - **Upstream Input**: Detected Oil Spill $\to$ Geometry + Probable Origin $\to$ Release-Time Window
  - **Phase 1**: Investigation Initialization (Create Investigation AOI)
  - **Phase 2**: AIS Vessel Investigation
  - **Phase 3**: SAR Vessel Investigation
  - **Phase 4**: Spatial and Temporal Data Fusion
  - **Phase 5**: AIS-SAR Matching & Unmatched Vessel Analysis
  - **Phase 6**: Vessel Identity Enrichment
  - **Phase 7**: Vessel Track & Behaviour Analysis
  - **Phase 8**: Explainable Vessel Attribution
  - **Phase 9**: Oceanographic Hindcast Validation
  - **Phase 10**: Forward Oil-Spill Drift Prediction
  - **Phase 11**: Coastal Risk Analysis
  - **Output**: Final GIS Investigation Dashboard

### 5. Vessel Attribution Input Specification
- Modules mapped: [`origin_zones.py`](file:///d:/Project/Tarang/characterization/investigation/origin_zones.py) & [`orchestrator.py`](file:///d:/Project/Tarang/characterization/investigation/orchestrator.py)
- Configured mandatory upstream parameters:
  - Spill ID (e.g. `SPILL_001`)
  - Detected Spill Polygon & Geometry
  - Probable Spill Origin (Latitude & Longitude)
  - Origin Uncertainty Region / Radius (treated as 2D spatial region: 1σ Core, 2σ Region, 3σ Boundary, not a single point)
  - Probable Release-Time Window & Spill Detection Timestamp
  - Estimated Spill Age

### 6. Map Zoom & Full Viewport Tile Fix
- Files updated: [`CharacterizationDashboard.tsx`](file:///d:/Project/Tarang/frontend/src/components/CharacterizationDashboard.tsx), [`MaritimeInvestigationSuite.tsx`](file:///d:/Project/Tarang/frontend/src/components/MaritimeInvestigationSuite.tsx), [`GlobalSurveillanceMap.tsx`](file:///d:/Project/Tarang/frontend/src/components/GlobalSurveillanceMap.tsx)
- Configured `maxNativeZoom` (`18`/`16`), `maxZoom={20}`, `minZoom={1}`, and `worldCopyJump={true}` so map tiles smoothly stretch/render at all zoom levels without breaking or showing empty "map not available" tiles when zooming out or exploring outside the spill area.
- Updated `MapCameraController` to prevent camera auto-locking when user pans or zooms outside the spill boundary.

### 7. Satellite Spill Image Outer Map Backdrop Fix
- Files updated: [`SatelliteVisionSuite.tsx`](file:///d:/Project/Tarang/frontend/src/components/SatelliteVisionSuite.tsx), [`MultiSatelliteViewer.tsx`](file:///d:/Project/Tarang/frontend/src/components/MultiSatelliteViewer.tsx)
- Replaced pitch black container backgrounds (`#04060a`) with high-resolution satellite imagery GIS map backdrops and set `objectFit: 'cover'`.
- Outer areas surrounding cropped spill images now continuously display complete satellite ocean, wave, and coastline map details instead of blank dark boxes or "data unavailable" placeholders.

### 8. Removal of "Map data not yet available" Watermark Tile
- Files updated: [`SatelliteVisionSuite.tsx`](file:///d:/Project/Tarang/frontend/src/components/SatelliteVisionSuite.tsx), [`MultiSatelliteViewer.tsx`](file:///d:/Project/Tarang/frontend/src/components/MultiSatelliteViewer.tsx)
- Replaced the hardcoded invalid tile URL (`tile/10/500/300` which contained the gray background and `Map data not yet available` watermark seen in screenshots) with a valid high-resolution ESRI ocean satellite tile (`tile/6/26/38`) and radial ocean GIS backdrop.
- Completely eliminated the gray backdrop and watermark text so the outer areas surrounding the spill display clean satellite ocean map details.

### 9. Complete Benchmark Dataset Image Watermark Clean & Regeneration
- Datasets updated: [`data/emerald_benchmark/`](file:///d:/Project/Tarang/data/emerald_benchmark/) & [`data/wakashio_benchmark/`](file:///d:/Project/Tarang/data/wakashio_benchmark/)
- **Root Cause Identified**: The pre-rendered benchmark image layers (specifically `deep_marine_256.png`, `deep_marine_super_res.png`, `grayscale_256.png`, `grayscale_super_res.png`, `spill_polygon_overlay.png`, and `spill_zoomed_crop.png`) for the active MT Emerald incident (`33.15°N, 34.20°E`) contained rasterized gray background tiles with "Map data not yet available" white text burned into their pixels from an earlier tile fetch fallback.
- **Fix**: Re-generated all pre-cached satellite palette layers, polygon overlays, and zoomed vector crop images directly from authentic Sentinel-1 SAR and Sentinel-2 optical satellite data with smooth CLAHE contrast and clean marine backgrounds.
- Verified zero gray tile watermarks or broken placeholders across all satellite vision tabs, palette modes, and incident locations.
### 10. Ocean Tile maxNativeZoom Clamping & Ocean-Friendly Basemaps
- Files updated: [`CharacterizationDashboard.tsx`](file:///d:/Project/Tarang/frontend/src/components/CharacterizationDashboard.tsx), [`MaritimeInvestigationSuite.tsx`](file:///d:/Project/Tarang/frontend/src/components/MaritimeInvestigationSuite.tsx), [`GlobalSurveillanceMap.tsx`](file:///d:/Project/Tarang/frontend/src/components/GlobalSurveillanceMap.tsx)
- Clamped tile server requests with `maxNativeZoom={13}` and `maxZoom={20}` across all Leaflet maps so ocean tile requests stop at level 13 and scale smoothly, completely eliminating "Map data not yet available" watermarks in open marine coordinates.
- Added ocean-friendly basemaps: CartoDB Positron (Light), Esri World Ocean Base, CartoDB Voyager, Esri World Imagery, and Esri Dark Canvas.

### 11. Rich Geographic & Oceanic Tooltip Cards
- Files created/updated: [`spatialLookup.ts`](file:///d:/Project/Tarang/frontend/src/utils/spatialLookup.ts), [`SpillTooltipCard.tsx`](file:///d:/Project/Tarang/frontend/src/components/SpillTooltipCard.tsx)
- Implemented real-time reverse geocoding & spatial lookup:
  - Marine Sea Basin resolution (*Bay of Bengal*, *Arabian Sea*, *Levantine Basin*, *Mascarene Plateau*, etc.) via coordinate bounding boxes.
  - GPS DMS format conversion (`17°39'07" N, 83°18'54" E`) paired with decimal representation.
  - Nearest coastal port proximity & Haversine distance calculations (e.g. `~28.4 km offshore from Visakhapatnam Port, India (INVTZ)`).
- Designed structured dark-theme tooltip cards with labeled data rows and red SAR sensor badges.

### 12. Dynamic Cursor Tracking & Context-Aware Hover Modes
- Files updated: [`CharacterizationDashboard.tsx`](file:///d:/Project/Tarang/frontend/src/components/CharacterizationDashboard.tsx), [`GlobalSurveillanceMap.tsx`](file:///d:/Project/Tarang/frontend/src/components/GlobalSurveillanceMap.tsx), [`MaritimeInvestigationSuite.tsx`](file:///d:/Project/Tarang/frontend/src/components/MaritimeInvestigationSuite.tsx)
- Added `MapMouseTracker` global map mousemove listener throttled at 30ms for smooth 60fps tracking without UI frame drops.
- Context-Aware Hover Modes:
  - **State A (Outside Spill)**: `📍 Marine Coordinate Inspector` displaying live cursor GPS DMS/Decimal coordinates, live Sea Basin, and nearest coastal proximity.
  - **State B (Inside Spill / Pin)**: `🚨 Observed Spill Slick (+0h)` displaying live cursor GPS, Sea Basin, coastal proximity, PLUS surface area (`~2.805 km²`) and detection timestamp (`05 Feb 2021 03:50 UTC`).
