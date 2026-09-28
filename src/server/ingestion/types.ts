// ─────────────────────────────────────────────────────────
// SOURCE TYPES
// ─────────────────────────────────────────────────────────

export type SourceType = 'RSS' | 'ATOM' | 'API' | 'WEB' | 'OFFICIAL_GOVERNMENT';

/**
 * Configurable trust level for a source.
 * - OFFICIAL_GOVERNMENT: verified govt dept feeds/APIs
 * - OFFICIAL_EVENT_ORGANIZER: official ticketing / civic calendar
 * - NEWS: established regional news outlets (default)
 * - PUBLIC_DATASET: open data portals
 */
export type SourceTrustLevel =
  | 'OFFICIAL_GOVERNMENT'
  | 'OFFICIAL_EVENT_ORGANIZER'
  | 'NEWS'
  | 'PUBLIC_DATASET';

export type ArticleCategory =
  | 'NEWS'
  | 'TRAFFIC'
  | 'CRIME'
  | 'GOVERNMENT'
  | 'EDUCATION'
  | 'EVENT'
  | 'OTHER';

export type AlertCategory =
  | 'HEALTH'
  | 'TRANSPORT'
  | 'EDUCATION'
  | 'WEATHER'
  | 'SECURITY'
  | 'CIVIC'
  | 'GENERAL';

// ─────────────────────────────────────────────────────────
// SOURCE CONFIG
// ─────────────────────────────────────────────────────────

export interface NewsSourceConfig {
  id: string;
  name: string;
  type: SourceType;
  baseUrl: string;
  feedUrl: string;
  enabled: boolean;
  language: string;
  region: string;
  trustLevel?: SourceTrustLevel;
  lastFetchedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────────────────
// RAW FEED
// ─────────────────────────────────────────────────────────

export interface RawFeedItem {
  guid?: string;
  title: string;
  link: string;
  description?: string;
  pubDate?: string;
  author?: string;
  categories?: string[];
  /** Extra fields from structured feeds */
  startDate?: string;
  endDate?: string;
  venue?: string;
  department?: string;
  effectiveFrom?: string;
  effectiveUntil?: string;
}

export interface NormalizedArticle {
  title: string;
  description: string;
  url: string;
  sourceId: string;
  sourceName: string;
  sourceUrl: string;
  publishedAt: string; // ISO 8601
  language: string;
  rawCategories?: string[];
}

export interface ExtractedLocation {
  city?: string;
  locality?: string;
  name: string;
  latitude?: number;
  longitude?: number;
}

// ─────────────────────────────────────────────────────────
// DATABASE RECORDS
// ─────────────────────────────────────────────────────────

export interface NewsArticleRecord {
  id: string;
  title: string;
  description: string;
  sourceId: string;
  sourceUrl: string;
  articleUrl: string;
  publishedAt: string;
  firstSeenAt: string;
  lastSeenAt: string;
  locationName: string;
  latitude?: number | null;
  longitude?: number | null;
  category: ArticleCategory;
  language: string;
  contentHash: string;
  status: 'active' | 'archived' | 'flagged';
  createdAt: string;
  updatedAt: string;
}

export interface EventRecord {
  id: string;
  title: string;
  description: string;
  startAt: string;
  endAt?: string | null;
  venue?: string | null;
  locationName: string;
  latitude?: number | null;
  longitude?: number | null;
  sourceId: string;
  sourceUrl: string;
  contentHash: string;
  status: 'active' | 'cancelled' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export interface GovernmentAlertRecord {
  id: string;
  title: string;
  description: string;
  department: string;
  publishedAt: string;
  effectiveFrom?: string | null;
  effectiveUntil?: string | null;
  locationName: string;
  latitude?: number | null;
  longitude?: number | null;
  category: AlertCategory;
  sourceId: string;
  sourceUrl: string;
  contentHash: string;
  status: 'active' | 'expired' | 'archived';
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────────────────
// INGESTION JOB STATS
// ─────────────────────────────────────────────────────────

export interface IngestionResult {
  sourceId: string;
  sourceName: string;
  success: boolean;
  itemsFetched: number;
  itemsInserted: number;
  itemsDuplicate: number;
  error?: string;
}

export interface IngestionJobStats {
  startedAt: string;
  completedAt: string;
  totalSources: number;
  successfulSources: number;
  failedSources: number;
  totalInserted: number;
  totalDuplicates: number;
  sourceResults: IngestionResult[];
}
