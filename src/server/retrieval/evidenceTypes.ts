export type EvidenceType = 'NEWS' | 'EVENT' | 'GOVERNMENT_ALERT' | 'PRICE';

export interface EvidenceLocation {
  name: string;
  latitude?: number;
  longitude?: number;
  distanceKm?: number;
}

export interface EvidenceSource {
  name: string;
  url?: string;
  trustLevel?: string;
  isMock?: boolean;
}

export interface EvidenceItem {
  type: EvidenceType;
  id: string;
  title: string;
  summary: string;
  location: EvidenceLocation;
  publishedAt: string;
  source: EvidenceSource;
  metadata?: Record<string, any>;
  importance?: 'URGENT' | 'HIGH' | 'NORMAL' | 'LOW';
  supportingSources?: EvidenceSource[];
  score?: number;
}

/**
 * Normalizes any retrieval item from news, events, government alerts, or prices
 * into the unified EvidenceItem contract.
 */
export function normalizeToEvidence(item: any, fallbackType: EvidenceType = 'NEWS'): EvidenceItem {
  let type: EvidenceType = fallbackType;
  const rawType = String(item.type || '').toUpperCase();

  if (rawType === 'EVENT' || rawType === 'LOCAL_EVENTS') {
    type = 'EVENT';
  } else if (rawType === 'ALERT' || rawType === 'GOVERNMENT_ALERT' || rawType === 'GOVERNMENT_ALERTS') {
    type = 'GOVERNMENT_ALERT';
  } else if (rawType === 'PRICE' || rawType === 'PRICE_SEARCH') {
    type = 'PRICE';
  } else if (rawType === 'NEWS' || rawType === 'LOCAL_NEWS') {
    type = 'NEWS';
  }

  // Determine initial importance
  let importance: 'URGENT' | 'HIGH' | 'NORMAL' | 'LOW' = 'NORMAL';
  if (type === 'GOVERNMENT_ALERT') {
    const sev = String(item.metadata?.severity || '').toUpperCase();
    if (sev === 'URGENT' || sev === 'CRITICAL' || sev === 'EMERGENCY') {
      importance = 'URGENT';
    } else if (sev === 'WARNING' || sev === 'HIGH') {
      importance = 'HIGH';
    } else {
      importance = 'NORMAL';
    }
  }

  const primarySource: EvidenceSource = {
    name: item.source?.name || item.metadata?.issuedBy || item.metadata?.venue || 'Verified Source',
    url: item.source?.url || item.sourceUrl,
    trustLevel: item.source?.trustLevel || item.metadata?.trustLevel,
    isMock: item.source?.isMock ?? false,
  };

  const supportingSources: EvidenceSource[] = Array.isArray(item.supportingSources)
    ? item.supportingSources
    : [];

  return {
    type,
    id: item.id || `evd-${Math.random().toString(36).slice(2, 10)}`,
    title: String(item.title || '').trim(),
    summary: String(item.summary || item.description || item.title || '').trim(),
    location: {
      name: item.location?.name || item.locationName || 'Local Region',
      latitude: item.location?.latitude ?? item.latitude,
      longitude: item.location?.longitude ?? item.longitude,
      distanceKm: item.location?.distanceKm ?? item.distanceKm,
    },
    publishedAt: item.publishedAt || item.startAt || item.createdAt || new Date().toISOString(),
    source: primarySource,
    metadata: item.metadata || {},
    importance,
    supportingSources,
  };
}
