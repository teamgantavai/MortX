import test from 'node:test';
import assert from 'node:assert/strict';
import { NewsFeedFetcher } from '../src/server/ingestion/feedFetcher';
import { ArticleNormalizer } from '../src/server/ingestion/normalizer';
import { LocationExtractor } from '../src/server/ingestion/locationExtractor';
import { ArticleCategorizer } from '../src/server/ingestion/categorizer';
import { ArticleRepository } from '../src/server/db/articleRepository';
import { DatabaseNewsSource } from '../src/server/retrieval/sources/databaseNewsSource';
import { NewsSourceConfig, NewsArticleRecord } from '../src/server/ingestion/types';
import { sourceRepository } from '../src/server/db/sourceRepository';
import { getDb } from '../src/server/db/database';

const sampleSource: NewsSourceConfig = {
  id: 'test-punjab-source',
  name: 'Test Punjab News',
  type: 'RSS',
  baseUrl: 'https://testnews.punjab.local',
  feedUrl: 'https://testnews.punjab.local/rss.xml',
  enabled: true,
  language: 'en',
  region: 'Punjab',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// Ensure sample source is registered in the database for foreign key integrity
sourceRepository.upsertSource(sampleSource);


// 1. Valid RSS feed test
test('1. Ingestion - parses valid RSS feed XML', () => {
  const fetcher = new NewsFeedFetcher();
  const validXml = `<?xml version="1.0" encoding="UTF-8"?>
  <rss version="2.0">
    <channel>
      <title>Punjab Civic News</title>
      <link>https://punjabnews.local</link>
      <description>Latest civic updates</description>
      <item>
        <title><![CDATA[New Bus Rapid Transit Route Opened in Amritsar]]></title>
        <link>https://punjabnews.local/articles/brts-amritsar</link>
        <description>The municipal transit authority launched 15 new electric buses.</description>
        <pubDate>Mon, 28 Sep 2026 10:00:00 GMT</pubDate>
        <category>Traffic</category>
      </item>
    </channel>
  </rss>`;

  const items = fetcher.parseFeedXml(validXml);
  assert.equal(items.length, 1);
  assert.equal(items[0].title, 'New Bus Rapid Transit Route Opened in Amritsar');
  assert.equal(items[0].link, 'https://punjabnews.local/articles/brts-amritsar');
  assert.ok(items[0].description?.includes('electric buses'));
  assert.equal(items[0].categories?.[0], 'Traffic');
});

// 2. Invalid feed test
test('2. Ingestion - handles invalid and empty feeds safely', () => {
  const fetcher = new NewsFeedFetcher();
  assert.deepEqual(fetcher.parseFeedXml(''), []);
  assert.deepEqual(fetcher.parseFeedXml('not xml content at all'), []);
  assert.deepEqual(fetcher.parseFeedXml('<html><body>404 Not Found</body></html>'), []);
});

// 3. Network timeout test
test('3. Ingestion - handles network timeout gracefully', async () => {
  const fetcher = new NewsFeedFetcher();
  const unreachableSource: NewsSourceConfig = {
    ...sampleSource,
    feedUrl: 'http://10.255.255.1/feed.xml', // Non-routable IP
  };

  await assert.rejects(
    async () => {
      await fetcher.fetchSource(unreachableSource, { timeoutMs: 50 });
    },
    (err: any) => {
      return err.message.includes('timed out');
    }
  );
});

// 4. Malformed article test
test('4. Ingestion - skips malformed items without title or link', () => {
  const fetcher = new NewsFeedFetcher();
  const malformedXml = `
  <rss version="2.0">
    <channel>
      <item>
        <!-- Missing link -->
        <title>Article Without Link</title>
      </item>
      <item>
        <!-- Missing title -->
        <link>https://news.local/no-title</link>
      </item>
      <item>
        <!-- Valid item -->
        <title>Valid Headline</title>
        <link>https://news.local/valid-item</link>
      </item>
    </channel>
  </rss>`;

  const items = fetcher.parseFeedXml(malformedXml);
  assert.equal(items.length, 1);
  assert.equal(items[0].title, 'Valid Headline');
});

// 5. Duplicate URL test
test('5. Ingestion - prevents duplicate article insertion by URL', () => {
  const repo = new ArticleRepository();
  const now = new Date().toISOString();

  const testTitle = `Water Pipeline Upgrades in Cantt Jalandhar ${Date.now()}_${Math.random()}`;
  const article1: NewsArticleRecord = {
    id: `test-url-dup-1-${Date.now()}`,
    title: testTitle,
    description: 'Upgrades to improve pressure across 5 wards.',
    sourceId: sampleSource.id,
    sourceUrl: sampleSource.baseUrl,
    articleUrl: `https://testnews.local/article-${Date.now()}`,
    publishedAt: now,
    firstSeenAt: now,
    lastSeenAt: now,
    locationName: 'Jalandhar Cantt, Jalandhar',
    latitude: 31.285,
    longitude: 75.615,
    category: 'NEWS',
    language: 'en',
    contentHash: `hash-url-test-1-${Date.now()}`,
    status: 'active',
    createdAt: now,
    updatedAt: now,
  };

  const insertedFirst = repo.insertArticle(article1);
  assert.equal(insertedFirst, true);

  // Attempt duplicate insertion with same URL
  const article2: NewsArticleRecord = {
    ...article1,
    id: `test-url-dup-2-${Date.now()}`,
    contentHash: `different-hash-${Date.now()}`,
  };

  const insertedDuplicate = repo.insertArticle(article2);
  assert.equal(insertedDuplicate, false);
});

// 6. Duplicate content test
test('6. Ingestion - prevents duplicate insertion by content hash', () => {
  const repo = new ArticleRepository();
  const normalizer = new ArticleNormalizer();
  const now = new Date().toISOString();

  const title = `Major Cricket Tournament Announced in Burlton Park ${Date.now()}`;
  const desc = 'District sports association announced 16 teams participating.';
  const hash = normalizer.computeContentHash(title, desc);

  const articleA: NewsArticleRecord = {
    id: `test-hash-a-${Date.now()}`,
    title,
    description: desc,
    sourceId: sampleSource.id,
    sourceUrl: sampleSource.baseUrl,
    articleUrl: `https://source-a.local/sports-${Date.now()}`,
    publishedAt: now,
    firstSeenAt: now,
    lastSeenAt: now,
    locationName: 'Jalandhar',
    latitude: 31.326,
    longitude: 75.5762,
    category: 'EVENT',
    language: 'en',
    contentHash: hash,
    status: 'active',
    createdAt: now,
    updatedAt: now,
  };

  assert.equal(repo.insertArticle(articleA), true);

  // Same title & description from a different URL
  const articleB: NewsArticleRecord = {
    ...articleA,
    id: `test-hash-b-${Date.now()}`,
    articleUrl: `https://syndicated-source-b.local/repost-${Date.now()}`,
  };

  assert.equal(repo.insertArticle(articleB), false);
});

// 7. Missing publication date test
test('7. Ingestion - normalizes missing pubDate to valid ISO timestamp', () => {
  const normalizer = new ArticleNormalizer();
  const raw = {
    title: 'Cleanliness Drive Announced',
    link: 'https://news.local/cleanliness?utm_source=rss&utm_medium=feed',
    description: '<p>Volunteers cleaned <b>Rama Mandi</b> park.</p>',
    // pubDate missing
  };

  const normalized = normalizer.normalize(raw, sampleSource);
  assert.ok(normalized.publishedAt);
  // Verify it is a valid ISO 8601 date
  assert.ok(!isNaN(new Date(normalized.publishedAt).getTime()));
  // Verify HTML tags were stripped
  assert.equal(normalized.description, 'Volunteers cleaned Rama Mandi park.');
  // Verify tracking query params removed from URL
  assert.equal(normalized.url, 'https://news.local/cleanliness');
});

// 8. Location extraction test
test('8. Ingestion - extracts city and locality accurately', () => {
  const extractor = new LocationExtractor();

  // Test Locality + City
  const loc1 = extractor.extract(
    'Traffic restrictions announced in Model Town, Jalandhar for marathon',
    'Vehicles will be diverted away from the market.'
  );
  assert.equal(loc1.city, 'Jalandhar');
  assert.equal(loc1.locality, 'Model Town');
  assert.equal(loc1.name, 'Model Town, Jalandhar');
  assert.ok(loc1.latitude && loc1.longitude);

  // Test City only
  const loc2 = extractor.extract(
    'Ludhiana municipal corporation starts solar street light program'
  );
  assert.equal(loc2.city, 'Ludhiana');

  // Test Fallback region
  const loc3 = extractor.extract(
    'Statewide advisory issued regarding agricultural water supply',
    '',
    'Punjab'
  );
  assert.equal(loc3.name, 'Punjab');
});

// 9. Category assignment test
test('9. Ingestion - classifies categories without hallucination', () => {
  const categorizer = new ArticleCategorizer();

  assert.equal(
    categorizer.categorize('Police arrested 3 suspects in debit card scam in Jalandhar'),
    'CRIME'
  );
  assert.equal(
    categorizer.categorize('Heavy traffic congestion on Ferozepur Road flyover due to diversion'),
    'TRAFFIC'
  );
  assert.equal(
    categorizer.categorize('PTU releases official syllabus for BTech 2026-27 examinations'),
    'EDUCATION'
  );
  assert.equal(
    categorizer.categorize('Municipal corporation approves new civic development budget'),
    'GOVERNMENT'
  );
  assert.equal(
    categorizer.categorize('Three-day cultural festival begins at Desh Bhagat Yadgar Hall'),
    'EVENT'
  );
  assert.equal(
    categorizer.categorize('Quantum computing principles and algorithmic hardware'),
    'OTHER'
  );
});

// 10. Database insertion test
test('10. Ingestion - inserts and retrieves NewsArticleRecord from SQLite database', () => {
  const repo = new ArticleRepository();
  const testId = `art-db-test-${Date.now()}`;
  const now = new Date().toISOString();
  const testTitle = `New Flyover Inaugurated at PAP Chowk Jalandhar ${Date.now()}_${Math.random()}`;

  const record: NewsArticleRecord = {
    id: testId,
    title: testTitle,
    description: 'The six-lane PAP Chowk flyover opened to regular traffic today.',
    sourceId: sampleSource.id,
    sourceUrl: sampleSource.baseUrl,
    articleUrl: `https://testnews.punjab.local/pap-chowk-${Date.now()}`,
    publishedAt: now,
    firstSeenAt: now,
    lastSeenAt: now,
    locationName: 'PAP Chowk, Jalandhar',
    latitude: 31.326,
    longitude: 75.5762,
    category: 'TRAFFIC',
    language: 'en',
    contentHash: `hash-pap-${Date.now()}`,
    status: 'active',
    createdAt: now,
    updatedAt: now,
  };

  const inserted = repo.insertArticle(record);
  assert.equal(inserted, true);

  const fetched = repo.findByUrl(record.articleUrl);
  assert.ok(fetched);
  assert.equal(fetched?.id, testId);
  assert.equal(fetched?.title, record.title);
  assert.equal(fetched?.category, 'TRAFFIC');
  assert.equal(fetched?.locationName, 'PAP Chowk, Jalandhar');
});

// 11. Retrieval of today's news test
test("11. Retrieval - retrieves today's stored news from DatabaseNewsSource", async () => {
  const repo = new ArticleRepository();
  const source = new DatabaseNewsSource();
  const now = new Date();
  const testUrl = `https://testnews.punjab.local/todays-news-${Date.now()}`;
  const testTitle = `Smart City Sensor Network Operational in Jalandhar ${Date.now()}_${Math.random()}`;

  // Insert a fresh article published today
  const inserted = repo.insertArticle({
    id: `art-today-${Date.now()}`,
    title: testTitle,
    description: 'Air quality and noise sensors have been deployed across 24 junctions in Jalandhar.',
    sourceId: sampleSource.id,
    sourceUrl: sampleSource.baseUrl,
    articleUrl: testUrl,
    publishedAt: now.toISOString(),
    firstSeenAt: now.toISOString(),
    lastSeenAt: now.toISOString(),
    locationName: 'Jalandhar',
    latitude: 31.326,
    longitude: 75.5762,
    category: 'NEWS',
    language: 'en',
    contentHash: `hash-today-${Date.now()}`,
    status: 'active',
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  });
  assert.equal(inserted, true);

  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  const results = await source.search({
    intent: 'LOCAL_NEWS',
    category: 'NEWS',
    keywords: [],
    location: {
      type: 'NAMED_LOCATION',
      placeName: 'Jalandhar',
    },
    dateRange: {
      startDate: startOfDay,
      endDate: now,
    },
  });

  assert.ok(results.length > 0);
  const found = results.find((r) => r.source.url === testUrl);
  assert.ok(found);
  assert.equal(found?.title, testTitle);
  assert.equal(found?.source.isMock, false);
});

// 12. Retrieval with no matching results test
test('12. Retrieval - returns empty array when query has no matching records', async () => {
  const source = new DatabaseNewsSource();

  const results = await source.search({
    intent: 'LOCAL_NEWS',
    category: 'NEWS',
    keywords: ['nonexistentkeywordXYZ12345'],
    location: {
      type: 'NAMED_LOCATION',
      placeName: 'Tokyo',
    },
  });

  assert.deepEqual(results, []);
});
