# 🛰️ TARANG: Multi-Satellite Marine Oil Spill Detection & Characterization Engine
### Real-Time Sentinel-1 SAR Radar, Sentinel-2 Optical (MSI), Deep Learning U-Net, 3D Geospatial Globe & Lagrangian Particle Drift Intelligence

---

## 📌 1. Project Overview

**TARANG** is an automated space-based maritime surveillance system designed to detect, delineate, characterize, and predict the movement of marine oil spills worldwide using the **European Space Agency (ESA) Copernicus Data Space Ecosystem (CDSE)**.

The system combines:
1. **Multi-Sensor Spaceborne Remote Sensing**:
   * **Sentinel-1 C-Band SAR Radar (5.405 GHz)**: Day/night, all-weather wave-damping detection.
   * **Sentinel-2 Multispectral Optical (MSI)**: Red (`B04`), NIR (`B08`), and SWIR (`B11`) spectral analysis utilizing the **Floating Algae/Oil Index (FAI)** for false-alarm rejection.
2. **Deep Learning Segmentation & Denoising**:
   * Pretrained **U-Net Convolutional Neural Network** (`unet_oilspill.h5`) for pixel-level binary classification.
   * Edge-preserving **Bilateral Filter + CLAHE** real-time despeckling.
3. **Oil Spill Characterization Engine (`characterization/`)**:
   * **Exact Vector Polygon Geometry**: GeoJSON boundary extraction, surface area ($\text{km}^2$), perimeter ($\text{km}$), centroid, major length, minor width, and orientation angle ($^\circ$).
   * **Hydrodynamic Movement Vector**: Combines ocean current velocity with wind leeway drift ($\vec{v}_{oil} = \vec{v}_{current} + C_{wind} \cdot \vec{v}_{wind}$) to compute net drift speed and 16-point cardinal heading (e.g. `NW`).
   * **Multi-Temporal Spreading Rate**: Observational $\text{spread rate} = \Delta \text{area} / \Delta \text{time}$ ($\text{km}^2/\text{h}$).
   * **Model-Based Severity Classification**: Categorizes slick severity (`Very Thin` $\to$ `Very Thick`) with confidence scores.
   * **Lagrangian Particle Hindcasting**: Backward particle advection and turbulent diffusion to identify the **Probable Origin** centroid and origin time window.
   * **Predictive Forecasting**: Forward particle dispersion at $+6\text{h}$, $+12\text{h}$, $+24\text{h}$, $+48\text{h}$, and $+72\text{h}$ with expanding uncertainty cones.
4. **AI-Enabled Maritime Vessel Investigation & Coastal Early Warning Engine (`characterization/investigation/`)**:
    * **Multi-Tier Probable Origin Region**: High (1σ Core), Medium (2σ Region), and Low (3σ Outer Boundary) spatial uncertainty contour polygons with estimated release time window.
    * **Global Fishing Watch (GFW) & SAR Integration**: Correlates AIS vessel presence (`public-global-presence:latest`) with Sentinel-1 SAR satellite vessel detections (`public-global-sar-presence:latest`).
    * **Candidate Categorization**:
      - **Category A**: AIS-visible vessel candidates.
      - **Category B**: SAR-detected AIS-correlated candidates.
      - **Category C**: AIS-unmatched SAR detection candidates (radar echoes with no broadcast AIS; analyzed transparently without false criminality).
    * **Explainable Multi-Factor Vessel Ranking**: Scores candidates (0–100) across Spatial Proximity (25%), Temporal Window Overlap (25%), Trajectory Lingering (20%), Oceanographic Drift Consistency (15%), AIS Transmission Blackout Coincidence (10%), and Vessel Risk Class (5%) with evidentiary justification bullet points.
    * **Coastal Drift Forecasting & Early Warning Alerts**: Intersects forward drift trajectory with vulnerable coastal receptors (Marine Protected Areas, Commercial Ports, Artisanal Fishing Grounds, Tourism Beaches) to output actionable Early Warning Alerts (HIGH / MODERATE / LOW risk) with ETA countdowns and tactical containment measures.
    * **Exportable Investigation Priority Reports**: Automated synthesis of formal Markdown and JSON briefing documents for maritime law enforcement.
