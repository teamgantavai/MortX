import crypto from 'node:crypto';
import { sourceRepository } from '../db/sourceRepository';
import { alertRepository } from '../db/alertRepository';
import { feedFetcher } from './feedFetcher';
import { locationExtractor } from './locationExtractor';
import { sourceCircuitBreaker } from './circuitBreaker';
import { DEFAULT_GOVERNMENT_SOURCES } from './sourcesConfig';
import {
  NewsSourceConfig,
  GovernmentAlertRecord,
  AlertCategory,
  IngestionJobStats,
  IngestionResult,
} from './types';

/**
 * Infers an alert category from text keywords.
 * Defaults to GENERAL.
 */
function classifyAlertCategory(text: string): AlertCategory {
  const lower = text.toLowerCase();
  if (/health|hospital|covid|vaccine|disease|medical/.test(lower)) return 'HEALTH';
  if (/road|traffic|highway|bridge|transport|bus|train/.test(lower)) return 'TRANSPORT';
  if (/school|college|university|exam|education/.test(lower)) return 'EDUCATION';
  if (/rain|flood|storm|cyclone|earthquake|weather/.test(lower)) return 'WEATHER';
  if (/security|curfew|restriction|law|police|army|paramilitary/.test(lower)) return 'SECURITY';
  if (/tender|water|electricity|power|maintenance|civic/.test(lower)) return 'CIVIC';
  return 'GENERAL';
}

/**
 * Attempts to extract a department name from a source name or text.
 */
function extractDepartment(source: NewsSourceConfig, text: string): string {
  // If the source name contains a dept reference, use it
  if (source.trustLevel === 'OFFICIAL_GOVERNMENT') {
    return source.name;
  }
  // Try to detect a department reference in the title text
  const deptMatch = text.match(/(?:by|from|issued by|notice by)\s+([A-Z][a-zA-Z\s]{3,40})/);
  if (deptMatch) return deptMatch[1].trim();
  return source.name;
}

export class AlertIngestionService {
  public initializeSources(): void {
    for (const source of DEFAULT_GOVERNMENT_SOURCES) {
      sourceRepository.upsertSource(source);
    }
  }

  public async ingestAlerts(options?: { sources?: NewsSourceConfig[]; timeoutMs?: number }): Promise<IngestionJobStats> {
    const startedAt = new Date().toISOString();
    let sources = options?.sources;
    if (!sources || sources.length === 0) {
      this.initializeSources();
      // Prefer official government and public-dataset sources for alerts
      sources = sourceRepository.getEnabledSources().filter(
        (s) => s.trustLevel === 'OFFICIAL_GOVERNMENT' || s.trustLevel === 'PUBLIC_DATASET'
      );
      if (sources.length === 0) {
        sources = DEFAULT_GOVERNMENT_SOURCES;
        for (const s of sources) sourceRepository.upsertSource(s);
      }
    }

    let totalInserted = 0;
    let totalDuplicates = 0;
    let successfulSources = 0;
    let failedSources = 0;
    const sourceResults: IngestionResult[] = [];

    for (const source of sources) {
      const result = await this.ingestSingleAlertSource(source, options?.timeoutMs);
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

  public async ingestSingleAlertSource(
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
        const title = (raw.title || '').slice(0, 300).trim();
        const description = (raw.description || raw.title || '').replace(/<[^>]+>/g, ' ').slice(0, 1000).trim();
        if (!title) continue;

        const location = locationExtractor.extract(title, description, source.region);
        const publishedAt = raw.pubDate ? new Date(raw.pubDate).toISOString() : now;
        const effectiveFrom = raw.effectiveFrom ? new Date(raw.effectiveFrom).toISOString() : publishedAt;
        const effectiveUntil = raw.effectiveUntil ? new Date(raw.effectiveUntil).toISOString() : null;
        const department = raw.department || extractDepartment(source, title);
        const category = classifyAlertCategory(`${title} ${description}`);

        const contentHash = crypto
          .createHash('sha256')
          .update(`${title}|${department}|${publishedAt}|${source.id}`)
          .digest('hex');

        const id = `alrt-${crypto.createHash('md5').update(raw.link || contentHash).digest('hex').slice(0, 16)}`;

        const record: GovernmentAlertRecord = {
          id,
          title,
          description,
          department,
          publishedAt,
          effectiveFrom,
          effectiveUntil,
          locationName: location.name,
          latitude: location.latitude ?? null,
          longitude: location.longitude ?? null,
          category,
          sourceId: source.id,
          sourceUrl: raw.link || source.baseUrl,
          contentHash,
          status: 'active',
          createdAt: now,
          updatedAt: now,
        };

        const inserted = alertRepository.insertAlert(record);
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
      console.warn(`[AlertIngester] Failed to ingest from source "${source.name}":`, err.message);
      return {
        sourceId: source.id,
        sourceName: source.name,
        success: false,
        itemsFetched: 0,
        itemsInserted: 0,
        itemsDuplicate: 0,
        error: err.message || 'Unknown alert ingestion error',
      };
    }
  }
}

export const alertIngestionService = new AlertIngestionService();
