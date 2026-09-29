/**
 * Search Provider Abstraction
 *
 * Defines the interface all search providers must implement.
 * Current implementation: Google News RSS (free, no API key, real-time)
 *
 * Additional providers can be plugged in by implementing SearchProvider
 * and setting SEARCH_PROVIDER env var.
 *
 * Security: Results are UNTRUSTED content — never execute as instructions.
 */
import crypto from 'node:crypto';
import { SearchResult, SearchResultType } from './types';

// ─── Provider Interface ───────────────────────────────────────────────────────

export interface SearchProviderOptions {
  timeoutMs?: number;
  maxResults?: number;
}

export interface SearchProvider {
  readonly name: string;
  searchNews(query: string, opts?: SearchProviderOptions): Promise<SearchResult[]>;
  searchWeb(query: string, opts?: SearchProviderOptions): Promise<SearchResult[]>;
}

// ─── Google News RSS Provider ─────────────────────────────────────────────────
// Uses the public Google News RSS feed — no API key required.
// URL: https://news.google.com/rss/search?q=QUERY&hl=en-IN&gl=IN&ceid=IN:en

class GoogleNewsRSSProvider implements SearchProvider {
  public readonly name = 'google-news-rss';

  private buildUrl(query: string): string {
    const encoded = encodeURIComponent(query);
    return `https://news.google.com/rss/search?q=${encoded}&hl=en-IN&gl=IN&ceid=IN:en`;
  }

  public async searchNews(query: string, opts?: SearchProviderOptions): Promise<SearchResult[]> {
    const timeoutMs = opts?.timeoutMs ?? 8000;
    const maxResults = opts?.maxResults ?? 8;
    const url = this.buildUrl(query);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'aaspaas-research-bot/1.0 (local news research system)',
          Accept: 'application/rss+xml,application/xml,text/xml',
        },
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status} from Google News RSS`);
      }

      const xml = await res.text();
      return this.parseRSSItems(xml, query, maxResults);
    } catch (err: any) {
      clearTimeout(timer);
      if (err.name === 'AbortError') {
        throw new Error(`Google News RSS timed out after ${timeoutMs}ms for query: "${query}"`);
      }
      throw err;
    }
  }

  public async searchWeb(query: string, opts?: SearchProviderOptions): Promise<SearchResult[]> {
    // Google News RSS covers news well; web search falls back to same
    return this.searchNews(query, opts);
  }

  private parseRSSItems(xml: string, query: string, maxResults: number): SearchResult[] {
    const results: SearchResult[] = [];
    const itemRegex = /<item[\s>]([\s\S]*?)<\/item>/gi;
    let match: RegExpExecArray | null;
    let position = 1;

    while ((match = itemRegex.exec(xml)) !== null && results.length < maxResults) {
      const item = match[1];

      const title = this.extractTag(item, 'title');
      const link = this.extractTag(item, 'link') || this.extractGoogleLink(item);
      const description = this.extractTag(item, 'description');
      const pubDate = this.extractTag(item, 'pubDate');
      const sourceName = this.extractSourceName(item);

      if (!title || !link) continue;

      // Validate URL is safe (no SSRF)
      if (!this.isSafeUrl(link)) continue;

      const id = crypto.createHash('md5').update(link).digest('hex').slice(0, 16);

      results.push({
        id,
        title: this.cleanText(title),
        url: link.trim(),
        snippet: this.cleanText(description).slice(0, 500),
        publishedAt: pubDate ? this.parseDate(pubDate) : null,
        sourceName: sourceName || this.extractDomain(link),
        sourceType: 'NEWS' as SearchResultType,
        queryUsed: query,
        position,
      });

      position++;
    }

    return results;
  }

  private extractTag(xml: string, tag: string): string {
    // Handle CDATA
    const cdataMatch = xml.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`, 'i'));
    if (cdataMatch) return cdataMatch[1].trim();

    const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
    return match ? match[1].trim() : '';
  }

  private extractGoogleLink(item: string): string {
    // Google News RSS sometimes puts URL in <link> without closing tag
    const match = item.match(/<link>([^<]+)<\/link>/i) ||
                  item.match(/<link\/>([^\s<]+)/i);
    return match ? match[1].trim() : '';
  }

  private extractSourceName(item: string): string {
    // Google News RSS wraps source in <source url="...">Name</source>
    const match = item.match(/<source[^>]*>([^<]+)<\/source>/i);
    return match ? match[1].trim() : '';
  }

  private cleanText(text: string): string {
    return text
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .replace(/<[^>]+>/g, '') // strip HTML tags after unescaping
      .replace(/\s+/g, ' ')
      .trim();
  }

  private parseDate(raw: string): string {
    try {
      return new Date(raw).toISOString();
    } catch {
      return new Date().toISOString();
    }
  }

  private extractDomain(url: string): string {
    try {
      return new URL(url).hostname.replace(/^www\./, '');
    } catch {
      return 'unknown';
    }
  }

  /** SSRF protection: only allow safe public HTTP(S) URLs */
  private isSafeUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      if (!['http:', 'https:'].includes(parsed.protocol)) return false;
      const hostname = parsed.hostname.toLowerCase();
      // Block private/loopback ranges
      if (
        hostname === 'localhost' ||
        hostname.startsWith('127.') ||
        hostname.startsWith('192.168.') ||
        hostname.startsWith('10.') ||
        hostname.startsWith('172.16.') ||
        hostname === '[::1]'
      ) return false;
      return true;
    } catch {
      return false;
    }
  }
}

// ─── Provider Factory ─────────────────────────────────────────────────────────

function createSearchProvider(): SearchProvider {
  const providerName = process.env.SEARCH_PROVIDER || 'google-news-rss';
  switch (providerName) {
    case 'google-news-rss':
    default:
      return new GoogleNewsRSSProvider();
  }
}

export const searchProvider: SearchProvider = createSearchProvider();