5. **Interactive 3D & 2D Geospatial Dashboard**:
   * **Three.js 3D Ocean Globe**: Real NASA Blue Marble Earth textures, shipping lanes, and single-beacon anomaly tracking.
   * **Satellite Evidence Lab**: 4-Card multi-satellite inspection deck and interactive before/after split slider.
   * **Characterization Dashboard**: Interactive Leaflet geospatial map with toggleable layer switches and forecast timeline scrubbing.
   * **Maritime Investigation Suite**: Tactical Leaflet operations center with origin zones, candidate vessel paths, AIS gap segments, SAR echo markers, coastal asset risk badges, and explainable AI evidence drawers.

---

## 🏛️ 2. System Architecture

```
                      ESA COPERNICUS DATA SPACE ECOSYSTEM (CDSE)
                                          │
                         ┌────────────────┴────────────────┐
                         ▼                                 ▼
             🛰️ Sentinel-1 GRD SAR               📷 Sentinel-2 L2A Optical
             (C-Band Dual-Pol Radar,             (Red B4, NIR B8, SWIR B11,
              Wave Damping Anomaly)               Floating Algae/Oil Index)
                         │                                 │
                         ▼                                 │
             ┌─────────────────────────┐                   │
             │  backend/preprocess.py  │                   │
             │  Adaptive SAR Baseline  │                   │
             │       Calibration       │                   │
             └───────────┬─────────────┘                   │
                         ▼                                 │
             ┌─────────────────────────┐                   │
             │ backend/unet_oilspill.h5│                   │
             │   U-Net Segmentation    │                   │
             └───────────┬─────────────┘                   │
                         ▼                                 │
                 Binary Spill Mask                         │
                         │                                 │
                         ▼                                 ▼
             ┌─────────────────────────────────────────────┐
             │    FastAPI Backend (backend/api.py)         │
             └───────────────────────┬─────────────────────┘
                                     │
             ┌───────────────────────┴─────────────────────┐
             ▼                                             ▼
┌─────────────────────────────────┐       ┌─────────────────────────────────┐
│ backend/characterization/       │       │ frontend/ (React + Vite + TS)   │
│ - Geometry Extractor            │       │ - Cinematic Mission Landing     │
│ - Movement Drift Vector         │──────►│ - 3D Earth Globe Surveillance   │
│ - Spreading Rate (dA/dt)        │       │ - Multi-Satellite Vision Suite  │
│ - Model Severity Estimator      │       │ - Characterization & Drift Map  │
│ - Backward Hindcast & Forecast  │       │ - Maritime Investigation & AIS  │
│ - Origin Zones & Vessel Forensics       └─────────────────────────────────┘
└─────────────────────────────────┘
```

---

## 📂 3. Directory Structure

