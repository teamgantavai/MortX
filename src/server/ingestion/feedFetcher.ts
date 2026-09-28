import { NewsSourceConfig, RawFeedItem } from './types';

export interface FetchOptions {
  timeoutMs?: number;
  maxSizeBytes?: number;
  userAgent?: string;
}

export class NewsFeedFetcher {
  private defaultOptions: FetchOptions = {
    timeoutMs: 6000,
    maxSizeBytes: 2 * 1024 * 1024, // 2MB
    userAgent: 'aaspaas-local-news-ingester/1.0 (+https://github.com/teamgantavai/MortX)',
  };

  public async fetchSource(
    source: NewsSourceConfig,
    options?: FetchOptions
  ): Promise<RawFeedItem[]> {
    const opts = { ...this.defaultOptions, ...options };
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), opts.timeoutMs);

    try {
      const res = await fetch(source.feedUrl, {
        method: 'GET',
        headers: {
          'User-Agent': opts.userAgent!,
          Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}: ${res.statusText}`);
      }

      // Check Content-Length if provided
      const contentLength = res.headers.get('content-length');
      if (contentLength && parseInt(contentLength, 10) > opts.maxSizeBytes!) {
        throw new Error(`Feed size exceeds limit (${contentLength} bytes)`);
      }

      const xml = await res.text();
      return this.parseFeedXml(xml);
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw new Error(`Request timed out after ${opts.timeoutMs}ms for ${source.name}`);
      }
      throw err;
    }
  }

  /**
   * Safe, zero-dependency RSS/Atom XML parser.
   * Handles RSS 2.0 (<item>) and Atom (<entry>).
   */
  public parseFeedXml(xml: string): RawFeedItem[] {
    if (!xml || typeof xml !== 'string' || !xml.trim()) {
      return [];
    }

    const items: RawFeedItem[] = [];

    // Check if Atom feed
    const isAtom = xml.includes('<entry>') || xml.includes('<entry ');

    if (isAtom) {
      const entryRegex = /<entry[\s>]([\s\S]*?)<\/entry>/gi;
      let match;
      while ((match = entryRegex.exec(xml)) !== null) {
        const entryContent = match[1];
        const item = this.parseAtomEntry(entryContent);
        if (item && item.title && item.link) {
          items.push(item);
        }
      }
    } else {
      // Standard RSS 2.0
      const itemRegex = /<item[\s>]([\s\S]*?)<\/item>/gi;
      let match;
      while ((match = itemRegex.exec(xml)) !== null) {
        const itemContent = match[1];
        const item = this.parseRssItem(itemContent);
        if (item && item.title && item.link) {
          items.push(item);
        }
      }
    }

    return items;
  }

  private parseRssItem(content: string): RawFeedItem | null {
    const title = this.extractTag(content, 'title');
    const link = this.extractTag(content, 'link');
    const guid = this.extractTag(content, 'guid');
    const description =
      this.extractTag(content, 'content:encoded') ||
      this.extractTag(content, 'description') ||
      '';
    const pubDate = this.extractTag(content, 'pubDate') || this.extractTag(content, 'dc:date');

    const categories: string[] = [];
    const catRegex = /<category[^>]*>([\s\S]*?)<\/category>/gi;
    let catMatch;
    while ((catMatch = catRegex.exec(content)) !== null) {
      const cat = this.cleanCData(catMatch[1]).trim();
      if (cat) categories.push(cat);
    }

    if (!title || !link) return null;

    return {
      guid: guid || link,
      title: title.trim(),
      link: link.trim(),
      description: description.trim(),
      pubDate: pubDate ? pubDate.trim() : undefined,
      categories,
    };
  }

  private parseAtomEntry(content: string): RawFeedItem | null {
    const title = this.extractTag(content, 'title');
    const id = this.extractTag(content, 'id');

    // Link in Atom often appears as <link href="..." /> or <link rel="alternate" href="..." />
    let link = '';
    const hrefMatch = content.match(/<link[^>]+href=["']([^"']+)["'][^>]*>/i);
    if (hrefMatch) {
      link = hrefMatch[1];
    } else {
      link = this.extractTag(content, 'link');
    }

    const summary =
      this.extractTag(content, 'content') ||
      this.extractTag(content, 'summary') ||
      '';
    const pubDate =
      this.extractTag(content, 'published') ||
      this.extractTag(content, 'updated');

    if (!title || !link) return null;

    return {
      guid: id || link,
      title: title.trim(),
      link: link.trim(),
      description: summary.trim(),
      pubDate: pubDate ? pubDate.trim() : undefined,
    };
  }

  private extractTag(content: string, tag: string): string {
    const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
    const match = content.match(regex);
    if (!match) return '';
    return this.cleanCData(match[1]);
  }

  private cleanCData(str: string): string {
    return str.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');
  }
}

export const feedFetcher = new NewsFeedFetcher();
