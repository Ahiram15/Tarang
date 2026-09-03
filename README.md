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
4. **Interactive 3D & 2D Geospatial Dashboard**:
   * **Three.js 3D Ocean Globe**: Real NASA Blue Marble Earth textures, shipping lanes, and single-beacon anomaly tracking.
   * **Satellite Evidence Lab**: 4-Card multi-satellite inspection deck and interactive before/after split slider.
   * **Characterization Dashboard**: Interactive Leaflet geospatial map with toggleable layer switches and forecast timeline scrubbing.

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
             ┌───────────────────────┐                     │
             │     preprocess.py     │                     │
             │ Adaptive SAR Baseline │                     │
             │      Calibration      │                     │
             └───────────┬───────────┘                     │
                         ▼                                 │
             ┌───────────────────────┐                     │
             │   unet_oilspill.h5    │                     │
             │   U-Net Segmentation  │                     │
             └───────────┬───────────┘                     │
                         ▼                                 │
                 Binary Spill Mask                         │
                         │                                 │
                         ▼                                 ▼
             ┌─────────────────────────────────────────────┐
             │       FastAPI Backend Engine (api.py)       │
             └───────────────────────┬─────────────────────┘
                                     │
             ┌───────────────────────┴─────────────────────┐
             ▼                                             ▼
┌─────────────────────────┐               ┌─────────────────────────────────┐
│ characterization/       │               │ React + Three.js + Leaflet UI   │
│ - Geometry Extractor    │               │ - 3D Earth Globe Landing        │
│ - Movement Drift Vector │ ────────────► │ - 4-Card Satellite Vision Lab   │
│ - Spreading Rate        │               │ - Fullscreen Polygon Inspector  │
│ - Severity Estimator    │               │ - Multi-Layer Characterization  │
│ - Backward Hindcast     │               │   Map & Forecast Timeline       │
│ - Forward Forecast      │               └─────────────────────────────────┘
└─────────────────────────┘
```

---

## 📂 3. Directory Structure

```
Oil_spill(sos)/
├── api.py                     # FastAPI backend server exposing REST endpoints
├── cdse_client.py             # Copernicus CDSE API client (Sentinel-1 & Sentinel-2)
├── preprocess.py              # Radiometric calibration & tensor normalization
├── unet_oilspill.h5           # Pretrained U-Net Deep Learning model
├── requirements.txt           # Python backend dependencies
├── WAKASHIO_AOI.txt           # Mauritius incident coordinates and AOI bbox
│
├── characterization/          # Oil Spill Characterization & Particle Drift Engine
│   ├── config.py              # Wind drift leeway (3%), diffusion Kh, and particle defaults
│   ├── geometry/
│   │   └── geometry_extractor.py # GeoJSON polygon extraction, area, perimeter, orientation
│   ├── movement/
│   │   ├── environmental_provider.py # Simulation trade-wind & ocean current fields
│   │   └── drift_vector.py    # Combined velocity vector, speed, cardinal heading
│   ├── spreading/
│   │   └── spreading_calculator.py # Multi-temporal spreading rate (dA/dt)
│   ├── severity/
│   │   └── thickness_estimator.py # Model-based thickness/severity estimation
│   ├── drift/
│   │   ├── particle_model.py  # Lagrangian particle advection & Brownian diffusion
│   │   ├── hindcast.py        # Backward particle tracking to find Probable Origin (-48h)
│   │   └── forecast.py        # Forward particle prediction (+6h to +72h)
│   ├── uncertainty/
│   │   └── dispersion.py      # Dispersion metrics (σx, σy) & uncertainty cone
│   └── engine.py              # Master coordinator & in-memory SpillAnalysisStore
│
├── tests/                     # Automated pytest suite
│   └── test_characterization.py
│
└── frontend/                  # React + Vite + TypeScript Frontend
    ├── package.json
    ├── vite.config.ts
    └── src/
        ├── App.tsx            # Main router (Globe ⇄ Satellite Lab ⇄ Characterization)
        ├── types.ts           # TypeScript interfaces and telemetry contracts
        ├── index.css          # Styling & glassmorphic tokens
        └── components/
            ├── OceanGlobe.tsx           # Interactive 3D Three.js Earth globe
            ├── SatelliteVisionSuite.tsx # 4-Card Satellite deck & Vector Polygon inspector
            └── CharacterizationDashboard.tsx # Interactive Leaflet map & predictive timeline
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

---

## 🚀 5. Getting Started (Local Setup)

### Prerequisites:
* **Python 3.9+**
* **Node.js 18+** & **npm**

### Step 1: Install Python Dependencies
```bash
pip install -r requirements.txt
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
python -m uvicorn api:app --host 0.0.0.0 --port 8000 --reload
```

In Terminal 2 (React Frontend):
```bash
cd frontend
npm run dev
```

Open **`http://localhost:3000`** (or **`http://localhost:5173`**) in your browser.

---

## 🧪 6. Running Automated Tests

Run the full pytest suite:
```bash
python -m pytest tests/test_characterization.py -v
```

All 7 unit and end-to-end integration tests verify:
* ✅ Polygon geometry extraction & GeoJSON compliance
* ✅ Environmental velocity and cardinal heading conversion
* ✅ Movement drift calculations
* ✅ Multi-temporal spreading rate calculations & single-observation handling
* ✅ Model-based severity estimation
* ✅ Lagrangian backward hindcast & forward forecast particle integration
* ✅ End-to-end characterization pipeline

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
pip install -r requirements.txt
cd frontend && npm install && cd ..
```

### Step 4: Make Changes & Verify
* Ensure all tests pass: `python -m pytest tests/test_characterization.py -v`
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

## 📜 8. Incident Specifications (MV Wakashio Grounding)

* **Incident**: MV Wakashio Coral Reef Grounding (Mauritius)
* **Wreck Coordinates**: `20°26′17.23″ S, 57°44′40.67″ E` (`-20.438119°S, 57.744631°E`)
* **Standard AOI Bounding Box**: `[-20.38, 57.68 to -20.50, 57.82]`
* **Validation Satellites**: Sentinel-1 C-Band SAR & Sentinel-2 MSI Optical

---

## 📄 License
This project is licensed under the MIT License.
