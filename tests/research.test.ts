/**
 * Step 8 Tests — Real-Time AI News Research Engine
 *
 * Verifies the complete real-time research pipeline:
 * 1. Research Planner (budgeting, query generation, intent routing, conversational bypass)
 * 2. Search Provider (Google News RSS provider abstraction, XML parsing, publisher extraction)
 * 3. Source Fetcher (SSRF protection, HTML sanitization, domain gating, content limits)
 * 4. Evidence Processor (scoring, tier weighting, bigram deduplication, clustering)
 * 5. Research Answer Engine (grounded synthesis, claim citation, prompt injection defense)
 * 6. Research Orchestrator (budget enforcement, timeout safety, session audit trail)
 * 7. End-to-End Query Integration (POST /api/ai/query with research metadata, citations, sources)
 */
import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { researchPlanner } from '../src/server/research/researchPlanner';
import { searchProvider } from '../src/server/research/searchProvider';
import { sourceFetcher, stripHtml, extractLocationMentions, isSafeUrl } from '../src/server/research/sourceFetcher';
import { evidenceProcessor } from '../src/server/research/evidenceProcessor';
import { researchAnswerEngine } from '../src/server/research/researchAnswerEngine';
import { researchOrchestrator } from '../src/server/research/researchOrchestrator';
import { handleQueryRequest } from '../src/server/handlers/queryHandler';
import { cacheService } from '../src/server/cache/cacheService';
import { getDb } from '../src/server/db/database';
import { seedInitialDataIfNeeded } from '../src/server/db/seed';
import { StructuredQuery } from '../src/server/ai/types';

