import crypto from 'node:crypto';
import { RawFeedItem, NormalizedArticle, NewsSourceConfig } from './types';

export class ArticleNormalizer {
  public normalize(raw: RawFeedItem, source: NewsSourceConfig): NormalizedArticle {
    const title = this.cleanText(raw.title);
    const description = this.cleanText(raw.description || '');
    const url = this.normalizeUrl(raw.link);

    // Normalize publishedAt date
    const publishedAt = this.normalizeDate(raw.pubDate);

    return {
      title,
      description,
      url,
      sourceId: source.id,
      sourceName: source.name,
      sourceUrl: source.baseUrl,
      publishedAt,
      language: source.language || 'en',
      rawCategories: raw.categories,
    };
  }

  public cleanText(text: string): string {
    if (!text) return '';

    return text
      // Strip HTML tags
      .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      // Decode HTML entities
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(dec))
      // Collapse whitespace
      .replace(/[\r\n\t]+/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }

  public normalizeUrl(rawUrl: string): string {
    if (!rawUrl) return '';

    try {
      const parsed = new URL(rawUrl.trim());
      // Strip tracking query parameters
      const trackingParams = [
        'utm_source',
        'utm_medium',
        'utm_campaign',
        'utm_term',
        'utm_content',
        'fbclid',
        'gclid',
        'ref',
      ];
      for (const param of trackingParams) {
        parsed.searchParams.delete(param);
      }
      // Remove trailing slash for uniformity
      let clean = parsed.toString();
      if (clean.endsWith('/') && parsed.pathname !== '/') {
        clean = clean.slice(0, -1);
      }
      return clean;
    } catch {
      return rawUrl.trim();
    }
  }

  public normalizeDate(dateStr?: string): string {
    if (!dateStr || !dateStr.trim()) {
      return new Date().toISOString();
    }

    try {
      const parsed = new Date(dateStr.trim());
      if (isNaN(parsed.getTime())) {
        return new Date().toISOString();
      }
      return parsed.toISOString();
    } catch {
      return new Date().toISOString();
    }
  }

  public computeContentHash(title: string, description: string): string {
    const normalized = `${title.toLowerCase().trim()}|${description.toLowerCase().trim()}`;
    return crypto.createHash('sha256').update(normalized, 'utf8').digest('hex');
  }
}

export const articleNormalizer = new ArticleNormalizer();
