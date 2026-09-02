# 🛰️ PROTOTYPE: Multi-Satellite AI Marine Oil Spill Early Warning System

---

## 📌 1. What is this Project (In Simple Terms)?

This project is a working automated web application that uses **European Space Agency (ESA) Copernicus Satellites** and **Deep Learning AI** to detect oil spills across the ocean in real-time.

Instead of people manually checking satellite photos:
* The system connects directly to satellite data streams in space.
* Downloads radar (day/night) and optical (color) photos of any ocean coordinate on Earth.
* Uses a trained AI neural network (**U-Net**) to scan the image and identify oil slicks.
* Shows glowing red alert dots on a worldwide dark map with side-by-side satellite views and contamination metrics.

---

## 🗺️ 2. Step-by-Step Flow (How Data Moves)

```
 [STEP 1: TARGET SELECTION]
   • Click any location on the global dark map OR pick a real historical disaster
     (e.g., 2020 Mauritius Wakashio Spill, 2022 Peru Repsol Spill).
                                │
                                ▼
 [STEP 2: SATELLITE DATA FETCHING]
   • The system calls the European Space Agency Copernicus CDSE API.
   • Fetches 2 satellite views for that exact GPS coordinate & date:
       a) Sentinel-1 SAR: Microwave radar that sees through clouds, rain, and night.
       b) Sentinel-2 Optical: Visible true-color daylight photograph.
                                │
                                ▼
 [STEP 3: IMAGE CALIBRATION]
   • The raw radar data is standardized so clean ocean water has a normal sea 
     brightness baseline (~155) and doesn't trigger false alarms.
                                │
                                ▼
 [STEP 4: AI DEEP LEARNING PREDICTION]
   • The preprocessed radar image (256x256) is fed into the trained U-Net model.
   • The model outputs a probability map (0% to 100% chance of oil per pixel).
   • Pixels above 50% probability are classified as oil spills.
                                │
                                ▼
 [STEP 5: VISUAL DASHBOARD & ALERTS]
   • If oil is found: A red alert banner displays the contaminated area and coverage %.
   • Displays 5 synchronized views:
       1. Sentinel-1 Radar Image (C-Band)
       2. Sentinel-2 Optical Photo (Visible RGB)
       3. AI Probability Heatmap (U-Net)
       4. Binary Spill Mask (Black & White)
       5. Red Highlight Overlay on the ocean
   • 1-click downloads for binary masks (PNG) and telemetry reports (JSON).
```

---

## 🌐 3. Which APIs are Used?

| API Name | Provider | Purpose | Endpoints & Documentation |
| :--- | :--- | :--- | :--- |
| **Copernicus Process API** | ESA / EU | Downloads Sentinel-1 SAR (`VV`, `VH`) & Sentinel-2 Optical (`RGB`, `NIR`) | Endpoint: `https://sh.dataspace.copernicus.eu/api/v1/process`<br>Docs: [Process API Docs](https://documentation.dataspace.copernicus.eu/APIs/SentinelHub/Process.html) |
| **Copernicus OData Catalog API** | ESA / EU | Discovers flight passes, exact UTC timestamps, and satellite orbits | Endpoint: `https://catalogue.dataspace.copernicus.eu/odata/v1/Products`<br>Docs: [OData API Docs](https://documentation.dataspace.copernicus.eu/APIs/OData.html) |
| **Copernicus OAuth2 Token API** | ESA / EU | Generates secure bearer tokens using Client ID & Secret | Endpoint: `https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token`<br>Docs: [Token Docs](https://documentation.dataspace.copernicus.eu/APIs/Token.html) |
| **Leaflet / Folium Map Engine** | Open-Source | Interactive worldwide dark operations map (CartoDB Dark Matter) | [Leaflet Docs](https://leafletjs.com/) \| [CartoDB Basemaps](https://carto.com/basemaps) |

* **Main Copernicus Portal**: [https://dataspace.copernicus.eu/](https://dataspace.copernicus.eu/)
* **API Registration**: [https://identity.dataspace.copernicus.eu/](https://identity.dataspace.copernicus.eu/)

---

## 💾 4. Which Dataset & Model are Used?

### 1. AI Model Architecture:
* **Architecture**: U-Net (Convolutional Encoder-Decoder with Skip Connections).
* **Source Repository**: [Samarth6840/Deep-SAR-Oil-Spill-Segmentation-](https://github.com/Samarth6840/Deep-SAR-Oil-Spill-Segmentation-)
* **Weights File**: `unet_oilspill.h5`
* **Input Tensor**: `(1, 256, 256, 1)` -> Single-channel grayscale radar image normalized to $[0.0, 1.0]$.
* **Output Tensor**: `(1, 256, 256, 1)` -> Sigmoid probability output $[0.0 \text{ to } 1.0]$.
* **Decision Threshold**: $0.50$ (Pixels $\ge 0.50$ are classified as oil).

### 2. Training Dataset & Model Origin:
* **Source**: Directly from [Samarth6840/Deep-SAR-Oil-Spill-Segmentation-](https://github.com/Samarth6840/Deep-SAR-Oil-Spill-Segmentation-)
* **Description**: Deep-SAR Oil Spill Segmentation dataset containing satellite SAR imagery patches and paired ground-truth binary masks (`0 = water`, `1 = spill`).
* **Training Setup**: Pretrained U-Net weights (`unet_oilspill.h5`) compiled with **Binary Cross-Entropy (BCE) loss** and the **Adam optimizer** for pixel-level binary semantic segmentation.

---

## 📁 5. Summary of Key Files in the Prototype Codebase

* **[`app.py`](file:///d:/Oil_spill%28sos%29/app.py)** — Streamlit operations dashboard (global map, historical disasters, 5-panel views).
* **[`cdse_client.py`](file:///d:/Oil_spill%28sos%29/cdse_client.py)** — Copernicus API client (downloads Sentinel-1 radar & Sentinel-2 optical).
* **[`preprocess.py`](file:///d:/Oil_spill%28sos%29/preprocess.py)** — Calibrates radar brightness baseline and prepares input tensors.
* **[`pipeline.py`](file:///d:/Oil_spill%28sos%29/pipeline.py)** — Python pipeline linking acquisition, U-Net prediction, and telemetry export.
* **[`main.py`](file:///d:/Oil_spill%28sos%29/main.py)** — Command-line interface for automated terminal runs.
* **`unet_oilspill.h5`** — Pretrained U-Net deep learning model weights.
* **[`.env`](file:///d:/Oil_spill%28sos%29/.env)** — Your Copernicus CDSE API credentials (`CDSE_CLIENT_ID` & `CDSE_CLIENT_SECRET`).

---

## 🚀 6. How to Run the Prototype

### Run the Web Dashboard:
```bash
streamlit run app.py
```
Open **`http://localhost:8501`** in your browser.

### Run via Command Line:
```bash
python main.py --lat 17.4135 --lon 83.6675 --date 2024-05-20
```
