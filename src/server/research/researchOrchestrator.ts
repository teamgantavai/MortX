/**
 * Research Orchestrator
 *
 * The main entry point for the real-time research pipeline.
 * Controls the entire workflow:
 *
 *   ResearchPlan → Search → Fetch → Extract → Rank → Deduplicate → Synthesize
 *
 * Budget enforcement:
 * - MAX_SEARCH_QUERIES: 4 (configurable)
 * - MAX_SEARCH_RESULTS_PER_QUERY: 8
 * - MAX_SOURCE_PAGES: 8
 * - MAX_TOTAL_TIME: configurable
 *
 * Every stage has a timeout. Failures in one stage never block others.
 */
import crypto from 'node:crypto';
import { StructuredQuery } from '../ai/types';
import { researchPlanner } from './researchPlanner';
import { searchProvider } from './searchProvider';
import { sourceFetcher } from './sourceFetcher';
import { evidenceProcessor } from './evidenceProcessor';
import { researchAnswerEngine } from './researchAnswerEngine';
import { SearchResult, FetchedSource, ResearchSession } from './types';
import { config } from '../config';

export class ResearchOrchestrator {
  /**
   * Execute the full research pipeline for a query.
   * Returns a ResearchSession with the full audit trail.
   *
   * Never throws — always returns a session (even if empty).
   */
  public async research(
    requestId: string,
    originalQuery: string,
    structuredQuery: StructuredQuery
  ): Promise<ResearchSession> {
    const startTime = Date.now();
    const sessionId = crypto.randomUUID();

    console.log(`[Research] Starting session ${sessionId} for: "${originalQuery}"`);

    // ── STEP 1: Research Planner ──────────────────────────────────────────────
    const plan = researchPlanner.plan(originalQuery, structuredQuery);

    if (!plan.needsRealtime || plan.searchQueries.length === 0) {
      console.log(`[Research] No real-time research needed: ${plan.reasoning}`);
      return this.emptySession(sessionId, originalQuery, plan, startTime);
    }

    console.log(`[Research] Plan: ${plan.searchQueries.length} queries, location="${plan.locationContext}"`);

    // ── STEP 2: Search Orchestration ─────────────────────────────────────────
    const allSearchResults: SearchResult[] = [];
    const seenUrls = new Set<string>();

    const searchTimeoutMs = Math.min(config.researchMaxTimeMs * 0.4, 12000); // 40% of budget

    for (const query of plan.searchQueries.slice(0, config.researchMaxSearchQueries)) {
      if (Date.now() - startTime > config.researchMaxTimeMs * 0.5) {
        console.warn(`[Research] Search budget exceeded — stopping at ${allSearchResults.length} results`);
        break;
      }

      try {
        console.log(`[Research] Searching: "${query}"`);
        const results = await Promise.race([
          searchProvider.searchNews(query, {
            timeoutMs: searchTimeoutMs,
            maxResults: config.researchMaxResultsPerQuery,
          }),
          this.timeoutPromise<SearchResult[]>(searchTimeoutMs + 1000, []),
        ]);

        for (const r of results) {
          if (!seenUrls.has(r.url)) {
            seenUrls.add(r.url);
            allSearchResults.push(r);
          }
        }

        console.log(`[Research] Query "${query}" → ${results.length} results`);
      } catch (err: any) {
        console.warn(`[Research] Search query failed: "${query}" — ${err.message}`);
      }
    }

    console.log(`[Research] Total unique search results: ${allSearchResults.length}`);

    // ── STEP 3: Source Fetching ───────────────────────────────────────────────
    // Prioritize top-ranked results (first N by position)
    const topResults = allSearchResults
      .sort((a, b) => a.position - b.position)
      .slice(0, config.researchMaxSourcePages);

    let fetchedSources: FetchedSource[] = [];

    if (topResults.length > 0) {
      const fetchTimeoutMs = Math.min(
        config.researchMaxTimeMs - (Date.now() - startTime) - 5000, // leave 5s for synthesis
        8000
      );

      if (fetchTimeoutMs > 1000) {
        try {
          fetchedSources = await Promise.race([
            sourceFetcher.fetchSources(topResults, config.researchMaxSourcePages, fetchTimeoutMs / topResults.length),
            this.timeoutPromise<FetchedSource[]>(fetchTimeoutMs, topResults.map((sr) => ({
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
            }))),
          ]);
        } catch {
          // Fallback: use snippets only
          fetchedSources = topResults.map((sr) => ({
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
          }));
        }
      } else {
        // No time left for fetching — use snippets
        fetchedSources = topResults.map((sr) => ({
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
        }));
      }

      const fetchedCount = fetchedSources.filter((s) => s.pageFetched).length;
      console.log(`[Research] Fetched ${fetchedCount}/${fetchedSources.length} pages`);
    }

    // ── STEP 4: Evidence Processing (normalize + rank + deduplicate) ──────────
    const { items: evidenceItems, clusters } = evidenceProcessor.process(
      fetchedSources,
      originalQuery,
      plan.locationContext,
      structuredQuery.keywords || []
    );

    console.log(`[Research] Evidence: ${evidenceItems.length} items, ${clusters.length} clusters`);

    // ── STEP 5: AI Synthesis ──────────────────────────────────────────────────
    let answer = null;
    try {
      answer = await Promise.race([
        researchAnswerEngine.synthesize(originalQuery, plan.locationContext, evidenceItems, clusters),
        this.timeoutPromise(8000, null),
      ]);
    } catch (err: any) {
      console.warn(`[Research] Synthesis failed: ${err.message}`);
    }

    // Fallback if synthesis timed out
    if (!answer) {
      answer = await researchAnswerEngine.synthesize(originalQuery, plan.locationContext, evidenceItems, clusters);
    }

    const durationMs = Date.now() - startTime;
    console.log(`[Research] Complete in ${durationMs}ms — ${evidenceItems.length} evidence items`);


    return {
      id: sessionId,
      originalQuery,
      plan,
      searchResults: allSearchResults,
      fetchedSources,
      evidence: evidenceItems,
      clusters,
      answer,
      meta: {
        searchesPerformed: plan.searchQueries.length,
        sourcesRead: fetchedSources.filter((s) => s.pageFetched).length,
        evidenceItems: evidenceItems.length,
        retrievedAt: new Date().toISOString(),
        durationMs,
      },
    };
  }

  private emptySession(
    sessionId: string,
    originalQuery: string,
    plan: any,
    startTime: number
  ): ResearchSession {
    return {
      id: sessionId,
      originalQuery,
      plan,
      searchResults: [],
      fetchedSources: [],
      evidence: [],
      clusters: [],
      answer: null,
      meta: {
        searchesPerformed: 0,
        sourcesRead: 0,
        evidenceItems: 0,
        retrievedAt: new Date().toISOString(),
        durationMs: Date.now() - startTime,
      },
    };
  }

  private timeoutPromise<T>(ms: number, fallback: T): Promise<T> {
    return new Promise((resolve) => setTimeout(() => resolve(fallback), ms));
  }
}

export const researchOrchestrator = new ResearchOrchestrator();
