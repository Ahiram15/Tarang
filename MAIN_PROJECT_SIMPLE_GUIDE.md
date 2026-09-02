================================================================================
MAIN PROJECT EXPLANATION (IN SIMPLE, PLAIN ENGLISH)
Automated Multi-Satellite Marine Oil Spill Detection System
================================================================================

1. WHAT IS THIS PROJECT?
--------------------------------------------------------------------------------
This is an automated system that uses 2 European satellites (Sentinel-1 and 
Sentinel-2) and Artificial Intelligence to monitor the oceans 24/7 and detect 
oil spills as soon as they happen.

Instead of a human manually looking at millions of satellite images:
- The system continuously watches major ocean shipping routes.
- When an oil spill occurs, it flags it, confirms it, and shows a glowing red dot 
  on a world map with the exact GPS coordinates and area size.


2. HOW DOES THE WHOLE SYSTEM WORK (STEP-BY-STEP)?
--------------------------------------------------------------------------------

[STEP 1: BACKGROUND ORBIT WATCHER]
  - Satellites orbit the Earth continuously. Every few hours, new ocean photos 
    are published by the space agency.
  - Our system automatically checks: "Is there a new satellite image over our 
    monitored shipping routes?"

[STEP 2: SMART CHANGE DETECTION (SAVING COMPUTER POWER)]
  - Instead of running heavy AI on millions of miles of empty, clean water:
  - The system compares the new image to the previous week's image.
  - If nothing changed: It goes to sleep.
  - If a new dark patch suddenly appeared: It immediately triggers the AI model!

[STEP 3: FIRST-STAGE DETECTION (SENTINEL-1 RADAR)]
  - Sentinel-1 uses Radar (microwaves). It works 24/7, through clouds, rain, 
    and total darkness.
  - Oil flattens ocean waves, making the water look dark on radar.
  - Our trained AI model (U-Net) scans this radar image and draws a boundary 
    around the dark patch.

[STEP 4: SECOND-STAGE CONFIRMATION (SENTINEL-2 OPTICAL PHOTO)]
  - Problem: Sometimes calm wind or floating seaweed can also look like a dark 
    patch on radar (called a "look-alike").
  - Solution: In daylight, the system grabs a real color photo from Sentinel-2.
  - How it confirms:
      • Physics / Math Rule: Clean seawater absorbs infrared light completely. 
        Oil slicks reflect infrared light and shine with a rainbow gloss.
      • If both radar (dark patch) AND optical (infrared reflection) match, 
        it is 100% CONFIRMED as an oil spill!

[STEP 5: MAP DISPLAY & ALERTS]
  - The spill is marked on the global dark map with a glowing red dot (🚨).
  - Coast guards and maritime operators can click the red dot to see:
      • Exact GPS location (Latitude & Longitude).
      • Estimated spill size in km².
      • Side-by-side radar and optical pictures.
      • Nearby ships that might have caused the leak.


3. WHICH DATASETS ARE USED TO TRAIN THE AI? (WITH DIRECT LINKS)
--------------------------------------------------------------------------------
We use the official European Zenodo Satellite Benchmark Series (over 86 GB total):

1. DATASET PART 1 (Confirmed Real Oil Spills - 40.7 GB):
   - Direct Link: https://zenodo.org/records/8346860
   - Contains: 1,200 real dual-polarization (VV, VH) Sentinel-1 SAR satellite images 
     (2048x2048x2 GeoTIFFs) of confirmed marine oil disasters paired with binary masks.
   - Purpose: Teaches the AI what real petroleum spills look like on radar.

2. DATASET PART 2 (Clean Water & Look-Alikes - 45.9 GB):
   - Direct Link: https://zenodo.org/records/8253899
   - Contains: 685 clean ocean images + 685 "fake look-alike" images (algal blooms, 
     seaweed, low-wind calm zones, rain cells) with all-0 masks.
   - Purpose: Teaches the AI NOT to give false alarms when there is no spill.

3. PROTOTYPE MODEL REPOSITORY:
   - GitHub Link: https://github.com/Samarth6840/Deep-SAR-Oil-Spill-Segmentation-
   - Contains: Pretrained U-Net weights ('unet_oilspill.h5') for fast testing.


