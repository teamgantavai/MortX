import { DataSource, RetrievalParams, RetrievalItem } from '../types';
import { eventRepository } from '../../db/eventRepository';
import { sourceRepository } from '../../db/sourceRepository';
import { calculateDistanceKm, LOCAL_COORDINATE_INDEX } from '../geoUtils';

export class DatabaseEventSource implements DataSource<RetrievalItem> {
  public readonly name = 'DatabaseEventSource';

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

    const radiusKm = params.location?.radiusKm || 30;

    const records = eventRepository.searchEvents({
      locationName: targetPlace,
      latitude: targetLat,
      longitude: targetLon,
      radiusKm,
      startDate: params.dateRange?.startDate,
      endDate: params.dateRange?.endDate,
      keywords: params.keywords,
      includeExpired: params.filters?.includeExpired ?? false,
      limit: params.limit || 20,
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
        type: 'EVENT' as const,
        title: rec.title,
        summary: rec.description,
        location: {
          name: rec.locationName,
          latitude: rec.latitude ?? undefined,
          longitude: rec.longitude ?? undefined,
          distanceKm,
        },
        publishedAt: rec.startAt, // Events: use startAt as publishedAt for sorting
        source: {
          name: sourceName,
          url: rec.sourceUrl,
          isMock: false,
          trustLevel: sourceConfig?.trustLevel,
        },
        metadata: {
          startAt: rec.startAt,
          endAt: rec.endAt,
          venue: rec.venue,
          sourceId: rec.sourceId,
          contentHash: rec.contentHash,
        },
      };
    });
  }

  public async getById(id: string): Promise<RetrievalItem | null> {
    // Simple lookup by record id via search (no direct findById on eventRepo, keep it light)
    const db = eventRepository;
    const all = db.searchEvents({ limit: 1000 });
    const record = all.find((r) => r.id === id);
    if (!record) return null;

    return {
      id: record.id,
      type: 'EVENT' as const,
      title: record.title,
      summary: record.description,
      location: {
        name: record.locationName,
        latitude: record.latitude ?? undefined,
        longitude: record.longitude ?? undefined,
      },
      publishedAt: record.startAt,
      source: {
        name: record.sourceId,
        url: record.sourceUrl,
        isMock: false,
      },
      metadata: {
        startAt: record.startAt,
        endAt: record.endAt,
        venue: record.venue,
      },
    };
  }

  public async healthCheck(): Promise<boolean> {
    try {
      eventRepository.countEvents();
      return true;
    } catch {
      return false;
    }
  }
}

export const databaseEventSource = new DatabaseEventSource();
