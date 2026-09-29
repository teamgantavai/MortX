import { DatabaseSync } from 'node:sqlite';
import { ALL_DEFAULT_SOURCES } from '../ingestion/sourcesConfig';
import { eventRepository } from './eventRepository';
import { alertRepository } from './alertRepository';
import { priceRepository } from './priceRepository';
import { GovernmentAlertRecord } from '../ingestion/types';

export function seedInitialDataIfNeeded(db: DatabaseSync): void {
  // 1. Seed default sources if missing
  const insertSourceStmt = db.prepare(`
    INSERT OR IGNORE INTO sources (
      id, name, type, baseUrl, feedUrl, enabled, language, region, trustLevel, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const src of ALL_DEFAULT_SOURCES) {
    insertSourceStmt.run(
      src.id,
      src.name,
      src.type,
      src.baseUrl,
      src.feedUrl,
      src.enabled ? 1 : 0,
      src.language,
      src.region,
      src.trustLevel || 'NEWS',
      src.createdAt,
      src.updatedAt
    );
  }

  const now = new Date();
  const nowIso = now.toISOString();

  // 2. Seed events if table is empty
  const countEventsStmt = db.prepare('SELECT count(*) as count FROM events');
  const eventCount = (countEventsStmt.get() as any)?.count || 0;

  if (eventCount === 0) {
    // Next weekend date calculation
    const sat = new Date(now);
    const day = sat.getDay();
    const daysToSat = (6 - day + 7) % 7 || 7;
    sat.setDate(sat.getDate() + daysToSat);
    sat.setHours(10, 0, 0, 0);

    const sun = new Date(sat);
    sun.setDate(sun.getDate() + 1);
    sun.setHours(18, 0, 0, 0);

    const nextFri = new Date(sat);
    nextFri.setDate(nextFri.getDate() - 1);
    nextFri.setHours(16, 0, 0, 0);

    const sampleEvents = [
      {
        id: 'evt-seed-1',
        title: 'Punjab Technology & Innovation Summit 2026',
        description: 'Annual gathering of tech leaders, university student innovators, and startup founders featuring AI showcases and robotics competitions.',
        startAt: sat.toISOString(),
        endAt: sun.toISOString(),
        venue: 'CT Group of Institutions Auditorium, Jalandhar',
        locationName: 'Jalandhar',
        latitude: 31.326,
        longitude: 75.5762,
        sourceId: 'punjab-govt-events',
        sourceUrl: 'https://punjab.gov.in/events/tech-summit-2026',
        contentHash: 'hash-seed-evt-1',
        status: 'active' as const,
        createdAt: nowIso,
        updatedAt: nowIso,
      },
      {
        id: 'evt-seed-2',
        title: 'District Cultural & Saras Craft Fair',
        description: 'Exhibition of regional handicrafts, folk dance performances, traditional Punjabi cuisine, and live pottery workshops.',
        startAt: nextFri.toISOString(),
        endAt: sun.toISOString(),
        venue: 'Model Town Ground, Jalandhar',
        locationName: 'Model Town, Jalandhar',
        latitude: 31.312,
        longitude: 75.584,
        sourceId: 'chandigarh-events',
        sourceUrl: 'https://chandigarh.gov.in/events/saras-fair',
        contentHash: 'hash-seed-evt-2',
        status: 'active' as const,
        createdAt: nowIso,
        updatedAt: nowIso,
      },
      {
        id: 'evt-seed-3',
        title: 'All-Punjab Inter-Collegiate Cricket Trophy',
        description: '16 university cricket teams competing for the annual state college championship trophy.',
        startAt: sat.toISOString(),
        endAt: sun.toISOString(),
        venue: 'Burlton Park Sports Complex, Jalandhar',
        locationName: 'Burlton Park, Jalandhar',
        latitude: 31.341,
        longitude: 75.568,
        sourceId: 'punjab-govt-events',
        sourceUrl: 'https://punjab.gov.in/events/cricket-championship',
        contentHash: 'hash-seed-evt-3',
        status: 'active' as const,
        createdAt: nowIso,
        updatedAt: nowIso,
      },
      {
        id: 'evt-seed-4',
        title: 'Ludhiana Startup & SME Business Expo',
        description: 'B2B networking event connecting regional manufacturers, e-commerce brands, and investors.',
        startAt: sat.toISOString(),
        endAt: sun.toISOString(),
        venue: 'Punjab Agricultural University (PAU) Grounds, Ludhiana',
        locationName: 'Ludhiana',
        latitude: 30.901,
        longitude: 75.8573,
        sourceId: 'chandigarh-events',
        sourceUrl: 'https://chandigarh.gov.in/events/ludhiana-sme-expo',
        contentHash: 'hash-seed-evt-4',
        status: 'active' as const,
        createdAt: nowIso,
        updatedAt: nowIso,
      },
    ];

    for (const evt of sampleEvents) {
      eventRepository.insertEvent(evt);
    }
  }

  // 3. Seed government alerts if table is empty
  const countAlertsStmt = db.prepare('SELECT count(*) as count FROM government_alerts');
  const alertCount = (countAlertsStmt.get() as any)?.count || 0;

  if (alertCount === 0) {
    const threeDaysLater = new Date(Date.now() + 3 * 86_400_000).toISOString();
    const oneWeekLater = new Date(Date.now() + 7 * 86_400_000).toISOString();

    const sampleAlerts: GovernmentAlertRecord[] = [
      {
        id: 'alert-seed-1',
        title: 'IMD Weather Advisory: Thunderstorms and Light Rain in Doaba Region',
        description: 'India Meteorological Department issues yellow advisory for Jalandhar and surrounding districts with intermittent rain and gusty winds.',
        department: 'India Meteorological Department (IMD)',
        publishedAt: nowIso,
        effectiveFrom: nowIso,
        effectiveUntil: threeDaysLater,
        locationName: 'Jalandhar',
        latitude: 31.326,
        longitude: 75.5762,
        category: 'WEATHER',
        sourceId: 'imd-punjab-alerts',
        sourceUrl: 'https://mausam.imd.gov.in/warnings/doaba-yellow-alert',
        contentHash: 'hash-seed-alert-1',
        status: 'active',
        createdAt: nowIso,
        updatedAt: nowIso,
      },
      {
        id: 'alert-seed-2',
        title: 'Traffic Diversion: Flyover Construction at PAP Chowk',
        description: 'Punjab Traffic Police advisory: Lane expansion active at PAP Chowk junction; commuters advised to use Rama Mandi or Cantt route during peak hours.',
        department: 'Punjab Traffic Police & Municipal Corporation',
        publishedAt: nowIso,
        effectiveFrom: nowIso,
        effectiveUntil: oneWeekLater,
        locationName: 'PAP Chowk, Jalandhar',
        latitude: 31.326,
        longitude: 75.5762,
        category: 'TRANSPORT',
        sourceId: 'punjab-govt-notices',
        sourceUrl: 'https://punjab.gov.in/notices/pap-chowk-traffic',
        contentHash: 'hash-seed-alert-2',
        status: 'active',
        createdAt: nowIso,
        updatedAt: nowIso,
      },
      {
        id: 'alert-seed-3',
        title: 'District Administration Drinking Water Pipeline Maintenance Notice',
        description: 'Municipal water supply maintenance scheduled for Model Town and Urban Estate Phase II between 10 AM and 2 PM tomorrow.',
        department: 'Jalandhar Municipal Corporation Water Dept',
        publishedAt: nowIso,
        effectiveFrom: nowIso,
        effectiveUntil: threeDaysLater,
        locationName: 'Model Town, Jalandhar',
        latitude: 31.312,
        longitude: 75.584,
        category: 'CIVIC',
        sourceId: 'punjab-govt-notices',
        sourceUrl: 'https://punjab.gov.in/notices/water-maintenance-mcj',
        contentHash: 'hash-seed-alert-3',
        status: 'active',
        createdAt: nowIso,
        updatedAt: nowIso,
      },
      {
        id: 'alert-seed-4',
        title: 'Ferozepur Road Flyover Expansion Traffic Advisory',
        description: 'Major construction work active along Ferozepur Road corridor in Ludhiana; heavy vehicles redirected to Pakhowal bypass.',
        department: 'Ludhiana Traffic Police & NHAI',
        publishedAt: nowIso,
        effectiveFrom: nowIso,
        effectiveUntil: oneWeekLater,
        locationName: 'Ludhiana',
        latitude: 30.901,
        longitude: 75.8573,
        category: 'TRANSPORT',
        sourceId: 'punjab-govt-notices',
        sourceUrl: 'https://punjab.gov.in/notices/ferozepur-road-traffic',
        contentHash: 'hash-seed-alert-4',
        status: 'active',
        createdAt: nowIso,
        updatedAt: nowIso,
      },
    ];

    for (const alt of sampleAlerts) {
      alertRepository.insertAlert(alt);
    }
  }

  // 4. Seed price observations if table is empty
  const countPricesStmt = db.prepare('SELECT count(*) as count FROM price_observations');
  const priceCount = (countPricesStmt.get() as any)?.count || 0;

  if (priceCount === 0) {
    const todayIso = nowIso;
    const sevenDaysAgoIso = new Date(Date.now() - 7 * 86_400_000).toISOString();
    const tenDaysAgoIso = new Date(Date.now() - 10 * 86_400_000).toISOString();

    const samplePrices = [
      // 1. Tomato at Maqsudan Mandi (current + 1 week ago -> +20% INCREASED)
      {
        id: 'price-seed-tomato-today',
        productName: 'Tomato',
        category: 'VEGETABLE' as const,
        price: 42,
        unit: 'kg',
        currency: 'INR',
        market: 'Maqsudan APMC Wholesale Market',
        locationName: 'Jalandhar',
        latitude: 31.341,
        longitude: 75.568,
        observedAt: todayIso,
        sourceId: 'maqsudan-apmc-jalandhar',
        sourceUrl: 'https://agmarknet.gov.in/api/jalandhar/prices',
        contentHash: 'hash-seed-price-tomato-today',
        status: 'active' as const,
        createdAt: nowIso,
        updatedAt: nowIso,
      },
      {
        id: 'price-seed-tomato-last-week',
        productName: 'Tomato',
        category: 'VEGETABLE' as const,
        price: 35,
        unit: 'kg',
        currency: 'INR',
        market: 'Maqsudan APMC Wholesale Market',
        locationName: 'Jalandhar',
        latitude: 31.341,
        longitude: 75.568,
        observedAt: sevenDaysAgoIso,
        sourceId: 'maqsudan-apmc-jalandhar',
        sourceUrl: 'https://agmarknet.gov.in/api/jalandhar/prices',
        contentHash: 'hash-seed-price-tomato-lastweek',
        status: 'active' as const,
        createdAt: nowIso,
        updatedAt: nowIso,
      },
      // 2. Tomato at Model Town Market (different market on same day -> tests multiple markets)
      {
        id: 'price-seed-tomato-model-town',
        productName: 'Tomato',
        category: 'VEGETABLE' as const,
        price: 48,
        unit: 'kg',
        currency: 'INR',
        market: 'Model Town Retail Market',
        locationName: 'Model Town, Jalandhar',
        latitude: 31.312,
        longitude: 75.584,
        observedAt: todayIso,
        sourceId: 'model-town-market-jalandhar',
        sourceUrl: 'https://jalandharmarket.org/retail/daily-rates',
        contentHash: 'hash-seed-price-tomato-modeltown',
        status: 'active' as const,
        createdAt: nowIso,
        updatedAt: nowIso,
      },
      // 3. Onion at Maqsudan Mandi (current 28 vs 32 last week -> DECREASED)
      {
        id: 'price-seed-onion-today',
        productName: 'Onion',
        category: 'VEGETABLE' as const,
        price: 28,
        unit: 'kg',
        currency: 'INR',
        market: 'Maqsudan APMC Wholesale Market',
        locationName: 'Jalandhar',
        latitude: 31.341,
        longitude: 75.568,
        observedAt: todayIso,
        sourceId: 'maqsudan-apmc-jalandhar',
        sourceUrl: 'https://agmarknet.gov.in/api/jalandhar/prices',
        contentHash: 'hash-seed-price-onion-today',
        status: 'active' as const,
        createdAt: nowIso,
        updatedAt: nowIso,
      },
      {
        id: 'price-seed-onion-last-week',
        productName: 'Onion',
        category: 'VEGETABLE' as const,
        price: 32,
        unit: 'kg',
        currency: 'INR',
        market: 'Maqsudan APMC Wholesale Market',
        locationName: 'Jalandhar',
        latitude: 31.341,
        longitude: 75.568,
        observedAt: sevenDaysAgoIso,
        sourceId: 'maqsudan-apmc-jalandhar',
        sourceUrl: 'https://agmarknet.gov.in/api/jalandhar/prices',
        contentHash: 'hash-seed-price-onion-lastweek',
        status: 'active' as const,
        createdAt: nowIso,
        updatedAt: nowIso,
      },
      // 4. Potato at Maqsudan Mandi (current 22 vs 22 last week -> STABLE)
      {
        id: 'price-seed-potato-today',
        productName: 'Potato',
        category: 'VEGETABLE' as const,
        price: 22,
        unit: 'kg',
        currency: 'INR',
        market: 'Maqsudan APMC Wholesale Market',
        locationName: 'Jalandhar',
        latitude: 31.341,
        longitude: 75.568,
        observedAt: todayIso,
        sourceId: 'maqsudan-apmc-jalandhar',
        sourceUrl: 'https://agmarknet.gov.in/api/jalandhar/prices',
        contentHash: 'hash-seed-price-potato-today',
        status: 'active' as const,
        createdAt: nowIso,
        updatedAt: nowIso,
      },
      {
        id: 'price-seed-potato-last-week',
        productName: 'Potato',
        category: 'VEGETABLE' as const,
        price: 22,
        unit: 'kg',
        currency: 'INR',
        market: 'Maqsudan APMC Wholesale Market',
        locationName: 'Jalandhar',
        latitude: 31.341,
        longitude: 75.568,
        observedAt: sevenDaysAgoIso,
        sourceId: 'maqsudan-apmc-jalandhar',
        sourceUrl: 'https://agmarknet.gov.in/api/jalandhar/prices',
        contentHash: 'hash-seed-price-potato-lastweek',
        status: 'active' as const,
        createdAt: nowIso,
        updatedAt: nowIso,
      },
      // 5. Wheat at Grain Market (quintal unit -> tests non-kg unit)
      {
        id: 'price-seed-wheat-today',
        productName: 'Wheat',
        category: 'GRAIN' as const,
        price: 2450,
        unit: 'quintal',
        currency: 'INR',
        market: 'Grain Market Jalandhar',
        locationName: 'Jalandhar',
        latitude: 31.326,
        longitude: 75.5762,
        observedAt: todayIso,
        sourceId: 'punjab-mandi-board',
        sourceUrl: 'https://mandiboard.nic.in/api/daily-prices',
        contentHash: 'hash-seed-price-wheat-today',
        status: 'active' as const,
        createdAt: nowIso,
        updatedAt: nowIso,
      },
      // 6. Cauliflower (single observation -> tests missing historical data)
      {
        id: 'price-seed-cauliflower-today',
        productName: 'Cauliflower',
        category: 'VEGETABLE' as const,
        price: 30,
        unit: 'kg',
        currency: 'INR',
        market: 'Maqsudan APMC Wholesale Market',
        locationName: 'Jalandhar',
        latitude: 31.341,
        longitude: 75.568,
        observedAt: todayIso,
        sourceId: 'maqsudan-apmc-jalandhar',
        sourceUrl: 'https://agmarknet.gov.in/api/jalandhar/prices',
        contentHash: 'hash-seed-price-cauliflower-today',
        status: 'active' as const,
        createdAt: nowIso,
        updatedAt: nowIso,
      },
      // 7. Ginger (observed 10 days ago -> tests stale price detection)
      {
        id: 'price-seed-ginger-stale',
        productName: 'Ginger',
        category: 'VEGETABLE' as const,
        price: 120,
        unit: 'kg',
        currency: 'INR',
        market: 'Maqsudan APMC Wholesale Market',
        locationName: 'Jalandhar',
        latitude: 31.341,
        longitude: 75.568,
        observedAt: tenDaysAgoIso,
        sourceId: 'maqsudan-apmc-jalandhar',
        sourceUrl: 'https://agmarknet.gov.in/api/jalandhar/prices',
        contentHash: 'hash-seed-price-ginger-stale',
        status: 'active' as const,
        createdAt: nowIso,
        updatedAt: nowIso,
      },
    ];

    for (const pr of samplePrices) {
      priceRepository.insertPrice(pr);
    }
  }
}

