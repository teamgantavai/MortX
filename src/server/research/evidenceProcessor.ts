/**
 * Evidence Processor
 *
 * Converts FetchedSources into ranked, deduplicated ResearchEvidenceItems.
 *
 * Pipeline:
 * 1. Normalize (build evidence text, assign tiers)
 * 2. Score (relevance + location + freshness → rank)
 * 3. Deduplicate (group near-duplicate stories into clusters)
 * 4. Return ranked primary items + clusters
 */
import crypto from 'node:crypto';
import { FetchedSource, ResearchEvidenceItem, EvidenceCluster } from './types';

// Source tier classification — affects rank score
const TIER_DOMAINS: Record<string, ResearchEvidenceItem['tier']> = {
  'punjab.gov.in': 'OFFICIAL',
  'chandigarh.gov.in': 'OFFICIAL',
  'ndma.gov.in': 'OFFICIAL',
  'mausam.imd.gov.in': 'OFFICIAL',
  'tribuneindia.com': 'ESTABLISHED_NEWS',
  'hindustantimes.com': 'ESTABLISHED_NEWS',
  'thehindu.com': 'ESTABLISHED_NEWS',
  'ndtv.com': 'ESTABLISHED_NEWS',
  'timesofindia.indiatimes.com': 'ESTABLISHED_NEWS',
  'indianexpress.com': 'ESTABLISHED_NEWS',
  'ptinews.com': 'ESTABLISHED_NEWS',
  'ani.news': 'ESTABLISHED_NEWS',
  'news18.com': 'REGIONAL_NEWS',
  'punjabkesari.in': 'REGIONAL_NEWS',
  'abplive.com': 'REGIONAL_NEWS',
  'aajtak.in': 'REGIONAL_NEWS',
};

const TIER_SCORE: Record<ResearchEvidenceItem['tier'], number> = {
  OFFICIAL: 1.0,
  ESTABLISHED_NEWS: 0.85,
  REGIONAL_NEWS: 0.7,
  WEB: 0.5,
};

function getDomain(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return 'unknown'; }
}

function getTier(url: string): ResearchEvidenceItem['tier'] {
  const domain = getDomain(url);
  return TIER_DOMAINS[domain] || 'WEB';
}

function freshnessScore(publishedAt: string | null): number {
  if (!publishedAt) return 0.3;
  const ageHours = (Date.now() - new Date(publishedAt).getTime()) / (1000 * 60 * 60);
  if (ageHours <= 6) return 1.0;
  if (ageHours <= 24) return 0.9;
  if (ageHours <= 72) return 0.7;
  if (ageHours <= 168) return 0.5;
  return 0.2;
}

function locationScore(source: FetchedSource, locationContext: string): number {
  if (!locationContext) return 0.5;
  const locationLower = locationContext.toLowerCase();
  const textToCheck = `${source.title} ${source.content}`.toLowerCase();

  // Exact location mentioned → high score
  if (textToCheck.includes(locationLower)) return 1.0;

  // Location mentions from extraction
  const mentionMatch = source.locationMentions.some(
    (m) => m.toLowerCase() === locationLower || locationLower.includes(m.toLowerCase())
  );
  if (mentionMatch) return 0.8;

  // Only consider Punjab/India if the query was actually for Punjab/India or near user
  if (locationLower.includes('punjab') || locationLower.includes('india')) {
    if (textToCheck.includes('punjab') || textToCheck.includes('chandigarh') || textToCheck.includes('jalandhar') || textToCheck.includes('ludhiana')) {
      return 0.5;
    }
  }

  return 0.05;
}

function relevanceScore(source: FetchedSource, query: string, keywords: string[]): number {
  const text = `${source.title} ${source.content}`.toLowerCase();
  const stopWords = new Set(['what', 'when', 'where', 'which', 'this', 'that', 'with', 'from', 'have', 'news', 'today', 'weekend', 'around', 'near']);
  const queryWords = query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 3 && !stopWords.has(w));
  const allKeywords = Array.from(new Set([...queryWords, ...keywords.map((k) => k.toLowerCase())]));

  if (allKeywords.length === 0) return 0.5;

  const matches = allKeywords.filter((kw) => text.includes(kw));
  if (matches.length === 0) return 0.1;
  return Math.min(1.0, (matches.length / allKeywords.length) * 0.8 + 0.2);
}

