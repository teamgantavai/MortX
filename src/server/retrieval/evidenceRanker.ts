import { StructuredQuery } from '../ai/types';
import { EvidenceItem } from './evidenceTypes';

export interface EvidenceProcessingResult {
  rankedItems: EvidenceItem[];
  deduplicatedCount: number;
  filteredOutCount: number;
  scoreBreakdown: Record<string, { total: number; reasons: string[] }>;
}

export class EvidenceRanker {
  /**
   * Filters, deduplicates across categories, and ranks evidence deterministically.
   */
  public process(
    rawItems: EvidenceItem[],
    query: StructuredQuery,
    options?: { maxItems?: number }
  ): EvidenceProcessingResult {
    const maxItems = options?.maxItems || 12;

    // 1. Initial Relevance Filtering
    const { filtered, filteredOutCount } = this.filterRelevance(rawItems, query);

    // 2. Cross-category Deduplication and Grouping
    const { deduplicated, deduplicatedCount } = this.deduplicateAndGroup(filtered);

    // 3. Deterministic Explainable Scoring
    const scoreBreakdown: Record<string, { total: number; reasons: string[] }> = {};
    for (const item of deduplicated) {
      const { score, reasons } = this.computeScore(item, query);
      item.score = score;
      scoreBreakdown[item.id] = { total: score, reasons };
    }

    // 4. Sort deterministically (highest score first; tie-break on publishedAt, then id)
    deduplicated.sort((a, b) => {
      const diff = (b.score || 0) - (a.score || 0);
      if (Math.abs(diff) > 0.001) return diff;

      const ta = new Date(a.publishedAt).getTime();
      const tb = new Date(b.publishedAt).getTime();
      if (tb !== ta) return tb - ta;

      return a.id.localeCompare(b.id);
    });

    const rankedItems = deduplicated.slice(0, maxItems);

    return {
      rankedItems,
      deduplicatedCount,
      filteredOutCount,
      scoreBreakdown,
    };
  }

  /**
   * Filters out items that violate explicit radius constraints or are invalid.
   */
  private filterRelevance(
    items: EvidenceItem[],
    query: StructuredQuery
  ): { filtered: EvidenceItem[]; filteredOutCount: number } {
    const radiusLimit = query.location?.radiusKm;
    let filteredOutCount = 0;

    const filtered = items.filter((item) => {
      // Coordinate distance check if a strict radius is requested
      if (
        radiusLimit &&
        typeof item.location.distanceKm === 'number' &&
        item.location.distanceKm > radiusLimit
      ) {
        filteredOutCount++;
        return false;
      }

      // Check empty titles
      if (!item.title || item.title.trim().length === 0) {
        filteredOutCount++;
        return false;
      }

      return true;
    });

    return { filtered, filteredOutCount };
  }

  /**
   * Cross-category deduplication:
   * Detects when a news article, alert, and event listing refer to the exact same event.
   * Merges them into one primary item, attaching secondary sources to supportingSources.
   */
  private deduplicateAndGroup(
    items: EvidenceItem[]
  ): { deduplicated: EvidenceItem[]; deduplicatedCount: number } {
    let deduplicatedCount = 0;
    const groups: EvidenceItem[] = [];

    for (const item of items) {
      const matchIndex = groups.findIndex((g) => this.areDuplicates(g, item));

      if (matchIndex === -1) {
        // No match: add as a new distinct evidence group
        groups.push({
          ...item,
          supportingSources: [...(item.supportingSources || [])],
        });
      } else {
        // Duplicate found: merge supporting sources into existing group
        deduplicatedCount++;
        const target = groups[matchIndex];

        // Ensure target has supportingSources array
        if (!target.supportingSources) {
          target.supportingSources = [];
        }

        // Add secondary item source if not already present
        const sourceExists =
          target.source.name === item.source.name ||
          target.supportingSources.some((s) => s.name === item.source.name);

        if (!sourceExists) {
          target.supportingSources.push(item.source);
        }

        // If secondary item is an URGENT or official alert, promote the group's type/importance
        if (item.importance === 'URGENT' && target.importance !== 'URGENT') {
          target.importance = 'URGENT';
        }

        // Prefer alert or event type over news when merged
        if (target.type === 'NEWS' && (item.type === 'EVENT' || item.type === 'GOVERNMENT_ALERT')) {
          target.type = item.type;
          target.metadata = { ...item.metadata, ...target.metadata };
        }
      }
    }

    return { deduplicated: groups, deduplicatedCount };
  }

