import { NewsSourceConfig } from './types';

const NOW = '2026-09-29T00:00:00.000Z';

// ─────────────────────────────────────────────────────────
// NEWS SOURCES
// Only include sources with verified, publicly accessible RSS feeds.
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
  {
    // Hindustan Times Punjab – covers Jalandhar/Ludhiana/Amritsar
    id: 'ht-punjab',
    name: 'Hindustan Times (Punjab)',
    type: 'RSS',
    baseUrl: 'https://www.hindustantimes.com',
    feedUrl: 'https://www.hindustantimes.com/feeds/rss/cities/chandigarh/rssfeed.xml',
    enabled: true,
    language: 'en',
    region: 'Punjab',
    trustLevel: 'NEWS',
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    // NDTV India – covers all major Punjab cities
    id: 'ndtv-india',
    name: 'NDTV India',
    type: 'RSS',
    baseUrl: 'https://feeds.feedburner.com',
    feedUrl: 'https://feeds.feedburner.com/ndtvnews-india-news',
    enabled: true,
    language: 'en',
    region: 'India',
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
// NOTE: Event RSS feeds from gov.in portals do not expose machine-readable feeds.
// These sources are seeded for DB integrity but disabled until real feed URLs are confirmed.
export const DEFAULT_EVENT_SOURCES: NewsSourceConfig[] = [
  {
    id: 'punjab-govt-events',
    name: 'Punjab Government Events & Programmes',
    type: 'RSS',
    baseUrl: 'https://punjab.gov.in',
    feedUrl: 'https://punjab.gov.in/rss/events',
    enabled: false, // URL unverified — disable until confirmed
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
    enabled: false, // URL unverified — disable until confirmed
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
// NOTE: These government alert feeds are seeded for DB integrity but disabled
// until official RSS/Atom feed URLs can be verified.
export const DEFAULT_GOVERNMENT_SOURCES: NewsSourceConfig[] = [
  {
    id: 'punjab-govt-notices',
    name: 'Punjab Government – Public Notices',
    type: 'OFFICIAL_GOVERNMENT',
    baseUrl: 'https://punjab.gov.in',
    feedUrl: 'https://punjab.gov.in/rss/notifications',
    enabled: false, // URL unverified
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
    enabled: false, // URL unverified
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
    enabled: false, // URL unverified
    language: 'en',
    region: 'India',
    trustLevel: 'OFFICIAL_GOVERNMENT',
    createdAt: NOW,
    updatedAt: NOW,
  },
];

// ─────────────────────────────────────────────────────────
// PRICE SOURCES
// Official Mandi Board (Agmarknet/PSAMB) & verified APMC markets.
// ─────────────────────────────────────────────────────────
// NOTE: Price APIs (Agmarknet/Mandi Board) require registration/authentication
// and do not expose public RSS feeds. These are seeded for DB integrity
// but disabled until a verified data source or API key is configured.
export const DEFAULT_PRICE_SOURCES: NewsSourceConfig[] = [
  {
    id: 'punjab-mandi-board',
    name: 'Punjab State Agricultural Marketing Board (Mandi Board)',
    type: 'OFFICIAL_GOVERNMENT',
    baseUrl: 'https://mandiboard.nic.in',
    feedUrl: 'https://mandiboard.nic.in/api/daily-prices',
    enabled: false, // Requires auth/registration
    language: 'en',
    region: 'Punjab',
    trustLevel: 'OFFICIAL_GOVERNMENT',
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'maqsudan-apmc-jalandhar',
    name: 'Maqsudan APMC Wholesale Market Jalandhar',
    type: 'OFFICIAL_GOVERNMENT',
    baseUrl: 'https://agmarknet.gov.in',
    feedUrl: 'https://agmarknet.gov.in/api/jalandhar/prices',
    enabled: false, // URL unverified
    language: 'en',
    region: 'Punjab',
    trustLevel: 'OFFICIAL_GOVERNMENT',
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'model-town-market-jalandhar',
    name: 'Model Town Retail Market Association Jalandhar',
    type: 'WEB',
    baseUrl: 'https://jalandharmarket.org',
    feedUrl: 'https://jalandharmarket.org/retail/daily-rates',
    enabled: false, // URL unverified
    language: 'en',
    region: 'Punjab',
    trustLevel: 'PUBLIC_DATASET',
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
  ...DEFAULT_PRICE_SOURCES,
];

