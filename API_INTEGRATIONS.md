# 🛰️ TARANG External API Architecture & Integration Reference

This document serves as the comprehensive architectural specification for the five core external API pillars powering the **TARANG Multi-Satellite Marine Oil Spill Detection, Characterization & Enforcement System**.

---

## 📑 System Architecture Overview

```
                                  ┌────────────────────────────────────────────────────────┐
                                  │             TARANG MARITIME INTELLIGENCE               │
                                  └──────────────────────────┬─────────────────────────────┘
                                                             │
         ┌───────────────────┬───────────────────────────────┼───────────────────────────────┬───────────────────┐
         ▼                   ▼                               ▼                               ▼                   ▼
┌──────────────────┐┌──────────────────┐           ┌──────────────────┐            ┌──────────────────┐┌──────────────────┐
│  1. SATELLITE    ││ 2. PLANETARY     │           │  3. VESSEL       │            │  4. METOCEAN     ││  5. DOCKET       │
│     IMAGERY      ││    CROSS-CHECK   │           │     TRACKING     │            │     & FORCING    ││     DISPATCH     │
├──────────────────┤├──────────────────┤           ├──────────────────┤            ├──────────────────┤├──────────────────┤
│ ESA CDSE STAC    ││ USGS Landsat M2M │           │ AISStream.io     │            │ CMEMS Currents   ││ Resend API       │
│ ESA CDSE Process ││ AWS Planetary    │           │ GFW Presence     │            │ ECMWF ERA5 Winds ││ SHA-256 PDF     │
│ (Sentinel-1/2)   ││ Computer STAC    │           │ GFW SAR Presence │            │ ISRO MOSDAC      ││ Webhook Delivery │
│                  ││ (Landsat 8/9)    │           │ GFW Identity     │            │ (Oceansat/RISAT) ││ Telemetry        │
└──────────────────┘└──────────────────┘           └──────────────────┘            └──────────────────┘└──────────────────┘
```

---

## 1. Satellite Imagery & Discovery APIs

### 1.1 Copernicus Data Space Ecosystem (CDSE) STAC API
* **Base URL:** `https://stac.dataspace.copernicus.eu/v1/`
* **Protocol:** REST / SpatioTemporal Asset Catalog (STAC) 1.0.0
* **Authentication:** Optional for catalog queries; OAuth2 Bearer token for asset downloads.
* **Purpose:** Queries metadata footprints, collection paths, cloud cover percentage, and precise acquisition times for Sentinel-1 (C-Band SAR) and Sentinel-2 (MSI Optical) globally.
* **Key Endpoints:**
  * `GET /search` or `POST /search`
  * Body parameters: `bbox`, `datetime`, `collections: ["SENTINEL-1", "SENTINEL-2"]`.

### 1.2 Copernicus Data Space Ecosystem (CDSE) Process API
* **Base URL:** `https://sh.dataspace.copernicus.eu/api/v1/process`
* **Protocol:** HTTPS POST (Evalscript)
* **Authentication:** OAuth2 Client Credentials (`https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token`).
* **Purpose:** Performs on-the-fly cloud cropping, band extraction, orthorectification, and radiometric calibration to download small $512 \times 512$ or $1024 \times 1024$ pixel patches rather than raw 1.5 GB scene archives.
* **Current Status in TARANG:** **Active** in `backend/cdse_client.py`. Generates calibrated SAR float arrays and Sentinel-2 RGB/NIR matrices.

### 1.3 USGS Landsat M2M & AWS Planetary Computer STAC API
* **Base URL:** `https://planetarycomputer.microsoft.com/api/stac/v1` (Public Mirror)
* **Protocol:** STAC API
* **Purpose:** Retrieves auxiliary optical (OLI-2) and thermal infrared (TIRS-2) data from Landsat 8/9 for multi-sensor cross-verification.
* **Value Addition:** Thermal infrared helps differentiate biogenic look-alikes (algae blooms) from petroleum slicks via surface temperature contrast.

---

## 2. Vessel Tracking & Intelligence APIs

### 2.1 AISStream.io WebSocket API
* **Base URL:** `wss://stream.aisstream.io/v0/stream`
* **Protocol:** Secure WebSocket (WSS)
* **Authentication:** API Key passed in the initial JSON subscription message.
* **Purpose:** Ingests live, high-frequency AIS transmissions (MMSI, latitude, longitude, speed over ground, course over ground, heading, timestamp) filtered by dynamic bounding boxes.
* **Key Capabilities:**
  * Real-time dark-ship anomaly detection (vessels suddenly disabling AIS upon entering an incident bounding box).
  * High-resolution waypoint reconstruction for immediate candidate scoring.

### 2.2 Global Fishing Watch (GFW) APIs
* **Base URL:** `https://gateway.api.globalfishingwatch.org/v3`
* **Protocol:** REST HTTPS
* **Authentication:** Bearer Token (`GFW_API_KEY`)
* **Datasets Utilized:**
  1. `public-global-presence:latest`: Historical vessel presence, gridded track history, and gear/vessel classification.
  2. `public-global-vessel-identity:latest`: Resolves MMSI, IMO number, callsign, vessel flag state, vessel name, deadweight tonnage, and ownership records.
  3. `public-global-sar-presence:latest`: Pre-processed spaceborne SAR radar vessel detections (radar reflections matched against AIS footprints to identify dark vessels).
* **Current Status in TARANG:** **Active** in `backend/characterization/investigation/gfw_provider.py` with multi-tier candidate categorization (A, B, C) and realistic offline fallback for instant demonstration.