/**
 * Simple title-based deduplication using character n-gram similarity.
 * Groups sources whose titles share >60% of bigrams.
 */
function titleSimilarity(a: string, b: string): number {
  const bigrams = (s: string): Set<string> => {
    const clean = s.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(/\s+/).join(' ');
    const result = new Set<string>();
    for (let i = 0; i < clean.length - 1; i++) result.add(clean.slice(i, i + 2));
    return result;
  };
  const bg1 = bigrams(a);
  const bg2 = bigrams(b);
  if (bg1.size === 0 || bg2.size === 0) return 0;
  let intersection = 0;
  for (const b of bg1) if (bg2.has(b)) intersection++;
  return (2 * intersection) / (bg1.size + bg2.size);
}

export class EvidenceProcessor {
  public process(
    sources: FetchedSource[],
    query: string,
    locationContext: string,
    keywords: string[] = []
  ): { items: ResearchEvidenceItem[]; clusters: EvidenceCluster[] } {
    // 1. Normalize + Score
    const items: ResearchEvidenceItem[] = sources.map((src) => {
      const tier = getTier(src.url);
      const fresh = freshnessScore(src.publishedAt);
      const loc = locationScore(src, locationContext);
      const rel = relevanceScore(src, query, keywords);
      const tierScoreValue = TIER_SCORE[tier];

      // Weighted rank: relevance 35%, location 30%, freshness 25%, tier 10%
      const rank = rel * 0.35 + loc * 0.30 + fresh * 0.25 + tierScoreValue * 0.10;

      // Build evidence text — title + content, truncated
      const evidenceText = src.content
        ? `${src.title}\n${src.content.slice(0, 1500)}`
        : src.title;

      return {
        id: src.id,
        title: src.title,
        url: src.url,
        publisher: src.publisher,
        publishedAt: src.publishedAt,
        evidenceText,
        relevanceScore: rel,
        locationScore: loc,
        freshnessScore: fresh,
        rankScore: rank,
        tier,
        clusterId: null,
        isClusterPrimary: false,
        supportingUrls: [],
      };
    });

    // 2. Sort by rank descending
    items.sort((a, b) => b.rankScore - a.rankScore);

    // 3. Deduplicate: cluster similar items
    const SIMILARITY_THRESHOLD = 0.55;
    const clustered = new Set<string>();
    const clusters: EvidenceCluster[] = [];

    for (let i = 0; i < items.length; i++) {
      if (clustered.has(items[i].id)) continue;

      const primary = items[i];
      const supporting: ResearchEvidenceItem[] = [];

      for (let j = i + 1; j < items.length; j++) {
        if (clustered.has(items[j].id)) continue;
        const sim = titleSimilarity(primary.title, items[j].title);
        if (sim >= SIMILARITY_THRESHOLD) {
          supporting.push(items[j]);
          clustered.add(items[j].id);
          items[j].clusterId = primary.id;
          items[j].isClusterPrimary = false;
        }
      }

      const clusterId = primary.id;
      primary.clusterId = clusterId;
      primary.isClusterPrimary = true;
      primary.supportingUrls = supporting.map((s) => s.url);
      clustered.add(primary.id);

      if (supporting.length > 0) {
        clusters.push({
          id: clusterId,
          primaryItem: primary,
          supportingItems: supporting,
          mergedEvidenceText: [primary.evidenceText, ...supporting.map((s) => s.title)].join('\n---\n'),
          supportingSourceCount: supporting.length,
        });
      }
    }

    // 4. Return only primary items that meet minimum relevance thresholds
    const primaryItems = items.filter((it) => {
      if (!it.isClusterPrimary) return false;
      // If a specific location was specified (other than generic Punjab), require location match or strong relevance
      if (locationContext && locationContext !== 'Punjab, India') {
        if (it.locationScore <= 0.1 && it.relevanceScore <= 0.3) {
          return false;
        }
      }
      return it.rankScore >= 0.25;
    });

    return { items: primaryItems, clusters };
  }
}

export const evidenceProcessor = new EvidenceProcessor();
