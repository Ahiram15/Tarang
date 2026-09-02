# 🛰️ Multi-Satellite Marine Oil Spill Early Warning System
### Sentinel-1 SAR Radar & Sentinel-2 Optical Cross-Verification Pipeline

> [!IMPORTANT]
> **DEVELOPMENT & ARCHITECTURE ROADMAP NOTICE**:
> * **Frontend Modernization**: The project is transitioning from the current prototype Streamlit interface to a modern, high-performance **React (Vite / Next.js) Frontend Dashboard** with dynamic interactive geospatial mapping (Mapbox / Deck.gl / Leaflet).
> * **Upcoming Enterprise Modules**:
>   1. **AIS Vessel Tracking Engine**: Correlating detected spill coordinates and timestamps with real-time AIS transponder feeds to identify suspect source ships.
>   2. **Background Orbit Watcher**: Automated polling daemon for proactive anomaly change detection over high-risk shipping corridors.
>   3. **Deep Learning Image Enhancement Engine**: Super-Resolution (Real-ESRGAN) and SAR Despeckling (SAR-DnCNN) models for ultra-clear human inspection.
>   4. **FastAPI / Python Backend Microservice**: RESTful API endpoints for asynchronous satellite job queues and telemetry exports.

---

## 📌 1. Project Overview & Architecture

This project is an automated, real-time satellite remote-sensing pipeline designed to detect and monitor marine oil spills globally using the **European Space Agency (ESA) Copernicus Data Space Ecosystem (CDSE)**.

It pairs **C-Band Synthetic Aperture Radar (Sentinel-1 SAR)** with **Multispectral Visible Imagery (Sentinel-2 Optical)** and feeds the calibrated radar data into a custom deep-learning **U-Net Segmentation Model** (`unet_oilspill.h5`).

```
                    COPERNICUS DATA SPACE ECOSYSTEM (CDSE)
                                      │
                     ┌────────────────┴────────────────┐
                     ▼                                 ▼
         🛰️ Sentinel-1 GRD SAR               📷 Sentinel-2 L2A Optical
         (All-weather, Day/Night,            (True-Color RGB Daylight
          Radar Wave Damping)                 Sunlight Reflectance)
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
             Spill Probability                         │
             & Binary Mask                             │
                     │                                 │
                     └────────────────┬────────────────┘
                                      ▼
                        🖥️ DASHBOARD INTERFACE
                        - 🌍 Global Red Dot Incident Surveillance Map
                        - 🏛️ Real Historical Spills Catalog (Real ESA Data)
                        - 🧪 Global Incident Simulator Hotspots
                        - 🔍 Compact 5-Layer Visual Inspection (Adjustable Size)
                        - 🎨 Dual-Pol Color Radar Palettes
                        - 💾 Asset & Telemetry Export Tools
```

---

## 🌍 2. Global Incident Surveillance & Monitoring Modes

### A. 🔴 Global Incident Surveillance Map (Live Red Dot View)
- Displays an interactive **CartoDB Dark Matter World Map** populated with **glowing red marker dots (🚨)** marking active and historical oil spill incidents across the planet.
- **Interactive Telemetry Popups**: Clicking any red dot opens incident details including GPS coordinates, estimated spill surface area ($\text{km}^2$), detection confidence, and a summary.
- **Global KPI Telemetry Cards**:
  - Total Tracked Incidents: **12 Incidents**
  - Total Contaminated Area: **262.3 $\text{km}^2$**
  - Active Satellites: **Sentinel-1 / Sentinel-2**
  - Surveillance Status: **24/7 ACTIVE**

---

### B. 🏛️ Curated Real Historical Spills Catalog (Real ESA Satellite Data)
Allows testing and demonstrating the U-Net model on **real satellite passes from historical marine disasters**:

| Real Disaster | Location | Date | Satellite Captured | Impact |
| :--- | :--- | :--- | :--- | :--- |
| **MV Wakashio Grounding** | Mauritius (Indian Ocean) | `2020-08-07` | Sentinel-1 SAR & Sentinel-2 Optical | ~1,000 tons bunker fuel on coral reefs |
| **Repsol Refinery Spill** | Ventanilla, Peru (Pacific) | `2022-01-16` | Sentinel-1 SAR & Sentinel-2 Optical | ~11,900 barrels crude oil discharge |
| **Baniyas Power Station Leak** | Syria (Mediterranean Sea) | `2021-08-25` | Sentinel-1 SAR | 800+ $\text{km}^2$ massive surface slick |
| **Taylor Energy Platform Leak** | Gulf of Mexico (USA) | `2021-09-03` | Sentinel-1 SAR | Subsea platform continuous sheen |
| **Mumbai High Offshore Spill** | Arabian Sea (India) | `2021-05-22` | Sentinel-1 SAR | Cyclone Tauktae vessel discharge |
| **Gulf of Paria Mystery Spill** | Trinidad & Tobago | `2024-02-09` | Sentinel-1 SAR | 15-mile overturned barge slick |

