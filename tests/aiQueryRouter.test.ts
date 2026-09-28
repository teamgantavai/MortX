import test from 'node:test';
import assert from 'node:assert/strict';
import { AIQueryRouter } from '../src/server/ai/queryRouter';
import { validateStructuredQuery } from '../src/server/ai/validator';
import { handleQueryRequest } from '../src/server/handlers/queryHandler';



test('AI Query Router - "What happened near me today?"', async () => {
  const router = new AIQueryRouter();
  const result = await router.routeQuery({
    query: 'What happened near me today?',
    userLocation: { latitude: 31.3260, longitude: 75.5762 },
  });

  assert.equal(result.intent, 'LOCAL_NEWS');
  assert.equal(result.category, 'NEWS');
  assert.ok(result.location);
  assert.equal(result.location?.type, 'USER_LOCATION');
  assert.equal(result.location?.latitude, 31.3260);
  assert.equal(result.location?.longitude, 75.5762);
  assert.ok(result.timeRange);
  assert.equal(result.timeRange?.type, 'TODAY');
});

test('AI Query Router - "What happened in Jalandhar today?"', async () => {
  const router = new AIQueryRouter();
  const result = await router.routeQuery({
    query: 'What happened in Jalandhar today?',
  });

  assert.equal(result.intent, 'LOCAL_NEWS');
  assert.equal(result.category, 'NEWS');
  assert.ok(result.location);
  assert.equal(result.location?.type, 'NAMED_LOCATION');
  assert.equal(result.location?.placeName, 'Jalandhar');
  assert.equal(result.timeRange?.type, 'TODAY');
});

test('AI Query Router - "Find PG under 8000 near me"', async () => {
  const router = new AIQueryRouter();
  const result = await router.routeQuery({
    query: 'Find PG under 8000 near me',
  });

  assert.equal(result.intent, 'PG_SEARCH');
  assert.equal(result.category, 'PG');
  assert.ok(result.location);
  assert.equal(result.location?.type, 'USER_LOCATION');
  assert.equal(result.timeRange, null);
  assert.equal(result.filters?.maxPrice, 8000);
});

test('AI Query Router - "What are tomato prices today?"', async () => {
  const router = new AIQueryRouter();
  const result = await router.routeQuery({
    query: 'What are tomato prices today?',
  });

  assert.equal(result.intent, 'PRICE_SEARCH');
  assert.equal(result.category, 'PRICE');
  assert.ok(result.location);
  assert.equal(result.location?.type, 'NEAR_USER');
  assert.equal(result.timeRange?.type, 'TODAY');
  assert.ok(result.keywords.includes('tomato'));
});

test('AI Query Router - "Upcoming events this week around Model Town"', async () => {
  const router = new AIQueryRouter();
  const result = await router.routeQuery({
    query: 'Upcoming events this week around Model Town',
  });

  assert.equal(result.intent, 'LOCAL_EVENTS');
  assert.equal(result.category, 'EVENTS');
  assert.ok(result.location);
  assert.equal(result.location?.type, 'NAMED_LOCATION');
  assert.equal(result.location?.placeName, 'Model Town');
  assert.equal(result.timeRange?.type, 'THIS_WEEK');
});

test('AI Query Router - "Best engineering colleges near my college"', async () => {
  const router = new AIQueryRouter();
  const result = await router.routeQuery({
    query: 'Best engineering colleges near my college',
  });

  assert.equal(result.intent, 'COLLEGE_SEARCH');
  assert.equal(result.category, 'COLLEGE');
  assert.ok(result.location);
  assert.equal(result.location?.type, 'NEAR_COLLEGE');
  assert.ok(result.keywords.includes('engineering'));
});

test('AI Query Router - Radius extraction "Traffic updates within 5 km"', async () => {
  const router = new AIQueryRouter();
  const result = await router.routeQuery({
    query: 'Traffic updates within 5 km',
  });

  assert.equal(result.intent, 'LOCAL_NEWS');
  assert.ok(result.location);
  assert.equal(result.location?.radiusKm, 5);
});

test('AI Query Router - "Explain quantum computing in simple terms"', async () => {
  const router = new AIQueryRouter();
  const result = await router.routeQuery({
    query: 'Explain quantum computing in simple terms',
  });

  assert.equal(result.intent, 'GENERAL_AI_QUERY');
  assert.equal(result.category, 'GENERAL');
  assert.equal(result.timeRange, null);
});

test('Validator - rejects invalid intent and malformed structure', () => {
  const invalidResult = validateStructuredQuery({
    intent: 'UNKNOWN_CUSTOM_INTENT',
    category: 'INVALID_CATEGORY',
  });

  assert.equal(invalidResult.valid, false);
  assert.ok(invalidResult.errors.length > 0);
  assert.ok(invalidResult.errors[0].includes('Invalid intent'));
});

test('HTTP Handler - POST /api/ai/query returns 200 with structured query', async () => {
  const req = new Request('http://localhost:5173/api/ai/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: 'What happened near me today?',
      location: { latitude: 31.3260, longitude: 75.5762 },
    }),
  });

  const res = await handleQueryRequest(req);
  assert.equal(res.status, 200);

  const data = await res.json();
  assert.equal(data.success, true);
  assert.equal(data.query.intent, 'LOCAL_NEWS');
  assert.equal(data.query.location.type, 'USER_LOCATION');
  assert.equal(data.query.location.latitude, 31.3260);
  assert.equal(data.query.timeRange.type, 'TODAY');
  assert.ok(Array.isArray(data.results));
});

test('HTTP Handler - rejects invalid request without query', async () => {
  const req = new Request('http://localhost:5173/api/ai/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });

  const res = await handleQueryRequest(req);
  assert.equal(res.status, 400);

  const data = await res.json();
  assert.equal(data.success, false);
  assert.ok(data.error);
});
