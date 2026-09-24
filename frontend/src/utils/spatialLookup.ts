/**
 * Spatial Lookup & Geographic Reverse Geocoding Utility
 * Resolves ocean sea basins, formats DMS/Decimal coordinates, and computes nearest port/coastal distances.
 */

export interface CoastalLandmark {
  name: string;
  code?: string;
  country: string;
  lat: number;
  lon: number;
}

export interface GeoContextResult {
  seaBasin: string;
  dms: string;
  decimal: string;
  nearestCoast: string;
  distanceKm: number;
}

const COASTAL_LANDMARKS: CoastalLandmark[] = [
  // India / Bay of Bengal & Arabian Sea
  { name: 'Visakhapatnam Port', code: 'INVTZ', country: 'India', lat: 17.6868, lon: 83.2185 },
  { name: 'Chennai Port', code: 'INMAA', country: 'India', lat: 13.0827, lon: 80.2925 },
  { name: 'Paradip Port', code: 'INPRP', country: 'India', lat: 20.2644, lon: 86.6713 },
  { name: 'Kolkata / Haldia Port', code: 'INKOL', country: 'India', lat: 22.0253, lon: 88.0583 },
  { name: 'Chattogram Port', code: 'BDCGP', country: 'Bangladesh', lat: 22.3300, lon: 91.8000 },
  { name: 'Mumbai Port', code: 'INBOM', country: 'India', lat: 18.9500, lon: 72.8500 },
  { name: 'Kochi (Cochin) Port', code: 'INKOK', country: 'India', lat: 9.9667, lon: 76.2667 },
  { name: 'New Mangalore Port', code: 'INNML', country: 'India', lat: 12.9250, lon: 74.8100 },
  { name: 'Kavaratti, Lakshadweep', code: 'INMAV', country: 'India', lat: 10.5626, lon: 72.6420 },
  { name: 'Colombo Port', code: 'LKCMB', country: 'Sri Lanka', lat: 6.9400, lon: 79.8400 },
  
  // Mauritius / Mascarene Plateau (Wakashio)
  { name: 'Pointe d\'Esny & Grand Port Lagoon', code: 'MUMBG', country: 'Mauritius', lat: -20.4200, lon: 57.7250 },
  { name: 'Port Louis', code: 'MUPLU', country: 'Mauritius', lat: -20.1600, lon: 57.5000 },
  { name: 'Saint-Denis', code: 'RERUN', country: 'Réunion (France)', lat: -20.8800, lon: 55.4500 },

  // Mediterranean Sea (MT Emerald / Levant)
  { name: 'Haifa Port', code: 'ILHFA', country: 'Israel', lat: 32.8250, lon: 34.9950 },
  { name: 'Beirut Port', code: 'BEY', country: 'Lebanon', lat: 33.9010, lon: 35.5130 },
  { name: 'Ashdod Port', code: 'ILASH', country: 'Israel', lat: 31.8330, lon: 34.6470 },
  { name: 'Limassol Port', code: 'CYLMS', country: 'Cyprus', lat: 34.6500, lon: 33.0300 },
  { name: 'Alexandria Port', code: 'EGALY', country: 'Egypt', lat: 31.1980, lon: 29.8630 },

  // Red Sea & Gulf of Aden
  { name: 'Jeddah Port', code: 'SAJED', country: 'Saudi Arabia', lat: 21.4800, lon: 39.1900 },
  { name: 'Port Sudan', code: 'SDPZU', country: 'Sudan', lat: 19.6100, lon: 37.2100 },
  { name: 'Aden Port', code: 'YEADE', country: 'Yemen', lat: 12.7800, lon: 44.9700 },

  // Persian Gulf & Gulf of Oman
  { name: 'Jebel Ali Port, Dubai', code: 'AEJEA', country: 'UAE', lat: 25.0000, lon: 55.0600 },
  { name: 'King Abdul Aziz Port, Dammam', code: 'SADMM', country: 'Saudi Arabia', lat: 26.4300, lon: 50.1000 },
  { name: 'Port Sultan Qaboos, Muscat', code: 'OMMCT', country: 'Oman', lat: 23.6200, lon: 58.5600 },

  // Southeast Asia & Malacca Strait
  { name: 'Singapore Port', code: 'SGSIN', country: 'Singapore', lat: 1.2640, lon: 103.8400 },
  { name: 'Port Klang', code: 'MYPKG', country: 'Malaysia', lat: 3.0000, lon: 101.4000 },
  { name: 'Manila Port', code: 'PHMNL', country: 'Philippines', lat: 14.5830, lon: 120.9670 },

  // Atlantic & Gulf of Mexico
  { name: 'Houston Ship Channel', code: 'USHOU', country: 'USA', lat: 29.7200, lon: -95.0200 },
  { name: 'New Orleans Port', code: 'USMSY', country: 'USA', lat: 29.9500, lon: -90.0700 },
  { name: 'Rotterdam Port', code: 'NLRTM', country: 'Netherlands', lat: 51.9500, lon: 4.1400 },
];

/**
 * Calculates Haversine distance in kilometers between two GPS points
 */
export function calculateHaversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Converts decimal latitude and longitude to DMS format (Degrees, Minutes, Seconds)
 */
