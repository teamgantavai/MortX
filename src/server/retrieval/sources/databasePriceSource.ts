import { DataSource, RetrievalParams, RetrievalItem } from '../types';
import { priceRepository } from '../../db/priceRepository';
import { sourceRepository } from '../../db/sourceRepository';
import { calculateDistanceKm, LOCAL_COORDINATE_INDEX } from '../geoUtils';
import { priceAnalysisService } from '../../price/priceAnalysisService';

export class DatabasePriceSource implements DataSource<RetrievalItem> {
  public readonly name = 'DatabasePriceSource';

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

    // Determine target product from keywords or filters
    let targetProduct = params.filters?.product;
    if (!targetProduct && params.keywords && params.keywords.length > 0) {
      // Find matching commodity keyword
      const commodityKeywords = [
        'tomato', 'onion', 'potato', 'wheat', 'rice', 'diesel', 'petrol',
        'milk', 'oil', 'sugar', 'cauliflower', 'ginger', 'garlic', 'cabbage',
        'carrot', 'peas', 'spinach', 'apple', 'banana', 'mango', 'vegetable'
      ];
      for (const kw of params.keywords) {
        const lowerKw = kw.toLowerCase();
        const match = commodityKeywords.find((c) => lowerKw.includes(c));
        if (match) {
          targetProduct = match;
          break;
        }
      }
    }

    // Search price observations from repository
    const records = priceRepository.searchPrices({
      product: targetProduct,
      market: params.filters?.market,
      locationName: targetPlace,
      latitude: targetLat,
      longitude: targetLon,
      radiusKm,
      startDate: params.dateRange?.startDate,
      endDate: params.dateRange?.endDate,
      category: params.filters?.category,
      limit: params.limit || 20,
    });

    const items: RetrievalItem[] = [];

    for (const rec of records) {
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

      // Deterministic freshness evaluation
      const freshness = priceAnalysisService.determineFreshness(rec.observedAt);

      // Historical comparison lookup (look for observation ~7 days prior to this observation)
      const obsDate = new Date(rec.observedAt);
      const priorDate = new Date(obsDate.getTime() - 24 * 60 * 60 * 1000); // anything before yesterday
      const historicalRec = priceRepository.getHistoricalPrice(rec.productName, priorDate, {
        market: rec.market,
        unit: rec.unit,
      });

      const comparison = priceAnalysisService.calculateComparison(rec, historicalRec);

      const changeText = comparison.direction !== 'UNKNOWN' && comparison.change !== null && comparison.change !== undefined
        ? ` (${comparison.change >= 0 ? '+' : ''}₹${comparison.change}/${rec.unit} vs last week, ${comparison.direction})`
        : '';

      const summary = `Price of ${rec.productName} is ₹${rec.price} per ${rec.unit} at ${rec.market} in ${rec.locationName} (observed ${rec.observedAt.slice(0, 10)}, freshness: ${freshness})${changeText}.`;

      items.push({
        id: rec.id,
        type: 'PRICE' as any,
        title: `${rec.productName}: ₹${rec.price}/${rec.unit} at ${rec.market}`,
        summary,
        location: {
          name: `${rec.market}, ${rec.locationName}`,
          latitude: rec.latitude ?? undefined,
          longitude: rec.longitude ?? undefined,
          distanceKm,
        },
        publishedAt: rec.observedAt,
        source: {
          name: sourceName,
          url: rec.sourceUrl || '',
          isMock: false,
          trustLevel: sourceConfig?.trustLevel || 'OFFICIAL_GOVERNMENT',
        },
        metadata: {
          productName: rec.productName,
          category: rec.category,
          price: rec.price,
          unit: rec.unit,
          currency: rec.currency,
          market: rec.market,
          observedAt: rec.observedAt,
          freshness,
          comparison,
          rawRecord: rec,
        },
      });
    }

    return items;
  }

  public async getById(id: string): Promise<RetrievalItem | null> {
    const record = priceRepository.getById(id);
    if (!record) return null;

    const sourceConfig = sourceRepository.getSourceById(record.sourceId);
    const sourceName = sourceConfig?.name || record.sourceId;

    return {
      id: record.id,
      type: 'PRICE' as any,
      title: `${record.productName}: ₹${record.price}/${record.unit} at ${record.market}`,
      summary: `Price of ${record.productName} is ₹${record.price} per ${record.unit} at ${record.market}`,
      location: {
        name: `${record.market}, ${record.locationName}`,
        latitude: record.latitude ?? undefined,
        longitude: record.longitude ?? undefined,
      },
      publishedAt: record.observedAt,
      source: {
        name: sourceName,
        url: record.sourceUrl || '',
        isMock: false,
        trustLevel: sourceConfig?.trustLevel || 'OFFICIAL_GOVERNMENT',
      },
      metadata: {
        productName: record.productName,
        category: record.category,
        price: record.price,
        unit: record.unit,
        currency: record.currency,
        market: record.market,
        observedAt: record.observedAt,
        rawRecord: record,
      },
    };
  }

  public async healthCheck(): Promise<boolean> {
    try {
      priceRepository.countPrices();
      return true;
    } catch {
      return false;
    }
  }
}

export const databasePriceSource = new DatabasePriceSource();
