from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Tuple
import cv2
import numpy as np
from shapely.geometry import Polygon, mapping


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

        # Clean noise with morphological opening and closing
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
        cleaned = cv2.morphologyEx(binary_mask.astype(np.uint8), cv2.MORPH_OPEN, kernel)
        cleaned = cv2.morphologyEx(cleaned, cv2.MORPH_CLOSE, kernel)

        contours, _ = cv2.findContours(cleaned, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        if not contours:
            return None

        # Select the dominant spill contour by area
        main_contour = max(contours, key=cv2.contourArea)
        if cv2.contourArea(main_contour) < 5:
            return None

        h, w = binary_mask.shape[:2]

        # Approximate polygon boundary with smooth, high-fidelity contour resolution
        approx_poly = cv2.approxPolyDP(main_contour, epsilon=0.8, closed=True)
        if len(approx_poly) < 3:
            return None

        # Convert pixel coordinates to geographic coordinates [lon, lat]
        geo_coords: List[List[float]] = []
        for pt in approx_poly:
            px_x, px_y = float(pt[0][0]), float(pt[0][1])
            # Mapping assuming centered bounding box
            lon = center_lon - buffer_deg + (px_x / w) * (2.0 * buffer_deg)
            lat = center_lat + buffer_deg - (px_y / h) * (2.0 * buffer_deg)
            geo_coords.append([round(lon, 6), round(lat, 6)])

        # Ensure GeoJSON polygon is closed
        if geo_coords[0] != geo_coords[-1]:
            geo_coords.append(geo_coords[0])

        shapely_poly = Polygon(geo_coords)
        if not shapely_poly.is_valid:
            shapely_poly = shapely_poly.buffer(0)

        # Centroid in geographic space
        poly_centroid = shapely_poly.centroid
        centroid_dict = {
            "lat": round(float(poly_centroid.y), 6),
            "lon": round(float(poly_centroid.x), 6),
        }

        # Area and Perimeter calculations (physical ground metrics)
        pixel_count = int(np.sum(cleaned == 1))
        pixel_area_m2 = self.pixel_res_m * self.pixel_res_m
        area_km2 = round((pixel_count * pixel_area_m2) / 1_000_000.0, 3)

        perimeter_px = float(cv2.arcLength(approx_poly, closed=True))
        perimeter_km = round((perimeter_px * self.pixel_res_m) / 1000.0, 3)

        # Bounding box [min_lon, min_lat, max_lon, max_lat]
        min_lon, min_lat, max_lon, max_lat = shapely_poly.bounds
        bbox = [round(min_lon, 6), round(min_lat, 6), round(max_lon, 6), round(max_lat, 6)]

        # Minimum area rotated rectangle for major length, minor width, and orientation
        rect = cv2.minAreaRect(main_contour)
        (center_x, center_y), (dim_w_px, dim_h_px), angle_deg = rect

        major_px = max(dim_w_px, dim_h_px)
        minor_px = min(dim_w_px, dim_h_px)
        length_km = round((major_px * self.pixel_res_m) / 1000.0, 3)
        width_km = round((minor_px * self.pixel_res_m) / 1000.0, 3)

        # Normalize orientation (0 to 180 degrees)
        orientation_deg = round(float(angle_deg) % 180.0, 1)

        # Construct GeoJSON Feature
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
