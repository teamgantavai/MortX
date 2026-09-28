import { ExtractedLocation } from './types';

interface KnownPlace {
  city: string;
  locality?: string;
  latitude: number;
  longitude: number;
}

const LOCALITY_DICTIONARY: Record<string, KnownPlace> = {
  'model town': { city: 'Jalandhar', locality: 'Model Town', latitude: 31.3060, longitude: 75.5840 },
  'bmc chowk': { city: 'Jalandhar', locality: 'BMC Chowk', latitude: 31.3260, longitude: 75.5762 },
  'rama mandi': { city: 'Jalandhar', locality: 'Rama Mandi', latitude: 31.3120, longitude: 75.6120 },
  'jalandhar cantt': { city: 'Jalandhar', locality: 'Jalandhar Cantt', latitude: 31.2850, longitude: 75.6150 },
  'maqsudan': { city: 'Jalandhar', locality: 'Maqsudan', latitude: 31.3550, longitude: 75.5680 },
  'ferozepur road': { city: 'Ludhiana', locality: 'Ferozepur Road', latitude: 30.9010, longitude: 75.8573 },
  'miller ganj': { city: 'Ludhiana', locality: 'Miller Ganj', latitude: 30.8920, longitude: 75.8650 },
  'civil lines': { city: 'Ludhiana', locality: 'Civil Lines', latitude: 30.9100, longitude: 75.8450 },
  'heritage street': { city: 'Amritsar', locality: 'Heritage Street', latitude: 31.6210, longitude: 74.8765 },
  'golden temple': { city: 'Amritsar', locality: 'Golden Temple Area', latitude: 31.6200, longitude: 74.8765 },
};

const CITY_DICTIONARY: Record<string, { latitude: number; longitude: number }> = {
  jalandhar: { latitude: 31.3260, longitude: 75.5762 },
  ludhiana: { latitude: 30.9010, longitude: 75.8573 },
  amritsar: { latitude: 31.6340, longitude: 74.8723 },
  phagwara: { latitude: 31.2240, longitude: 75.7708 },
  patiala: { latitude: 30.3398, longitude: 76.3869 },
  bathinda: { latitude: 30.2110, longitude: 74.9455 },
  mohali: { latitude: 30.7046, longitude: 76.7179 },
  chandigarh: { latitude: 30.7333, longitude: 76.7794 },
  hoshiarpur: { latitude: 31.5273, longitude: 75.9149 },
  kapurthala: { latitude: 31.3800, longitude: 75.3800 },
};

export class LocationExtractor {
  public extract(title: string, description: string = '', fallbackRegion: string = 'Punjab'): ExtractedLocation {
    const text = `${title} ${description}`.toLowerCase();

    // 1. Check for specific localities first
    for (const [key, place] of Object.entries(LOCALITY_DICTIONARY)) {
      const regex = new RegExp(`\\b${key}\\b`, 'i');
      if (regex.test(text)) {
        return {
          city: place.city,
          locality: place.locality,
          name: `${place.locality}, ${place.city}`,
          latitude: place.latitude,
          longitude: place.longitude,
        };
      }
    }

    // 2. Check for cities
    for (const [cityKey, coords] of Object.entries(CITY_DICTIONARY)) {
      const regex = new RegExp(`\\b${cityKey}\\b`, 'i');
      if (regex.test(text)) {
        const capitalizedCity = cityKey.charAt(0).toUpperCase() + cityKey.slice(1);
        return {
          city: capitalizedCity,
          name: capitalizedCity,
          latitude: coords.latitude,
          longitude: coords.longitude,
        };
      }
    }

    // 3. Fallback to source region
    return {
      name: fallbackRegion,
      city: fallbackRegion,
      // Default regional coordinates for Punjab center if region matches Punjab
      ...(fallbackRegion.toLowerCase().includes('punjab')
        ? { latitude: 31.1471, longitude: 75.3412 }
        : {}),
    };
  }
}

export const locationExtractor = new LocationExtractor();
