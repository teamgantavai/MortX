/**
 * Centralized Production Configuration Module
 * Loads environment variables with sensible production defaults.
 */

export interface AppConfig {
  env: 'development' | 'production' | 'test';
  port: number;
  databasePath: string;
  redisUrl?: string;
  geminiApiKey: string;
  aiModel: string;
  aiTimeoutMs: number;
  aiMaxTokens: number;
  aiTemperature: number;
  /** News queries cached for 10 minutes (can break quickly) */
  cacheTtlNewsSeconds: number;
  /** Event queries cached for 30 minutes (change less frequently) */
  cacheTtlEventsSeconds: number;
  /** Govt alert queries cached for 5 minutes (may require fast invalidation) */
  cacheTtlAlertsSeconds: number;
  /** Price queries cached for 15 minutes */
  cacheTtlPricesSeconds: number;
  cacheTtlGeneralSeconds: number;
  cacheTtlStaticSeconds: number;
  rateLimitAnonymousPerMin: number;
  rateLimitAuthenticatedPerMin: number;
  retrievalMaxLimit: number;
  feedFetchTimeoutMs: number;
  maxQueryLength: number;
  /** Background ingestion interval in ms */
  ingestionIntervalNewsMs: number;
  ingestionIntervalEventsMs: number;
  ingestionIntervalAlertsMs: number;
  ingestionIntervalPricesMs: number;
  // ── Research Engine Budget ───────────────────────────────────────────────
  researchMaxSearchQueries: number;
  researchMaxResultsPerQuery: number;
  researchMaxSourcePages: number;
  researchMaxContentChars: number;
  researchMaxTimeMs: number;
  /** Cache TTL for research queries (shorter — results change fast) */
  cacheTtlResearchSeconds: number;
}

export const config: AppConfig = {
  env: (process.env.NODE_ENV as any) || 'development',
  port: parseInt(process.env.PORT || '5173', 10),
  databasePath: process.env.DATABASE_PATH || '',
  redisUrl: process.env.REDIS_URL,
  geminiApiKey: process.env.GEMINI_API_KEY || process.env.API_KEY || '',
  aiModel: process.env.AI_MODEL || 'gemini-1.5-flash',
  aiTimeoutMs: parseInt(process.env.AI_TIMEOUT_MS || '6000', 10),
  aiMaxTokens: parseInt(process.env.AI_MAX_TOKENS || '500', 10),
  aiTemperature: parseFloat(process.env.AI_TEMPERATURE || '0.1'),
  cacheTtlNewsSeconds: parseInt(process.env.CACHE_TTL_NEWS_SECONDS || '600', 10),      // 10 min
  cacheTtlEventsSeconds: parseInt(process.env.CACHE_TTL_EVENTS_SECONDS || '1800', 10), // 30 min
  cacheTtlAlertsSeconds: parseInt(process.env.CACHE_TTL_ALERTS_SECONDS || '300', 10),  // 5 min
  cacheTtlPricesSeconds: parseInt(process.env.CACHE_TTL_PRICES_SECONDS || '900', 10),  // 15 min
  cacheTtlGeneralSeconds: parseInt(process.env.CACHE_TTL_GENERAL_SECONDS || '300', 10),
  cacheTtlStaticSeconds: parseInt(process.env.CACHE_TTL_STATIC_SECONDS || '3600', 10),
  rateLimitAnonymousPerMin: parseInt(process.env.RATE_LIMIT_ANON_PER_MIN || '60', 10),
  rateLimitAuthenticatedPerMin: parseInt(process.env.RATE_LIMIT_AUTH_PER_MIN || '120', 10),
  retrievalMaxLimit: parseInt(process.env.RETRIEVAL_MAX_LIMIT || '25', 10),
  feedFetchTimeoutMs: parseInt(process.env.FEED_FETCH_TIMEOUT_MS || '5000', 10),
  maxQueryLength: parseInt(process.env.MAX_QUERY_LENGTH || '500', 10),
  ingestionIntervalNewsMs: parseInt(process.env.INGESTION_INTERVAL_NEWS_MS || '900000', 10),   // 15 min
  ingestionIntervalEventsMs: parseInt(process.env.INGESTION_INTERVAL_EVENTS_MS || '3600000', 10), // 1 hr
  ingestionIntervalAlertsMs: parseInt(process.env.INGESTION_INTERVAL_ALERTS_MS || '1800000', 10), // 30 min
  ingestionIntervalPricesMs: parseInt(process.env.INGESTION_INTERVAL_PRICES_MS || '14400000', 10), // 4 hr
  // Research engine budget
  researchMaxSearchQueries: parseInt(process.env.MAX_SEARCH_QUERIES || '4', 10),
  researchMaxResultsPerQuery: parseInt(process.env.MAX_SEARCH_RESULTS_PER_QUERY || '8', 10),
  researchMaxSourcePages: parseInt(process.env.MAX_SOURCE_PAGES || '8', 10),
  researchMaxContentChars: parseInt(process.env.MAX_CONTENT_PER_SOURCE_CHARS || '3000', 10),
  researchMaxTimeMs: parseInt(process.env.MAX_TOTAL_RESEARCH_TIME_MS || '25000', 10), // 25s
  cacheTtlResearchSeconds: parseInt(process.env.CACHE_TTL_RESEARCH_SECONDS || '120', 10), // 2 min
};