---

### C. 🧪 Global Incident Simulator (Demonstration Hotspots)
Simulates active operational tanker discharges and bilge-dumping along major international shipping corridors:
- **Strait of Malacca Tanker Discharge** (`2.85°N, 101.45°E`)
- **Persian Gulf Crude Sludge Slick** (`26.40°N, 53.20°E`)
- **Red Sea Shipping Corridor Leak** (`21.30°N, 38.20°E`)
- **Singapore Anchorage Bunker Discharge** (`1.22°N, 103.85°E`)
- **West Africa Niger Delta Offshore Slick** (`4.50°N, 6.80°E`)

---

## 📁 3. File-by-File Breakdown & Code Explanation

### 1. `cdse_client.py` — *Satellite Data Ingestion Engine*
* **Role**: Handles all communication with the Copernicus Data Space Ecosystem APIs.
* **Key Functions & Logic**:
  - `authenticate()`: Performs OAuth2 Client Credentials authentication against `https://identity.dataspace.copernicus.eu` with built-in retry handling.
  - `fetch_sentinel1_image()`: Queries the Sentinel Hub Process API for `sentinel-1-grd` C-band data. Runs an on-the-fly JavaScript `evalscript` that extracts both co-polarization (`VV`) and cross-polarization (`VH`) radar backscatter. Returns both a 3-channel False-Color RGB composite and a single-channel grayscale radar array with automated orbit pass auto-seeking.
  - `fetch_sentinel2_optical()`: Queries the Process API for `sentinel-2-l2a` optical imagery, retrieving Red (`B04`), Green (`B03`), and Blue (`B02`) visible daylight bands with automated daylight brightness validation.
  - `get_available_scenes()` & `get_available_sentinel2_scenes()`: Queries the Copernicus OData Catalog to discover exact satellite platform names (`Sentinel-1A`, `Sentinel-2B`), orbit passes, and UTC acquisition timestamps.
  - `get_mock_sentinel1_image()` & `get_mock_sentinel2_optical()`: Provides realistic synthetic ocean radar and optical scenes with simulated oil slicks for offline testing when API keys are absent.

---

### 2. `preprocess.py` — *SAR Radiometric Calibration & Tensor Formatting*
* **Role**: Prepares raw satellite arrays for ingestion by the U-Net deep learning model.
* **Key Functions & Logic**:
  - `calibrate_sar_histogram(img)`: **The critical mathematical fix**. Standardizes incoming raw SAR radar images to match the exact brightness baseline the model learned during training (Clean ocean mean $\approx 155$, std $\approx 25$). This prevents clean, calm water from being falsely classified as oil.
  - `preprocess_sar_image(image_input)`: Accepts file paths, byte streams, or NumPy arrays. Resizes the image to $(256, 256)$, applies baseline calibration, normalizes pixel values to $[0.0, 1.0]$ float32, and expands dimensions to $(1, 256, 256, 1)$.

---

