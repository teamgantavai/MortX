import { StructuredQuery, QueryIntent } from '../ai/types';
import { DataSource, RetrievalItem, RetrievalParams } from './types';
import { resolveTimeRange } from './timeUtils';
import { validateCoordinates } from './geoUtils';
import { DatabaseNewsSource } from './sources/databaseNewsSource';
import { DatabaseEventSource } from './sources/databaseEventSource';
import { DatabaseAlertSource } from './sources/databaseAlertSource';
import { DatabasePriceSource } from './sources/databasePriceSource';
import { EvidenceItem, normalizeToEvidence } from './evidenceTypes';
import { evidenceRanker } from './evidenceRanker';

const DEFAULT_LIMIT_PER_INTENT = 8;

export interface LocalIntelligenceResult {
  intent: QueryIntent;
  retrievalPlan: QueryIntent[];
  status: 'SUCCESS' | 'PARTIAL' | 'EMPTY';
  evidence: EvidenceItem[];
  rawCount: number;
  sourcesUsed: string[];
  sourcesFailed: string[];
  timings: {
    totalMs: number;
    parallelFetchMs: number;
    rankAndFilterMs: number;
    intentTimings: Record<string, number>;
  };
  message?: string;
}

export class LocalIntelligenceRetrievalService {
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