4. HOW DOES SENTINEL-2 CONFIRM OIL (MATH VS AI)?
--------------------------------------------------------------------------------
- CAN MATH SOLVE IT? Yes! Using a simple formula called the Floating Algae/Oil 
  Index (FAI). Oil reflects near-infrared light differently than water. The math 
  calculation takes less than 0.01 seconds.
- DO WE NEED AN AI MODEL? A lightweight AI classifier can help in complex cloudy 
  scenes.
- BEST HYBRID SOLUTION:
  1. Use the fast Math formula first (instant check).
  2. If borderline, use the Optical AI model for a final double-check.


5. ENHANCING IMAGE QUALITY USING DEEP LEARNING (DL) MODELS:
--------------------------------------------------------------------------------
To make satellite images crystal-clear for operators and human inspection:

1. SAR DESPECKLING DEEP LEARNING MODEL (e.g., SAR-DnCNN / Noise2Void):
   - Purpose: Radar images naturally have grainy "salt-and-pepper" noise.
   - How it works: A deep denoising neural network filters out the microwave 
     noise while keeping the sharp outline and shape of the oil spill intact.

2. SUPER-RESOLUTION DEEP LEARNING MODEL (e.g., Real-ESRGAN / SRCNN):
   - Purpose: Upscales low-resolution satellite patches (from 256x256 up to 
     1024x1024 HD).
   - How it works: Reconstructs high-definition sub-pixel details so operators 
     can zoom in closely to see oil slick thickness, rainbow sheen borders, and 
     nearby ship wakes.

3. OPTICAL DEHAZING & ATMOSPHERIC CORRECTION MODEL:
   - Purpose: Cleans up thin clouds, sea fog, and haze from Sentinel-2 optical 
     photos so daylight views look bright, sharp, and high-contrast.


6. THE 5 SCREEN DISPLAY MODES:
--------------------------------------------------------------------------------
The dashboard lets you view the ocean in 5 different scientific styles:
1. 🔥 Turbo Thermal Heatmap  -> Shows water movement and dark spill zones in heat colors.
2. 🌊 Deep Ocean Marine       -> Renders the ocean in navy blue and glowing cyan.
3. 🌈 False-Color Radar (RGB) -> Red (sea waves) + Green (volume) + Blue (contrast ratio).
4. 🌌 Viridis Oceanographic   -> Standard scientific color gradient used by marine scientists.
5. 🔘 Pure Grayscale Radar    -> Raw black & white radar echo.


7. WHICH APIS ARE USED? (WITH DIRECT ACCESS & DOC LINKS)
--------------------------------------------------------------------------------
1. COPERNICUS DATA SPACE ECOSYSTEM (CDSE) MAIN PORTAL:
   - Portal Link: https://dataspace.copernicus.eu/
   - Registration & API Keys: https://identity.dataspace.copernicus.eu/

2. COPERNICUS PROCESS API (Downloads Satellite Images):
   - Endpoint: https://sh.dataspace.copernicus.eu/api/v1/process
   - Documentation: https://documentation.dataspace.copernicus.eu/APIs/SentinelHub/Process.html
   - Function: Fetches Sentinel-1 SAR (VV, VH) and Sentinel-2 Optical (RGB, NIR).

3. COPERNICUS ODATA CATALOG API (Discovers Satellite Passes):
   - Endpoint: https://catalogue.dataspace.copernicus.eu/odata/v1/Products
   - Documentation: https://documentation.dataspace.copernicus.eu/APIs/OData.html
   - Function: Discovers satellite passes, flight orbits, and exact UTC timestamps.

4. COPERNICUS OAUTH2 AUTHENTICATION API:
   - Endpoint: https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token
   - Documentation: https://documentation.dataspace.copernicus.eu/APIs/Token.html
   - Function: Secure login and bearer token generation.

5. LEAFLET / FOLIUM MAP ENGINE:
   - Leaflet Docs: https://leafletjs.com/
   - Dark Matter Tiles: https://carto.com/basemaps
   - Function: Free worldwide interactive dark radar map.
================================================================================
