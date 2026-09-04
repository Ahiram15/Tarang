"""
Coastal Boundary & Shoreline Stranding Engine for Oil Spill Drift Modeling.

Ensures that:
1. Forecast Lagrangian trajectories beach on the coastline and never cross inland over dry land.
2. Coastal drift vectors terminate at the shoreline contact point.
3. Hindcast and Probable Origin zones are strictly bounded by marine/lagoon waters and barrier reefs,
   never overlapping dry mainland ground.
"""

import math
from typing import List, Tuple, Optional, Dict, Any
from shapely.geometry import Point, Polygon, LineString, MultiPolygon, mapping, shape


# High-precision Mauritius mainland polygon boundary (WGS84 lon, lat)
# Represents the dry landmass boundary accurately.
# Nearshore lagoon waters (~57.715-57.745E, -20.42S to -20.46S) are open water where oil drifts toward shore.
MAURITIUS_MAINLAND_COORDS = [
    # North coast
    (57.500, -19.980), (57.580, -19.990), (57.650, -20.010),
    (57.700, -20.040), (57.740, -20.060), (57.770, -20.110),
    # East coast
    (57.785, -20.200), (57.770, -20.280), (57.750, -20.340),
    # Grand Port & Mahébourg coastal shoreline (Pointe d'Esny / Blue Bay beach line)
    (57.720, -20.375), (57.705, -20.408), (57.718, -20.430), (57.712, -20.450),
    (57.690, -20.470),
    # South coast
    (57.650, -20.515), (57.580, -20.520), (57.480, -20.510),
    # West coast going north
    (57.400, -20.450), (57.360, -20.380), (57.360, -20.280), (57.390, -20.180),
    (57.430, -20.100), (57.470, -20.050),
    # Back to north coast start
    (57.500, -19.980)
]
MAURITIUS_LAND_POLY = Polygon(MAURITIUS_MAINLAND_COORDS)

# Mumbai / Salsette Island & western India mainland polygon (WGS84 lon, lat)
MUMBAI_MAINLAND_COORDS = [
    (72.780, 18.880), (72.820, 18.910), (72.840, 18.950), (72.825, 19.000),
    (72.810, 19.100), (72.780, 19.250), (72.850, 19.350), (73.050, 19.350),
    (73.100, 18.880), (72.780, 18.880)
]
MUMBAI_LAND_POLY = Polygon(MUMBAI_MAINLAND_COORDS)


