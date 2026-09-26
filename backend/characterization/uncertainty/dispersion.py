import math
from dataclasses import dataclass
from typing import Any, Dict, List, Tuple
import numpy as np
try:
    from scipy.spatial import ConvexHull
except ImportError:
    ConvexHull = None
from shapely.geometry import Polygon, mapping


@dataclass
class UncertaintyMetrics:
    centroid_lat: float
    centroid_lon: float
    sigma_x_km: float
    sigma_y_km: float
    uncertainty_radius_km: float
    confidence_score: float
    convex_hull_geojson: Dict[str, Any]
    uncertainty_circle_geojson: Dict[str, Any]


class DispersionAnalyzer:
    """Analyzes spatial dispersion and uncertainty of Lagrangian particle clouds."""

    @staticmethod
    def calculate_dispersion(
        lons: np.ndarray,
        lats: np.ndarray,
        base_confidence: float = 0.85,
    ) -> UncertaintyMetrics:
        if len(lons) == 0:
            return UncertaintyMetrics(
                centroid_lat=0.0,
                centroid_lon=0.0,
                sigma_x_km=0.0,
                sigma_y_km=0.0,
                uncertainty_radius_km=0.0,
                confidence_score=0.0,
                convex_hull_geojson={},
                uncertainty_circle_geojson={},
            )

        c_lon = float(np.mean(lons))
        c_lat = float(np.mean(lats))

        # Convert degree offsets to km
        lat_rad = math.radians(c_lat)
        km_per_deg_lat = 111.32
        km_per_deg_lon = 111.32 * math.cos(lat_rad)

        dx_km = (lons - c_lon) * km_per_deg_lon
        dy_km = (lats - c_lat) * km_per_deg_lat

        sigma_x = float(np.std(dx_km))
        sigma_y = float(np.std(dy_km))

        # 95th percentile distance from centroid
        dist_km = np.sqrt(dx_km * dx_km + dy_km * dy_km)
        radius_95_km = float(np.percentile(dist_km, 95)) if len(dist_km) > 0 else 0.0

        # Confidence decreases smoothly with particle spread
        confidence = max(0.40, min(0.95, round(base_confidence - (radius_95_km * 0.008), 2)))

        # 1. Convex Hull Polygon around particle cluster
        hull_geojson = {}
        if len(lons) >= 4:
            points = np.column_stack([lons, lats])
            try:
                try:
                    from scipy.spatial import ConvexHull
                    hull = ConvexHull(points)
                    hull_coords = [[round(float(points[idx, 0]), 6), round(float(points[idx, 1]), 6)] for idx in hull.vertices]
                    if hull_coords[0] != hull_coords[-1]:
                        hull_coords.append(hull_coords[0])
                    poly = Polygon(hull_coords)
                except (ImportError, Exception):
                    from shapely.geometry import MultiPoint
                    poly = MultiPoint(points).convex_hull
                hull_geojson = mapping(poly)
            except Exception:
                hull_geojson = {}

        # 2. Uncertainty Circle Polygon
        circle_coords = []
        r_deg_lat = radius_95_km / km_per_deg_lat
        r_deg_lon = radius_95_km / max(1.0, km_per_deg_lon)

        for deg in range(0, 361, 10):
            rad = math.radians(deg)
            p_lon = c_lon + r_deg_lon * math.cos(rad)
            p_lat = c_lat + r_deg_lat * math.sin(rad)
            circle_coords.append([round(p_lon, 6), round(p_lat, 6)])

        circle_geojson = mapping(Polygon(circle_coords))

        return UncertaintyMetrics(
            centroid_lat=round(c_lat, 6),
            centroid_lon=round(c_lon, 6),
            sigma_x_km=round(sigma_x, 2),
            sigma_y_km=round(sigma_y, 2),
            uncertainty_radius_km=round(radius_95_km, 2),
            confidence_score=confidence,
            convex_hull_geojson=hull_geojson,
            uncertainty_circle_geojson=circle_geojson,
        )
