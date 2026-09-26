import numpy as np
from PIL import Image
import io

try:
    import cv2
    _CV2_AVAILABLE = True
except ImportError:
    cv2 = None
    _CV2_AVAILABLE = False

IMG_SIZE = 256

def calibrate_sar_histogram(img):
    """
    Standardizes SAR radar image brightness so the sea surface background matches
    the exact distribution the U-Net model was trained on (Mean ~155, Std ~25).
    """
    if img is None or img.size == 0:
        return img

    valid_pixels = img[img > 2]
    if len(valid_pixels) < 100:
        return img

    current_mean = float(np.mean(valid_pixels))
    current_std = float(np.std(valid_pixels))

    if current_std < 1.0:
        return img

    # Target baseline learned by U-Net from training dataset
    target_mean = 155.0
    target_std = 25.0

    # Normalize and shift to model training domain
    calibrated = (img.astype(np.float32) - current_mean) * (target_std / current_std) + target_mean
    calibrated = np.clip(calibrated, 0, 255).astype(np.uint8)
    return calibrated


def _load_gray_pil(source) -> np.ndarray:
    """Load an image from path or bytes as grayscale numpy array using Pillow."""
    if isinstance(source, (str, bytes, bytearray)):
        if isinstance(source, str):
            pil = Image.open(source).convert("L")
        else:
            pil = Image.open(io.BytesIO(source)).convert("L")
    else:
        raise TypeError(f"Expected str or bytes, got {type(source)}")
    return np.array(pil)


def _to_gray_np(arr: np.ndarray) -> np.ndarray:
    """Convert a numpy array to grayscale (H, W) uint8."""
    if arr.ndim == 2:
        return arr
    if arr.ndim == 3:
        if arr.shape[2] == 1:
            return arr.squeeze(axis=-1)
        if arr.shape[2] >= 3:
            # Luminosity conversion (BT.601): matches cv2.COLOR_BGR2GRAY weighting
            return np.dot(arr[:, :, :3].astype(np.float32), [0.114, 0.587, 0.299]).astype(np.uint8)
    raise ValueError(f"Cannot convert array with shape {arr.shape} to grayscale")


def _resize_gray(img: np.ndarray, size: int) -> np.ndarray:
    """Resize a 2D uint8 array to (size, size) using PIL LANCZOS."""
    pil = Image.fromarray(img, mode="L")
    pil = pil.resize((size, size), Image.LANCZOS)
    return np.array(pil)


def preprocess_sar_image(image_input):
    """
    Preprocesses SAR image for U-Net model prediction.

    Accepts:
        image_input: NumPy array (H, W) or (H, W, C), OR image file path (str) OR raw PNG bytes

    Returns:
        tuple:
            - preprocessed_tensor: NumPy array of shape (1, 256, 256, 1), float32 normalized [0.0, 1.0]
            - calibrated_image: NumPy array of shape (256, 256), uint8 [0..255]
    """
    if isinstance(image_input, str):
        if _CV2_AVAILABLE:
            img = cv2.imdecode(np.fromfile(image_input, dtype=np.uint8), cv2.IMREAD_GRAYSCALE)
            if img is None:
                raise ValueError(f"Could not load image from path: {image_input}")
        else:
            img = _load_gray_pil(image_input)
    elif isinstance(image_input, bytes):
        if _CV2_AVAILABLE:
            image_bytes = np.frombuffer(image_input, dtype=np.uint8)
            img = cv2.imdecode(image_bytes, cv2.IMREAD_GRAYSCALE)
            if img is None:
                raise ValueError("Could not decode image from bytes.")
        else:
            img = _load_gray_pil(image_input)
    elif isinstance(image_input, np.ndarray):
        img = _to_gray_np(image_input.copy())
    else:
        raise TypeError(f"Unsupported input type for image_input: {type(image_input)}")

    # Resize to exact model input dimensions (256 x 256)
    if _CV2_AVAILABLE:
        img_resized = cv2.resize(img, (IMG_SIZE, IMG_SIZE), interpolation=cv2.INTER_AREA)
    else:
        img_resized = _resize_gray(img, IMG_SIZE)

    # Calibrate histogram to match the U-Net training domain
    img_calibrated = calibrate_sar_histogram(img_resized)

    # Normalize to [0.0, 1.0] float32 as done during U-Net training
    img_normalized = img_calibrated.astype(np.float32) / 255.0

    # Expand dimensions for model prediction shape (1, 256, 256, 1)
    input_tensor = img_normalized[np.newaxis, ..., np.newaxis]

    return input_tensor, img_calibrated
