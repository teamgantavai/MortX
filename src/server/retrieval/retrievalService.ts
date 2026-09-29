import { StructuredQuery, QueryIntent } from '../ai/types';
import { DataSource, RetrievalItem, RetrievalParams, RetrievalResult } from './types';
import { resolveTimeRange } from './timeUtils';
import { validateCoordinates } from './geoUtils';
import { DatabaseNewsSource } from './sources/databaseNewsSource';
import { DatabaseEventSource } from './sources/databaseEventSource';
import { DatabaseAlertSource } from './sources/databaseAlertSource';
import { DatabasePriceSource } from './sources/databasePriceSource';
import { localIntelligenceRetrievalService } from './localIntelligenceRetrievalService';

/** Max items per intent when running multi-category MIXED_LOCAL retrieval */
const MIXED_LIMIT_PER_INTENT = 8;

export class RetrievalService {
  private sources: Map<QueryIntent, DataSource<RetrievalItem>> = new Map();

  constructor() {
    this.registerSource('LOCAL_NEWS', new DatabaseNewsSource());
    this.registerSource('LOCAL_EVENTS', new DatabaseEventSource());
    this.registerSource('GOVERNMENT_ALERTS', new DatabaseAlertSource());
    this.registerSource('PRICE_SEARCH', new DatabasePriceSource());
  }

  public registerSource(intent: QueryIntent, source: DataSource<RetrievalItem>): void {
    this.sources.set(intent, source);
  }

  public async retrieve(query: StructuredQuery): Promise<RetrievalResult> {
    if (!query || !query.intent) {
      throw new Error('Invalid query: intent is required for retrieval');
    }

    // Geographic validation
    if (query.location) {
      const { valid, error } = validateCoordinates(
        query.location.latitude,
        query.location.longitude
      );
      if (!valid) {
        throw new Error(`Coordinate validation failed: ${error}`);
      }
    }

    // ── LOCAL_OVERVIEW / MIXED_LOCAL: run parallel retrieval across plan ──────
    if (query.intent === 'LOCAL_OVERVIEW' || query.intent === 'MIXED_LOCAL') {
      const overview = await localIntelligenceRetrievalService.retrieve(query);
      return {
        intent: query.intent,
        status: overview.status === 'EMPTY' ? 'EMPTY' : 'SUCCESS',
        items: overview.evidence.map((e: any) => ({
          id: e.id,
          type: e.type,
          title: e.title,
          summary: e.summary,
          location: e.location,
          publishedAt: e.publishedAt,
          source: e.source,
          metadata: e.metadata,
        })),
        total: overview.evidence.length,
        ...(overview.message ? { message: overview.message } : {}),
      };
    }

    // ── Single-intent dispatch ────────────────────────────────────────────────
    switch (query.intent) {
      case 'LOCAL_NEWS':
      case 'LOCAL_EVENTS':
      case 'GOVERNMENT_ALERTS':
      case 'PRICE_SEARCH': {
        const source = this.sources.get(query.intent);
        if (!source) {
          throw new Error(`No data source registered for ${query.intent}`);
        }

        const dateRange = resolveTimeRange(query.timeRange);
        const params: RetrievalParams = {
          intent: query.intent,
          category: query.category,
          keywords: query.keywords || [],
          location: query.location,
          timeRange: query.timeRange,
          dateRange,
          filters: {
            ...query.filters,
            product: query.product,
            comparison: query.comparison,
            unit: query.unit,
          },
        };

        const items = await source.search(params);

        return {
          intent: query.intent,
          status: items.length > 0 ? 'SUCCESS' : 'EMPTY',
          items,
          total: items.length,
          ...(items.length === 0
            ? { message: this.emptyMessage(query.intent) }
            : {}),
        };
      }

      case 'PG_SEARCH':
      case 'COLLEGE_SEARCH':
      case 'GENERAL_LOCAL_SEARCH': {
        return {
          intent: query.intent,
          status: 'NOT_IMPLEMENTED',
          message: `Retrieval for intent "${query.intent}" is not implemented yet in this step.`,
          items: [],
          total: 0,
        };
      }

      default: {
        return {
          intent: query.intent,
          status: 'NOT_IMPLEMENTED',
          message: `Intent "${query.intent}" does not require structured local retrieval.`,
          items: [],
          total: 0,
        };
      }
    }
  }

  /**
   * Executes LOCAL_NEWS, LOCAL_EVENTS, and GOVERNMENT_ALERTS concurrently and
   * merges results. Caps each intent at MIXED_LIMIT_PER_INTENT items to avoid
   * over-fetching.
   */
  private async retrieveMixed(query: StructuredQuery): Promise<RetrievalResult> {
    const dateRange = resolveTimeRange(query.timeRange);
    const baseParams: Omit<RetrievalParams, 'intent' | 'category'> = {
      keywords: query.keywords || [],
      location: query.location,
      timeRange: query.timeRange,
      dateRange,
      filters: query.filters,
      limit: MIXED_LIMIT_PER_INTENT,
    };

    // Determine which intents to fan out to
    const targetIntents: QueryIntent[] =
      query.intents && query.intents.length > 0
        ? query.intents.filter((i) => i !== 'MIXED_LOCAL')
        : ['LOCAL_NEWS', 'LOCAL_EVENTS', 'GOVERNMENT_ALERTS'];

    const tasks = targetIntents.map(async (intent) => {
      const source = this.sources.get(intent);
      if (!source) return [] as RetrievalItem[];

      try {
        return await source.search({
          ...baseParams,
          intent,
          category: this.intentToCategory(intent),
        });
      } catch {
        return [] as RetrievalItem[];
      }
    });

    const results = await Promise.all(tasks);
    const merged = results.flat();

    // Sort by publishedAt descending so newest content surfaces first
    merged.sort((a, b) => {
      const ta = new Date(a.publishedAt).getTime();
      const tb = new Date(b.publishedAt).getTime();
      return tb - ta;
    });

    return {
      intent: 'MIXED_LOCAL',
      status: merged.length > 0 ? 'SUCCESS' : 'EMPTY',
      items: merged,
      total: merged.length,
      ...(merged.length === 0
        ? { message: 'No local updates found matching the specified criteria.' }
        : {}),
    };
  }

  private intentToCategory(intent: QueryIntent): any {
    switch (intent) {
      case 'LOCAL_NEWS': return 'NEWS';
      case 'LOCAL_EVENTS': return 'EVENTS';
      case 'GOVERNMENT_ALERTS': return 'GOVERNMENT_ALERT';
      default: return 'LOCAL';
    }
  }

  private emptyMessage(intent: QueryIntent): string {
    switch (intent) {
      case 'LOCAL_NEWS': return 'No local news found matching the specified criteria.';
      case 'LOCAL_EVENTS': return 'No events found matching the specified criteria.';
      case 'GOVERNMENT_ALERTS': return 'No government alerts found for the specified location or time period.';
      default: return 'No results found.';
    }
  }
}

// Export singleton instance
export const defaultRetrievalService = new RetrievalService();
