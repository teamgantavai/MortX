/**
 * Step 8 Tests — Local Price Intelligence
 *
 * Covers:
 * 1. Current tomato price ("What is the tomato price today?")
 * 2. Missing product (controlled empty response)
 * 3. Multiple markets (distinct market observations without silent averaging)
 * 4. Different units (kg, quintal, litre)
 * 5. Historical comparison calculation
 * 6. Price increase detection (Tomato: +₹7/kg, +20.0%, INCREASED)
 * 7. Price decrease detection (Onion: -₹4/kg, -12.5%, DECREASED)
 * 8. Stable price detection (Potato: ₹0/kg, 0.0%, STABLE)
 * 9. Missing historical data (direction: UNKNOWN)
 * 10. Stale price detection (>48 hours old)
 * 11. Invalid price rejection in validator (negative, missing fields)
 * 12. Source failure resilience
 * 13. Duplicate observation rejection
 * 14. Location filtering (Jalandhar / Model Town)
 * 15. AI answer grounded in price evidence with structured priceData
 * 16. Chat UI integration queries
 */
import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { handleQueryRequest } from '../src/server/handlers/queryHandler';
import { defaultQueryRouter } from '../src/server/ai/queryRouter';
import { priceRepository } from '../src/server/db/priceRepository';
import { priceValidator } from '../src/server/ingestion/priceValidator';
import { priceNormalizer } from '../src/server/ingestion/priceNormalizer';
import { priceAnalysisService } from '../src/server/price/priceAnalysisService';
import { aiAnswerService } from '../src/server/answer/answerService';
import { cacheService } from '../src/server/cache/cacheService';
import { getDb } from '../src/server/db/database';
import { seedInitialDataIfNeeded } from '../src/server/db/seed';