export function formatDMS(lat: number, lon: number): string {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lonDir = lon >= 0 ? 'E' : 'W';
  const absLat = Math.abs(lat);
  const absLon = Math.abs(lon);

  const latDeg = Math.floor(absLat);
  const latMin = Math.floor((absLat - latDeg) * 60);
  const latSec = Math.round(((absLat - latDeg) * 60 - latMin) * 60);

  const lonDeg = Math.floor(absLon);
  const lonMin = Math.floor((absLon - lonDeg) * 60);
  const lonSec = Math.round(((absLon - lonDeg) * 60 - lonMin) * 60);

  return `${latDeg}°${latMin.toString().padStart(2, '0')}'${latSec.toString().padStart(2, '0')}" ${latDir}, ${lonDeg}°${lonMin.toString().padStart(2, '0')}'${lonSec.toString().padStart(2, '0')}" ${lonDir}`;
}

/**
 * Formats decimal latitude and longitude
 */
export function formatDecimalLatLon(lat: number, lon: number): string {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lonDir = lon >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(4)}° ${latDir}, ${Math.abs(lon).toFixed(4)}° ${lonDir}`;
}

/**
 * Resolves ocean sea basin name based on coordinate bounding boxes or spill metadata
 */
export function resolveSeaBasin(lat: number, lon: number, spillId?: string): string {
  if (spillId === 'emerald') return 'Eastern Mediterranean Sea (Levantine Basin)';
  if (spillId === 'wakashio') return 'South Indian Ocean (Mascarene Plateau)';

  // Bay of Bengal: Lat 5 to 23 N, Lon 80 to 96 E
  if (lat >= 5 && lat <= 23 && lon >= 80 && lon <= 96) {
    return 'Bay of Bengal';
  }
  // Arabian Sea: Lat 5 to 26 N, Lon 50 to 77.5 E
  if (lat >= 5 && lat <= 26 && lon >= 50 && lon <= 77.5) {
    if (lat >= 8 && lat <= 14 && lon >= 71 && lon <= 77) {
      return 'Laccadive Sea (Lakshadweep Basin)';
    }
    return 'Arabian Sea';
  }
  // Mediterranean Sea: Lat 30 to 46 N, Lon -6 to 36 E
  if (lat >= 30 && lat <= 46 && lon >= -6 && lon <= 36) {
    if (lon >= 28) return 'Eastern Mediterranean Sea (Levantine Basin)';
    if (lon >= 12) return 'Central Mediterranean Sea (Ionian / Adriatic Basin)';
    return 'Western Mediterranean Sea';
  }
  // South Indian Ocean (Mauritius / Mascarene Plateau)
  if (lat >= -30 && lat <= 0 && lon >= 40 && lon <= 80) {
    if (lat >= -22 && lat <= -19 && lon >= 56 && lon <= 60) {
      return 'South Indian Ocean (Mascarene Islands / Mauritius)';
    }
    return 'South Indian Ocean';
  }
  // Red Sea
  if (lat >= 12 && lat <= 30 && lon >= 32 && lon <= 44) {
    return 'Red Sea (Bab-el-Mandeb Basin)';
  }
  // Persian Gulf
  if (lat >= 23 && lat <= 31 && lon >= 47 && lon <= 57) {
    return 'Persian Gulf (Strait of Hormuz)';
  }
  // South China Sea / Malacca Strait
  if (lat >= 0 && lat <= 24 && lon >= 99 && lon <= 122) {
    if (lat <= 6 && lon <= 104) return 'Malacca Strait';
    return 'South China Sea';
  }
  // North Atlantic / Caribbean / Gulf of Mexico
  if (lat >= 0 && lat <= 70 && lon >= -98 && lon <= 0) {
    if (lat >= 18 && lat <= 31 && lon >= -98 && lon <= -80) return 'Gulf of Mexico';
    if (lat >= 9 && lat <= 22 && lon >= -89 && lon <= -60) return 'Caribbean Sea';
    return 'North Atlantic Ocean';
  }
  // Pacific Ocean
  if (lon < -100 || lon > 120) {
    return lat >= 0 ? 'North Pacific Ocean' : 'South Pacific Ocean';
  }

  return lat >= 0 ? 'Northern Indian Ocean' : 'Southern Indian Ocean';
}

/**
 * Resolves nearest shoreline / port landmark and distance in km
 */
export function resolveNearestCoast(lat: number, lon: number): { distanceKm: number; text: string } {
  let minDistance = Infinity;
  let nearestPort: CoastalLandmark | null = null;

  for (const lm of COASTAL_LANDMARKS) {
    const dist = calculateHaversineKm(lat, lon, lm.lat, lm.lon);
    if (dist < minDistance) {
      minDistance = dist;
      nearestPort = lm;
    }
  }

  if (nearestPort) {
    const codeStr = nearestPort.code ? ` (${nearestPort.code})` : '';
    return {
      distanceKm: Math.round(minDistance * 10) / 10,
      text: `~${minDistance.toFixed(1)} km offshore from ${nearestPort.name}, ${nearestPort.country}${codeStr}`,
    };
  }

  return {
    distanceKm: 25.0,
    text: `~25.0 km offshore from Nearest Coastline`,
  };
}

/**
 * Returns comprehensive geographic context object for a coordinate
 */
export function resolveGeographicContext(lat: number, lon: number, spillId?: string): GeoContextResult {
  const seaBasin = resolveSeaBasin(lat, lon, spillId);
  const dms = formatDMS(lat, lon);
  const decimal = formatDecimalLatLon(lat, lon);
  const coast = resolveNearestCoast(lat, lon);

  return {
    seaBasin,
    dms,
    decimal,
    nearestCoast: coast.text,
    distanceKm: coast.distanceKm,
  };
}
