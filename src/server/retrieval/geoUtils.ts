/**
 * Geographic utility functions for distance filtering and coordinate validation.
 * Uses a safe, lightweight Haversine calculation for development.
 */

export function validateCoordinates(lat?: any, lon?: any): { valid: boolean; error?: string } {
  if (lat === undefined && lon === undefined) {
    return { valid: true };
  }

  const numLat = Number(lat);
  const numLon = Number(lon);

  if (isNaN(numLat) || isNaN(numLon)) {
    return { valid: false, error: 'Latitude and longitude must be valid numbers' };
  }

  if (numLat < -90 || numLat > 90) {
    return { valid: false, error: `Latitude ${numLat} is out of range. Must be between -90 and 90.` };
  }

  if (numLon < -180 || numLon > 180) {
    return { valid: false, error: `Longitude ${numLon} is out of range. Must be between -180 and 180.` };
  }

  return { valid: true };
}

/**
 * Calculates Haversine distance in kilometers between two sets of coordinates.
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's mean radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Approximate coordinates for common named locations in the region.
 * Enables mock geographic lookups when a user asks "in Jalandhar" or "around Model Town".
 */
export const LOCAL_COORDINATE_INDEX: Record<string, { latitude: number; longitude: number }> = {
  jalandhar: { latitude: 31.3260, longitude: 75.5762 },
  'model town': { latitude: 31.3060, longitude: 75.5840 },
  ludhiana: { latitude: 30.9010, longitude: 75.8573 },
  amritsar: { latitude: 31.6340, longitude: 74.8723 },
  phagwara: { latitude: 31.2240, longitude: 75.7708 },
  chandigarh: { latitude: 30.7333, longitude: 76.7794 },
};
