import { PriceObservationRecord } from '../ingestion/types';

export type PriceFreshness = 'CURRENT' | 'RECENT' | 'STALE' | 'UNKNOWN';
export type PriceTrendDirection = 'INCREASED' | 'DECREASED' | 'STABLE' | 'UNKNOWN';

export interface PriceComparison {
  previousPrice?: number | null;
  previousObservedAt?: string | null;
  change?: number | null;
  percentage?: number | null;
  direction: PriceTrendDirection;
}

export interface StructuredPriceData {
  product: string;
  category?: string;
  current: {
    price: number;
    unit: string;
    currency: string;
    market: string;
    location: string;
    observedAt: string;
    freshness: PriceFreshness;
  };
  comparison?: PriceComparison | null;
  markets?: {
    market: string;
    price: number;
    unit: string;
    currency: string;
    location: string;
    observedAt: string;
    freshness: PriceFreshness;
    source: string;
  }[];
}

export class PriceAnalysisService {
  /**
   * Deterministically calculates price change and percentage in code.
   * Never delegates arithmetic to LLMs.
   */
  public calculateComparison(
    current: PriceObservationRecord,
    previous?: PriceObservationRecord | null
  ): PriceComparison {
    if (!previous || typeof previous.price !== 'number' || previous.price <= 0) {
      return {
        previousPrice: null,
        previousObservedAt: null,
        change: null,
        percentage: null,
        direction: 'UNKNOWN',
      };
    }

    const change = Number((current.price - previous.price).toFixed(2));
    const percentage = Number(((change / previous.price) * 100).toFixed(1));

    let direction: PriceTrendDirection = 'STABLE';
    if (change > 0) {
      direction = 'INCREASED';
    } else if (change < 0) {
      direction = 'DECREASED';
    } else {
      direction = 'STABLE';
    }

    return {
      previousPrice: previous.price,
      previousObservedAt: previous.observedAt,
      change,
      percentage: Math.abs(percentage),
      direction,
    };
  }

  public comparePrices(
    current: PriceObservationRecord,
    previous?: PriceObservationRecord | null
  ): PriceComparison {
    return this.calculateComparison(current, previous);
  }

  /**
   * Determines observation freshness based on timestamp:
   * - < 24 hours: CURRENT
   * - < 48 hours: RECENT
   * - > 48 hours: STALE
   */
  public determineFreshness(observedAt: string): PriceFreshness {
    const ts = new Date(observedAt).getTime();
    if (isNaN(ts)) return 'UNKNOWN';

    const diffHours = (Date.now() - ts) / (1000 * 60 * 60);
    if (diffHours <= 24) return 'CURRENT';
    if (diffHours <= 48) return 'RECENT';
    return 'STALE';
  }

  /**
   * Builds structured price payload for API and UI consumption
   */
  public buildStructuredPriceData(
    product: string,
    current: PriceObservationRecord,
    comparison?: PriceComparison | null,
    allMarketObservations?: PriceObservationRecord[]
  ): StructuredPriceData {
    const markets = (allMarketObservations || []).map((obs) => ({
      market: obs.market,
      price: obs.price,
      unit: obs.unit,
      currency: obs.currency || 'INR',
      location: obs.locationName,
      observedAt: obs.observedAt,
      freshness: this.determineFreshness(obs.observedAt),
      source: obs.sourceId,
    }));

    return {
      product: product.toLowerCase(),
      category: current.category,
      current: {
        price: current.price,
        unit: current.unit,
        currency: current.currency || 'INR',
        market: current.market,
        location: current.locationName,
        observedAt: current.observedAt,
        freshness: this.determineFreshness(current.observedAt),
      },
      comparison: comparison || null,
      markets: markets.length > 0 ? markets : undefined,
    };
  }
}

export const priceAnalysisService = new PriceAnalysisService();
