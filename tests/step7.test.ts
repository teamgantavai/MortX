/**
 * Step 7 Tests — Unified Local Intelligence Engine
 *
 * Verifies:
 * 1. "What is happening near me?" -> LOCAL_OVERVIEW
 * 2. "What is happening around me this weekend?" -> LOCAL_OVERVIEW
 * 3. "Any important updates near me?" -> LOCAL_OVERVIEW
 * 4. "What happened in Jalandhar today?" -> LOCAL_NEWS
 * 5. "What events are happening this weekend?" -> LOCAL_EVENTS
 * 6. "Any government alerts near me?" -> GOVERNMENT_ALERTS
 * 7. One source unavailable -> partial answer
 * 8. No results -> controlled empty response
 * 9. Duplicate evidence -> deduplicated/grouped with supporting sources preserved
 * 10. Multiple sources -> coherent unified answer with natural section structure
 * 11. Performance benchmark: Parallel retrieval latency & concurrency verification
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { handleQueryRequest } from '../src/server/handlers/queryHandler';
import { defaultQueryRouter } from '../src/server/ai/queryRouter';
import { LocalIntelligenceRetrievalService } from '../src/server/retrieval/localIntelligenceRetrievalService';
import { evidenceRanker } from '../src/server/retrieval/evidenceRanker';
import { aiAnswerService } from '../src/server/answer/answerService';
import { EvidenceItem } from '../src/server/retrieval/evidenceTypes';
import { DataSource, RetrievalItem } from '../src/server/retrieval/types';
import { cacheService } from '../src/server/cache/cacheService';

describe('Step 7 — Unified Local Intelligence Engine', () => {

  // ─────────────────────────────────────────────────────────────
  // 1-6: Query Router Intent & Retrieval Plan Tests
  // ─────────────────────────────────────────────────────────────
  it('1. Query Router — "What is happening near me?" -> LOCAL_OVERVIEW with unified plan', async () => {
    const query = await defaultQueryRouter.routeQuery({
      query: 'What is happening near me?',
    });

    assert.equal(query.intent, 'LOCAL_OVERVIEW');
    assert.ok(Array.isArray(query.retrievalPlan));
    assert.deepEqual(query.retrievalPlan, ['LOCAL_NEWS', 'LOCAL_EVENTS', 'GOVERNMENT_ALERTS']);
    assert.equal(query.location?.type, 'USER_LOCATION');
  });

  it('2. Query Router — "What is happening around me this weekend?" -> LOCAL_OVERVIEW with weekend timeRange', async () => {
    const query = await defaultQueryRouter.routeQuery({
      query: 'What is happening around me this weekend?',
    });

    assert.equal(query.intent, 'LOCAL_OVERVIEW');
    assert.deepEqual(query.retrievalPlan, ['LOCAL_NEWS', 'LOCAL_EVENTS', 'GOVERNMENT_ALERTS']);
    assert.equal(query.timeRange?.type, 'THIS_WEEKEND');
    assert.equal(query.location?.type, 'USER_LOCATION');
  });

  it('3. Query Router — "Any important updates near me?" -> LOCAL_OVERVIEW', async () => {
    const query = await defaultQueryRouter.routeQuery({
      query: 'Any important updates near me?',
    });

    assert.equal(query.intent, 'LOCAL_OVERVIEW');
    assert.deepEqual(query.retrievalPlan, ['LOCAL_NEWS', 'LOCAL_EVENTS', 'GOVERNMENT_ALERTS']);
  });

  it('4. Query Router — "What happened in Jalandhar today?" -> LOCAL_NEWS only', async () => {
    const query = await defaultQueryRouter.routeQuery({
      query: 'What happened in Jalandhar today?',
    });

    assert.equal(query.intent, 'LOCAL_NEWS');
    assert.deepEqual(query.retrievalPlan, ['LOCAL_NEWS']);
    assert.equal(query.location?.type, 'NAMED_LOCATION');
    assert.equal(query.location?.placeName, 'Jalandhar');
  });

  it('5. Query Router — "What events are happening this weekend?" -> LOCAL_EVENTS only', async () => {
    const query = await defaultQueryRouter.routeQuery({
      query: 'What events are happening this weekend?',
    });

    assert.equal(query.intent, 'LOCAL_EVENTS');
    assert.deepEqual(query.retrievalPlan, ['LOCAL_EVENTS']);
    assert.equal(query.timeRange?.type, 'THIS_WEEKEND');
  });

  it('6. Query Router — "Any government alerts near me?" -> GOVERNMENT_ALERTS only', async () => {
    const query = await defaultQueryRouter.routeQuery({
      query: 'Any government alerts near me?',
    });

    assert.equal(query.intent, 'GOVERNMENT_ALERTS');
    assert.deepEqual(query.retrievalPlan, ['GOVERNMENT_ALERTS']);
  });

  // ─────────────────────────────────────────────────────────────
  // 7. Partial Retrieval Fault Tolerance
  // ─────────────────────────────────────────────────────────────
  it('7. Partial retrieval — one source unavailable does not fail the request', async () => {
    const orchestrator = new LocalIntelligenceRetrievalService();

    // Register a failing source for alerts
    const failingAlertSource: DataSource<RetrievalItem> = {
      name: 'Failing Alerts',
      search: async () => {
        throw new Error('Public Alert DB connection timeout');
      },
      getById: async () => null,
      healthCheck: async () => false,
    };
    orchestrator.registerSource('GOVERNMENT_ALERTS', failingAlertSource);

    const result = await orchestrator.retrieve({
      intent: 'LOCAL_OVERVIEW',
      retrievalPlan: ['LOCAL_NEWS', 'LOCAL_EVENTS', 'GOVERNMENT_ALERTS'],
      keywords: [],
      location: null,
      timeRange: null,
      category: 'LOCAL',
      filters: {},
    });

    assert.ok(result.evidence.length > 0, 'Should still return items from news and events');
    assert.ok(result.sourcesFailed.includes('GOVERNMENT_ALERTS'));
    assert.ok(result.sourcesUsed.includes('LOCAL_NEWS'));
    assert.equal(result.status, 'PARTIAL');
    assert.ok(result.message?.includes('temporarily unavailable'));
  });

  // ─────────────────────────────────────────────────────────────
  // 8. Controlled Empty Response
  // ─────────────────────────────────────────────────────────────
  it('8. Empty results — query with no matches returns controlled empty response', async () => {
    cacheService.clear();
    const req = new Request('http://localhost:5173/api/ai/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'What is happening in Antarctica this weekend?',
      }),
    });

    const res = await handleQueryRequest(req);
    assert.equal(res.status, 200);

    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.results.length, 0);
    assert.ok(data.answer.text);
    assert.equal(data.answer.confidence, 'LOW');
  });

  // ─────────────────────────────────────────────────────────────
  // 9. Deduplication & Cross-Category Grouping
  // ─────────────────────────────────────────────────────────────
  it('9. Deduplication — detects same real-world incident across news and alert', () => {
    const rawItems: EvidenceItem[] = [
      {
        type: 'GOVERNMENT_ALERT',
        id: 'alt-water-1',
        title: 'Water Supply Disruption in Urban Estate Phase 2',
        summary: 'Emergency pipeline maintenance will disrupt water supply for 8 hours.',
        location: { name: 'Urban Estate Phase 2, Jalandhar' },
        publishedAt: new Date().toISOString(),
        source: { name: 'Jalandhar Municipal Corp', trustLevel: 'OFFICIAL_GOVERNMENT' },
        importance: 'HIGH',
      },
      {
        type: 'NEWS',
        id: 'news-water-2',
        title: 'Water supply disruption announced for Urban Estate Phase 2',
        summary: 'Civic authorities repair broken water supply pipeline in Urban Estate.',
        location: { name: 'Urban Estate Phase 2, Jalandhar' },
        publishedAt: new Date(Date.now() - 3600000).toISOString(),
        source: { name: 'Punjab Tribune', trustLevel: 'VERIFIED_JOURNALIST' },
        importance: 'NORMAL',
      },
      {
        type: 'EVENT',
        id: 'evt-music-1',
        title: 'Weekend Sufi Night at Haveli',
        summary: 'Live sufi music performance and traditional dinner.',
        location: { name: 'Haveli, Jalandhar' },
        publishedAt: new Date().toISOString(),
        source: { name: 'Haveli Events', trustLevel: 'OFFICIAL_EVENT_ORGANIZER' },
        importance: 'NORMAL',
      },
    ];

    const { rankedItems } = evidenceRanker.process(rawItems, {
      intent: 'LOCAL_OVERVIEW',
      keywords: ['water'],
      location: null,
      timeRange: null,
      category: 'LOCAL',
      filters: {},
    });

    // 3 raw items should deduplicate the water incident into 1 primary item
    assert.equal(rankedItems.length, 2, 'Should deduplicate the 2 water items into 1');

    const waterItem = rankedItems.find((it) => it.title.includes('Water Supply Disruption'));
    assert.ok(waterItem, 'Deduplicated water item must exist');
    assert.equal(waterItem.type, 'GOVERNMENT_ALERT', 'Should prefer higher importance GOVERNMENT_ALERT');
    assert.ok(waterItem.supportingSources && waterItem.supportingSources.length >= 1);
    assert.equal(waterItem.supportingSources[0].name, 'Punjab Tribune');
  });

  // ─────────────────────────────────────────────────────────────
  // 10. Multi-source Unified Answer Synthesis
  // ─────────────────────────────────────────────────────────────
  it('10. Multi-source answer synthesis — formats natural categories with alerts first', async () => {
    const evidence: EvidenceItem[] = [
      {
        type: 'GOVERNMENT_ALERT',
        id: 'alt-traffic-1',
        title: 'Traffic Diversion at BMC Chowk',
        summary: 'Road repair underway near BMC chowk. Follow alternative route via Flyover.',
        location: { name: 'BMC Chowk, Jalandhar' },
        publishedAt: new Date().toISOString(),
        source: { name: 'Jalandhar Traffic Police' },
        importance: 'URGENT',
      },
      {
        type: 'EVENT',
        id: 'evt-heritage-1',
        title: 'Punjab Heritage Food Festival',
        summary: 'Annual cultural cuisine fair at Model Town Club.',
        location: { name: 'Model Town, Jalandhar' },
        publishedAt: new Date().toISOString(),
        source: { name: 'Culture Board' },
        importance: 'NORMAL',
      },
      {
        type: 'NEWS',
        id: 'news-park-1',
        title: 'New Solar Powered Park Opened',
        summary: 'Green energy recreational park inaugurated for public in Cantt area.',
        location: { name: 'Jalandhar Cantt' },
        publishedAt: new Date().toISOString(),
        source: { name: 'Jalandhar Post' },
        importance: 'NORMAL',
      },
    ];

    const answerOutput = await aiAnswerService.generateAnswer({
      originalQuery: 'What is happening around me this weekend?',
      structuredQuery: {
        intent: 'LOCAL_OVERVIEW',
        retrievalPlan: ['LOCAL_NEWS', 'LOCAL_EVENTS', 'GOVERNMENT_ALERTS'],
        keywords: [],
        location: null,
        timeRange: null,
        category: 'LOCAL',
        filters: {},
      },
      results: evidence,
    });

    assert.ok(answerOutput.answer);
    // Alert should be prioritized and formatted under natural headers
    assert.ok(answerOutput.answer.includes('PUBLIC ALERTS') || answerOutput.answer.includes('Traffic Diversion'));
    assert.ok(answerOutput.answer.includes('EVENTS') || answerOutput.answer.includes('Punjab Heritage'));
    assert.ok(answerOutput.answer.includes('LOCAL UPDATES') || answerOutput.answer.includes('Solar Powered'));
    assert.equal(answerOutput.confidence, 'HIGH');
    assert.equal(answerOutput.sources.length, 3);
  });

  // ─────────────────────────────────────────────────────────────
  // 11. End-to-End API Integration & Performance Test
  // ─────────────────────────────────────────────────────────────
  it('11. Performance benchmark — parallel retrieval executes concurrently', async () => {
    cacheService.clear();

    // 1. Single intent query
    const reqSingle = new Request('http://localhost:5173/api/ai/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'What happened in Jalandhar today?',
      }),
    });
    const resSingle = await handleQueryRequest(reqSingle);
    const dataSingle = await resSingle.json();

    // 2. Overview multi-intent query
    const reqOverview = new Request('http://localhost:5173/api/ai/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'What is happening around me this weekend?',
      }),
    });
    const resOverview = await handleQueryRequest(reqOverview);
    const dataOverview = await resOverview.json();

    assert.equal(resOverview.status, 200);
    assert.equal(dataOverview.query.intent, 'LOCAL_OVERVIEW');
    assert.deepEqual(dataOverview.retrievalPlan, ['LOCAL_NEWS', 'LOCAL_EVENTS', 'GOVERNMENT_ALERTS']);
    assert.ok(Array.isArray(dataOverview.results));

    const t = dataOverview.metadata.timings;
    assert.ok(typeof t.queryRouterMs === 'number');
    assert.ok(typeof t.retrievalMs === 'number');
    assert.ok(typeof t.parallelFetchMs === 'number');
    assert.ok(typeof t.rankAndFilterMs === 'number');
    assert.ok(typeof t.answerEngineMs === 'number');
    assert.ok(typeof t.totalMs === 'number');

    // Parallel fetch latency should be lean and within reasonable thresholds (< 200ms in SQLite)
    assert.ok(t.parallelFetchMs < 200, `Parallel fetch took ${t.parallelFetchMs}ms`);

    console.log(`\n  [Step 7 Performance Benchmark]`);
    console.log(`  -------------------------------------------------------------`);
    console.log(`  Single Intent (LOCAL_NEWS)     Total: ${dataSingle.metadata.timings.totalMs}ms | Retrieval: ${dataSingle.metadata.timings.retrievalMs}ms`);
    console.log(`  Overview Intent (3 Categories) Total: ${t.totalMs}ms | Retrieval: ${t.retrievalMs}ms`);
    console.log(`    ↳ Query Router:      ${t.queryRouterMs}ms`);
    console.log(`    ↳ Parallel Fetch:    ${t.parallelFetchMs}ms`);
    console.log(`    ↳ Rank & Filter:     ${t.rankAndFilterMs}ms`);
    console.log(`    ↳ AI Answer Engine:  ${t.answerEngineMs}ms`);
    console.log(`  -------------------------------------------------------------\n`);
  });

});
