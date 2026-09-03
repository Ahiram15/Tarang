# ==========================================================
# WAKASHIO AOI — SATELLITE DOWNLOAD CONFIGURATION
# ==========================================================
# Coordinate Reference System: WGS 84 / EPSG:4326

INCIDENT_NAME = "MV Wakashio Grounding & Marine Oil Spill"
LOCATION = "Pointe d'Esny, Southeast Mauritius, Indian Ocean"

# Exact Grounding Coordinates:
WRECK_LATITUDE = -20.438119
WRECK_LONGITUDE = 57.744631
DMS = "20°26'17.23\" S, 57°44'40.67\" E"

# Recommended AOI Bounding Box (approx. 13 km x 15 km area):
WAKASHIO_AOI = {
    "north": -20.38,
    "south": -20.50,
    "west": 57.68,
    "east": 57.82,
}

# Key Satellite Pass Observations:
# Sentinel-1 SAR: 10 Aug 2020 (01:37 UTC), 16 Aug 2020 (01:37 UTC), 22 Aug 2020 (01:37 UTC)
# Sentinel-2 Optical: 10 Aug 2020, 15 Aug 2020
PRIMARY_OBSERVATION_DATE = "2020-08-10"

if __name__ == "__main__":
    print("=" * 60)
    print("WAKASHIO AOI BOUNDING BOX:")
    print(f"Latitude Range:  {WAKASHIO_AOI['south']} to {WAKASHIO_AOI['north']}")
    print(f"Longitude Range: {WAKASHIO_AOI['west']} to {WAKASHIO_AOI['east']}")
    print(f"Target Wreck:    {WRECK_LATITUDE}, {WRECK_LONGITUDE}")
    print("=" * 60)
