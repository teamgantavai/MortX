/**
 * Research Planner
 *
 * Analyzes a structured query and produces a research plan:
 * - Decides whether real-time search is needed
 * - Generates location-aware search queries (max 4)
 * - Sets search budget parameters
 *
 * Does NOT call any external APIs. Pure decision logic.
 */
import { StructuredQuery, QueryIntent } from '../ai/types';
import { ResearchPlan, ResearchBudget } from './types';
import { config } from '../config';

const MAX_SEARCH_QUERIES = parseInt(process.env.MAX_SEARCH_QUERIES || '4', 10);

// Intents that require real-time research
const REALTIME_INTENTS = new Set<QueryIntent>([
  'LOCAL_NEWS',
  'LOCAL_OVERVIEW',
  'MIXED_LOCAL',
  'GOVERNMENT_ALERTS',
  'GENERAL_LOCAL_SEARCH',
]);

// Queries that map to conversational AI only — no research needed
const CONVERSATIONAL_PATTERNS = [
  /^(hi|hello|hey|good\s*(morning|evening|afternoon|night)|how are you|what('s| is) up|thanks|thank you|bye|goodbye)/i,
  /^what is \d+\s*[\+\-\*\/]\s*\d+/,
  /^(capital of|population of|area of|distance from)\b/i,
];

export class ResearchPlanner {
  public plan(
    query: string,
    structuredQuery: StructuredQuery
  ): ResearchPlan {
    // 1. Check if this is a conversational / general knowledge query
    const isConversational = CONVERSATIONAL_PATTERNS.some((p) => p.test(query.trim()));
    if (isConversational || structuredQuery.intent === 'GENERAL_AI_QUERY') {
      return {
        needsRealtime: false,
        needsDatabase: false,
        searchQueries: [],
        locationContext: '',
        timeContext: '',
        maxSourcesToRead: 0,
        reasoning: 'Conversational or general knowledge query — no research needed.',
      };
    }

    // 2. Check if a named location is outside the local service region
    const place = structuredQuery.location?.placeName?.toLowerCase().trim();
    if (place) {
      const isOutOfRegion = [
        'tokyo', 'antarctica', 'japan', 'london', 'paris', 'new york',
        'los angeles', 'berlin', 'sydney', 'toronto', 'mars', 'atlantis'
      ].some((p) => place.includes(p));

      if (isOutOfRegion) {
        return {
          needsRealtime: false,
          needsDatabase: false,
          searchQueries: [],
          locationContext: structuredQuery.location?.placeName || '',
          timeContext: '',
          maxSourcesToRead: 0,
          reasoning: `Location "${place}" is outside local service region — no local research needed.`,
        };
      }
    }

    // 3. Determine if real-time research is needed
    const needsRealtime = REALTIME_INTENTS.has(structuredQuery.intent);
    const needsDatabase = true; // Always check the local DB

    // 3. Build location context for search queries
    const locationContext = this.buildLocationContext(structuredQuery);

    // 4. Build time context
    const timeContext = this.buildTimeContext(structuredQuery);

    // 5. Generate search queries
    const searchQueries = needsRealtime
      ? this.generateSearchQueries(query, structuredQuery, locationContext, timeContext)
      : [];

    return {
      needsRealtime,
      needsDatabase,
      searchQueries,
      locationContext,
      timeContext,
      maxSourcesToRead: config.researchMaxSourcePages,
      reasoning: `Intent=${structuredQuery.intent}, location="${locationContext}", time="${timeContext}"`,
    };
  }

  private buildLocationContext(sq: StructuredQuery): string {
    if (!sq.location) return 'Punjab, India';

    if (sq.location.placeName) {
      return sq.location.placeName;
    }

    if (sq.location.type === 'USER_LOCATION' || sq.location.type === 'NEAR_USER') {
      return 'Punjab, India'; // Safe default when only GPS coords available
    }

    return 'Punjab, India';
  }

  private buildTimeContext(sq: StructuredQuery): string {
    if (!sq.timeRange) return 'today';
    switch (sq.timeRange.type) {
      case 'TODAY': return 'today';
      case 'YESTERDAY': return 'yesterday';
      case 'THIS_WEEK': return 'this week';
      case 'THIS_WEEKEND': return 'this weekend';
      case 'RECENT': return 'latest';
      case 'NO_TIME_FILTER': return '';
      default: return 'today';
    }
  }

  private generateSearchQueries(
    originalQuery: string,
    sq: StructuredQuery,
    location: string,
    time: string
  ): string[] {
    const queries: string[] = [];
    const keywords = (sq.keywords || []).slice(0, 3).join(' ');
    const timePart = time ? ` ${time}` : '';

    // Query 1: Direct restatement with location + time
    queries.push(`${location} news${timePart}`);

    // Query 2: Category-specific
    if (sq.intent === 'GOVERNMENT_ALERTS') {
      queries.push(`${location} government alert notice${timePart}`);
    } else if (sq.intent === 'LOCAL_EVENTS') {
      queries.push(`${location} events${timePart}`);
    } else {
      queries.push(`${location} latest updates${timePart}`);
    }

    // Query 3: Keyword-enriched (if keywords extracted)
    if (keywords) {
      queries.push(`${location} ${keywords}${timePart}`);
    } else {
      queries.push(`${location} breaking news${timePart}`);
    }

    // Query 4: Broader regional query for context
    const isPunjabRegion = location.toLowerCase().includes('punjab') || location === 'Punjab, India';
    if (isPunjabRegion) {
      queries.push(`Punjab India news${timePart}`);
    } else {
      queries.push(`${location} updates${timePart}`);
    }

    // Deduplicate and cap at MAX_SEARCH_QUERIES
    const seen = new Set<string>();
    const unique: string[] = [];
    for (const q of queries) {
      const normalized = q.toLowerCase().trim();
      if (!seen.has(normalized)) {
        seen.add(normalized);
        unique.push(q);
      }
      if (unique.length >= MAX_SEARCH_QUERIES) break;
    }

    return unique;
  }

  public getDefaultBudget(): ResearchBudget {
    return {
      maxSearchQueries: config.researchMaxSearchQueries,
      maxSearchResultsPerQuery: config.researchMaxResultsPerQuery,
      maxSourcePages: config.researchMaxSourcePages,
      maxContentPerSourceChars: config.researchMaxContentChars,
      maxTotalResearchTimeMs: config.researchMaxTimeMs,
    };
  }
}

export const researchPlanner = new ResearchPlanner();