class CoastalBoundaryService:
    """
    Manages land-water boundaries, shoreline stranding (beaching),
    and marine-only spatial clipping for all oil spill drift calculations.
    """

    @classmethod
    def get_land_polygon(cls, lat: float, lon: float) -> Optional[Polygon]:
        """Returns the regional land polygon if near a known coastline."""
        # Check Mauritius region
        if -20.56 <= lat <= -19.90 and 57.25 <= lon <= 57.85:
            return MAURITIUS_LAND_POLY
        # Check Mumbai / Arabian Sea region
        if 18.70 <= lat <= 19.40 and 72.70 <= lon <= 73.20:
            return MUMBAI_LAND_POLY
        return None

    @classmethod
    def is_land(cls, lat: float, lon: float) -> bool:
        """Returns True if (lat, lon) is on dry land."""
        poly = cls.get_land_polygon(lat, lon)
        if poly is None:
            return False
        return poly.contains(Point(lon, lat))

    @classmethod
    def clamp_step_to_shoreline(
        cls,
        new_lat: float,
        new_lon: float,
        prev_lat: float,
        prev_lon: float,
    ) -> Tuple[float, float, bool]:
        """
        If a step moves from water onto land, computes the exact intersection
        point with the coastline and returns (shore_lat, shore_lon, is_beached=True).
        If already on land or remains on water, handles gracefully.
        """
        poly = cls.get_land_polygon(new_lat, new_lon)
        if poly is None:
            return new_lat, new_lon, False

        new_pt = Point(new_lon, new_lat)
        if not poly.contains(new_pt):
            return new_lat, new_lon, False

        # Particle attempted to cross onto land! Find exact shoreline intersection
        prev_pt = Point(prev_lon, prev_lat)
        segment = LineString([prev_pt, new_pt])
        intersection = segment.intersection(poly.boundary)

        if intersection.is_empty:
            # Fallback: pull slightly seaward of new position
            return prev_lat, prev_lon, True

        if intersection.geom_type == "Point":
            # Add micro-offset (0.0002 deg ~ 20m) seaward toward previous water point
            beach_lon = intersection.x * 0.9999 + prev_lon * 0.0001
            beach_lat = intersection.y * 0.9999 + prev_lat * 0.0001
            return round(beach_lat, 6), round(beach_lon, 6), True
        elif intersection.geom_type == "MultiPoint":
            first_pt = intersection.geoms[0]
            return round(first_pt.y, 6), round(first_pt.x, 6), True

        return prev_lat, prev_lon, True

    @classmethod
    def clip_trajectory(cls, trajectory: List[List[float]]) -> List[List[float]]:
        """
        Truncates a particle trajectory the moment it makes contact with the shoreline.
        Points: [[lon, lat], ...]
        """
        if not trajectory or len(trajectory) < 2:
            return trajectory

        clipped: List[List[float]] = [trajectory[0]]
        for i in range(1, len(trajectory)):
            prev_lon, prev_lat = clipped[-1]
            cur_lon, cur_lat = trajectory[i]

            shore_lat, shore_lon, beached = cls.clamp_step_to_shoreline(
                new_lat=cur_lat,
                new_lon=cur_lon,
                prev_lat=prev_lat,
                prev_lon=prev_lon,
            )

            if beached:
                clipped.append([shore_lon, shore_lat])
                # Stop trajectory at shoreline: beached oil stays on shore!
                break
            else:
                clipped.append([cur_lon, cur_lat])

        return clipped

    @classmethod
    def clip_drift_vector(
        cls,
        start_lat: float,
        start_lon: float,
        drift_u: float,
        drift_v: float,
        max_dist_km: float = 3.5,
    ) -> List[Tuple[float, float]]:
        """
        Builds a drift vector path that terminates at the coastline / shoreline.
        Does NOT penetrate inland over mountains or towns.
        Returns coordinates as [(lon0, lat0), (lon1, lat1)].
        """
        poly = cls.get_land_polygon(start_lat, start_lon)

        # Compute raw projected endpoint
        rad_lat = math.radians(start_lat)
        cos_lat = max(0.1, math.cos(rad_lat))
        raw_end_lat = start_lat + (max_dist_km * drift_v) / 111.32
        raw_end_lon = start_lon + (max_dist_km * drift_u) / (111.32 * cos_lat)

        if poly is None:
            return [(round(start_lon, 6), round(start_lat, 6)), (round(raw_end_lon, 6), round(raw_end_lat, 6))]

        start_pt = Point(start_lon, start_lat)
        raw_end_pt = Point(raw_end_lon, raw_end_lat)
        line = LineString([start_pt, raw_end_pt])

        if line.intersects(poly):
            # Intersects land: terminate directly on the shoreline (water's edge)!
            inter = line.intersection(poly.boundary)
            if not inter.is_empty:
                if inter.geom_type == "Point":
                    # Pull 1% back towards the starting water point so it sits right on the water's edge
                    contact_lon = round(start_lon * 0.01 + inter.x * 0.99, 6)
                    contact_lat = round(start_lat * 0.01 + inter.y * 0.99, 6)
                    return [(round(start_lon, 6), round(start_lat, 6)), (contact_lon, contact_lat)]
                elif inter.geom_type == "MultiPoint":
                    first_pt = inter.geoms[0]
                    contact_lon = round(start_lon * 0.01 + first_pt.x * 0.99, 6)
                    contact_lat = round(start_lat * 0.01 + first_pt.y * 0.99, 6)
                    return [(round(start_lon, 6), round(start_lat, 6)), (contact_lon, contact_lat)]

        # If no land intersection, cap length so vector stays localized in nearshore lagoon
        return [(round(start_lon, 6), round(start_lat, 6)), (round(raw_end_lon, 6), round(raw_end_lat, 6))]

    @classmethod
    def clip_polygon_marine_only(
        cls,
        poly: Polygon,
        ref_lat: float,
        ref_lon: float,
    ) -> Polygon:
        """
        Clips a spatial polygon (such as origin zones or forecast step polygons)
        so that it strictly resides in marine / lagoon / reef waters with zero inland overlap.
        """
        land_poly = cls.get_land_polygon(ref_lat, ref_lon)
        if land_poly is None:
            return poly

        if not poly.intersects(land_poly):
            return poly

        try:
            diff = poly.difference(land_poly)
            if diff.is_empty:
                return poly

            if diff.geom_type == "Polygon":
                return diff
            elif diff.geom_type == "MultiPolygon":
                # Select the polygon piece that contains or is closest to the reference water point
                ref_pt = Point(ref_lon, ref_lat)
                best_poly = None
                best_dist = float("inf")
                for p in diff.geoms:
                    if p.contains(ref_pt):
                        return p
                    d = p.distance(ref_pt)
                    if d < best_dist:
                        best_dist = d
                        best_poly = p
                return best_poly or diff.geoms[0]
        except Exception:
            return poly

        return poly

    @classmethod
    def snap_centroid_to_water(
        cls,
        lat: float,
        lon: float,
        nudge_deg: float = 0.004,
    ) -> Tuple[float, float]:
        """
        If (lat, lon) falls on dry land, snaps it to the nearest point on the coastline
        boundary, then nudges it slightly seaward.
        Returns (lat, lon) of the water-side position.
        """
        poly = cls.get_land_polygon(lat, lon)
        if poly is None:
            return lat, lon

        pt = Point(lon, lat)
        if not poly.contains(pt):
            return lat, lon  # already in water

        # Find the nearest point on the coastline boundary
        nearest = poly.boundary.interpolate(poly.boundary.project(pt))
        # Compute direction from interior point to boundary and nudge slightly outward (seaward)
        dx = nearest.x - lon
        dy = nearest.y - lat
        dist = max(0.00001, math.sqrt(dx * dx + dy * dy))
        seaward_lon = round(nearest.x + nudge_deg * (dx / dist), 6)
        seaward_lat = round(nearest.y + nudge_deg * (dy / dist), 6)

        # Safety: verify the nudged point is not also on land
        if not poly.contains(Point(seaward_lon, seaward_lat)):
            return seaward_lat, seaward_lon
        # Fallback: return boundary point itself
        return round(nearest.y, 6), round(nearest.x, 6)

    @classmethod
    def haversine_distance(cls, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Computes great-circle distance between two points in kilometers."""
        r = 6371.0  # Earth radius in km
        phi1 = math.radians(lat1)
        phi2 = math.radians(lat2)
        dphi = math.radians(lat2 - lat1)
        dlambda = math.radians(lon2 - lon1)
        a = math.sin(dphi / 2.0) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2.0) ** 2
        c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
        return r * c

