// ────────────────────────────────────────────────────────────────
// SOURCES TABLE
// ────────────────────────────────────────────────────────────────
export const CREATE_SOURCES_TABLE = `
CREATE TABLE IF NOT EXISTS sources (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  baseUrl TEXT NOT NULL,
  feedUrl TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1,
  language TEXT NOT NULL DEFAULT 'en',
  region TEXT NOT NULL DEFAULT 'Punjab',
  trustLevel TEXT NOT NULL DEFAULT 'NEWS',
  lastFetchedAt TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);
`;

/** Migration: safely add trustLevel to an existing sources table */
export const MIGRATE_SOURCES_TRUST_LEVEL = `
  ALTER TABLE sources ADD COLUMN trustLevel TEXT NOT NULL DEFAULT 'NEWS';
`;

// ────────────────────────────────────────────────────────────────
// NEWS ARTICLES TABLE
// ────────────────────────────────────────────────────────────────
export const CREATE_NEWS_ARTICLES_TABLE = `
CREATE TABLE IF NOT EXISTS news_articles (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  sourceId TEXT NOT NULL,
  sourceUrl TEXT NOT NULL,
  articleUrl TEXT NOT NULL,
  publishedAt TEXT NOT NULL,
  firstSeenAt TEXT NOT NULL,
  lastSeenAt TEXT NOT NULL,
  locationName TEXT NOT NULL,
  latitude REAL,
  longitude REAL,
  category TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'en',
  contentHash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  FOREIGN KEY (sourceId) REFERENCES sources(id)
);
`;

// ────────────────────────────────────────────────────────────────
// EVENTS TABLE
// ────────────────────────────────────────────────────────────────
export const CREATE_EVENTS_TABLE = `
CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  startAt TEXT NOT NULL,
  endAt TEXT,
  venue TEXT,
  locationName TEXT NOT NULL,
  latitude REAL,
  longitude REAL,
  sourceId TEXT NOT NULL,
  sourceUrl TEXT NOT NULL,
  contentHash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  FOREIGN KEY (sourceId) REFERENCES sources(id)
);
`;

// ────────────────────────────────────────────────────────────────
// GOVERNMENT ALERTS TABLE
// ────────────────────────────────────────────────────────────────
export const CREATE_GOVERNMENT_ALERTS_TABLE = `
CREATE TABLE IF NOT EXISTS government_alerts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  department TEXT NOT NULL,
  publishedAt TEXT NOT NULL,
  effectiveFrom TEXT,
  effectiveUntil TEXT,
  locationName TEXT NOT NULL,
  latitude REAL,
  longitude REAL,
  category TEXT NOT NULL DEFAULT 'GENERAL',
  sourceId TEXT NOT NULL,
  sourceUrl TEXT NOT NULL,
  contentHash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  FOREIGN KEY (sourceId) REFERENCES sources(id)
);
`;

// ────────────────────────────────────────────────────────────────
// INDEXES (all idempotent)
// ────────────────────────────────────────────────────────────────
export const CREATE_INDEXES = `
CREATE UNIQUE INDEX IF NOT EXISTS idx_news_articles_url ON news_articles(articleUrl);
CREATE UNIQUE INDEX IF NOT EXISTS idx_news_articles_hash ON news_articles(contentHash);
CREATE INDEX IF NOT EXISTS idx_news_articles_published ON news_articles(publishedAt DESC);
CREATE INDEX IF NOT EXISTS idx_news_articles_source ON news_articles(sourceId);
CREATE INDEX IF NOT EXISTS idx_news_articles_category ON news_articles(category);
CREATE INDEX IF NOT EXISTS idx_news_articles_location ON news_articles(locationName);
CREATE INDEX IF NOT EXISTS idx_news_articles_coords ON news_articles(latitude, longitude);
`;

export const CREATE_EVENTS_INDEXES = `
CREATE UNIQUE INDEX IF NOT EXISTS idx_events_hash ON events(contentHash);
CREATE INDEX IF NOT EXISTS idx_events_start ON events(startAt);
CREATE INDEX IF NOT EXISTS idx_events_end ON events(endAt);
CREATE INDEX IF NOT EXISTS idx_events_location ON events(locationName);
CREATE INDEX IF NOT EXISTS idx_events_coords ON events(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
`;

export const CREATE_ALERTS_INDEXES = `
CREATE UNIQUE INDEX IF NOT EXISTS idx_alerts_hash ON government_alerts(contentHash);
CREATE INDEX IF NOT EXISTS idx_alerts_published ON government_alerts(publishedAt DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_effective ON government_alerts(effectiveFrom, effectiveUntil);
CREATE INDEX IF NOT EXISTS idx_alerts_until ON government_alerts(effectiveUntil);
CREATE INDEX IF NOT EXISTS idx_alerts_location ON government_alerts(locationName);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON government_alerts(status);
`;

// ────────────────────────────────────────────────────────────────
// PRICE OBSERVATIONS TABLE
// ────────────────────────────────────────────────────────────────
export const CREATE_PRICE_OBSERVATIONS_TABLE = `
CREATE TABLE IF NOT EXISTS price_observations (
  id TEXT PRIMARY KEY,
  productName TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'VEGETABLE',
  price REAL NOT NULL,
  unit TEXT NOT NULL DEFAULT 'kg',
  currency TEXT NOT NULL DEFAULT 'INR',
  market TEXT NOT NULL,
  locationName TEXT NOT NULL,
  latitude REAL,
  longitude REAL,
  observedAt TEXT NOT NULL,
  sourceId TEXT NOT NULL,
  sourceUrl TEXT,
  contentHash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  FOREIGN KEY (sourceId) REFERENCES sources(id)
);
`;

export const CREATE_PRICE_INDEXES = `
CREATE UNIQUE INDEX IF NOT EXISTS idx_prices_hash ON price_observations(contentHash);
CREATE INDEX IF NOT EXISTS idx_prices_product ON price_observations(productName);
CREATE INDEX IF NOT EXISTS idx_prices_observed ON price_observations(observedAt DESC);
CREATE INDEX IF NOT EXISTS idx_prices_product_observed ON price_observations(productName, observedAt DESC);
CREATE INDEX IF NOT EXISTS idx_prices_market ON price_observations(market);
CREATE INDEX IF NOT EXISTS idx_prices_location ON price_observations(locationName);
CREATE INDEX IF NOT EXISTS idx_prices_source ON price_observations(sourceId);
CREATE INDEX IF NOT EXISTS idx_prices_status ON price_observations(status);
`;

