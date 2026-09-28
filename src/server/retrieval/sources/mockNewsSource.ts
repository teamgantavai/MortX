import { DataSource, RetrievalParams, RetrievalItem } from '../types';
import { calculateDistanceKm, LOCAL_COORDINATE_INDEX } from '../geoUtils';

/**
 * MOCK DATA SOURCE FOR LOCAL NEWS (DEVELOPMENT ONLY)
 *
 * NOTE: All data returned by this provider is synthetic mock data
 * created for testing the retrieval pipeline architecture.
 */
export class MockNewsSource implements DataSource<RetrievalItem> {
  public readonly name = 'MockNewsSource (Development Only)';

  private generateMockArticles(now: Date = new Date()): RetrievalItem[] {
    const today = new Date(now);
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const threeDaysAgo = new Date(now);
    threeDaysAgo.setDate(now.getDate() - 3);

    return [
      {
        id: 'mock-news-jal-01',
        type: 'NEWS',
        title: 'New Smart Traffic Light System Activated at BMC Chowk',
        summary: 'Jalandhar traffic police inaugurated automated sensor lights to alleviate peak-hour congestion at BMC Chowk.',
        location: {
          name: 'BMC Chowk, Jalandhar',
          latitude: 31.3260,
          longitude: 75.5762,
        },
        publishedAt: today.toISOString(),
        source: {
          name: 'Punjab Civic Express (Mock Source)',
          url: 'https://mock.aaspaas.local/news/traffic-bmc-chowk',
          isMock: true,
        },
        metadata: {
          category: 'Traffic',
          isMock: true,
        },
      },
      {
        id: 'mock-news-jal-02',
        type: 'NEWS',
        title: 'Model Town Market Sunday Food Festival Draws Thousands',
        summary: 'Local artisan bakers and regional street food vendors showcased Punjabi and organic cuisines at Model Town Market.',
        location: {
          name: 'Model Town, Jalandhar',
          latitude: 31.3060,
          longitude: 75.5840,
        },
        publishedAt: yesterday.toISOString(),
        source: {
          name: 'Doaba Chronicle (Mock Source)',
          url: 'https://mock.aaspaas.local/news/model-town-food-fest',
          isMock: true,
        },
        metadata: {
          category: 'Community',
          isMock: true,
        },
      },
      {
        id: 'mock-news-jal-03',
        type: 'NEWS',
        title: 'Municipal Corporation Announces Cleanliness Drive in Jalandhar West',
        summary: 'Special waste segregation and green canopy planting initiatives scheduled across 12 wards starting this weekend.',
        location: {
          name: 'Jalandhar West, Jalandhar',
          latitude: 31.3180,
          longitude: 75.5620,
        },
        publishedAt: today.toISOString(),
        source: {
          name: 'City Bulletin (Mock Source)',
          url: 'https://mock.aaspaas.local/news/mc-clean-drive',
          isMock: true,
        },
        metadata: {
          category: 'Civic',
          isMock: true,
        },
      },
      {
        id: 'mock-news-lud-01',
        type: 'NEWS',
        title: 'Ferozepur Road Elevated Highway Expansion Phase 2 Completed',
        summary: 'Commuters in Ludhiana experience 20-minute reduced travel times following the reopening of the flyover ramp.',
        location: {
          name: 'Ferozepur Road, Ludhiana',
          latitude: 30.9010,
          longitude: 75.8573,
        },
        publishedAt: yesterday.toISOString(),
        source: {
          name: 'Ludhiana Tribune (Mock Source)',
          url: 'https://mock.aaspaas.local/news/ferozepur-road-expansion',
          isMock: true,
        },
        metadata: {
          category: 'Infrastructure',
          isMock: true,
        },
      },
      {
        id: 'mock-news-amr-01',
        type: 'NEWS',
        title: 'Heritage Street Clean Energy Transition Completed in Amritsar',
        summary: 'Solar panels and battery storage now power 80% of pedestrian streetlights surrounding the Heritage corridor.',
        location: {
          name: 'Heritage Street, Amritsar',
          latitude: 31.6340,
          longitude: 74.8723,
        },
        publishedAt: threeDaysAgo.toISOString(),
        source: {
          name: 'Majha Daily (Mock Source)',
          url: 'https://mock.aaspaas.local/news/heritage-street-solar',
          isMock: true,
        },
        metadata: {
          category: 'Environment',
          isMock: true,
        },
      },
    ];
  }

  public async search(params: RetrievalParams): Promise<RetrievalItem[]> {
    const now = new Date();
    let articles = this.generateMockArticles(now);

    // 1. Filter by Date Range
    if (params.dateRange) {
      const { startDate, endDate } = params.dateRange;
      articles = articles.filter((art) => {
        const published = new Date(art.publishedAt);
        if (startDate && published < startDate) return false;
        if (endDate && published > endDate) return false;
        return true;
      });
    }

    // 2. Resolve query target coordinates & placeName
    let targetLat: number | undefined;
    let targetLon: number | undefined;
    let targetPlace: string | undefined;

    if (params.location) {
      if (params.location.latitude !== undefined && params.location.longitude !== undefined) {
        targetLat = Number(params.location.latitude);
        targetLon = Number(params.location.longitude);
      } else if (params.location.placeName) {
        targetPlace = params.location.placeName.toLowerCase();
        const coords = LOCAL_COORDINATE_INDEX[targetPlace];
        if (coords) {
          targetLat = coords.latitude;
          targetLon = coords.longitude;
        }
      }
    }

    const radiusKm = params.location?.radiusKm || 25; // Default 25km radius for local news

    // 3. Filter by location / distance
    if (targetLat !== undefined && targetLon !== undefined) {
      articles = articles
        .map((art) => {
          if (art.location.latitude !== undefined && art.location.longitude !== undefined) {
            const distance = calculateDistanceKm(
              targetLat!,
              targetLon!,
              art.location.latitude,
              art.location.longitude
            );
            return {
              ...art,
              location: {
                ...art.location,
                distanceKm: distance,
              },
            };
          }
          return art;
        })
        .filter((art) => {
          if (art.location.distanceKm !== undefined) {
            return art.location.distanceKm <= radiusKm;
          }
          return true;
        });
    } else if (targetPlace) {
      articles = articles.filter(
        (art) =>
          art.location.name.toLowerCase().includes(targetPlace!) ||
          art.title.toLowerCase().includes(targetPlace!) ||
          art.summary.toLowerCase().includes(targetPlace!)
      );
    }

    // 4. Filter by Keywords
    if (params.keywords && params.keywords.length > 0) {
      articles = articles.filter((art) => {
        const combined = `${art.title} ${art.summary} ${art.location.name}`.toLowerCase();
        return params.keywords.some((kw) => combined.includes(kw.toLowerCase()));
      });
    }

    if (params.limit && params.limit > 0) {
      articles = articles.slice(0, params.limit);
    }

    return articles;
  }

  public async getById(id: string): Promise<RetrievalItem | null> {
    const articles = this.generateMockArticles();
    return articles.find((a) => a.id === id) || null;
  }

  public async healthCheck(): Promise<boolean> {
    return true;
  }
}
