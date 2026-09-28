import { DataSource, RetrievalParams, RetrievalItem } from '../types';
import { alertRepository } from '../../db/alertRepository';
import { sourceRepository } from '../../db/sourceRepository';
import { calculateDistanceKm, LOCAL_COORDINATE_INDEX } from '../geoUtils';

export class DatabaseAlertSource implements DataSource<RetrievalItem> {
  public readonly name = 'DatabaseAlertSource';

  public async search(params: RetrievalParams): Promise<RetrievalItem[]> {
    let targetLat: number | undefined;
    let targetLon: number | undefined;
    let targetPlace: string | undefined;

    if (params.location) {
      if (params.location.latitude !== undefined && params.location.longitude !== undefined) {
        targetLat = Number(params.location.latitude);
        targetLon = Number(params.location.longitude);
      } else if (params.location.placeName) {
        targetPlace = params.location.placeName.trim();
        const coords = LOCAL_COORDINATE_INDEX[targetPlace.toLowerCase()];
        if (coords) {
          targetLat = coords.latitude;
          targetLon = coords.longitude;
        }
      }
    }

    const radiusKm = params.location?.radiusKm || 50; // slightly wider for regional alerts

    const records = alertRepository.searchAlerts({
      locationName: targetPlace,
      latitude: targetLat,
      longitude: targetLon,
      radiusKm,
      startDate: params.dateRange?.startDate,
      endDate: params.dateRange?.endDate,
      category: params.filters?.alertCategory,
      keywords: params.keywords,
      includeExpired: params.filters?.includeExpired ?? false,
      limit: params.limit || 15,
    });

    return records.map((rec) => {
      let distanceKm: number | undefined;
      if (
        targetLat !== undefined &&
        targetLon !== undefined &&
        rec.latitude != null &&
        rec.longitude != null
      ) {
        distanceKm = calculateDistanceKm(targetLat, targetLon, rec.latitude, rec.longitude);
      }

      const sourceConfig = sourceRepository.getSourceById(rec.sourceId);
      const sourceName = sourceConfig?.name || rec.sourceId;

      return {
        id: rec.id,
        type: 'GOVERNMENT_ALERT' as const,
        title: rec.title,
        summary: rec.description,
        location: {
          name: rec.locationName,
          latitude: rec.latitude ?? undefined,
          longitude: rec.longitude ?? undefined,
          distanceKm,
        },
        publishedAt: rec.publishedAt,
        source: {
          name: sourceName,
          url: rec.sourceUrl,
          isMock: false,
          trustLevel: sourceConfig?.trustLevel ?? 'OFFICIAL_GOVERNMENT',
        },
        metadata: {
          department: rec.department,
          category: rec.category,
          effectiveFrom: rec.effectiveFrom,
          effectiveUntil: rec.effectiveUntil,
          sourceId: rec.sourceId,
          contentHash: rec.contentHash,
        },
      };
    });
  }

  public async getById(id: string): Promise<RetrievalItem | null> {
    const all = alertRepository.searchAlerts({ limit: 1000, includeExpired: true });
    const record = all.find((r) => r.id === id);
    if (!record) return null;

    return {
      id: record.id,
      type: 'GOVERNMENT_ALERT' as const,
      title: record.title,
      summary: record.description,
      location: {
        name: record.locationName,
        latitude: record.latitude ?? undefined,
        longitude: record.longitude ?? undefined,
      },
      publishedAt: record.publishedAt,
      source: {
        name: record.sourceId,
        url: record.sourceUrl,
        isMock: false,
        trustLevel: 'OFFICIAL_GOVERNMENT',
      },
      metadata: {
        department: record.department,
        category: record.category,
        effectiveFrom: record.effectiveFrom,
        effectiveUntil: record.effectiveUntil,
      },
    };
  }

  public async healthCheck(): Promise<boolean> {
    try {
      alertRepository.countAlerts();
      return true;
    } catch {
      return false;
    }
  }
}

export const databaseAlertSource = new DatabaseAlertSource();
