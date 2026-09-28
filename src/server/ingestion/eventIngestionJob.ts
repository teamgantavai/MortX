import crypto from 'node:crypto';
import { sourceRepository } from '../db/sourceRepository';
import { eventRepository } from '../db/eventRepository';
import { feedFetcher } from './feedFetcher';
import { locationExtractor } from './locationExtractor';
import { sourceCircuitBreaker } from './circuitBreaker';
import { DEFAULT_EVENT_SOURCES } from './sourcesConfig';
import {
  NewsSourceConfig,
  EventRecord,
  IngestionJobStats,
  IngestionResult,
} from './types';

export class EventIngestionService {
  public initializeSources(): void {
    for (const source of DEFAULT_EVENT_SOURCES) {
      sourceRepository.upsertSource(source);
    }
  }

  public async ingestEvents(options?: { sources?: NewsSourceConfig[]; timeoutMs?: number }): Promise<IngestionJobStats> {
    const startedAt = new Date().toISOString();
    let sources = options?.sources;
    if (!sources || sources.length === 0) {
      this.initializeSources();
      sources = sourceRepository.getEnabledSources().filter(
        (s) => s.trustLevel === 'OFFICIAL_EVENT_ORGANIZER' || s.type === 'API'
      );
      // Fallback: if no event-specific sources exist yet, use all enabled sources
      if (sources.length === 0) {
        sources = DEFAULT_EVENT_SOURCES;
        for (const s of sources) sourceRepository.upsertSource(s);
      }
    }

    let totalInserted = 0;
    let totalDuplicates = 0;
    let successfulSources = 0;
    let failedSources = 0;
    const sourceResults: IngestionResult[] = [];

    for (const source of sources) {
      const result = await this.ingestSingleEventSource(source, options?.timeoutMs);
      sourceResults.push(result);
      if (result.success) {
        successfulSources++;
        totalInserted += result.itemsInserted;
        totalDuplicates += result.itemsDuplicate;
      } else {
        failedSources++;
      }
    }

    return {
      startedAt,
      completedAt: new Date().toISOString(),
      totalSources: sources.length,
      successfulSources,
      failedSources,
      totalInserted,
      totalDuplicates,
      sourceResults,
    };
  }

  public async ingestSingleEventSource(
    source: NewsSourceConfig,
    timeoutMs?: number
  ): Promise<IngestionResult> {
    if (!sourceCircuitBreaker.canAttempt(source.id)) {
      return {
        sourceId: source.id,
        sourceName: source.name,
        success: false,
        itemsFetched: 0,
        itemsInserted: 0,
        itemsDuplicate: 0,
        error: `Circuit breaker OPEN: source "${source.name}" temporarily skipped`,
      };
    }

    try {
      const rawItems = await feedFetcher.fetchSource(source, { timeoutMs });
      sourceCircuitBreaker.recordSuccess(source.id);

      let itemsInserted = 0;
      let itemsDuplicate = 0;
      const now = new Date().toISOString();

      for (const raw of rawItems) {
        // Extract location from title/description
        const location = locationExtractor.extract(raw.title, raw.description || '', source.region);

        // Resolve startAt from the feed item's pubDate or startDate
        const startAt = raw.startDate
          ? new Date(raw.startDate).toISOString()
          : raw.pubDate
          ? new Date(raw.pubDate).toISOString()
          : now;

        const endAt = raw.endDate ? new Date(raw.endDate).toISOString() : null;

        // Normalize title/description
        const title = (raw.title || '').slice(0, 300).trim();
        const description = (raw.description || raw.title || '').replace(/<[^>]+>/g, ' ').slice(0, 1000).trim();

        if (!title) continue;

        const contentHash = crypto
          .createHash('sha256')
          .update(`${title}|${startAt}|${source.id}`)
          .digest('hex');

        const id = `evt-${crypto.createHash('md5').update(raw.link || contentHash).digest('hex').slice(0, 16)}`;

        const record: EventRecord = {
          id,
          title,
          description,
          startAt,
          endAt,
          venue: raw.venue || null,
          locationName: location.name,
          latitude: location.latitude ?? null,
          longitude: location.longitude ?? null,
          sourceId: source.id,
          sourceUrl: raw.link || source.baseUrl,
          contentHash,
          status: 'active',
          createdAt: now,
          updatedAt: now,
        };

        const inserted = eventRepository.insertEvent(record);
        if (inserted) {
          itemsInserted++;
        } else {
          itemsDuplicate++;
        }
      }

      sourceRepository.updateLastFetched(source.id, now);

      return {
        sourceId: source.id,
        sourceName: source.name,
        success: true,
        itemsFetched: rawItems.length,
        itemsInserted,
        itemsDuplicate,
      };
    } catch (err: any) {
      sourceCircuitBreaker.recordFailure(source.id);
      console.warn(`[EventIngester] Failed to ingest from source "${source.name}":`, err.message);
      return {
        sourceId: source.id,
        sourceName: source.name,
        success: false,
        itemsFetched: 0,
        itemsInserted: 0,
        itemsDuplicate: 0,
        error: err.message || 'Unknown event ingestion error',
      };
    }
  }
}

export const eventIngestionService = new EventIngestionService();
