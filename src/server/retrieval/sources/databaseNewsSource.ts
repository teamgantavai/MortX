import { DataSource, RetrievalParams, RetrievalItem } from '../types';
import { articleRepository } from '../../db/articleRepository';
import { sourceRepository } from '../../db/sourceRepository';
import { calculateDistanceKm, LOCAL_COORDINATE_INDEX } from '../geoUtils';
import { MockNewsSource } from './mockNewsSource';


export class DatabaseNewsSource implements DataSource<RetrievalItem> {
  public readonly name = 'DatabaseNewsSource';

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

    const totalCount = articleRepository.countArticles();
    if (totalCount === 0) {
      // Fallback to MockNewsSource for initial development if database is empty
      const mockSource = new MockNewsSource();
      return mockSource.search(params);
    }

    const radiusKm = params.location?.radiusKm || 30;

    // Query SQLite database
    const records = articleRepository.searchArticles({
      locationName: targetPlace,
      latitude: targetLat,
      longitude: targetLon,
      radiusKm,
      startDate: params.dateRange?.startDate,
      endDate: params.dateRange?.endDate,
      keywords: params.keywords,
      limit: params.limit || 20,
    });

    // Map database records to standardized RetrievalItem format
    return records.map((rec) => {
      let distanceKm: number | undefined;
      if (
        targetLat !== undefined &&
        targetLon !== undefined &&
        rec.latitude !== null &&
        rec.latitude !== undefined &&
        rec.longitude !== null &&
        rec.longitude !== undefined
      ) {
        distanceKm = calculateDistanceKm(targetLat, targetLon, rec.latitude, rec.longitude);
      }

      // Lookup source name if available
      const sourceConfig = sourceRepository.getSourceById(rec.sourceId);
      const sourceName = sourceConfig?.name || rec.sourceId;

      return {
        id: rec.id,
        type: 'NEWS',
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
          url: rec.articleUrl || rec.sourceUrl,
          isMock: false,
        },
        metadata: {
          category: rec.category,
          sourceId: rec.sourceId,
          contentHash: rec.contentHash,
        },
      };
    });
  }

  public async getById(id: string): Promise<RetrievalItem | null> {
    const record = articleRepository.findByUrl(id);
    if (!record) return null;

    return {
      id: record.id,
      type: 'NEWS',
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
        url: record.articleUrl,
        isMock: false,
      },
      metadata: {
        category: record.category,
      },
    };
  }

  public async healthCheck(): Promise<boolean> {
    try {
      articleRepository.countArticles();
      return true;
    } catch {
      return false;
    }
  }
}

export const databaseNewsSource = new DatabaseNewsSource();
