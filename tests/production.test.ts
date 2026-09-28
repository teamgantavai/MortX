import test from 'node:test';
import assert from 'node:assert/strict';
import { handleQueryRequest } from '../src/server/handlers/queryHandler';
import { handleHealthRequest } from '../src/server/handlers/healthHandler';
import { cacheService } from '../src/server/cache/cacheService';
import { rateLimiter } from '../src/server/security/rateLimiter';
import { sourceCircuitBreaker } from '../src/server/ingestion/circuitBreaker';
import { articleRepository } from '../src/server/db/articleRepository';
import { sourceRepository } from '../src/server/db/sourceRepository';

// Setup test database state
const prodSource = {
  id: 'prod-test-source',
  name: 'Doaba News Network',
  type: 'RSS' as const,
  baseUrl: 'https://doabanews.local',
  feedUrl: 'https://doabanews.local/rss.xml',
  enabled: true,
  language: 'en',
  region: 'Punjab',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};
sourceRepository.upsertSource(prodSource);

const testArticle = {
  id: `prod-art-${Date.now()}`,
  title: 'Jalandhar Municipal Corporation Approves New Smart Lighting',
  description: 'Automated energy efficient streetlights deployed across all 15 wards.',
  sourceId: prodSource.id,
  sourceUrl: prodSource.baseUrl,
  articleUrl: `https://doabanews.local/lights-${Date.now()}`,
  publishedAt: new Date().toISOString(),
  firstSeenAt: new Date().toISOString(),
  lastSeenAt: new Date().toISOString(),
  locationName: 'Jalandhar',
  latitude: 31.3260,
  longitude: 75.5762,
  category: 'GOVERNMENT' as const,
  language: 'en',
  contentHash: `prod-hash-${Date.now()}`,
  status: 'active' as const,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};
articleRepository.insertArticle(testArticle);

// 1. Normal query with request ID & internal timings
test('1. Production - normal query returns request ID and internal timing breakdown', async () => {
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
  assert.equal(res.status, 200);
  assert.ok(res.headers.get('X-Request-Id')?.startsWith('req_'));
  assert.equal(res.headers.get('X-Cache'), 'MISS');

  const data = await res.json();
  assert.equal(data.success, true);
  assert.ok(data.requestId.startsWith('req_'));
  assert.ok(data.metadata.timings);
  assert.ok(typeof data.metadata.timings.totalMs === 'number');
  assert.ok(typeof data.metadata.timings.queryRouterMs === 'number');
  assert.ok(typeof data.metadata.timings.retrievalMs === 'number');
  assert.ok(typeof data.metadata.timings.databaseMs === 'number');
  assert.ok(typeof data.metadata.timings.answerEngineMs === 'number');
});

// 2. Cache hit vs Cache miss
test('2. Production - caches repeatable queries and returns X-Cache: HIT with near-zero latency', async () => {
  cacheService.clear();
  const makeReq = () =>
    new Request('http://localhost:5173/api/ai/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'What happened in Jalandhar today?',
        location: { latitude: 31.3260, longitude: 75.5762 },
      }),
    });

  // First request: Cache Miss
  const res1 = await handleQueryRequest(makeReq());
  assert.equal(res1.status, 200);
  assert.equal(res1.headers.get('X-Cache'), 'MISS');

  // Second request: Cache Hit
  const res2 = await handleQueryRequest(makeReq());
  assert.equal(res2.status, 200);
  assert.equal(res2.headers.get('X-Cache'), 'HIT');

  const data2 = await res2.json();
  assert.equal(data2.metadata.cached, true);
  assert.ok(data2.metadata.latencyMs <= 10, `Expected latency <= 10ms on cache hit, got ${data2.metadata.latencyMs}ms`);
});

// 3. Rate limiting enforcement
test('3. Production - rate limiter enforces requests limit and returns 429 Too Many Requests', async () => {
  rateLimiter.reset();
  const testClientIp = '198.51.100.42';

  const makeReq = () =>
    new Request('http://localhost:5173/api/ai/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': testClientIp,
      },
      body: JSON.stringify({ query: 'Hello local check' }),
    });

  // Exhaust anonymous limit (60)
  for (let i = 0; i < 60; i++) {
    const r = await handleQueryRequest(makeReq());
    assert.equal(r.status, 200);
  }

  // 61st request should be rejected
  const blockedRes = await handleQueryRequest(makeReq());
  assert.equal(blockedRes.status, 429);
  assert.ok(blockedRes.headers.get('Retry-After'));

  const blockedData = await blockedRes.json();
  assert.equal(blockedData.success, false);
  assert.equal(blockedData.error.code, 'RATE_LIMIT_EXCEEDED');
  rateLimiter.reset(); // Cleanup
});

