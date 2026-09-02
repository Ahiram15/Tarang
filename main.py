import argparse
import sys
import os
from datetime import datetime
from dotenv import load_dotenv
from pipeline import OilSpillDetectionPipeline

load_dotenv()

def main():
    parser = argparse.ArgumentParser(
        description="CDSE Sentinel-1 SAR Oil Spill Detection Pipeline with U-Net"
    )
    parser.add_argument("--lat", type=float, default=17.4135, help="Target center latitude")
    parser.add_argument("--lon", type=float, default=83.6675, help="Target center longitude")
    parser.add_argument("--bbox", nargs=4, type=float, help="Bounding box: min_lon min_lat max_lon max_lat")
    parser.add_argument("--date", type=str, default=datetime.now().strftime("%Y-%m-%d"), help="Target acquisition date (YYYY-MM-DD)")
    parser.add_argument("--client-id", type=str, help="Copernicus CDSE Client ID")
    parser.add_argument("--client-secret", type=str, help="Copernicus CDSE Client Secret")
    parser.add_argument("--model-path", type=str, default="unet_oilspill.h5", help="Path to trained U-Net model .h5")
    parser.add_argument("--mock", action="store_true", help="Use synthetic/mock Sentinel-1 SAR image for offline testing")
    parser.add_argument("--output-dir", type=str, default="output", help="Directory to save output files")

    args = parser.parse_args()

    print("==========================================================")
    print(" Copernicus CDSE Sentinel-1 Oil Spill Detection Pipeline")
    print("==========================================================")

    # Check for credentials in arguments or environment
    client_id = args.client_id or os.environ.get("CDSE_CLIENT_ID")
    client_secret = args.client_secret or os.environ.get("CDSE_CLIENT_SECRET")

    is_mock = args.mock or not (client_id and client_secret)

    if is_mock and not args.mock:
        print("[INFO] CDSE credentials not provided. Running in Mock Mode for verification.")
        print("       Provide --client-id and --client-secret (or set CDSE_CLIENT_ID / CDSE_CLIENT_SECRET env variables) for live API access.\n")

    try:
        pipeline = OilSpillDetectionPipeline(model_path=args.model_path)
        results = pipeline.run_detection(
            lat=args.lat,
            lon=args.lon,
            bbox=args.bbox,
            date=args.date,
            client_id=client_id,
            client_secret=client_secret,
            mock=is_mock,
            output_dir=args.output_dir
        )
        print("\n[SUCCESS] Pipeline execution finished successfully!")
        print(f"Oil Spill Detected: {results['oil_spill_detected']}")
        print(f"Spill Coverage:    {results['spill_coverage_percent']}%")
    except Exception as e:
        print(f"\n[ERROR] Pipeline failed: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