  /**
   * Executes the retrieval plan in parallel across all specified local intelligence sources.
   * Concurrently fetches news, events, alerts, and prices, normalizes them into common evidence items,
   * performs cross-category deduplication, and deterministically ranks the findings.
   */
  public async retrieve(query: StructuredQuery): Promise<LocalIntelligenceResult> {
    const tStart = Date.now();

    if (!query || !query.intent) {
      throw new Error('Invalid query: intent is required for retrieval');
    }

    const implementedIntents: QueryIntent[] = [
      'LOCAL_NEWS',
      'LOCAL_EVENTS',
      'GOVERNMENT_ALERTS',
      'PRICE_SEARCH',
      'LOCAL_OVERVIEW',
      'MIXED_LOCAL',
    ];

    if (!implementedIntents.includes(query.intent)) {
      return {
        intent: query.intent,
        retrievalPlan: [query.intent],
        status: 'EMPTY',
        evidence: [],
        rawCount: 0,
        sourcesUsed: [],
        sourcesFailed: [],
        timings: {
          totalMs: Date.now() - tStart,
          parallelFetchMs: 0,
          rankAndFilterMs: 0,
          intentTimings: {},
        },
        message: `Retrieval for intent "${query.intent}" is not implemented yet in this step.`,
      };
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

    // Determine the retrieval plan
    const plan = this.resolvePlan(query);

    // Build common retrieval parameters
    const dateRange = resolveTimeRange(query.timeRange);
    const limit = plan.length > 1 ? DEFAULT_LIMIT_PER_INTENT : 20;

    const baseParams: Omit<RetrievalParams, 'intent' | 'category'> = {
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
      limit,
    };

    const sourcesUsed: string[] = [];
    const sourcesFailed: string[] = [];
    const intentTimings: Record<string, number> = {};

    // ── PARALLEL RETRIEVAL ──────────────────────────────────────────────────
    // Execute all plan sources concurrently with Promise.all
    const tFetchStart = Date.now();

    const fetchTasks = plan.map(async (intent) => {
      const source = this.sources.get(intent);
      if (!source) {
        sourcesFailed.push(intent);
        return [] as EvidenceItem[];
      }

      const tSourceStart = Date.now();
      try {
        const rawItems = await source.search({
          ...baseParams,
          intent,
          category: this.intentToCategory(intent),
        });

        intentTimings[intent] = Date.now() - tSourceStart;
        sourcesUsed.push(intent);

        // Normalize raw items to unified EvidenceItem format
        return rawItems.map((item) => normalizeToEvidence(item, this.intentToEvidenceType(intent)));
      } catch (err: any) {
        intentTimings[intent] = Date.now() - tSourceStart;
        sourcesFailed.push(intent);
        console.warn(`[LocalIntelligence] Source failed for intent ${intent}:`, err.message);
        return [] as EvidenceItem[];
      }
    });

    const nestedEvidence = await Promise.all(fetchTasks);
    const parallelFetchMs = Date.now() - tFetchStart;

    const rawEvidence = nestedEvidence.flat();
    const rawCount = rawEvidence.length;

    // ── RELEVANCE FILTERING, DEDUPLICATION & RANKING ────────────────────────
    const tRankStart = Date.now();
    const { rankedItems } = evidenceRanker.process(rawEvidence, query, {
      maxItems: plan.length > 1 ? 12 : 20,
    });
    const rankAndFilterMs = Date.now() - tRankStart;

    const totalMs = Date.now() - tStart;

    // Determine status
    let status: 'SUCCESS' | 'PARTIAL' | 'EMPTY' = 'SUCCESS';
    if (rankedItems.length === 0) {
      status = 'EMPTY';
    } else if (sourcesFailed.length > 0 && sourcesUsed.length > 0) {
      status = 'PARTIAL';
    }

    let message: string | undefined;
    if (rankedItems.length === 0) {
      message = this.emptyMessage(query, plan);
    } else if (status === 'PARTIAL') {
      message = `Results retrieved from ${sourcesUsed.join(', ')}. Some sources (${sourcesFailed.join(', ')}) were temporarily unavailable.`;
    }

    return {
      intent: query.intent,
      retrievalPlan: plan,
      status,
      evidence: rankedItems,
      rawCount,
      sourcesUsed,
      sourcesFailed,
      timings: {
        totalMs,
        parallelFetchMs,
        rankAndFilterMs,
        intentTimings,
      },
      message,
    };
  }

  private resolvePlan(query: StructuredQuery): QueryIntent[] {
    if (Array.isArray(query.retrievalPlan) && query.retrievalPlan.length > 0) {
      return query.retrievalPlan;
    }

    if (query.intent === 'LOCAL_OVERVIEW' || query.intent === 'MIXED_LOCAL') {
      return query.intents && query.intents.length > 0
        ? query.intents
        : ['LOCAL_NEWS', 'LOCAL_EVENTS', 'GOVERNMENT_ALERTS'];
    }

    if (query.intent === 'LOCAL_NEWS' || query.intent === 'LOCAL_EVENTS' || query.intent === 'GOVERNMENT_ALERTS') {
      return [query.intent];
    }

    return [query.intent];
  }

  private intentToCategory(intent: QueryIntent): any {
    switch (intent) {
      case 'LOCAL_NEWS': return 'NEWS';
      case 'LOCAL_EVENTS': return 'EVENTS';
      case 'GOVERNMENT_ALERTS': return 'GOVERNMENT_ALERT';
      case 'PRICE_SEARCH': return 'PRICE';
      default: return 'LOCAL';
    }
  }

  private intentToEvidenceType(intent: QueryIntent): 'NEWS' | 'EVENT' | 'GOVERNMENT_ALERT' | 'PRICE' {
    switch (intent) {
      case 'LOCAL_EVENTS': return 'EVENT';
      case 'GOVERNMENT_ALERTS': return 'GOVERNMENT_ALERT';
      case 'PRICE_SEARCH': return 'PRICE';
      default: return 'NEWS';
    }
  }

  private emptyMessage(query: StructuredQuery, plan: QueryIntent[]): string {
    if (query.intent === 'LOCAL_OVERVIEW') {
      return 'No local news, events, or government alerts found for the requested area and time.';
    }
    switch (query.intent) {
      case 'LOCAL_NEWS': return 'No local news found matching the specified criteria.';
      case 'LOCAL_EVENTS': return 'No events found matching the specified criteria.';
      case 'GOVERNMENT_ALERTS': return 'No government alerts found for the specified location or time period.';
      case 'PRICE_SEARCH':
        return query.product
          ? `I couldn't find a reliable current price for ${query.product} in the requested area.`
          : 'No price observations found matching the specified criteria.';
      default: return 'No results found.';
    }
  }
}

export const localIntelligenceRetrievalService = new LocalIntelligenceRetrievalService();
