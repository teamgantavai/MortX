import crypto from 'node:crypto';
import { sourceRepository } from '../db/sourceRepository';
import { articleRepository } from '../db/articleRepository';
import { feedFetcher } from './feedFetcher';
import { articleNormalizer } from './normalizer';
import { locationExtractor } from './locationExtractor';
import { articleCategorizer } from './categorizer';
import { DEFAULT_NEWS_SOURCES } from './sourcesConfig';
import { sourceCircuitBreaker } from './circuitBreaker';
import {
  NewsSourceConfig,
  NewsArticleRecord,
  IngestionJobStats,
  IngestionResult,
} from './types';

export interface IngestionOptions {
  sources?: NewsSourceConfig[];
  timeoutMs?: number;
}

export class NewsIngestionService {
  /**
   * Initializes default sources in the database if not present.
   */
  public initializeSources(): void {
    for (const source of DEFAULT_NEWS_SOURCES) {
      sourceRepository.upsertSource(source);
    }
  }

  /**
   * Main ingestion job: fetches all enabled sources, normalizes, extracts location,
   * categorizes, deduplicates, and saves records into SQLite.
   */
  public async ingestNews(options?: IngestionOptions): Promise<IngestionJobStats> {
    const startedAt = new Date().toISOString();

    // 1. Load enabled sources
    let sources = options?.sources;
    if (!sources || sources.length === 0) {
      this.initializeSources();
      sources = sourceRepository.getEnabledSources();
    }

    const sourceResults: IngestionResult[] = [];
    let totalInserted = 0;
    let totalDuplicates = 0;
    let successfulSources = 0;
    let failedSources = 0;

    for (const source of sources) {
      const result = await this.ingestSingleSource(source, options?.timeoutMs);
      sourceResults.push(result);

      if (result.success) {
        successfulSources++;
        totalInserted += result.itemsInserted;
        totalDuplicates += result.itemsDuplicate;
      } else {
        failedSources++;
      }
    }

    const completedAt = new Date().toISOString();

    return {
      startedAt,
      completedAt,
      totalSources: sources.length,
      successfulSources,
      failedSources,
      totalInserted,
      totalDuplicates,
      sourceResults,
    };
  }

  /**
   * Ingest a single source. Continues processing without failing entire job.
   */
  public async ingestSingleSource(
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
        error: `Circuit breaker OPEN: source "${source.name}" temporarily skipped due to repeated failures`,
      };
    }

    try {
      // 2. Fetch feed
      const rawItems = await feedFetcher.fetchSource(source, { timeoutMs });
      sourceCircuitBreaker.recordSuccess(source.id);

      let itemsInserted = 0;
      let itemsDuplicate = 0;
      const now = new Date().toISOString();

      // Process each raw item
      for (const raw of rawItems) {
        // 3. Normalize item
        const normalized = articleNormalizer.normalize(raw, source);

        // 4. Extract location
        const location = locationExtractor.extract(
          normalized.title,
          normalized.description,
          source.region
        );

        // 5. Categorize
        const category = articleCategorizer.categorize(
          normalized.title,
          normalized.description,
          normalized.rawCategories
        );

        // 6. Compute content hash for deduplication
        const contentHash = articleNormalizer.computeContentHash(
          normalized.title,
          normalized.description
        );

        // Deterministic ID based on article URL or hash
        const id = `art-${crypto.createHash('md5').update(normalized.url || contentHash).digest('hex').slice(0, 16)}`;

        const record: NewsArticleRecord = {
          id,
          title: normalized.title,
          description: normalized.description,
          sourceId: source.id,
          sourceUrl: source.baseUrl,
          articleUrl: normalized.url,
          publishedAt: normalized.publishedAt,
          firstSeenAt: now,
          lastSeenAt: now,
          locationName: location.name,
          latitude: location.latitude,
          longitude: location.longitude,
          category,
          language: normalized.language,
          contentHash,
          status: 'active',
          createdAt: now,
          updatedAt: now,
        };

        // 7. Store / Deduplicate
        const inserted = articleRepository.insertArticle(record);
        if (inserted) {
          itemsInserted++;
        } else {
          itemsDuplicate++;
        }
      }

      // 8. Update lastFetchedAt on source
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
      console.warn(`[NewsIngester] Failed to ingest from source "${source.name}":`, err.message);
      return {
        sourceId: source.id,
        sourceName: source.name,
        success: false,
        itemsFetched: 0,
        itemsInserted: 0,
        itemsDuplicate: 0,
        error: err.message || 'Unknown ingestion error',
      };
    }
  }
}

export const newsIngestionService = new NewsIngestionService();
