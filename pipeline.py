import os
import json
import numpy as np
import cv2
import matplotlib.pyplot as plt
import tensorflow as tf

from cdse_client import CDSEClient
from preprocess import preprocess_sar_image

class OilSpillDetectionPipeline:
    """
    End-to-End Pipeline for Oil Spill Detection:
    CDSE Sentinel-1 SAR Acquisition -> Preprocessing -> Trained U-Net Model -> Mask & Report Generation
    """
    def __init__(self, model_path="unet_oilspill.h5"):
        if not os.path.exists(model_path):
            alt_path = os.path.join("ML model", model_path)
            if os.path.exists(alt_path):
                model_path = alt_path
            else:
                raise FileNotFoundError(f"Model file not found at {model_path} or {alt_path}")

        print(f"[Pipeline] Loading U-Net model from: {model_path}...")
        self.model = tf.keras.models.load_model(model_path)
        print("[Pipeline] Model loaded successfully.")

    def run_detection(self, lat=None, lon=None, bbox=None, date="2026-08-20", 
                      buffer=0.05, client_id=None, client_secret=None, mock=False, 
                      threshold=0.5, output_dir="output"):
        """
        Executes complete detection flow:
        1. Acquire Sentinel-1 image from CDSE API (or Mock mode)
        2. Preprocess to 256x256x1 normalized tensor
        3. Model prediction (probability map)
        4. Postprocess & threshold for binary mask
        5. Visual summary & metrics export
        """
        os.makedirs(output_dir, exist_ok=True)

        # Step 1: Data Acquisition
        if mock or (not client_id and not os.environ.get("CDSE_CLIENT_ID")):
            sar_image_rgb, sar_image, scene_meta = CDSEClient.get_mock_sentinel1_image()
            source_type = "Mock/Synthetic Sentinel-1 SAR Data"
        else:
            client = CDSEClient(client_id=client_id, client_secret=client_secret)
            sar_image_rgb, sar_image, scene_meta = client.fetch_sentinel1_image(lat=lat, lon=lon, bbox=bbox, date=date, buffer=buffer)
            source_type = f"CDSE Sentinel-1 API ({scene_meta.get('date', date)})"

        # Step 2: Preprocessing
        print("[Pipeline] Preprocessing SAR image...")
        input_tensor, original_gray = preprocess_sar_image(sar_image)

        # Step 3: U-Net Model Inference
        print("[Pipeline] Running U-Net oil spill segmentation...")
        prediction_prob = self.model.predict(input_tensor, verbose=0)[0, ..., 0]

        # Step 4: Binary Thresholding & Statistics
        binary_mask = (prediction_prob > threshold).astype(np.uint8)
        spill_pixel_count = int(np.sum(binary_mask))
        total_pixels = binary_mask.size
        spill_percentage = float((spill_pixel_count / total_pixels) * 100.0)
        max_confidence = float(np.max(prediction_prob))

        print(f"[Pipeline] Detection Complete: {spill_pixel_count} oil spill pixels detected ({spill_percentage:.2f}% of area).")

        # Step 5: Save Outputs
        mask_filename = os.path.join(output_dir, "spill_mask.png")
        cv2.imwrite(mask_filename, binary_mask * 255)

        summary_filename = os.path.join(output_dir, "detection_summary.png")
        self._generate_summary_plot(
            original_gray, prediction_prob, binary_mask, 
            scene_meta.get("product_name", source_type), spill_percentage, max_confidence, summary_filename
        )

        results = {
            "source": source_type,
            "scene_name": scene_meta.get("product_name"),
            "satellite": scene_meta.get("satellite"),
            "acquisition_time_utc": scene_meta.get("acquisition_time_utc"),
            "date": date,
            "latitude": lat,
            "longitude": lon,
            "bbox": bbox,
            "total_pixels": total_pixels,
            "spill_pixels": spill_pixel_count,
            "spill_coverage_percent": round(spill_percentage, 3),
            "max_spill_confidence": round(max_confidence, 4),
            "oil_spill_detected": bool(spill_pixel_count > 0),
            "output_mask_path": mask_filename,
            "output_summary_path": summary_filename
        }

        results_json_path = os.path.join(output_dir, "results.json")
        with open(results_json_path, "w") as f:
            json.dump(results, f, indent=2)

        print(f"[Pipeline] Outputs saved in directory '{output_dir}':")
        print(f"  - Binary Mask: {mask_filename}")
        print(f"  - Summary Plot: {summary_filename}")
        print(f"  - Results Data: {results_json_path}")

        return results

    def _generate_summary_plot(self, original, prob_map, mask, source_info, spill_pct, max_conf, save_path):
        """Generates side-by-side visualization of SAR, probability map, binary mask, and overlay."""
        fig, axes = plt.subplots(2, 2, figsize=(12, 10))
        fig.suptitle(f"Sentinel-1 Oil Spill Detection Summary\n({source_info[:55]}...)", fontsize=13, fontweight="bold")

        # Plot 1: Raw Sentinel-1 SAR Image
        axes[0, 0].imshow(original, cmap="gray")
        axes[0, 0].set_title("Input Sentinel-1 SAR (VV)")
        axes[0, 0].axis("off")

        # Plot 2: Prediction Probability Heatmap
        im_prob = axes[0, 1].imshow(prob_map, cmap="jet", vmin=0, vmax=1)
        axes[0, 1].set_title(f"Model Probability Map (Max: {max_conf:.2f})")
        axes[0, 1].axis("off")
        fig.colorbar(im_prob, ax=axes[0, 1], fraction=0.046, pad=0.04)

        # Plot 3: Binary Mask (Threshold = 0.5)
        axes[1, 0].imshow(mask, cmap="gray")
        axes[1, 0].set_title(f"Binary Spill Mask (Coverage: {spill_pct:.2f}%)")
        axes[1, 0].axis("off")

        # Plot 4: Colored Overlay on Original SAR
        overlay = cv2.cvtColor(original, cv2.COLOR_GRAY2RGB)
        overlay[mask == 1] = [255, 30, 30]
        axes[1, 1].imshow(overlay)
        axes[1, 1].set_title("Oil Spill Overlay (Red = Spill)")
        axes[1, 1].axis("off")

        plt.tight_layout()
        plt.savefig(save_path, dpi=150)
        plt.close()