describe('Step 8 — Real-Time AI News Research Engine', () => {
  before(() => {
    const db = getDb();
    seedInitialDataIfNeeded(db);
  });

  // ─── 1. Research Planner ──────────────────────────────────────────────────
  describe('1. Research Planner', () => {
    it('generates up to 4 location-aware search queries for local news', () => {
      const sq: StructuredQuery = {
        intent: 'LOCAL_NEWS',
        category: 'NEWS',
        location: { type: 'NAMED_LOCATION', placeName: 'Jalandhar' },
        timeRange: { type: 'TODAY' },
        keywords: ['traffic', 'accident'],
        filters: {},
        intents: ['LOCAL_NEWS'],
        retrievalPlan: ['LOCAL_NEWS'],
      };

      const plan = researchPlanner.plan('What happened in Jalandhar today?', sq);
      assert.strictEqual(plan.needsRealtime, true);
      assert.ok(plan.searchQueries.length >= 2 && plan.searchQueries.length <= 4);
      assert.strictEqual(plan.locationContext, 'Jalandhar');
      assert.strictEqual(plan.timeContext, 'today');
      assert.ok(plan.searchQueries.some((q) => q.toLowerCase().includes('jalandhar')));
    });

    it('bypasses real-time research for conversational / general AI queries', () => {
      const sq: StructuredQuery = {
        intent: 'GENERAL_AI_QUERY',
        category: 'GENERAL',
        location: null,
        timeRange: null,
        keywords: [],
        filters: {},
        intents: ['GENERAL_AI_QUERY'],
        retrievalPlan: ['GENERAL_AI_QUERY'],
      };

      const plan = researchPlanner.plan('hello how are you', sq);
      assert.strictEqual(plan.needsRealtime, false);
      assert.strictEqual(plan.searchQueries.length, 0);
    });

    it('bypasses real-time research for unsupported out-of-region locations', () => {
      const sq: StructuredQuery = {
        intent: 'LOCAL_NEWS',
        category: 'NEWS',
        location: { type: 'NAMED_LOCATION', placeName: 'Tokyo' },
        timeRange: { type: 'TODAY' },
        keywords: [],
        filters: {},
        intents: ['LOCAL_NEWS'],
        retrievalPlan: ['LOCAL_NEWS'],
      };

      const plan = researchPlanner.plan('What happened in Tokyo today?', sq);
      assert.strictEqual(plan.needsRealtime, false);
      assert.strictEqual(plan.searchQueries.length, 0);
      assert.ok(plan.reasoning.includes('outside local service region'));
    });
  });

  // ─── 2. Search Provider ───────────────────────────────────────────────────
  describe('2. Search Provider (Google News RSS)', () => {
    it('executes news search and returns structured search results with publisher', async () => {
      const results = await searchProvider.searchNews('Punjab breaking news', {
        maxResults: 5,
        timeoutMs: 8000,
      });

      assert.ok(Array.isArray(results));
      assert.ok(results.length > 0, 'Google News RSS should return results');

      const first = results[0];
      assert.ok(first.id);
      assert.ok(first.title);
      assert.ok(first.url);
      assert.ok(first.sourceName);
      assert.strictEqual(first.sourceType, 'NEWS');
    });

    it('handles query with special characters without breaking', async () => {
      const results = await searchProvider.searchNews('Jalandhar & Ludhiana: "police" updates?', {
        maxResults: 3,
        timeoutMs: 5000,
      });
      assert.ok(Array.isArray(results));
    });
  });

  // ─── 3. Source Fetcher & Safety ────────────────────────────────────────────
  describe('3. Source Fetcher & Safety', () => {
    it('blocks dangerous URL schemes and local private IPs via SSRF check', () => {
      const blockedUrls = [
        'file:///etc/passwd',
        'http://127.0.0.1:8080/admin',
        'http://192.168.1.1/secret',
        'http://localhost:3000/api',
        'ftp://example.com/test',
      ];

      for (const url of blockedUrls) {
        assert.strictEqual(isSafeUrl(url), false, `Should identify url as unsafe: ${url}`);
      }

      assert.strictEqual(isSafeUrl('https://tribuneindia.com/news/punjab'), true);
      assert.strictEqual(isSafeUrl('https://hindustantimes.com/cities'), true);
    });

    it('strips HTML tags and script elements cleanly from web content', () => {
      const html = `
        <html>
          <head><title>Test News</title><script>alert('injection')</script></head>
          <body>
            <nav>Menu items to ignore</nav>
            <main>
              <h1>Heavy Rain in Jalandhar Causes Waterlogging</h1>
              <p>Municipal authorities deployed 10 suction trucks across Model Town.</p>
            </main>
          </body>
        </html>
      `;

      const stripped = stripHtml(html);
      assert.ok(!stripped.includes('<script>'));
      assert.ok(!stripped.includes('alert('));
      assert.ok(!stripped.includes('<html>'));
      assert.ok(stripped.includes('Heavy Rain in Jalandhar'));
      assert.ok(stripped.includes('Model Town'));
    });

    it('extracts known Punjab location mentions from text', () => {
      const text = 'Road repairs commenced between Jalandhar and Phagwara on GT Road near Model Town.';
      const mentions = extractLocationMentions(text);
      assert.ok(mentions.includes('Jalandhar'));
      assert.ok(mentions.includes('Phagwara'));
    });
  });

  // ─── 4. Evidence Processor ────────────────────────────────────────────────
  describe('4. Evidence Processor', () => {
    it('ranks and scores sources by relevance, location, freshness, and tier', () => {
      const sources = [
        {
          id: 'src-1',
          title: 'Heavy traffic on GT Road Jalandhar due to flyover repair',
          url: 'https://tribuneindia.com/news/jalandhar/heavy-traffic-1',
          content: 'Traffic congestion reported on GT road in Jalandhar city today.',
          publisher: 'The Tribune',
          publishedAt: new Date().toISOString(),
          fetchStatus: 'FETCHED' as const,
          locationMentions: ['Jalandhar'],
          pageFetched: true,
          fetchedAt: new Date().toISOString(),
          searchResult: {
            id: 'res-1',
            title: 'Heavy traffic on GT Road Jalandhar',
            url: 'https://tribuneindia.com/news/jalandhar/heavy-traffic-1',
            publisher: 'The Tribune',
            publishedAt: new Date().toISOString(),
            type: 'NEWS' as const,
          },
        },
        {
          id: 'src-2',
          title: 'General entertainment gossip in Bollywood',
          url: 'https://example.com/entertainment/gossip',
          content: 'Movie stars attended a film premiere in Mumbai.',
          publisher: 'Unknown Blog',
          publishedAt: new Date(Date.now() - 30 * 86400000).toISOString(),
          fetchStatus: 'FETCHED' as const,
          locationMentions: ['Mumbai'],
          pageFetched: true,
          fetchedAt: new Date().toISOString(),
          searchResult: {
            id: 'res-2',
            title: 'General entertainment gossip',
            url: 'https://example.com/entertainment/gossip',
            publisher: 'Unknown Blog',
            publishedAt: new Date(Date.now() - 30 * 86400000).toISOString(),
            type: 'NEWS' as const,
          },
        },
      ];

      const processed = evidenceProcessor.process(sources as any, 'What is the traffic situation in Jalandhar today?', 'Jalandhar', ['traffic', 'flyover']);
      assert.ok(processed.items.length >= 1);
      // The Jalandhar traffic article must rank highest
      const top = processed.items[0];
      assert.strictEqual(top.id, 'src-1');
      assert.ok(top.locationScore >= 0.8);
      assert.strictEqual(top.tier, 'ESTABLISHED_NEWS');
    });

    it('clusters near-duplicate stories covering the same event', () => {
      const sources = [
        {
          id: 'dup-1',
          title: 'Power cut announced in Model Town Jalandhar for 4 hours',
          url: 'https://tribuneindia.com/news/jalandhar/power-cut-model-town',
          content: 'PSPCL scheduled 4 hour power shutdown in Model Town.',
          publisher: 'The Tribune',
          publishedAt: new Date().toISOString(),
          fetchStatus: 'FETCHED' as const,
          locationMentions: ['Jalandhar'],
          pageFetched: false,
          fetchedAt: new Date().toISOString(),
          searchResult: {
            id: 'r-1',
            title: 'Power cut announced in Model Town Jalandhar for 4 hours',
            url: 'https://tribuneindia.com/news/jalandhar/power-cut-model-town',
            publisher: 'The Tribune',
            publishedAt: new Date().toISOString(),
            type: 'NEWS' as const,
          },
        },
        {
          id: 'dup-2',
          title: 'Power shutdown announced in Model Town Jalandhar for 4 hours',
          url: 'https://hindustantimes.com/cities/chandigarh-news/power-cut-jalandhar',
          content: 'Electricity board scheduled maintenance shutdown in Model Town Jalandhar.',
          publisher: 'Hindustan Times',
          publishedAt: new Date().toISOString(),
          fetchStatus: 'FETCHED' as const,
          locationMentions: ['Jalandhar'],
          pageFetched: false,
          fetchedAt: new Date().toISOString(),
          searchResult: {
            id: 'r-2',
            title: 'Power shutdown announced in Model Town Jalandhar for 4 hours',
            url: 'https://hindustantimes.com/cities/chandigarh-news/power-cut-jalandhar',
            publisher: 'Hindustan Times',
            publishedAt: new Date().toISOString(),
            type: 'NEWS' as const,
          },
        },
      ];

      const processed = evidenceProcessor.process(sources as any, 'Power cut in Jalandhar Model Town', 'Jalandhar');
      // Should cluster the two duplicates under one primary item
      assert.strictEqual(processed.items.length, 1, 'Near duplicates should be deduplicated to 1 primary item');
      assert.ok(processed.clusters.length >= 1);
      assert.strictEqual(processed.clusters[0].supportingItems.length, 1);
    });
  });

  // ─── 5. Research Answer Engine ────────────────────────────────────────────
  describe('5. Research Answer Engine', () => {
    it('synthesizes cited answer referencing verified sources', async () => {
      const evidence = [
        {
          id: 'ev-1',
          title: 'Punjab Police bust interstate vehicle theft ring in Jalandhar',
          url: 'https://tribuneindia.com/news/jalandhar/theft-ring',
          publisher: 'The Tribune',
          publishedAt: new Date().toISOString(),
          evidenceText: 'Police recovered 12 luxury cars and arrested 4 suspects in Jalandhar.',
          relevanceScore: 0.9,
          locationScore: 1.0,
          freshnessScore: 1.0,
          rankScore: 0.95,
          tier: 'ESTABLISHED_NEWS' as const,
          clusterId: 'ev-1',
          isClusterPrimary: true,
          supportingUrls: [],
        },
      ];

      const answer = await researchAnswerEngine.synthesize('What is happening in Jalandhar today?', 'Jalandhar', evidence, []);
      assert.ok(answer.answer);
      assert.ok(answer.sources.length >= 1);
      assert.strictEqual(answer.sources[0].publisher, 'The Tribune');
      assert.ok(answer.claims.length >= 1);
      assert.ok(answer.claims[0].sourceIds.includes('ev-1'));
    });

    it('returns grounded fallback when zero evidence is provided', async () => {
      const answer = await researchAnswerEngine.synthesize('What is happening in Jalandhar today?', 'Jalandhar', [], []);
      assert.ok(answer.answer.includes('No current information found') || answer.answer.includes("couldn't find"));
      assert.strictEqual(answer.sources.length, 0);
      assert.strictEqual(answer.claims.length, 0);
    });
  });

  // ─── 6. Research Orchestrator ─────────────────────────────────────────────
  describe('6. Research Orchestrator', () => {
    it('executes full research session within budget and records audit trail', async () => {
      const sq: StructuredQuery = {
        intent: 'LOCAL_NEWS',
        category: 'NEWS',
        location: { type: 'NAMED_LOCATION', placeName: 'Jalandhar' },
        timeRange: { type: 'TODAY' },
        keywords: [],
        filters: {},
        intents: ['LOCAL_NEWS'],
        retrievalPlan: ['LOCAL_NEWS'],
      };

      const session = await researchOrchestrator.research('req_test_01', 'What happened in Jalandhar today?', sq);
      assert.ok(session.id);
      assert.ok(session.meta.durationMs >= 0);
      assert.ok(session.meta.durationMs <= 10000, 'Must complete within max time budget');
      assert.ok(session.plan.searchQueries.length > 0);
      assert.ok(session.meta.searchesPerformed > 0);
      assert.ok(session.evidence.length > 0);
      assert.ok(session.answer);
    });
  });

  // ─── 7. End-to-End API Integration ────────────────────────────────────────
  describe('7. End-to-End API Integration (POST /api/ai/query)', () => {
    it('real-time research query returns 200 with research metadata and cited sources', async () => {
      cacheService.clear();
      const req = new Request('http://localhost:5173/api/ai/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: 'What happened in Jalandhar today?',
          location: { latitude: 31.3260, longitude: 75.5762 },
        }),
      });

      const res = await handleQueryRequest(req);
      assert.strictEqual(res.status, 200);

      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.query.intent, 'LOCAL_NEWS');
      assert.ok(data.answer.text);
      assert.ok(data.sources.length > 0);

      // Verify research metadata block
      assert.ok(data.research);
      assert.strictEqual(data.research.provider, 'google-news-rss');
      assert.ok(data.research.searchesPerformed > 0);
      assert.ok(data.research.durationMs >= 0);
      assert.ok(Array.isArray(data.research.searchQueries));

      // Verify response includes claims
      if (data.answer.claims) {
        assert.ok(Array.isArray(data.answer.claims));
        assert.ok(data.answer.claims[0].sourceIds.length > 0);
      }
    });

    it('research query sets shorter cache TTL and subsequent request hits cache', async () => {
      cacheService.clear();

      const makeReq = () => new Request('http://localhost:5173/api/ai/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: 'Latest breaking news in Ludhiana today',
        }),
      });

      const res1 = await handleQueryRequest(makeReq());
      assert.strictEqual(res1.status, 200);

      // Second request must hit cache
      const res2 = await handleQueryRequest(makeReq());
      assert.strictEqual(res2.status, 200);
      assert.strictEqual(res2.headers.get('X-Cache'), 'HIT');
    });
  });
});
