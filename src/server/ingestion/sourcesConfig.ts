import { NewsSourceConfig } from './types';

const NOW = '2026-09-29T00:00:00.000Z';

// ─────────────────────────────────────────────────────────
// NEWS SOURCES (existing)
// ─────────────────────────────────────────────────────────
export const DEFAULT_NEWS_SOURCES: NewsSourceConfig[] = [
  {
    id: 'tribune-punjab',
    name: 'The Tribune India (Punjab Edition)',
    type: 'RSS',
    baseUrl: 'https://www.tribuneindia.com',
    feedUrl: 'https://www.tribuneindia.com/rss/feed?catSlug=punjab',
    enabled: true,
    language: 'en',
    region: 'Punjab',
    trustLevel: 'NEWS',
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'toi-punjab',
    name: 'Times of India (Punjab News)',
    type: 'RSS',
    baseUrl: 'https://timesofindia.indiatimes.com',
    feedUrl: 'https://timesofindia.indiatimes.com/rssfeeds/2183863.cms',
    enabled: true,
    language: 'en',
    region: 'Punjab',
    trustLevel: 'NEWS',
    createdAt: NOW,
    updatedAt: NOW,
  },
];

// ─────────────────────────────────────────────────────────
// EVENT SOURCES
// Prefer official organizer feeds and open civic calendars.
// Respect robots.txt and rate limits.
// ─────────────────────────────────────────────────────────
export const DEFAULT_EVENT_SOURCES: NewsSourceConfig[] = [
  {
    id: 'punjab-govt-events',
    name: 'Punjab Government Events & Programmes',
    type: 'RSS',
    baseUrl: 'https://punjab.gov.in',
    feedUrl: 'https://punjab.gov.in/rss/events',
    enabled: true,
    language: 'en',
    region: 'Punjab',
    trustLevel: 'OFFICIAL_EVENT_ORGANIZER',
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'chandigarh-events',
    name: 'Chandigarh Administration – Events',
    type: 'RSS',
    baseUrl: 'https://chandigarh.gov.in',
    feedUrl: 'https://chandigarh.gov.in/rss/events',
    enabled: true,
    language: 'en',
    region: 'Punjab',
    trustLevel: 'OFFICIAL_EVENT_ORGANIZER',
    createdAt: NOW,
    updatedAt: NOW,
  },
];

// ─────────────────────────────────────────────────────────
// GOVERNMENT / PUBLIC ALERT SOURCES
// Only official government feeds and open data portals.
// Never auto-scrape arbitrary sites.
// ─────────────────────────────────────────────────────────
export const DEFAULT_GOVERNMENT_SOURCES: NewsSourceConfig[] = [
  {
    id: 'punjab-govt-notices',
    name: 'Punjab Government – Public Notices',
    type: 'OFFICIAL_GOVERNMENT',
    baseUrl: 'https://punjab.gov.in',
    feedUrl: 'https://punjab.gov.in/rss/notifications',
    enabled: true,
    language: 'en',
    region: 'Punjab',
    trustLevel: 'OFFICIAL_GOVERNMENT',
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'imd-punjab-alerts',
    name: 'India Meteorological Department – Punjab Weather Alerts',
    type: 'RSS',
    baseUrl: 'https://mausam.imd.gov.in',
    feedUrl: 'https://mausam.imd.gov.in/rss/warnings.xml',
    enabled: true,
    language: 'en',
    region: 'Punjab',
    trustLevel: 'OFFICIAL_GOVERNMENT',
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'ndma-alerts',
    name: 'National Disaster Management Authority – Alerts',
    type: 'RSS',
    baseUrl: 'https://ndma.gov.in',
    feedUrl: 'https://ndma.gov.in/rss/alerts',
    enabled: true,
    language: 'en',
    region: 'India',
    trustLevel: 'OFFICIAL_GOVERNMENT',
    createdAt: NOW,
    updatedAt: NOW,
  },
];

// ─────────────────────────────────────────────────────────
// ALL SOURCES (used for initial seeding)
// ─────────────────────────────────────────────────────────
export const ALL_DEFAULT_SOURCES: NewsSourceConfig[] = [
  ...DEFAULT_NEWS_SOURCES,
  ...DEFAULT_EVENT_SOURCES,
  ...DEFAULT_GOVERNMENT_SOURCES,
];