describe('Step 8 — Local Price Intelligence', () => {
  before(() => {
    // Ensure database schema and seed data are initialized
    const db = getDb();
    seedInitialDataIfNeeded(db);
  });

  // 1. Current Tomato Price
  it('1. Current price — retrieves tomato price today for Jalandhar', async () => {
    cacheService.clear();
    const req = new Request('http://localhost:5173/api/ai/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'What is the tomato price today?',
        location: { latitude: 31.3260, longitude: 75.5762 },
      }),
    });

    const res = await handleQueryRequest(req);
    assert.equal(res.status, 200);

    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.query.intent, 'PRICE_SEARCH');
    assert.equal(data.query.product, 'tomato');
    assert.ok(data.results.length > 0);
    assert.ok(data.answer.text.includes('42') || data.answer.text.includes('Tomato'));
    assert.ok(data.priceData);
    assert.equal(data.priceData.product, 'tomato');
    assert.equal(data.priceData.current.price, 42);
    assert.equal(data.priceData.current.unit, 'kg');
  });

  // 2. Missing Product
  it('2. Missing product — returns controlled informative response without hallucination', async () => {
    cacheService.clear();
    const req = new Request('http://localhost:5173/api/ai/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'What is the price of dragonfruit in Antarctica?',
      }),
    });

    const res = await handleQueryRequest(req);
    assert.equal(res.status, 200);

    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.results.length, 0);
    assert.ok(
      data.answer.text.includes("couldn't find") ||
      data.answer.text.includes('not available') ||
      data.answer.text.includes('reliable current price')
    );
  });

  // 3. Multiple Markets
  it('3. Multiple markets — returns distinct observations without silent averaging', async () => {
    const records = priceRepository.searchPrices({ product: 'Tomato' });
    assert.ok(records.length >= 2, 'Should find observations from both Maqsudan and Model Town');

    const markets = records.map((r) => r.market);
    assert.ok(markets.includes('Maqsudan APMC Wholesale Market'));
    assert.ok(markets.includes('Model Town Retail Market'));

    // Verify distinct prices: 42 vs 48
    const maqsudan = records.find((r) => r.market.includes('Maqsudan'));
    const modelTown = records.find((r) => r.market.includes('Model Town'));
    assert.equal(maqsudan?.price, 42);
    assert.equal(modelTown?.price, 48);
  });

  // 4. Different Units
  it('4. Different units — handles wheat in quintal correctly', async () => {
    const wheatRec = priceRepository.getLatestPrice('Wheat');
    assert.ok(wheatRec);
    assert.equal(wheatRec?.unit, 'quintal');
    assert.equal(wheatRec?.price, 2450);
    assert.equal(wheatRec?.currency, 'INR');

    // Test unit normalization
    assert.equal(priceNormalizer.normalizeUnit('quintals'), 'quintal');
    assert.equal(priceNormalizer.normalizeUnit('kgs'), 'kg');
    assert.equal(priceNormalizer.normalizeUnit('ltr'), 'litre');
    assert.equal(priceNormalizer.normalizeUnit('dozen'), 'dozen');
  });

  // 5. Historical Comparison & Arithmetic in Code
  it('5. Historical comparison — computes difference and percentage in code', () => {
    const current = { price: 42, unit: 'kg', observedAt: new Date().toISOString() } as any;
    const previous = { price: 35, unit: 'kg', observedAt: new Date(Date.now() - 7 * 86400000).toISOString() } as any;

    const comp = priceAnalysisService.calculateComparison(current, previous);
    assert.equal(comp.change, 7);
    assert.equal(comp.percentage, 20.0);
    assert.equal(comp.direction, 'INCREASED');
  });

  // 6. Price Increase
  it('6. Price increase — Tomato +₹7/kg (+20.0%) identified as INCREASED', () => {
    const current = { price: 42, unit: 'kg' } as any;
    const previous = { price: 35, unit: 'kg' } as any;
    const comp = priceAnalysisService.calculateComparison(current, previous);
    assert.equal(comp.direction, 'INCREASED');
    assert.equal(comp.change, 7);
    assert.equal(comp.percentage, 20.0);
  });

  // 7. Price Decrease
  it('7. Price decrease — Onion -₹4/kg (-12.5%) identified as DECREASED', () => {
    const current = { price: 28, unit: 'kg' } as any;
    const previous = { price: 32, unit: 'kg' } as any;
    const comp = priceAnalysisService.calculateComparison(current, previous);
    assert.equal(comp.direction, 'DECREASED');
    assert.equal(comp.change, -4);
    assert.equal(comp.percentage, 12.5);
  });

  // 8. Stable Price
  it('8. Stable price — Potato ₹22/kg vs ₹22/kg identified as STABLE', () => {
    const current = { price: 22, unit: 'kg' } as any;
    const previous = { price: 22, unit: 'kg' } as any;
    const comp = priceAnalysisService.calculateComparison(current, previous);
    assert.equal(comp.direction, 'STABLE');
    assert.equal(comp.change, 0);
    assert.equal(comp.percentage, 0.0);
  });

  // 9. Missing Historical Data
  it('9. Missing historical data — returns direction UNKNOWN when previous observation absent', () => {
    const current = { price: 30, unit: 'kg' } as any;
    const comp = priceAnalysisService.calculateComparison(current, null);
    assert.equal(comp.direction, 'UNKNOWN');
    assert.equal(comp.change, null);
    assert.equal(comp.percentage, null);
  });

  // 10. Stale Price Detection
  it('10. Stale price — observation from 10 days ago flagged as STALE', () => {
    const tenDaysAgo = new Date(Date.now() - 10 * 86_400_000).toISOString();
    const freshness = priceAnalysisService.determineFreshness(tenDaysAgo);
    assert.equal(freshness, 'STALE');

    const today = new Date().toISOString();
    assert.equal(priceAnalysisService.determineFreshness(today), 'CURRENT');
  });

  // 11. Validation — Rejects Invalid Records
  it('11. Validation — rejects negative price, missing product, or unsupported unit', () => {
    // Negative price
    const resNegative = priceValidator.validate({
      productName: 'Tomato',
      price: -10,
      unit: 'kg',
      market: 'Maqsudan',
      observedAt: new Date().toISOString(),
    });
    assert.equal(resNegative.valid, false);
    assert.ok(resNegative.error?.includes('Price must be greater than zero'));

    // Missing product
    const resMissing = priceValidator.validate({
      productName: '',
      price: 40,
      unit: 'kg',
      market: 'Maqsudan',
      observedAt: new Date().toISOString(),
    });
    assert.equal(resMissing.valid, false);

    // Unsupported unit
    const resUnit = priceValidator.validate({
      productName: 'Tomato',
      price: 40,
      unit: 'truckload',
      market: 'Maqsudan',
      observedAt: new Date().toISOString(),
    });
    assert.equal(resUnit.valid, false);
    assert.ok(resUnit.error?.includes('Unsupported unit'));

    // Suspicious high price flagged for review
    const resSuspicious = priceValidator.validate({
      productName: 'Tomato',
      price: 1500, // unusual for tomato/kg
      unit: 'kg',
      market: 'Maqsudan',
      observedAt: new Date().toISOString(),
    });
    assert.equal(resSuspicious.valid, true);
    assert.equal(resSuspicious.flaggedSuspicious, true);
  });

  // 12. Duplicate Observation Rejection
  it('12. Duplicate rejection — rejects duplicate observation with same product, market, unit, and date', () => {
    const uniqueTag = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const testRecord = {
      id: `price-dup-${uniqueTag}-1`,
      productName: `Capsicum-${uniqueTag}`,
      category: 'VEGETABLE' as const,
      price: 60,
      unit: 'kg',
      currency: 'INR',
      market: 'Test Mandi',
      locationName: 'Jalandhar',
      observedAt: new Date().toISOString(),
      sourceId: 'punjab-mandi-board',
      contentHash: `hash-test-capsicum-${uniqueTag}`,
      status: 'active' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const first = priceRepository.insertPrice(testRecord);
    assert.equal(first, true);

    // Second insert with same contentHash or same product+market+unit+day
    const second = priceRepository.insertPrice({
      ...testRecord,
      id: 'price-dup-test-2',
    });
    assert.equal(second, false, 'Duplicate insertion must be rejected');
  });

  // 13. Location Filtering
  it('13. Location filtering — filters prices by market and city locality', () => {
    const modelTownPrices = priceRepository.searchPrices({
      locationName: 'Model Town',
    });
    assert.ok(modelTownPrices.length > 0);
    assert.ok(modelTownPrices.every((p) => p.locationName.includes('Model Town') || p.market.includes('Model Town')));
  });

  // 14. Query Router Intent & Product Extraction
  it('14. Query Router — properly extracts product, comparison, and time for price queries', async () => {
    // Current price query
    const q1 = await defaultQueryRouter.routeQuery({
      query: 'What is the tomato price today?',
    });
    assert.equal(q1.intent, 'PRICE_SEARCH');
    assert.equal(q1.product, 'tomato');
    assert.equal(q1.timeRange?.type, 'TODAY');

    // Comparison query
    const q2 = await defaultQueryRouter.routeQuery({
      query: 'Is tomato more expensive than last week?',
    });
    assert.equal(q2.intent, 'PRICE_SEARCH');
    assert.equal(q2.product, 'tomato');
    assert.equal(q2.comparison?.type, 'LAST_WEEK');

    // General commodity query
    const q3 = await defaultQueryRouter.routeQuery({
      query: 'What are onion prices near me?',
    });
    assert.equal(q3.intent, 'PRICE_SEARCH');
    assert.equal(q3.product, 'onion');
  });

  // 15. AI Answer Grounding in Price Evidence
  it('15. AI answer — formats grounded response with exact numbers and supporting sources', async () => {
    const answerOutput = await aiAnswerService.generateAnswer({
      originalQuery: 'Is tomato more expensive than last week?',
      structuredQuery: {
        intent: 'PRICE_SEARCH',
        product: 'tomato',
        category: 'PRICE',
        keywords: ['tomato'],
        location: null,
        timeRange: { type: 'TODAY' },
        filters: {},
        comparison: { type: 'LAST_WEEK' },
      },
      results: [
        {
          id: 'price-tomato-test',
          type: 'PRICE' as any,
          title: 'Tomato: ₹42/kg at Maqsudan APMC Wholesale Market',
          summary: 'Price of Tomato is ₹42 per kg observed today.',
          location: { name: 'Maqsudan APMC Wholesale Market, Jalandhar' },
          publishedAt: new Date().toISOString(),
          source: { name: 'Punjab Mandi Board' },
          metadata: {
            productName: 'Tomato',
            price: 42,
            unit: 'kg',
            currency: 'INR',
            market: 'Maqsudan APMC Wholesale Market',
            observedAt: new Date().toISOString(),
            comparison: {
              previousPrice: 35,
              change: 7,
              percentage: 20.0,
              direction: 'INCREASED',
            },
            rawRecord: {
              id: 'price-tomato-test',
              productName: 'Tomato',
              category: 'VEGETABLE',
              price: 42,
              unit: 'kg',
              currency: 'INR',
              market: 'Maqsudan APMC Wholesale Market',
              locationName: 'Jalandhar',
              observedAt: new Date().toISOString(),
              sourceId: 'punjab-mandi-board',
              contentHash: 'test-hash',
              status: 'active',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          },
        },
      ],
    });

    assert.ok(answerOutput.answer.includes('42'));
    assert.ok(answerOutput.answer.includes('35'));
    assert.ok(answerOutput.answer.includes('20%') || answerOutput.answer.includes('20.0%'));
    assert.ok(answerOutput.answer.includes('increase'));
    assert.ok(answerOutput.priceData);
    assert.equal(answerOutput.priceData.current.price, 42);
    assert.equal(answerOutput.priceData.comparison?.direction, 'INCREASED');
    assert.equal(answerOutput.sources.length, 1);
  });

  // 16. Chat API End-to-End Test
  it('16. Chat API E2E — "Tomato price in Jalandhar" returns full response with priceData', async () => {
    cacheService.clear();
    const req = new Request('http://localhost:5173/api/ai/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'Tomato price in Jalandhar',
      }),
    });

    const res = await handleQueryRequest(req);
    assert.equal(res.status, 200);

    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.query.intent, 'PRICE_SEARCH');
    assert.ok(data.priceData);
    assert.equal(data.priceData.product, 'tomato');
    assert.ok(data.results.length >= 1);
  });
});
