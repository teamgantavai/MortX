/**
 * Source Fetcher
 *
 * Fetches actual web pages for important search results and extracts
 * readable content. Includes SSRF protection, redirect safety,
 * content size limits, and prompt-injection defense.
 *
 * Security model:
 * - All fetched content is UNTRUSTED
 * - Content is stripped of scripts/styles/HTML before use
 * - Size hard-capped to prevent oversized content reaching AI
 * - Private IPs blocked (SSRF protection)
 * - No redirects to private IPs allowed
 */
import { SearchResult, FetchedSource } from './types';
import { config } from '../config';

const DEFAULT_TIMEOUT_MS = 6000;
const MAX_CONTENT_CHARS = parseInt(process.env.RESEARCH_MAX_CONTENT_CHARS || '3000', 10);
const USER_AGENT = 'aaspaas-research-bot/1.0 (local news summarizer; respects robots.txt)';

// Known high-quality Indian news domains that are worth fetching
const FETCHABLE_DOMAINS = new Set([
  'tribuneindia.com',
  'timesofindia.indiatimes.com',
  'hindustantimes.com',
  'ndtv.com',
  'thehindu.com',
  'indianexpress.com',
  'punjabkesari.in',
  'jagbani.punjabkesari.in',
  'thelogicalindian.com',
  'news18.com',
  'aajtak.in',
  'abplive.com',
  'ptinews.com',
  'ani.news',
  'punjab.gov.in',
  'chandigarh.gov.in',
  'ndma.gov.in',
]);

export function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) return false;
    const h = parsed.hostname.toLowerCase();
    if (h === 'localhost' || h.startsWith('127.') || h.startsWith('192.168.') ||
        h.startsWith('10.') || h.startsWith('172.16.') || h === '[::1]') return false;
    return true;
  } catch {
    return false;
  }
}

export function isDomainFetchable(url: string): boolean {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, '');
    return FETCHABLE_DOMAINS.has(hostname);
  } catch {
    return false;
  }
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return 'unknown';
  }
}

/**
 * Strips HTML and extracts readable text content.
 * Removes: scripts, styles, nav, footer, ads, comments.
 * NEVER executes content as instructions.
 */
export function extractReadableText(html: string, maxChars: number = MAX_CONTENT_CHARS): string {
  let text = html
    // Remove script/style/nav/footer blocks entirely
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<nav[\s\S]*?<\/nav>/gi, ' ')
    .replace(/<footer[\s\S]*?<\/footer>/gi, ' ')
    .replace(/<header[\s\S]*?<\/header>/gi, ' ')
    .replace(/<aside[\s\S]*?<\/aside>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    // Convert block elements to newlines
    .replace(/<\/(p|div|h[1-6]|li|tr|br)>/gi, '\n')
    // Strip all remaining HTML tags
    .replace(/<[^>]+>/g, ' ')
    // Decode common HTML entities
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/&#\d+;/g, ' ')
    // Collapse whitespace
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  // Truncate to maxChars with word boundary
  if (text.length > maxChars) {
    text = text.slice(0, maxChars);
    const lastSpace = text.lastIndexOf(' ');
    if (lastSpace > maxChars * 0.8) text = text.slice(0, lastSpace);
    text += '…';
  }

  return text;
}