### 3. `unet_oilspill.h5` — *Deep Learning Segmentation Model*
* **Role**: Pixel-level binary segmentation of marine surface oil contamination.
* **Model Source**: [Samarth6840/Deep-SAR-Oil-Spill-Segmentation-](https://github.com/Samarth6840/Deep-SAR-Oil-Spill-Segmentation-)
* **Technical Specifications**:
  - **Input Tensor**: `(None, 256, 256, 1)` float32 in range $[0.0, 1.0]$.
  - **Architecture**: Convolutional Encoder-Decoder U-Net with skip connections.
  - **Output**: `(None, 256, 256, 1)` with sigmoid activation representing pixel-by-pixel oil spill probability $[0.0, 1.0]$.
  - **Decision Threshold**: $0.50$ (Pixels $\ge 0.50$ are classified as oil slick).

---

### 4. `pipeline.py` — *End-to-End Inference & Result Export*
* **Role**: Integrates data acquisition, preprocessing, neural network inference, and result generation into a callable pipeline.
* **Key Functions & Logic**:
  - `run_detection()`: 
    1. Loads `unet_oilspill.h5` model.
    2. Downloads Sentinel-1 SAR imagery for the given Lat/Lon and date.
    3. Runs preprocessing and model prediction.
    4. Calculates contamination statistics (spill pixel count, coverage percentage, confidence score).
    5. Generates and saves output artifacts:
       - `output/spill_mask.png`: Binary black-and-white contamination mask.
       - `output/detection_summary.png`: 4-panel diagnostic plot.
       - `output/results.json`: Full machine-readable telemetry report.

---

### 5. `main.py` — *Command-Line Interface (CLI)*
* **Role**: Standalone command-line entry point for automated scripts, cron jobs, and terminal runs.
* **Usage**:
  ```bash
  python main.py --lat 17.4135 --lon 83.6675 --date 2024-05-20 --output_dir output
  ```

---

### 6. `app.py` — *Operations Dashboard*
* **Role**: Operations dashboard for interactive maritime monitoring.
* **Features**:
  - **Navigation Tabs**:
    1. **`🌍 Global Incident Surveillance Map`**: World map with live glowing red dots for active and historical spills.
    2. **`🛰️ Satellite Radar & Optical Deep Analysis`**: In-depth multi-satellite inspection.
  - **Compact 5-Layer Visual Breakdown**:
    - Arranges all 5 channels (**Sentinel-1 SAR**, **Sentinel-2 Optical**, **U-Net Heatmap**, **Binary Mask**, **Red Overlay**) side-by-side in one neat horizontal row.
    - **📏 Interactive Size Slider**: Shrink or enlarge thumbnails on-the-fly (`120px` to `300px`).
  - **Radar Color Palette Selector**:
    1. 🌈 *False-Color RGB Composite (`VV + VH + Ratio`)*
    2. 🌊 *Deep Ocean Marine Palette*
    3. 🔥 *Turbo Thermal Radar Palette*
    4. 🌌 *Viridis Oceanographic Palette*
    5. 🔘 *Classic Grayscale Radar*
  - **Dual Satellite Telemetry**: Displays exact UTC capture times, satellite platforms, and product IDs for both Sentinel-1 and Sentinel-2.
  - **One-Click Asset Export**: Instant download buttons for Binary Masks (PNG), Overlays (PNG), and Telemetry Reports (JSON).

---

### 7. `.env` & `.streamlit/config.toml` — *Configuration Files*
* **`.env`**: Stores secure Copernicus credentials (`CDSE_CLIENT_ID`, `CDSE_CLIENT_SECRET`) and default GPS coordinates.
* **`.streamlit/config.toml`**: Configures dark mode background colors (`#0d1322`), text colors, and server settings.

---

## 🔬 4. Key Technical Challenges Solved

### 1. The "100% Dark Image False Alarm" Bug
* **The Issue**: Initially, when scanning clean ocean, the U-Net flagged 100% of the image as an oil spill.
* **Root Cause**: Training images had a clean sea surface average brightness of $\approx 155$. Raw Sentinel-1 SAR images returned from the API had average backscatter brightness around $\approx 50–70$. Because $\approx 50$ is darker than training oil spills ($\approx 85$), the model thought the entire ocean was a massive spill.
* **The Solution**: Created `calibrate_sar_histogram()` in `preprocess.py` to adaptively standardize the ocean baseline to $155$, allowing the model to accurately detect true localized slicks while outputting **0.00% spill** on clean water.

### 2. Multi-Modal Radar + Optical Cross-Checking
* **The Issue**: Radar SAR measures wave damping; low wind or biogenic algae can occasionally create dark patches ("look-alikes").
* **The Solution**: Integrated Sentinel-2 True-Color optical imagery so human operators and downstream logic can visually cross-check the exact same coordinates in daylight for rainbow sheens or brown emulsified sludge.

### 3. Image Quality Enhancement & SAR Despeckling Strategy
* **Why NOT use Deep Learning Super-Resolution (GANs/ESRGAN) for AI inference?**
  - The U-Net was specifically trained on **raw radar speckle noise textures**. If an external generative AI model is run before the U-Net, it introduces hallucinated artifacts and smooths out genuine physical capillary wave dampening edges, which degrades segmentation accuracy.
* **The Solution — Real-Time DSP Enhancement for Human Visualization**:
  - **Raw Tensor Path**: Pure, mathematically calibrated radar tensors are routed directly to the U-Net for unbiased inference.
  - **Visual Path (`enhance_visual_quality`)**: Real-time **Bilateral Edge-Preserving Filters** (smooths microwave salt-and-pepper speckle grain while preserving sharp oil slick contours) combined with **CLAHE (Contrast Limited Adaptive Histogram Equalization)** are applied for crisp, high-definition display on the dashboard with sub-millisecond execution (< 2ms vs 5,000ms for heavy deep-learning upscalers).

---

## 🌐 5. Satellite APIs & Direct Links

* **Copernicus Data Space Ecosystem (CDSE) Main Portal**: [https://dataspace.copernicus.eu/](https://dataspace.copernicus.eu/)
* **Copernicus Sentinel Hub Process API**: `https://sh.dataspace.copernicus.eu/api/v1/process` ([Docs](https://documentation.dataspace.copernicus.eu/APIs/SentinelHub/Process.html))
* **Copernicus OData Catalog API**: `https://catalogue.dataspace.copernicus.eu/odata/v1/Products` ([Docs](https://documentation.dataspace.copernicus.eu/APIs/OData.html))
* **Copernicus OAuth 2.0 Auth API**: `https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token` ([Docs](https://documentation.dataspace.copernicus.eu/APIs/Token.html))

---

## 🚀 6. How to Launch and Run

### Run the Web Dashboard:
```bash
streamlit run app.py
```
Open **`http://localhost:8501`** in your browser.

### Run via Command Line:
```bash
python main.py --lat 17.4135 --lon 83.6675 --date 2024-05-20
```
