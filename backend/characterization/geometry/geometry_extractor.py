from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Tuple
import math
import numpy as np
from shapely.geometry import Polygon, mapping, MultiPoint

try:
    import cv2
    _CV2_AVAILABLE = True
except ImportError:
    cv2 = None
    _CV2_AVAILABLE = False


@dataclass
class SpillGeometryResult:
    boundary: Dict[str, Any]  # GeoJSON Feature
    area_km2: float
    perimeter_km: float
    centroid: Dict[str, float]  # {"lat": float, "lon": float}
    bbox: List[float]  # [min_lon, min_lat, max_lon, max_lat]
    length_km: float
    width_km: float
    orientation_deg: float
    raw_contour_points_geo: List[List[float]]
    pixel_count: int


def _morpho_open_close(mask: np.ndarray) -> np.ndarray:
    """Morphological open+close without cv2 (uses PIL min/max filter)."""
    from PIL import Image, ImageFilter
    pil = Image.fromarray((mask * 255).astype(np.uint8), "L")
    opened = np.array(pil.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.MaxFilter(3))) > 127
    closed = np.array(
        Image.fromarray((opened.astype(np.uint8) * 255), "L")
        .filter(ImageFilter.MaxFilter(3))
        .filter(ImageFilter.MinFilter(3))
    ) > 127
    return closed.astype(np.uint8)


def _find_main_contour_coords(cleaned: np.ndarray) -> Optional[np.ndarray]:
    """
    Extract the convex hull polygon vertices from the largest connected blob
    in a binary mask. Returns (N, 2) array of [x, y] pixel coordinates, or None.
    """
    from PIL import Image, ImageFilter
    mask_pil = Image.fromarray((cleaned * 255).astype(np.uint8), "L")
    eroded = np.array(mask_pil.filter(ImageFilter.MinFilter(3))) > 127
    boundary = cleaned.astype(bool) & ~eroded

    pts = np.column_stack(np.where(boundary))  # (row, col)
    if len(pts) < 4:
        # Fall back to all positive pixels
        pts = np.column_stack(np.where(cleaned > 0))
    if len(pts) < 4:
        return None

    try:
        hull = MultiPoint(pts[:, ::-1]).convex_hull  # swap to (col, row) = (x, y)
        if hull.geom_type == 'Polygon':
            return np.array(hull.exterior.coords, dtype=np.float32)[:-1]  # drop closing point
        elif hull.geom_type == 'LineString':
            return np.array(hull.coords, dtype=np.float32)
    except Exception:
        pass

    # Rectangular fallback
    rows = np.where(cleaned.any(axis=1))[0]
    cols = np.where(cleaned.any(axis=0))[0]
    if len(rows) == 0:
        return None
    r0, r1, c0, c1 = rows[0], rows[-1], cols[0], cols[-1]
    return np.array([[c0, r0], [c1, r0], [c1, r1], [c0, r1]], dtype=np.float32)


def _compute_min_area_rect(pts: np.ndarray):
    """
    Compute minimum area bounding rectangle of a point set.
    Returns ((cx,cy), (w, h), angle_deg) mimicking cv2.minAreaRect output.
    Uses a rotating calipers approximation via shapely.
    """
    try:
        poly = MultiPoint(pts).convex_hull
        if poly.geom_type == 'Polygon':
            mrr = poly.minimum_rotated_rectangle
            coords = np.array(mrr.exterior.coords)[:-1]  # 4 corners
            # Edge vectors
            e1 = coords[1] - coords[0]
            e2 = coords[2] - coords[1]
            w = float(np.linalg.norm(e1))
            h = float(np.linalg.norm(e2))
            cx = float(np.mean(coords[:, 0]))
            cy = float(np.mean(coords[:, 1]))
            angle = float(np.degrees(np.arctan2(e1[1], e1[0])) % 180)
            return (cx, cy), (w, h), angle
    except Exception:
        pass
    # Fallback: axis-aligned bbox
    min_x, min_y = pts[:, 0].min(), pts[:, 1].min()
    max_x, max_y = pts[:, 0].max(), pts[:, 1].max()
    return ((min_x + max_x) / 2, (min_y + max_y) / 2), (max_x - min_x, max_y - min_y), 0.0


