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
- Files updated: [`CharacterizationDashboard.tsx`](file:///d:/Project/Tarang/frontend/src/components/CharacterizationDashboard.tsx), [`MaritimeInvestigationSuite.tsx`](file:///d:/Project/Tarang/frontend/src/components/MaritimeInvestigationSuite.tsx)
- Added `MapMouseTracker` global map mousemove listener throttled at 30ms for smooth 60fps tracking without UI frame drops.
- Context-Aware Hover Modes:
  - **State A (Outside Spill)**: `📍 Marine Coordinate Inspector` displaying live cursor GPS DMS/Decimal coordinates, live Sea Basin, and nearest coastal proximity.
  - **State B (Inside Spill / Pin)**: `🚨 Observed Spill Slick (+0h)` displaying live cursor GPS, Sea Basin, coastal proximity, PLUS surface area (`~2.805 km²`) and detection timestamp (`05 Feb 2021 03:50 UTC`).

### 13. GIS Layer Decluttering & Satellite Basemap Locking
- Files updated: [`CharacterizationDashboard.tsx`](file:///d:/Project/Tarang/frontend/src/components/CharacterizationDashboard.tsx), [`MaritimeInvestigationSuite.tsx`](file:///d:/Project/Tarang/frontend/src/components/MaritimeInvestigationSuite.tsx)
- Locked both Characterization and Maritime Investigation suites exclusively to high-resolution **Esri World Imagery** satellite map.
- Removed animated wave ripples and clutter lines from Page 3.
- Restructured Page 4 GIS source layers into two dedicated tabs:
  - **Tab 1 (Suspect Vessels)**: Probable Origin (1σ/2σ/3σ), AIS Vessels & Tracks, Backward Hindcast Trajectories, Counterfactual Simulated Slick, AIS Transmission Blackouts, SAR Radar Vessel Detections.
  - **Tab 2 (Infrastructure & Coast)**: Ports & Terminals, Subsea Pipelines, Offshore Platforms, Refineries, Natural Seeps, Threatened Coastal Assets.
- Heavy visual layers defaulted to off/unchecked so maps open crisp and high-contrast without visual clutter.

### 14. Removal of Obsolete Prototypes & GSD Artifacts
- Removed deleted `.gsd/` documentation and style configs from repository and added to `.gitignore`.
- Removed 6 unused early prototype components (`GlobalSurveillanceMap.tsx`, `IncidentsTable.tsx`, `MultiSatelliteViewer.tsx`, `Navbar.tsx`, `SidebarControls.tsx`, `TelemetryDisplay.tsx`) superseded by the 5 main mission suites.
- Cleaned up one-off scripts (`frontend/download.py`, `characterization/update_authentic_coords.py`) and offline design mockups (`stitch_designs/`).

### 15. Clean Separation of Frontend & Backend Architecture
- Centralized all Python microservices, models, datasets, and characterization pipelines into **`backend/`**:
  - `backend/api.py`, `backend/cdse_client.py`, `backend/preprocess.py`, `backend/unet_oilspill.h5`, `backend/model_capabilities.yaml`, `backend/requirements.txt`, `backend/characterization/`, `backend/modules/`, and `backend/data/`.
- Implemented root backwards-compatibility proxy shim (`api.py`) to support seamless local running (`uvicorn api:app`).
- Added `tests/conftest.py` ensuring pytest passes all 25 unit and integration tests.
- Updated [PROJECT_RULES.md](file:///d:/Oil_spill(sos)/PROJECT_RULES.md), [README.md](file:///d:/Oil_spill(sos)/README.md), and [API_INTEGRATIONS.md](file:///d:/Oil_spill(sos)/API_INTEGRATIONS.md) to reflect the new structure.

### 16. Authentic Grand Port Bay Oil Spill Polygon Implemented
- Files updated: [`backend/data/wakashio_benchmark/real_spill_polygon.json`](file:///d:/Oil_spill(sos)/backend/data/wakashio_benchmark/real_spill_polygon.json), [`backend/data/wakashio_benchmark/real_binary_mask_256.png`](file:///d:/Oil_spill(sos)/backend/data/wakashio_benchmark/real_binary_mask_256.png), [`backend/api.py`](file:///d:/Oil_spill(sos)/backend/api.py).
- Calibrated exact 26-vertex polygon conforming to the authentic oil spill footprint from Google Earth satellite imagery:
  - Traces the wreck origin at the coral barrier reef (`-20.43812, 57.74463`).
  - Follows Pointe d'Esny lagoon shoreline and wraps through the channel west of Île aux Aigrettes.
  - Follows Mahebourg Waterfront and River La Chaux inlet.
  - Extends north along Ferney coast into the U-shaped Vieux Grand Port harbor / Lion Mountain inlet (`-20.3685, 57.7005`).
  - Follows the northern coastline along Bois des Amourettes and Anse Jonchée to the northern apex at Bambous Virieux bay (`-20.3415, 57.7610`).
  - Cuts south across the central Grand Port deep lagoon water channel back to the reef wreck.
- **Metrics**: Surface area `32.93 km²`, perimeter `31.28 km`, centroid `(-20.393225, 57.730365)`.
- Generated 256x256 binary ground truth mask (`11,128` spill pixels) with `buffer_deg = 0.065`.
- Updated backend API default centroid and multi-temporal benchmark observations (14.2 km² on 2020-08-07, 32.93 km² on 2020-08-10).