---

## 3. MetOcean & Environmental Data APIs

### 3.1 Copernicus Marine Service (CMEMS) & ECMWF ERA5
* **Base URL:** `https://marine.copernicus.eu/` / `https://cds.climate.copernicus.eu/api/v2`
* **Protocol:** OPeNDAP / NetCDF Subset / CDS API
* **Purpose:**
  * CMEMS: Ingests gridded ocean surface currents ($\vec{V}_{\text{current}} = [u, v]$ in m/s).
  * ERA5: Ingests 10-meter wind velocity fields ($\vec{V}_{\text{wind}} = [u_{10}, v_{10}]$ in m/s).
* **Role in TARANG Engine:**
  * Drives the forward and backward Lagrangian particle drift models:
    $$\vec{V}_{\text{slick}} = \vec{V}_{\text{current}} + C_{\text{wind}} \cdot \vec{V}_{\text{wind}}$$
    (where $C_{\text{wind}} \approx 0.03$ leeway factor).
  * Look-alike wind gating: Filters false positives where low wind speeds ($< 2.5\text{ m/s}$) produce natural ocean surface damping indistinguishable from oil in SAR.

### 3.2 ISRO MOSDAC / Bhoonidhi Data APIs
* **Base URL:** `https://www.mosdac.gov.in/`
* **Protocol:** REST HTTPS / GeoTIFF delivery
* **Purpose:** Accesses regional meteorological and radar remote sensing datasets focusing on the Indian Exclusive Economic Zone (EEZ):
  * **Oceansat-3 (EOS-06) SCAT-3:** High-resolution ocean surface scatterometer wind vectors.
  * **RISAT-1A (EOS-04):** C-Band SAR rasters in Stripmap and ScanSAR modes for complementary coverage of South Asian waters.

---

## 4. Legal Docket Dispatch & Verification APIs

### 4.1 Resend Email API
* **Base URL:** `https://api.resend.com/emails`
* **Protocol:** REST HTTPS POST
* **Authentication:** API Key (`Bearer re_...`)
* **Purpose:** Instantly dispatches the formal, court-ready PDF enforcement docket to coastal authorities, port state control officers, flag administration registries, and environmental protection agencies.
* **Payload Structure:**
  ```json
  {
    "from": "TARANG Maritime Intelligence <enforcement@tarang-intelligence.org>",
    "to": ["portstate@coastguard.gov", "enforcement@imo.org"],
    "subject": "CRITICAL: Maritime Oil Spill Priority Investigation Docket [SHA-256: 4a2f8b...]",
    "html": "<h3>Official Enforcement Notice</h3><p>Attached is the verified forensic dossier...</p>",
    "attachments": [
      {
        "filename": "TARANG_Investigation_Docket_WAKASHIO.pdf",
        "content": "<base64_encoded_pdf_bytes>"
      }
    ]
  }
  ```

### 4.2 FastAPI Webhook Telemetry Listener
* **Internal Route:** `POST /webhooks/resend`
* **Purpose:** Listens to incoming webhook events from Resend:
  * `email.sent`
  * `email.delivered`
  * `email.delivery_delayed`
  * `email.opened`
  * `email.complained`
* **Significance:** Automatically records delivery timestamps and cryptographically verifies receipt for audit trails in maritime legal proceedings.

---

## 5. Security, Secrets & Environment Variables

All API keys, secrets, and baseline endpoints are configured through `.env` (refer to `.env.example`):

| Variable Name | Required | Description |
| :--- | :---: | :--- |
| `CDSE_CLIENT_ID` | Yes | Copernicus Data Space OAuth2 client ID |
| `CDSE_CLIENT_SECRET` | Yes | Copernicus Data Space OAuth2 client secret |
| `GFW_API_KEY` | Optional | Global Fishing Watch Gateway API key (has fallback) |
| `AISSTREAM_API_KEY` | Optional | AISStream.io real-time streaming key |
| `CMEMS_USERNAME` | Optional | Copernicus Marine Service username |
| `CMEMS_PASSWORD` | Optional | Copernicus Marine Service password |
| `CDS_API_KEY` | Optional | ECMWF Climate Data Store API key |
| `MOSDAC_API_KEY` | Optional | ISRO MOSDAC regional data access key |
| `RESEND_API_KEY` | Optional | Resend transactional email API key |
| `RESEND_WEBHOOK_SECRET`| Optional | Secret for validating Resend webhook signatures |

---

## 6. Fault Tolerance & Fallback Strategy

To ensure 24/7 high-availability and zero downtime even during third-party API rate limits or outages:
1. **Satellite Ingest:** If CDSE Process API is temporarily unreachable, the system falls back to cached Sentinel tiles or pre-processed scene arrays for the incident AOI.
2. **Vessel Intelligence:** If live GFW Gateway or AISStream times out, the built-in deterministic maritime AIS/SAR traffic scenario generator provides valid, realistic vessel candidate records with complete telemetry for uninterrupted analysis.
3. **MeteoOcean Forcing:** If CMEMS/ERA5 servers are unresponsive, the system seamlessly uses the high-fidelity analytical trade-wind and South Equatorial Current field defined in `backend/characterization/movement/environmental_provider.py`.
4. **Docket Dispatch:** If Resend is unreachable, the generated PDF with computed SHA-256 checksum is persisted locally in `backend/characterization/investigation/reports/` for manual retrieval and out-of-band transmission.
