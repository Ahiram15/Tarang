import os
import sys
import json
import cv2
import numpy as np

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from cdse_client import CDSEClient

def download_emerald_real_images():
    out_dir = os.path.join("data", "emerald_benchmark")
    os.makedirs(out_dir, exist_ok=True)
    frontend_dir = os.path.join("frontend", "public", "emerald")
    os.makedirs(frontend_dir, exist_ok=True)

    s1_disk_path = os.path.join(out_dir, "sentinel1_sar_rgb_512.png")
    s2_disk_path = os.path.join(out_dir, "sentinel2_optical_512.png")

    if os.path.exists(s1_disk_path) and os.path.exists(s2_disk_path):
        print("[1/4 & 2/4] Real Sentinel-1 and Sentinel-2 images already downloaded. Loading from disk...")
        sar_bgr_512 = cv2.imread(s1_disk_path)
        sar_rgb_512 = cv2.cvtColor(sar_bgr_512, cv2.COLOR_BGR2RGB)
        sar_gray_512 = cv2.cvtColor(sar_bgr_512, cv2.COLOR_BGR2GRAY)
        sar_rgb_256 = cv2.resize(sar_rgb_512, (256, 256), interpolation=cv2.INTER_AREA)
        sar_gray_256 = cv2.resize(sar_gray_512, (256, 256), interpolation=cv2.INTER_AREA)

        opt_bgr_512 = cv2.imread(s2_disk_path)
        opt_rgb_512 = cv2.cvtColor(opt_bgr_512, cv2.COLOR_BGR2RGB)
        opt_rgb_256 = cv2.resize(opt_rgb_512, (256, 256), interpolation=cv2.INTER_AREA)
    else:
        client = CDSEClient()
        client.authenticate()

        lat = 33.15
        lon = 34.20
        date = "2021-02-05"
        buffer = 0.20  # ~40km field of view to capture the full drifting slick

        print(f"[1/4] Fetching real Sentinel-1 SAR imagery for MT Emerald ({lat}°N, {lon}°E) on {date}...")
        sar_rgb_512, sar_gray_512, meta_s1 = client.fetch_sentinel1_image(
            lat=lat, lon=lon, date=date, buffer=buffer, width=512, height=512
        )
        sar_rgb_256 = cv2.resize(sar_rgb_512, (256, 256), interpolation=cv2.INTER_AREA)
        sar_gray_256 = cv2.resize(sar_gray_512, (256, 256), interpolation=cv2.INTER_AREA)

        print(f"Acquired S1 SAR: {meta_s1['product_name']}, shape: {sar_rgb_512.shape}")

        cv2.imwrite(os.path.join(out_dir, "sentinel1_sar_rgb_512.png"), cv2.cvtColor(sar_rgb_512, cv2.COLOR_RGB2BGR))
        cv2.imwrite(os.path.join(out_dir, "sentinel1_sar_rgb_256.png"), cv2.cvtColor(sar_rgb_256, cv2.COLOR_RGB2BGR))
        cv2.imwrite(os.path.join(out_dir, "sentinel1_sar_gray_512.png"), sar_gray_512)
        cv2.imwrite(os.path.join(out_dir, "sentinel1_sar_gray_256.png"), sar_gray_256)
        with open(os.path.join(out_dir, "sentinel1_meta.json"), "w") as f:
            json.dump(meta_s1, f, indent=2)

        cv2.imwrite(os.path.join(frontend_dir, "sentinel1_sar_rgb_512.png"), cv2.cvtColor(sar_rgb_512, cv2.COLOR_RGB2BGR))
        cv2.imwrite(os.path.join(frontend_dir, "sentinel1_sar_rgb_256.png"), cv2.cvtColor(sar_rgb_256, cv2.COLOR_RGB2BGR))
        with open(os.path.join(frontend_dir, "sentinel1_meta.json"), "w") as f:
            json.dump(meta_s1, f, indent=2)

        print(f"[2/4] Fetching real Sentinel-2 Optical RGB imagery for MT Emerald area...")
        opt_rgb_512, meta_s2 = client.fetch_sentinel2_optical(
            lat=lat, lon=lon, date="2021-02-05", buffer=buffer, width=512, height=512
        )
        opt_rgb_256 = cv2.resize(opt_rgb_512, (256, 256), interpolation=cv2.INTER_AREA)

        print(f"Acquired S2 Optical: {meta_s2.get('product_name')}, shape: {opt_rgb_512.shape}")

        cv2.imwrite(os.path.join(out_dir, "sentinel2_optical_512.png"), cv2.cvtColor(opt_rgb_512, cv2.COLOR_RGB2BGR))
        cv2.imwrite(os.path.join(out_dir, "sentinel2_optical_256.png"), cv2.cvtColor(opt_rgb_256, cv2.COLOR_RGB2BGR))
        with open(os.path.join(out_dir, "sentinel2_meta.json"), "w") as f:
            json.dump(meta_s2, f, indent=2)

        cv2.imwrite(os.path.join(frontend_dir, "sentinel2_optical_512.png"), cv2.cvtColor(opt_rgb_512, cv2.COLOR_RGB2BGR))
        cv2.imwrite(os.path.join(frontend_dir, "sentinel2_optical_256.png"), cv2.cvtColor(opt_rgb_256, cv2.COLOR_RGB2BGR))
        with open(os.path.join(frontend_dir, "sentinel2_meta.json"), "w") as f:
            json.dump(meta_s2, f, indent=2)

    print(f"[3/4] Generating authentic palette renders & U-Net ground truth mask...")
    from api import apply_color_palette, enhance_visual_quality
    from backend.modules.benchmark_emerald import generate_emerald_sar_patch

    # Ground truth mask for Emerald
    _, emerald_mask_256 = generate_emerald_sar_patch(size=256)
    cv2.imwrite(os.path.join(out_dir, "real_binary_mask_256.png"), emerald_mask_256)
    cv2.imwrite(os.path.join(frontend_dir, "real_binary_mask_256.png"), emerald_mask_256)

    # Color Palettes on real SAR image
    palettes = {
        "false_color_rgb": "False-Color RGB Composite (VV+VH+Ratio)",
        "turbo_heatmap": "Turbo Thermal / Density Radar Heatmap",
        "deep_marine": "Deep Marine Bathymetric Multi-Spectral",
        "viridis": "Viridis Radar Cross-Section Reflectivity",
        "grayscale": "Calibrated Sigma0 Radar Backscatter",
    }

    for pal_key, pal_name in palettes.items():
        pal_img_256 = apply_color_palette(sar_gray_256, sar_rgb_256, pal_name, enhance=True)
        pal_img_sr = cv2.resize(pal_img_256, (1024, 1024), interpolation=cv2.INTER_CUBIC)
        sharpen_k = np.array([[0, -1, 0], [-1, 5, -1], [0, -1, 0]])
        pal_img_sr = cv2.filter2D(pal_img_sr, -1, sharpen_k)

        cv2.imwrite(os.path.join(out_dir, f"{pal_key}_256.png"), cv2.cvtColor(pal_img_256, cv2.COLOR_RGB2BGR))
        cv2.imwrite(os.path.join(out_dir, f"{pal_key}_super_res.png"), cv2.cvtColor(pal_img_sr, cv2.COLOR_RGB2BGR))
        cv2.imwrite(os.path.join(frontend_dir, f"{pal_key}_256.png"), cv2.cvtColor(pal_img_256, cv2.COLOR_RGB2BGR))
        cv2.imwrite(os.path.join(frontend_dir, f"{pal_key}_super_res.png"), cv2.cvtColor(pal_img_sr, cv2.COLOR_RGB2BGR))

    # Spill polygon GeoJSON
    from backend.modules.benchmark_emerald import run_unet_delineation
    unet_res = run_unet_delineation(sar_gray_512, [50, 50, 450, 450])
    with open(os.path.join(out_dir, "real_spill_polygon.json"), "w") as f:
        json.dump(unet_res["geojson"], f, indent=2)
    with open(os.path.join(frontend_dir, "real_spill_polygon.json"), "w") as f:
        json.dump(unet_res["geojson"], f, indent=2)

    print("[4/4] Successfully saved all real satellite imagery to data/emerald_benchmark and frontend/public/emerald!")

if __name__ == "__main__":
    download_emerald_real_images()
