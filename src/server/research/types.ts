/**
 * Research Engine — Shared Types
 *
 * These types flow through the entire research pipeline:
 * ResearchPlan → SearchResult → FetchedSource → Evidence → ResearchAnswer
 */

// ─── Search Provider ─────────────────────────────────────────────────────────

export type SearchResultType = 'NEWS' | 'OFFICIAL' | 'WEB' | 'BLOG';

export interface SearchResult {
  /** Unique identifier derived from URL hash */
  id: string;
  title: string;
  url: string;
  snippet: string;
  publishedAt: string | null;
  sourceName: string;
  sourceType: SearchResultType;
  /** Which search query produced this result */
  queryUsed: string;
  /** Raw position in result list (1-indexed) */
  position: number;
}

// ─── Research Planner ────────────────────────────────────────────────────────

export interface ResearchPlan {
  needsRealtime: boolean;
  needsDatabase: boolean;
  searchQueries: string[];
  locationContext: string;
  timeContext: string;
  /** Max sources to read per the budget */
  maxSourcesToRead: number;
  /** Reasoning for the plan (for debug) */
  reasoning: string;
}

// ─── Fetched Source (after page fetch + extraction) ──────────────────────────

export interface FetchedSource {
  id: string;
  title: string;
  url: string;
  publisher: string;
  publishedAt: string | null;
  /** Short extracted evidence snippet (NOT full page) */
  content: string;
  /** Extracted location mentions */
  locationMentions: string[];
  /** Whether actual page was fetched (vs. snippet-only) */
  pageFetched: boolean;
  fetchedAt: string;
  /** Original search result this was derived from */
  searchResult: SearchResult;
}

// ─── Evidence Item ────────────────────────────────────────────────────────────

export interface ResearchEvidenceItem {
  id: string;
  title: string;
  url: string;
  publisher: string;
  publishedAt: string | null;
  /** Cleaned evidence text sent to AI */
  evidenceText: string;
  /** Relevance score (0-1) */
  relevanceScore: number;
  /** Location relevance score (0-1) */
  locationScore: number;
  /** Freshness score (0-1, 1=very fresh) */
  freshnessScore: number;
  /** Combined rank score */
  rankScore: number;
  /** Source quality tier */
  tier: 'OFFICIAL' | 'ESTABLISHED_NEWS' | 'REGIONAL_NEWS' | 'WEB';
  /** IDs of other evidence items covering the same event (for dedup) */
  clusterId: string | null;
  /** Whether this is the primary item in a cluster */
  isClusterPrimary: boolean;
  /** Supporting sources in the same cluster */
  supportingUrls: string[];
}

// ─── Evidence Cluster ────────────────────────────────────────────────────────

export interface EvidenceCluster {
  id: string;
  primaryItem: ResearchEvidenceItem;
  supportingItems: ResearchEvidenceItem[];
  /** Combined evidence text for AI */
  mergedEvidenceText: string;
  supportingSourceCount: number;
}

// ─── Research Answer ─────────────────────────────────────────────────────────

export interface ResearchClaim {
  text: string;
  /** IDs of evidence items supporting this claim */
  sourceIds: string[];
}

export interface ResearchSource {
  id: string;
  title: string;
  url: string;
  publisher: string;
  publishedAt: string | null;
}

export interface ResearchAnswer {
  /** Main synthesized answer text */
  answer: string;
  /** Individual cited claims */
  claims: ResearchClaim[];
  /** All sources used */
  sources: ResearchSource[];
  /** Follow-up questions the user might ask */
  followUpQuestions: string[];
}

// ─── Research Session ────────────────────────────────────────────────────────

export interface ResearchSession {
  id: string;
  originalQuery: string;
  plan: ResearchPlan;
  searchResults: SearchResult[];
  fetchedSources: FetchedSource[];
  evidence: ResearchEvidenceItem[];
  clusters: EvidenceCluster[];
  answer: ResearchAnswer | null;
  /** Metadata for the response */
  meta: {
    searchesPerformed: number;
    sourcesRead: number;
    evidenceItems: number;
    retrievedAt: string;
    durationMs: number;
  };
}

// ─── Research Budget ─────────────────────────────────────────────────────────

export interface ResearchBudget {
  maxSearchQueries: number;
  maxSearchResultsPerQuery: number;
  maxSourcePages: number;
  maxContentPerSourceChars: number;
  maxTotalResearchTimeMs: number;
}
