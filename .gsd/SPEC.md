# SPEC.md — Project Specification: TARANG Maritime Oil Spill Intelligence

> **Status**: `FINALIZED`
>
> ⚠️ **Planning Lock**: Requirements finalized. Planning and implementation unlocked.

## Vision
**TARANG** is an autonomous space-based and oceanographic maritime surveillance system designed to detect, delineate, characterize, and predict the trajectory of marine oil spills worldwide using multi-sensor spaceborne remote sensing (Sentinel-1 SAR, Sentinel-2 Optical, Landsat 8/9), deep learning segmentation, hydrodynamic particle drift forecasting, vessel intelligence correlation, and cryptographic legal enforcement docket dispatch.

## Goals
1. **Multi-Satellite Spaceborne Detection** — Ingest and process Sentinel-1 C-Band SAR radar and Sentinel-2 MSI optical imagery via Copernicus Data Space Ecosystem (CDSE) APIs, running deep learning U-Net segmentation for pixel-accurate oil spill delineation.
2. **Lagrangian Drift Hindcasting & Forecasting** — Calculate hydrodynamic drift trajectories combining surface current vectors ($\vec{V}_{\text{current}}$) and 10m wind leeway fields ($\vec{V}_{\text{wind}}$) using Copernicus Marine Service (CMEMS) and ECMWF ERA5 data.
3. **AIS & SAR Dark Vessel Investigation** — Ingest live AIS data (AISStream.io WebSocket) and historical vessel tracks/SAR radar vessel detections (Global Fishing Watch APIs) to rank suspect polluter candidates with explainable AI scores.
4. **Court-Ready Legal Docket Dispatch** — Generate SHA-256 hashed enforcement PDF dockets and dispatch via Resend Email API with delivery telemetry tracked via FastAPI webhooks.
5. **Interactive 2D & 3D Geospatial Visualization** — Provide operational dashboards via Three.js (3D ocean globe) and Leaflet (2D interactive characterization and coastal risk maps).

## External API Ecosystem
The system relies on five foundational external API pillars:
1. **Satellite Imagery & Discovery APIs**:
   - Copernicus Data Space Ecosystem (CDSE) STAC API (`https://stac.dataspace.copernicus.eu/v1/`)
   - Copernicus Data Space Ecosystem (CDSE) Process API (`https://sh.dataspace.copernicus.eu/api/v1/process`)
   - USGS Landsat M2M / AWS Planetary Computer STAC API (`https://planetarycomputer.microsoft.com/api/stac/v1`)
2. **Vessel Tracking & Intelligence APIs**:
   - AISStream.io WebSocket API (`wss://stream.aisstream.io/v0/stream`)
   - Global Fishing Watch (GFW) APIs (`public-global-presence:latest`, `public-global-vessel-identity:latest`, `public-global-sar-presence:latest`)
3. **MetOcean & Environmental Data APIs**:
   - Copernicus Marine Service (CMEMS) & ECMWF ERA5 Climate Data Store
   - ISRO MOSDAC / Bhoonidhi (Oceansat-3 SCAT-3 winds & RISAT EOS-04 SAR rasters)
4. **Legal Docket Dispatch & Verification APIs**:
   - Resend Email API (`https://api.resend.com/emails`)
   - FastAPI Webhook Listeners (`POST /webhooks/resend`)

## Constraints
- **Model Independence**: Follows GSD canonical rules (no hard requirement on any single model provider).
- **Graceful Degradation / Zero Downtime**: Built-in deterministic simulation fallbacks for offline demonstration when remote external API keys are absent or rate-limited.
- **Verification Evidence**: Every feature and API change must be verified with automated test suites or captured HTTP/CLI outputs.

## Success Criteria
- [x] Pretrained U-Net segmentation with bilateral despeckling.
- [x] Vector polygon geometry extraction and multi-temporal spreading rate.
- [x] Lagrangian particle dispersion model (hindcast origin identification and 72-hour forecast).
- [x] Multi-tier origin zone generation (1σ, 2σ, 3σ) with release time estimation.
- [x] GFW-compatible vessel intelligence provider with Category A/B/C candidate classification.
- [x] Multi-factor explainable vessel ranking algorithm (0–100 score).
- [x] Automated SHA-256 signed PDF investigation docket generation.
- [x] Documented external API integration reference (`API_INTEGRATIONS.md`) and `.env.example`.

---

*Last updated: 2026-09-22*
