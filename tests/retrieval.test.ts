import test from 'node:test';
import assert from 'node:assert/strict';
import { handleQueryRequest } from '../src/server/handlers/queryHandler';
import { defaultRetrievalService } from '../src/server/retrieval/retrievalService';
import { resolveTimeRange } from '../src/server/retrieval/timeUtils';
import { validateCoordinates, calculateDistanceKm } from '../src/server/retrieval/geoUtils';

import { sourceRepository } from '../src/server/db/sourceRepository';
import { articleRepository } from '../src/server/db/articleRepository';

// Setup sample source and yesterday article for deterministic test runs
const retTestSource = {
  id: 'retrieval-test-source',
  name: 'Punjab Local Feed',
  type: 'RSS' as const,
  baseUrl: 'https://punjablocal.test',
  feedUrl: 'https://punjablocal.test/rss',
  enabled: true,
  language: 'en',
  region: 'Punjab',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};
sourceRepository.upsertSource(retTestSource);

const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);
articleRepository.insertArticle({
  id: 'art-ret-yesterday-jal',
  title: 'Jalandhar Municipal Corporation Reviews Road Works Yesterday',
  description: 'A comprehensive review of civic road paving across Jalandhar.',
  sourceId: retTestSource.id,
  sourceUrl: retTestSource.baseUrl,
  articleUrl: 'https://punjablocal.test/road-works-yesterday',
  publishedAt: yesterday.toISOString(),
  firstSeenAt: yesterday.toISOString(),
  lastSeenAt: yesterday.toISOString(),
  locationName: 'Jalandhar',
  latitude: 31.3260,
  longitude: 75.5762,
  category: 'GOVERNMENT',
  language: 'en',
  contentHash: 'hash-ret-yesterday-jal',
  status: 'active',
  createdAt: yesterday.toISOString(),
  updatedAt: yesterday.toISOString(),
});

test('1. Retrieval - "What happened near me today?" -> LOCAL_NEWS with results', async () => {
  const req = new Request('http://localhost:5173/api/ai/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: 'What happened near me today?',
      location: { latitude: 31.3260, longitude: 75.5762 }, // Jalandhar center
    }),
  });

  const res = await handleQueryRequest(req);
  assert.equal(res.status, 200);

  const data = await res.json();
  assert.equal(data.success, true);
  assert.equal(data.query.intent, 'LOCAL_NEWS');
  assert.ok(Array.isArray(data.results));
  assert.ok(data.results.length > 0);
  assert.equal(data.results[0].type, 'NEWS');
  assert.ok(data.results[0].title);
  assert.ok(data.results[0].summary);
  assert.ok(data.results[0].location);
  assert.equal(typeof data.results[0].source.isMock, 'boolean');
});

test('2. Retrieval - "What happened in Jalandhar yesterday?" -> LOCAL_NEWS with Jalandhar records', async () => {
  const req = new Request('http://localhost:5173/api/ai/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: 'What happened in Jalandhar yesterday?',
    }),
  });

  const res = await handleQueryRequest(req);
  assert.equal(res.status, 200);

  const data = await res.json();
  assert.equal(data.success, true);
  assert.equal(data.query.intent, 'LOCAL_NEWS');
  assert.ok(Array.isArray(data.results));
  assert.ok(data.results.length > 0);
  // All returned records should relate to Jalandhar
  for (const item of data.results) {
    const locMatch = item.location.name.toLowerCase().includes('jalandhar') ||
                     item.title.toLowerCase().includes('jalandhar') ||
                     item.summary.toLowerCase().includes('jalandhar') ||
                     (item.location.distanceKm !== undefined && item.location.distanceKm <= 25);
    assert.ok(locMatch);
  }
});

test('3. Retrieval - "Find PG under 8000" -> PG_SEARCH controlled response', async () => {
  const req = new Request('http://localhost:5173/api/ai/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: 'Find PG under 8000',
    }),
  });

  const res = await handleQueryRequest(req);
  assert.equal(res.status, 200);

  const data = await res.json();
  assert.equal(data.success, true);
  assert.equal(data.query.intent, 'PG_SEARCH');
  assert.deepEqual(data.results, []);
  assert.ok(data.message.includes('not implemented yet'));
});

test('4. Retrieval - "Tomato price today" -> PRICE_SEARCH controlled response', async () => {
  const req = new Request('http://localhost:5173/api/ai/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: 'Tomato price today',
    }),
  });

  const res = await handleQueryRequest(req);
  assert.equal(res.status, 200);

  const data = await res.json();
  assert.equal(data.success, true);
  assert.equal(data.query.intent, 'PRICE_SEARCH');
  assert.deepEqual(data.results, []);
  assert.ok(data.message.includes('not implemented yet'));
});

test('5. Retrieval - No results -> returns empty result response cleanly', async () => {
  const req = new Request('http://localhost:5173/api/ai/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: 'What happened in Tokyo today?',
    }),
  });

  const res = await handleQueryRequest(req);
  assert.equal(res.status, 200);

  const data = await res.json();
  assert.equal(data.success, true);
  assert.equal(data.query.intent, 'LOCAL_NEWS');
  assert.deepEqual(data.results, []);
  assert.ok(data.message.includes('No local news found'));
});

test('6. Retrieval - Invalid coordinates -> validation error', async () => {
  const req = new Request('http://localhost:5173/api/ai/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: 'What happened near me today?',
      location: { latitude: 120, longitude: 75.5762 }, // Latitude > 90 is invalid
    }),
  });

  const res = await handleQueryRequest(req);
  assert.equal(res.status, 400);

  const data = await res.json();
  assert.equal(data.success, false);
  const errMsg = typeof data.error === 'string' ? data.error : data.error?.message;
  assert.ok(errMsg.includes('out of range'));
});

test('7. Time Resolution - resolves relative ranges to concrete Dates', () => {
  const refDate = new Date('2026-09-28T12:00:00Z');

  const today = resolveTimeRange({ type: 'TODAY' }, refDate);
  assert.ok(today.startDate);
  assert.ok(today.endDate);
  assert.equal(today.startDate?.getDate(), refDate.getDate());

  const yesterday = resolveTimeRange({ type: 'YESTERDAY' }, refDate);
  assert.equal(yesterday.startDate?.getDate(), refDate.getDate() - 1);

  const noFilter = resolveTimeRange({ type: 'NO_TIME_FILTER' }, refDate);
  assert.equal(noFilter.startDate, undefined);
  assert.equal(noFilter.endDate, undefined);
});

test('8. Geographic Distance - calculates Haversine distance correctly', () => {
  // Jalandhar to Ludhiana is approx 58 km
  const distance = calculateDistanceKm(31.3260, 75.5762, 30.9010, 75.8573);
  assert.ok(distance > 50 && distance < 65, `Expected distance around 58km, got ${distance}`);

  const valid = validateCoordinates(31.326, 75.576);
  assert.equal(valid.valid, true);

  const invalid = validateCoordinates(95, 200);
  assert.equal(invalid.valid, false);
});