```
Oil_spill(sos)/
│
├── backend/                                   # 🐍 Python Microservice & Analytics Engine
│   ├── api.py                                 # FastAPI application with REST endpoints
│   ├── cdse_client.py                         # Copernicus CDSE API acquisition client
│   ├── preprocess.py                          # Radiometric calibration & tensor normalization
│   ├── unet_oilspill.h5                       # Pretrained U-Net Deep Learning model
│   ├── model_capabilities.yaml                # Model metadata & sensor specifications
│   ├── requirements.txt                       # Python backend dependencies
│   │
│   ├── characterization/                      # Oil Spill Characterization & Particle Drift Engine
│   │   ├── config.py                          # Wind drift leeway (3%), diffusion Kh, and particle defaults
│   │   ├── engine.py                          # Master coordinator & in-memory SpillAnalysisStore
│   │   ├── geometry/geometry_extractor.py     # GeoJSON polygon boundary, area, perimeter, orientation
│   │   ├── movement/drift_vector.py           # Combined velocity vector, speed, cardinal heading
│   │   ├── movement/environmental_provider.py # Trade-wind & ocean current vector fields
│   │   ├── spreading/spreading_calculator.py  # Multi-temporal spreading rate (dA/dt)
│   │   ├── severity/thickness_estimator.py    # Model-based thickness/severity estimation
│   │   ├── drift/particle_model.py            # Lagrangian advection & Brownian diffusion
│   │   ├── drift/hindcast.py                  # Backward particle tracking to find Probable Origin (-48h)
│   │   ├── drift/forecast.py                  # Forward particle dispersion (+6h to +72h)
│   │   ├── uncertainty/dispersion.py          # Dispersion metrics (σx, σy) & uncertainty cone
│   │   └── investigation/                     # Vessel attribution & coastal warning engine
│   │       ├── origin_zones.py                # 1σ/2σ/3σ Probable Origin zones & release time window
│   │       ├── vessel_models.py               # Pydantic schemas for Categories A, B, and C
│   │       ├── gfw_provider.py                # GFW AIS vessel presence & SAR radar correlates
│   │       ├── ranking_engine.py              # Multi-factor explainable vessel ranking (0–100)
│   │       ├── coastal_warning.py             # Coastal drift vector & asset risk alerts
│   │       ├── report_generator.py            # Automated law enforcement briefing synthesis
│   │       └── orchestrator.py                # End-to-end investigation pipeline
│   │
│   ├── modules/                               # Dedicated Benchmark Modules
│   │   └── benchmark_emerald.py               # MT Emerald historical benchmark suite
│   │
│   └── data/                                  # Ground-Truth Incident Benchmark Datasets
│       ├── emerald_benchmark/                 # Eastern Mediterranean 2021 SAR/Optical imagery
│       └── wakashio_benchmark/                # Mauritius 2020 SAR/Optical ground-truth imagery
│
├── frontend/                                  # ⚛️ React + Vite + TypeScript Frontend
│   ├── package.json                           # Frontend scripts & dependencies
│   ├── tsconfig.json                          # TypeScript configuration
│   ├── vite.config.ts                         # Vite build & proxy settings
│   ├── index.html                             # Single-page application entrypoint
│   └── src/
│       ├── App.tsx                            # Root mission control navigation & layout
│       ├── index.css                          # Modern dark-mode styling tokens
│       ├── types.ts                           # Comprehensive TypeScript data interfaces
│       ├── utils/spatialLookup.ts             # Coastal geometry & coordinate conversion helpers
│       ├── assets/                            # Cinematic video streams & media feeds
│       └── components/
│           ├── CinematicLanding.tsx           # Page 0: Cinematic mission control introduction
│           ├── OceanGlobe.tsx                 # Page 1: Interactive 3D Three.js Earth globe
│           ├── SatelliteVisionSuite.tsx       # Page 2: 4-Card spaceborne optical & radar lab
│           ├── CharacterizationDashboard.tsx  # Page 3: Spill geometry, drift physics & forecast timeline
│           ├── MaritimeInvestigationSuite.tsx # Page 4: Suspect vessel forensics & coastal risk center
│           ├── SourceHypothesisSuite.tsx      # Infrastructure & multi-source hypothesis inspector
│           ├── SpillTooltipCard.tsx           # Reusable floating telemetry card
│           └── WatchdogSimulation.tsx         # Automated watchdog surveillance simulation
│
├── tests/                                     # 🧪 Automated Pytest Test Suite
│   ├── conftest.py                            # Auto sys.path configuration for backend
│   ├── test_characterization.py               # Spill geometry & drift engine tests
│   ├── test_investigation.py                  # Origin zones & vessel ranking tests
│   └── test_benchmark_emerald.py              # MT Emerald benchmark pipeline tests
│
├── api.py                                     # 🔄 Root compatibility proxy shim (supports uvicorn api:app)
├── requirements.txt                           # Root requirements reference
└── .gitignore                                 # Git ignore rules
```