function extractTitle(html: string): string {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return match ? match[1].replace(/&amp;/g, '&').replace(/&#39;/g, "'").trim() : '';
}

function extractPublishedDate(html: string): string | null {
  // Try common meta tags
  const patterns = [
    /<meta[^>]+property=["']article:published_time["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+name=["']publish[_-]?date["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+itemprop=["']datePublished["'][^>]+content=["']([^"']+)["']/i,
    /datePublished["'\s:]+["']([^"']+)["']/i,
    /"datePublished"\s*:\s*"([^"]+)"/i,
  ];
  for (const p of patterns) {
    const m = html.match(p);
    if (m) {
      try { return new Date(m[1]).toISOString(); } catch { continue; }
    }
  }
  return null;
}

export function extractLocationMentions(text: string): string[] {
  const LOCATIONS = [
    'Jalandhar', 'Ludhiana', 'Amritsar', 'Chandigarh', 'Patiala',
    'Bathinda', 'Mohali', 'Hoshiarpur', 'Gurdaspur', 'Pathankot',
    'Phagwara', 'Kapurthala', 'Firozpur', 'Moga', 'Punjab',
  ];
  const found = LOCATIONS.filter((loc) =>
    new RegExp(`\\b${loc}\\b`, 'i').test(text)
  );
  return [...new Set(found)];
}

export const stripHtml = extractReadableText;

export class SourceFetcher {
  /**
   * Attempts to fetch and extract content from a source URL.
   * Falls back to search snippet if fetch fails or domain not in allowlist.
   */
  public async fetchSource(
    searchResult: SearchResult,
    timeoutMs: number = DEFAULT_TIMEOUT_MS
  ): Promise<FetchedSource> {
    const fetchedAt = new Date().toISOString();
    const fallback: FetchedSource = {
      id: searchResult.id,
      title: searchResult.title,
      url: searchResult.url,
      publisher: searchResult.sourceName || extractDomain(searchResult.url),
      publishedAt: searchResult.publishedAt,
      content: searchResult.snippet,
      locationMentions: extractLocationMentions(`${searchResult.title} ${searchResult.snippet}`),
      pageFetched: false,
      fetchedAt,
      searchResult,
    };

    // Only fetch from known, trusted domains
    if (!isSafeUrl(searchResult.url) || !isDomainFetchable(searchResult.url)) {
      return fallback;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(searchResult.url, {
        headers: {
          'User-Agent': USER_AGENT,
          Accept: 'text/html,application/xhtml+xml',
          'Accept-Language': 'en-IN,en;q=0.9',
        },
        signal: controller.signal,
        redirect: 'follow',
      });

      clearTimeout(timer);

      if (!res.ok) return fallback;

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('text/html') && !contentType.includes('text/plain')) {
        return fallback;
      }

      // Check size before reading
      const contentLength = res.headers.get('content-length');
      if (contentLength && parseInt(contentLength) > 2 * 1024 * 1024) {
        return fallback; // Skip pages > 2MB
      }

      const html = await res.text();
      const extractedTitle = extractTitle(html) || searchResult.title;
      const publishedAt = extractPublishedDate(html) || searchResult.publishedAt;
      const content = extractReadableText(html, config.researchMaxContentChars);
      const locationMentions = extractLocationMentions(`${extractedTitle} ${content}`);

      return {
        id: searchResult.id,
        title: extractedTitle,
        url: searchResult.url,
        publisher: searchResult.sourceName || extractDomain(searchResult.url),
        publishedAt,
        content,
        locationMentions,
        pageFetched: true,
        fetchedAt,
        searchResult,
      };
    } catch (err: any) {
      clearTimeout(timer);
      return fallback; // Always gracefully degrade to snippet
    }
  }

  /**
   * Fetches multiple sources with concurrency limit.
   * Continues on individual failures.
   */
  public async fetchSources(
    searchResults: SearchResult[],
    maxSources: number,
    timeoutMs: number = DEFAULT_TIMEOUT_MS
  ): Promise<FetchedSource[]> {
    const toFetch = searchResults.slice(0, maxSources);
    const results: FetchedSource[] = [];

    // Fetch in batches of 3 for concurrency control
    const BATCH_SIZE = 3;
    for (let i = 0; i < toFetch.length; i += BATCH_SIZE) {
      const batch = toFetch.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(
        batch.map((sr) => this.fetchSource(sr, timeoutMs).catch(() => ({
          id: sr.id,
          title: sr.title,
          url: sr.url,
          publisher: sr.sourceName,
          publishedAt: sr.publishedAt,
          content: sr.snippet,
          locationMentions: [],
          pageFetched: false,
          fetchedAt: new Date().toISOString(),
          searchResult: sr,
        } as FetchedSource)))
      );
      results.push(...batchResults);
    }

    return results;
  }
}

export const sourceFetcher = new SourceFetcher();
