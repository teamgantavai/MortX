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

  public prune(results: RetrievalItem[]): PrunedEvidence {
    const warnings: string[] = [];
    if (!results || results.length === 0) {
      return { items: [], sources: [], warnings };
    }

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

      if (uniqueItems.length >= this.maxItems) {
        break;
      }
    }

    // 3. Extract traceable source provenance
    const sources: AnswerSource[] = uniqueItems.map((item, idx) => ({
      id: item.source.name || `src-${idx + 1}`,
      name: item.source.name || 'Verified Local Feed',
      url: item.source.url || '',
      publishedAt: item.publishedAt,
    }));

    return {
      items: uniqueItems,
      sources,
      warnings,
    };
  }

  /**
   * Sanitizes untrusted text retrieved from external sources.
   * Defends against prompt injection (jailbreak phrases, instruction overrides).
   */
  public sanitizeText(text: string): string {
    if (!text) return '';

    return text
      // Neutralize prompt injection phrases
      .replace(/\b(ignore\s+(all\s+)?(previous|prior)\s+instructions)\b/gi, '[neutralized instruction]')
      .replace(/\b(reveal\s+(system\s+)?prompt)\b/gi, '[neutralized text]')
      .replace(/\b(you\s+are\s+now\s+a\s+different\s+model)\b/gi, '[neutralized text]')
      .replace(/\b(system:\s*)/gi, 'note: ')
      .trim();
  }
}

export const evidencePruner = new EvidencePruner();