---

## 📡 4. REST API Reference

### Core Endpoints:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/scan` | Ingests satellite data, runs U-Net segmentation, extracts vector polygon, and returns telemetry. |
| `GET` | `/api/spill/{id}/geometry` | Returns GeoJSON boundary, area ($\text{km}^2$), perimeter ($\text{km}$), centroid, length, width, and orientation. |
| `GET` | `/api/spill/{id}/movement` | Returns net drift speed, direction in degrees, cardinal heading, and wind/current contribution %. |
| `GET` | `/api/spill/{id}/spreading` | Returns multi-temporal spreading rate ($\text{km}^2/\text{h}$) across satellite passes. |
| `GET` | `/api/spill/{id}/severity` | Returns model-based severity classification (`Thick`, `Very Thick`, etc.) and confidence. |
| `POST` | `/api/spill/{id}/hindcast` | Backtracks Lagrangian particles to identify **Probable Origin**, origin time window, and uncertainty radius. |
| `POST` | `/api/spill/{id}/forecast` | Propagates particles forward to generate future polygons ($+6\text{h}$ to $+72\text{h}$) and uncertainty cones. |
| `GET` | `/api/spill/{id}/analysis` | Returns the complete unified characterization and predictive drift dataset. |
| `GET` | `/api/spill/{id}/origin` | Returns multi-tier Probable Origin Regions (High 1σ, Medium 2σ, Low 3σ zones) and release time window. |
| `GET` | `/api/spill/{id}/vessels` | Returns ranked vessel candidates (Category A, B, C) with multi-factor scores and explainable reasons. |
| `GET` | `/api/spill/{id}/coastal-risk` | Returns coastal drift impact forecast, vulnerable receptors (MPAs, ports, fisheries, beaches), and active early warning alerts. |
| `GET` | `/api/spill/{id}/investigation-report` | Returns the full consolidated investigation priority report (structured data + Markdown briefing). |
| `POST` | `/api/v1/demo/replay-emerald` | Runs the full 7-step historical benchmark on MT EMERALD (IMO 9231224) returning attribution telemetry. |
| `GET` | `/api/v1/demo/emerald-docket.pdf` | Serves the official cryptographic SHA-256 stamped PDF enforcement docket for MT EMERALD. |

---

## 🚀 5. Getting Started (Local Setup)

### Prerequisites:
* **Python 3.9+**
* **Node.js 18+** & **npm**

### Step 1: Install Python Dependencies
```bash
pip install -r backend/requirements.txt
```

### Step 2: Install Frontend Dependencies
```bash
cd frontend
npm install
cd ..
```

### Step 3: Run the Development Servers
In Terminal 1 (FastAPI Backend):
```bash
# Option A: From root using the compatibility proxy shim
python -m uvicorn api:app --host 0.0.0.0 --port 8000 --reload

# Option B: Directly from backend/
python -m uvicorn backend.api:app --host 0.0.0.0 --port 8000 --reload
```

In Terminal 2 (React Frontend):
```bash
cd frontend
npm run dev
```

Open **`http://localhost:5173`** (or **`http://localhost:3000`**) in your browser.

---

## 🚀 5. Production Deployment

TARANG provides turnkey production deployment via Docker Compose or native Linux hosting.

### One-Command Docker Deployment (Recommended)
```bash
# 1. Build and start containers in detached mode
docker compose up -d --build

# 2. View container status
docker compose ps

# 3. View live backend logs
docker compose logs -f backend
```

Access services:
* **Web Application**: `http://<your-server-ip>/` (Port 80 via Nginx)
* **REST API Documentation**: `http://<your-server-ip>:8000/docs`

