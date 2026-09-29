import { RetrievalItem } from '../retrieval/types';
import { AnswerSource } from './types';

export interface PrunedEvidence {
  items: RetrievalItem[];
  sources: AnswerSource[];
  warnings: string[];
}

export class EvidencePruner {
  private maxItems: number;
  private maxTextLength: number;

  constructor(maxItems: number = 5, maxTextLength: number = 500) {
    this.maxItems = maxItems;
    this.maxTextLength = maxTextLength;
  }

  public prune(results: (RetrievalItem | any)[], customMaxItems?: number): PrunedEvidence {
    const warnings: string[] = [];
    if (!results || results.length === 0) {
      return { items: [], sources: [], warnings };
    }

    const limit = customMaxItems || this.maxItems;
    const seenUrls = new Set<string>();
    const seenTitles = new Set<string>();
    const uniqueItems: RetrievalItem[] = [];

    // 1. Deduplicate by URL and normalized title
    for (const item of results) {
      const urlKey = (item.source.url || item.id || '').toLowerCase().trim();
      const titleKey = (item.title || '').toLowerCase().replace(/[^a-z0-9]/g, '');

      if (urlKey && seenUrls.has(urlKey)) {
        continue;
      }
      if (titleKey && seenTitles.has(titleKey)) {
        continue;
      }

      if (urlKey) seenUrls.add(urlKey);
      if (titleKey) seenTitles.add(titleKey);

      // 2. Security sanitization: strip prompt injections / malicious instructions
      const sanitizedTitle = this.sanitizeText(item.title);
      const sanitizedSummary = this.sanitizeText(item.summary);

      if (sanitizedSummary.length > this.maxTextLength) {
        warnings.push(`Truncated item "${item.id}" exceeding ${this.maxTextLength} chars.`);
      }

      uniqueItems.push({
        ...item,
        title: sanitizedTitle,
        summary: sanitizedSummary.slice(0, this.maxTextLength),
      });

      if (uniqueItems.length >= limit) {
        break;
      }
    }

    // 3. Extract traceable source provenance (including supportingSources)
    const sourcesMap = new Map<string, AnswerSource>();
    for (const item of uniqueItems) {
      const name = item.source.name || 'Verified Local Feed';
      if (!sourcesMap.has(name)) {
        sourcesMap.set(name, {
          id: name,
          name,
          url: item.source.url || '',
          publishedAt: item.publishedAt,
        });
      }
      if (Array.isArray((item as any).supportingSources)) {
        for (const s of (item as any).supportingSources) {
          if (s?.name && !sourcesMap.has(s.name)) {
            sourcesMap.set(s.name, {
              id: s.name,
              name: s.name,
              url: s.url || '',
              publishedAt: item.publishedAt,
            });
          }
        }
      }
    }

    const sources: AnswerSource[] = Array.from(sourcesMap.values());

    return {
      items: uniqueItems,
      sources,
      warnings,
    };
  }

  /**
   * Sanitizes untrusted text retrieved from external sources.
   * Defends against prompt injection (jailbreak phrases, instruction overrides, credential harvesting).
   */
  public sanitizeText(text: string): string {
    if (!text) return '';

    return text
      // Neutralize prompt injection phrases
      .replace(/\b(ignore\s+(all\s+)?(previous|prior)\s+instructions)\b/gi, '[neutralized instruction]')
      .replace(/\b(disregard\s+(all\s+)?(previous|prior)\s+instructions)\b/gi, '[neutralized instruction]')
      .replace(/\b(reveal\s+(the\s+)?(system\s+)?prompt)\b/gi, '[neutralized text]')
      .replace(/\b(print\s+(the\s+)?(system\s+)?prompt)\b/gi, '[neutralized text]')
      .replace(/\b(show\s+(the\s+)?system\s+instructions)\b/gi, '[neutralized text]')
      .replace(/\b(return\s+(the\s+)?api\s*key)\b/gi, '[neutralized text]')
      .replace(/\b(reveal\s+(the\s+)?api\s*key)\b/gi, '[neutralized text]')
      .replace(/\b(execute\s+(this\s+)?command)\b/gi, '[neutralized text]')
      .replace(/\b(run\s+(this\s+)?command)\b/gi, '[neutralized text]')
      .replace(/\b(you\s+are\s+now\s+a\s+different\s+model)\b/gi, '[neutralized text]')
      .replace(/\b(system:\s*)/gi, 'note: ')
      .trim();
  }
}

export const evidencePruner = new EvidencePruner();