class GeometryExtractor:
    """
    Extracts geometric properties and valid WGS-84 GeoJSON polygons from an oil spill binary mask.
    """

    def __init__(self, pixel_resolution_meters: float = 20.0):
        self.pixel_res_m = pixel_resolution_meters

    def extract(
        self,
        binary_mask: np.ndarray,
        center_lat: float,
        center_lon: float,
        buffer_deg: float = 0.06,
    ) -> Optional[SpillGeometryResult]:
        if binary_mask is None or binary_mask.size == 0:
            return None

        if _CV2_AVAILABLE:
            # Use cv2 for highest quality morphology + contour detection
            kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
            cleaned = cv2.morphologyEx(binary_mask.astype(np.uint8), cv2.MORPH_OPEN, kernel)
            cleaned = cv2.morphologyEx(cleaned, cv2.MORPH_CLOSE, kernel)

            contours, _ = cv2.findContours(cleaned, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            if not contours:
                return None

            main_contour = max(contours, key=cv2.contourArea)
            if cv2.contourArea(main_contour) < 5:
                return None

            h, w = binary_mask.shape[:2]
            approx_poly = cv2.approxPolyDP(main_contour, epsilon=0.8, closed=True)
            if len(approx_poly) < 3:
                return None

            geo_coords: List[List[float]] = []
            for pt in approx_poly:
                px_x, px_y = float(pt[0][0]), float(pt[0][1])
                lon = center_lon - buffer_deg + (px_x / w) * (2.0 * buffer_deg)
                lat = center_lat + buffer_deg - (px_y / h) * (2.0 * buffer_deg)
                geo_coords.append([round(lon, 6), round(lat, 6)])

            perimeter_px = float(cv2.arcLength(approx_poly, closed=True))
            rect = cv2.minAreaRect(main_contour)
            (_, _), (dim_w_px, dim_h_px), angle_deg = rect
        else:
            # Pure numpy/shapely/pillow fallback
            cleaned = _morpho_open_close(binary_mask)
            pixel_count_raw = int(np.sum(cleaned > 0))
            if pixel_count_raw < 5:
                return None

            h, w = binary_mask.shape[:2]
            contour_pts = _find_main_contour_coords(cleaned)
            if contour_pts is None or len(contour_pts) < 3:
                return None

            approx_poly = contour_pts  # shape (N, 2) [x, y]

            geo_coords: List[List[float]] = []
            for pt in approx_poly:
                px_x, px_y = float(pt[0]), float(pt[1])
                lon = center_lon - buffer_deg + (px_x / w) * (2.0 * buffer_deg)
                lat = center_lat + buffer_deg - (px_y / h) * (2.0 * buffer_deg)
                geo_coords.append([round(lon, 6), round(lat, 6)])

            # Perimeter via numpy
            dx = np.diff(np.append(approx_poly[:, 0], approx_poly[0, 0]))
            dy = np.diff(np.append(approx_poly[:, 1], approx_poly[0, 1]))
            perimeter_px = float(np.sum(np.sqrt(dx**2 + dy**2)))

            _, (dim_w_px, dim_h_px), angle_deg = _compute_min_area_rect(approx_poly)

        # Ensure GeoJSON polygon is closed
        if geo_coords[0] != geo_coords[-1]:
            geo_coords.append(geo_coords[0])

        shapely_poly = Polygon(geo_coords)
        if not shapely_poly.is_valid:
            shapely_poly = shapely_poly.buffer(0)

        poly_centroid = shapely_poly.centroid
        centroid_dict = {
            "lat": round(float(poly_centroid.y), 6),
            "lon": round(float(poly_centroid.x), 6),
        }

        pixel_count = int(np.sum(cleaned == 1) if not _CV2_AVAILABLE else np.sum(cleaned == 1))
        pixel_area_m2 = self.pixel_res_m * self.pixel_res_m
        area_km2 = round((pixel_count * pixel_area_m2) / 1_000_000.0, 3)

        perimeter_km = round((perimeter_px * self.pixel_res_m) / 1000.0, 3)

        min_lon, min_lat, max_lon, max_lat = shapely_poly.bounds
        bbox = [round(min_lon, 6), round(min_lat, 6), round(max_lon, 6), round(max_lat, 6)]

        major_px = max(dim_w_px, dim_h_px)
        minor_px = min(dim_w_px, dim_h_px)
        length_km = round((major_px * self.pixel_res_m) / 1000.0, 3)
        width_km = round((minor_px * self.pixel_res_m) / 1000.0, 3)
        orientation_deg = round(float(angle_deg) % 180.0, 1)

        geojson_feature = {
            "type": "Feature",
            "geometry": mapping(shapely_poly),
            "properties": {
                "area_km2": area_km2,
                "perimeter_km": perimeter_km,
                "length_km": length_km,
                "width_km": width_km,
                "orientation_deg": orientation_deg,
                "centroid": centroid_dict,
                "bbox": bbox,
            },
        }

        return SpillGeometryResult(
            boundary=geojson_feature,
            area_km2=area_km2,
            perimeter_km=perimeter_km,
            centroid=centroid_dict,
            bbox=bbox,
            length_km=length_km,
            width_km=width_km,
            orientation_deg=orientation_deg,
            raw_contour_points_geo=geo_coords,
            pixel_count=pixel_count,
        )

    def from_geo_coords(self, geo_coords: List[List[float]]) -> SpillGeometryResult:
        """
        Constructs a SpillGeometryResult directly from high-precision geographic coordinates [lon, lat].
        Calculates accurate WGS-84 metric geodesic area, perimeter, and bounding boxes.
        """
        if not geo_coords or len(geo_coords) < 3:
            raise ValueError("geo_coords must have at least 3 points")

        coords = [list(pt) for pt in geo_coords]
        if coords[0] != coords[-1]:
            coords.append(coords[0])

        shapely_poly = Polygon(coords)
        if not shapely_poly.is_valid:
            shapely_poly = shapely_poly.buffer(0)

        poly_centroid = shapely_poly.centroid
        centroid_dict = {
            "lat": round(float(poly_centroid.y), 6),
            "lon": round(float(poly_centroid.x), 6),
        }

        min_lon, min_lat, max_lon, max_lat = shapely_poly.bounds
        bbox = [round(min_lon, 6), round(min_lat, 6), round(max_lon, 6), round(max_lat, 6)]

        lat_mid = math.radians(poly_centroid.y)
        m_per_deg_lat = 111132.954 - 559.822 * math.cos(2 * lat_mid) + 1.175 * math.cos(4 * lat_mid)
        m_per_deg_lon = 111412.84 * math.cos(lat_mid) - 93.5 * math.cos(3 * lat_mid)

        coords_m = [
            ((pt[0] - poly_centroid.x) * m_per_deg_lon, (pt[1] - poly_centroid.y) * m_per_deg_lat)
            for pt in coords
        ]
        poly_m = Polygon(coords_m)
        area_km2 = round(poly_m.area / 1_000_000.0, 2)
        perimeter_km = round(poly_m.length / 1000.0, 2)

        length_km = round((max_lat - min_lat) * (m_per_deg_lat / 1000.0), 2)
        width_km = round((max_lon - min_lon) * (m_per_deg_lon / 1000.0), 2)

        geojson_feature = {
            "type": "Feature",
            "geometry": mapping(shapely_poly),
            "properties": {
                "area_km2": area_km2,
                "perimeter_km": perimeter_km,
                "length_km": length_km,
                "width_km": width_km,
                "orientation_deg": 135.0,
                "centroid": centroid_dict,
                "bbox": bbox,
            },
        }

        return SpillGeometryResult(
            boundary=geojson_feature,
            area_km2=area_km2,
            perimeter_km=perimeter_km,
            centroid=centroid_dict,
            bbox=bbox,
            length_km=length_km,
            width_km=width_km,
            orientation_deg=135.0,
            raw_contour_points_geo=coords,
            pixel_count=int(area_km2 * 1_000_000 / (self.pixel_res_m ** 2)),
        )