For comprehensive Cloud PaaS (Render, Vercel, Railway, Fly.io) and Ubuntu VPS Systemd instructions, consult the complete [Production Deployment Guide](file:///d:/Oil_spill(sos)/docs/DEPLOYMENT_GUIDE.md).

---

## 🧪 6. Running Automated Tests

Run the full automated pytest suite (25 tests):
```bash
python -m pytest tests/ -v
```

All 25 unit and end-to-end integration tests verify:
* ✅ Polygon geometry extraction & GeoJSON boundary compliance
* ✅ Environmental velocity vectors and 16-point cardinal heading conversion
* ✅ Movement drift calculations and coastal shoreline clamping
* ✅ Multi-temporal spreading rate calculations & single-observation handling
* ✅ Model-based severity & oil thickness estimation
* ✅ Lagrangian backward hindcast & forward forecast particle integration
* ✅ End-to-end characterization pipeline execution
* ✅ Probable origin zones generation (1σ Core, 2σ Region, 3σ Boundary) & Release Time Window
* ✅ Global Fishing Watch (GFW) & Sentinel-1 SAR intelligence provider (Categories A, B, and C)
* ✅ Multi-factor explainable vessel ranking algorithm (0–100 score breakdown & transparent justifications)
* ✅ Coastal drift impact simulation & Early Warning Alert generation (MPAs, ports, fisheries, beaches)
* ✅ End-to-end investigation orchestrator & report synthesis
* ✅ REST API investigation endpoints
* ✅ MT Emerald historical benchmark pipeline (SAR acquisition, U-Net inference, AIS correlation, PDF docket generation)

---

## 🤝 7. Contribution Guide

We welcome contributions! Follow this workflow to contribute:

### Step 1: Clone the Repository
```bash
git clone https://github.com/Ahiram15/Tarang.git
cd Tarang
```

### Step 2: Create a Feature Branch
```bash
git checkout -b feature/your-feature-name
```

### Step 3: Install Dependencies
```bash
pip install -r backend/requirements.txt
cd frontend && npm install && cd ..
```

### Step 4: Make Changes & Verify
* Ensure all tests pass: `python -m pytest tests/ -v`
* Verify frontend compilation: `cd frontend && npx tsc --noEmit && cd ..`

### Step 5: Commit and Push
```bash
git add .
git commit -m "feat: your feature description"
git push origin feature/your-feature-name
```

### Step 6: Submit a Pull Request
Open a PR on GitHub with a description of your changes and test verification results!

---

## 📜 8. Benchmark Incidents

### A. MV Wakashio Grounding (Mauritius)
* **Incident**: MV Wakashio Coral Reef Grounding (Mauritius, Indian Ocean)
* **Wreck Coordinates**: `20°26′17.23″ S, 57°44′40.67″ E` (`-20.438119°S, 57.744631°E`)
* **Standard AOI Bounding Box**: `[-20.38, 57.68 to -20.50, 57.82]`
* **Validation Satellites**: Sentinel-1 C-Band SAR & Sentinel-2 MSI Optical

### B. MT Emerald Mystery Oil Spill (Eastern Mediterranean)
* **Incident**: Deliberate discharge by Suezmax Crude Oil Tanker during an 8-hour AIS blackout (~50 km off Levant coast)
* **Vessel Details**: MT *Emerald* (ex-name: *Ebn Batuta*) | IMO: `9231224` | MMSI: `372469000` (alias: `356145000`) | Flag: Panama
* **Discharge Window**: February 1, 2021 (22:00 UTC) to February 2, 2021 (04:00 UTC)
* **Estimated Volume**: 1,000 to 2,000 metric tons of crude oil
* **Release Centroid**: `33.15° N, 34.20° E` ($\pm 25\text{ km}$ uncertainty radius)
* **AOI Bounding Box**: `[33.50, 32.50, 35.50, 34.50]`
* **Validation Satellites**: Sentinel-1 SAR Primary (`S1A_IW_GRDH_...20210205T035017`) & Shoreward (`S1A_IW_GRDH_...20210211T035017`)
* **Full Case Dossier**: [docs/EMERALD_CASE_STUDY.md](file:///d:/Oil_spill(sos)/docs/EMERALD_CASE_STUDY.md)

---

## 📄 License
This project is licensed under the MIT License.