  /**
   * Deterministic duplicate detector:
   * Checks contentHash match or normalized title word overlap + compatible location.
   */
  public areDuplicates(a: EvidenceItem, b: EvidenceItem): boolean {
    if (a.id === b.id) return true;

    // Content hash match if present in metadata
    if (
      a.metadata?.contentHash &&
      b.metadata?.contentHash &&
      a.metadata.contentHash === b.metadata.contentHash
    ) {
      return true;
    }

    // Normalized title string comparison
    const normA = this.normalizeTitle(a.title);
    const normB = this.normalizeTitle(b.title);

    if (normA === normB) return true;

    // Substring match for substantial titles (at least 20 chars)
    if (normA.length >= 20 && normB.length >= 20) {
      if (normA.includes(normB) || normB.includes(normA)) {
        return true;
      }
    }

    // Token Jaccard overlap
    const tokensA = this.tokenize(normA);
    const tokensB = this.tokenize(normB);

    if (tokensA.size === 0 || tokensB.size === 0) return false;

    let intersection = 0;
    for (const t of tokensA) {
      if (tokensB.has(t)) intersection++;
    }

    const union = new Set([...tokensA, ...tokensB]).size;
    const jaccard = union > 0 ? intersection / union : 0;

    // High lexical overlap (>0.6) with matching or compatible location
    if (jaccard >= 0.6) {
      const locA = (a.location.name || '').toLowerCase();
      const locB = (b.location.name || '').toLowerCase();
      if (!locA || !locB || locA.includes(locB) || locB.includes(locA)) {
        return true;
      }
    }

    return false;
  }

  private normalizeTitle(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private tokenize(str: string): Set<string> {
    const stopWords = new Set([
      'the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'in', 'for',
      'of', 'to', 'with', 'by', 'as', 'today', 'latest', 'news', 'update'
    ]);

    const words = str.split(' ').filter((w) => w.length > 2 && !stopWords.has(w));
    return new Set(words);
  }

  /**
   * Deterministic Explainable Scoring.
   * Prioritizes:
   * 1. URGENT / Warning public alerts (+1000 / +500)
   * 2. Geographic proximity (up to +100)
   * 3. Freshness / Recency (up to +100)
   * 4. Event timing in query window (+120)
   * 5. Source quality (+50 to +150)
   * 6. Query keyword match (+40 per keyword)
   */
  private computeScore(
    item: EvidenceItem,
    query: StructuredQuery
  ): { score: number; reasons: string[] } {
    let score = 0;
    const reasons: string[] = [];

    // 1. Importance & Severity
    if (item.importance === 'URGENT') {
      score += 1000;
      reasons.push('Urgent public emergency / safety alert (+1000)');
    } else if (item.importance === 'HIGH') {
      score += 500;
      reasons.push('High-priority alert / warning (+500)');
    } else if (item.type === 'GOVERNMENT_ALERT') {
      score += 250;
      reasons.push('Official government alert / civic notice (+250)');
    } else if (item.type === 'EVENT') {
      score += 200;
      reasons.push('Local event listing (+200)');
    } else {
      score += 100;
      reasons.push('Local news update (+100)');
    }

    // 2. Geographic Proximity
    if (typeof item.location.distanceKm === 'number' && !isNaN(item.location.distanceKm)) {
      const dist = Math.max(0, item.location.distanceKm);
      const proximityScore = Math.max(0, Math.round((50 - dist) * 2));
      if (proximityScore > 0) {
        score += proximityScore;
        reasons.push(`Proximity (${dist.toFixed(1)} km: +${proximityScore})`);
      }
    }

    // 3. Freshness
    const itemTime = new Date(item.publishedAt).getTime();
    if (!isNaN(itemTime)) {
      const hoursAgo = Math.max(0, (Date.now() - itemTime) / (1000 * 60 * 60));
      const freshnessScore = Math.max(0, Math.round(100 - hoursAgo * 2));
      if (freshnessScore > 0) {
        score += freshnessScore;
        reasons.push(`Freshness (${hoursAgo.toFixed(0)}h ago: +${freshnessScore})`);
      }
    }

    // 4. Source Quality / Trust Level
    const trust = item.source.trustLevel || '';
    if (trust === 'OFFICIAL_GOVERNMENT') {
      score += 150;
      reasons.push('Official government authority source (+150)');
    } else if (trust === 'OFFICIAL_EVENT_ORGANIZER') {
      score += 100;
      reasons.push('Verified event organizer source (+100)');
    } else if (trust === 'NEWS') {
      score += 50;
      reasons.push('Verified regional news source (+50)');
    }

    // 5. Query Keyword Match
    const textLower = `${item.title} ${item.summary}`.toLowerCase();
    if (query.keywords && query.keywords.length > 0) {
      let kwScore = 0;
      for (const kw of query.keywords) {
        if (textLower.includes(kw.toLowerCase())) {
          kwScore += 40;
        }
      }
      if (kwScore > 0) {
        score += kwScore;
        reasons.push(`Query keyword matches (+${kwScore})`);
      }
    }

    // 6. Supporting source corroboration bonus
    if (item.supportingSources && item.supportingSources.length > 0) {
      const corrobScore = item.supportingSources.length * 30;
      score += corrobScore;
      reasons.push(`Cross-source corroboration (+${corrobScore})`);
    }

    return { score, reasons };
  }
}

export const evidenceRanker = new EvidenceRanker();