// 4. Input validation: query length rejection
test('4. Production - rejects oversized query strings exceeding character limit', async () => {
  const req = new Request('http://localhost:5173/api/ai/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: 'A'.repeat(600), // Exceeds 500 limit
    }),
  });

  const res = await handleQueryRequest(req);
  assert.equal(res.status, 400);

  const data = await res.json();
  assert.equal(data.success, false);
  assert.equal(data.error.code, 'QUERY_TOO_LONG');
});

// 5. Input validation: invalid coordinates & radius
test('5. Production - rejects invalid search radius and out-of-range coordinates', async () => {
  const req = new Request('http://localhost:5173/api/ai/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: 'Check updates',
      location: { latitude: 31.3260, longitude: 75.5762, radiusKm: 500 }, // Max is 100
    }),
  });

  const res = await handleQueryRequest(req);
  assert.equal(res.status, 400);

  const data = await res.json();
  assert.equal(data.error.code, 'INVALID_RADIUS');
});

// 6. News Source Circuit Breaker
test('6. Production - circuit breaker trips after repeated source failures and skips hammering', () => {
  sourceCircuitBreaker.reset();
  const sourceId = 'failing-test-source';

  assert.equal(sourceCircuitBreaker.canAttempt(sourceId), true);
  sourceCircuitBreaker.recordFailure(sourceId);
  assert.equal(sourceCircuitBreaker.canAttempt(sourceId), true);
  sourceCircuitBreaker.recordFailure(sourceId);
  sourceCircuitBreaker.recordFailure(sourceId);

  // After 3 failures, circuit should be OPEN
  assert.equal(sourceCircuitBreaker.getState(sourceId), 'OPEN');
  assert.equal(sourceCircuitBreaker.canAttempt(sourceId), false);

  sourceCircuitBreaker.reset();
});

// 7. Health Check Endpoint
test('7. Production - GET /api/health reports system status, database, and cache metrics', async () => {
  const req = new Request('http://localhost:5173/api/health', {
    method: 'GET',
  });

  const res = await handleHealthRequest(req);
  assert.equal(res.status, 200);

  const data = await res.json();
  assert.equal(data.status, 'healthy');
  assert.equal(data.checks.database.status, 'UP');
  assert.ok(data.checks.database.articleCount > 0);
  assert.equal(data.checks.cache.status, 'UP');
  assert.ok(typeof data.checks.cache.hitRate === 'string');
});

// 8. 10 Repeated Queries Benchmark (P50, P95, Latency Measurement)
test('8. Production - 10 repeated queries benchmark measures P50, P95, and cache efficiency', async () => {
  cacheService.clear();
  const latencies: number[] = [];

  const makeReq = () =>
    new Request('http://localhost:5173/api/ai/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'What happened in Jalandhar today?',
        location: { latitude: 31.3260, longitude: 75.5762 },
      }),
    });

  // Run 10 consecutive requests
  for (let i = 0; i < 10; i++) {
    const tStart = Date.now();
    const res = await handleQueryRequest(makeReq());
    assert.equal(res.status, 200);
    latencies.push(Date.now() - tStart);
  }

  // Sort latencies for percentiles
  latencies.sort((a, b) => a - b);
  const p50 = latencies[Math.floor(latencies.length * 0.5)];
  const p95 = latencies[Math.floor(latencies.length * 0.95)];
  const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length;

  console.log(`\n  [Performance Benchmark] Latencies (10 queries):`);
  console.log(`  Avg: ${avg.toFixed(1)}ms | P50: ${p50}ms | P95: ${p95}ms | All: [${latencies.join(', ')}]ms`);

  const stats = cacheService.getStats();
  assert.equal(stats.hits, 9);
  assert.equal(stats.misses, 1);
  assert.ok(p50 <= 5, `Expected P50 <= 5ms on cached queries, got ${p50}ms`);
});
