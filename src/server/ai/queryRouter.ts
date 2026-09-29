import { AIService } from './aiService';
import { validateStructuredQuery } from './validator';
import { AIQueryInput, StructuredQuery, QueryIntent } from './types';

const QUERY_SCHEMA_SPECIFICATION = `
{
  "intent": "LOCAL_OVERVIEW" | "LOCAL_NEWS" | "LOCAL_EVENTS" | "GOVERNMENT_ALERTS" | "MIXED_LOCAL" | "PRICE_SEARCH" | "PG_SEARCH" | "COLLEGE_SEARCH" | "GENERAL_LOCAL_SEARCH" | "GENERAL_AI_QUERY",
  "retrievalPlan": string[],
  "intents": string[],
  "location": {
    "type": "USER_LOCATION" | "NEAR_USER" | "NAMED_LOCATION" | "NEAR_COLLEGE" | "GLOBAL",
    "placeName"?: string,
    "radiusKm"?: number
  } | null,
  "timeRange": {
    "type": "TODAY" | "TOMORROW" | "THIS_WEEK" | "THIS_WEEKEND" | "NEXT_WEEK" | "YESTERDAY" | "THIS_MONTH" | "RECENT" | "NO_TIME_FILTER"
  } | null,
  "category": "NEWS" | "EVENTS" | "GOVERNMENT_ALERT" | "PRICE" | "PG" | "COLLEGE" | "LOCAL" | "GENERAL",
  "keywords": string[],
  "filters": {
    "maxPrice"?: number,
    "minPrice"?: number,
    "alertCategory"?: string,
    "includeExpired"?: boolean,
    [key: string]: any
  }
}
`;

export class AIQueryRouter {
  private aiService: AIService;

  constructor(aiService?: AIService) {
    this.aiService = aiService || new AIService();
  }

  public async routeQuery(input: AIQueryInput): Promise<StructuredQuery> {
    if (!input || typeof input.query !== 'string' || !input.query.trim()) {
      throw new Error('Query string is required');
    }

    const trimmedQuery = input.query.trim();
    const userCoords = input.userLocation || input.location;

    const prompt = `Analyze this user query and extract its structured parameters:
Query: "${trimmedQuery}"

Instructions:
1. Intent: Choose exactly one of:
   - LOCAL_OVERVIEW: for general questions about what is happening in an area, weekend roundups, or broad updates (combines news, events, and alerts)
   - LOCAL_NEWS: specifically for local news, crime, infrastructure, civic incidents, happenings
   - LOCAL_EVENTS: specifically for upcoming events, festivals, concerts, sports, workshops
   - GOVERNMENT_ALERTS: specifically for official notices, public alerts, warnings, weather warnings
   - PRICE_SEARCH, PG_SEARCH, COLLEGE_SEARCH, GENERAL_LOCAL_SEARCH, GENERAL_AI_QUERY for other cases.

2. retrievalPlan: Array of data sources needed:
   - For broad/overview queries ("what's happening near me?", "any updates this weekend?"): ["LOCAL_NEWS", "LOCAL_EVENTS", "GOVERNMENT_ALERTS"]
   - For specific queries: only the required source (e.g. ["LOCAL_NEWS"] or ["LOCAL_EVENTS"] or ["GOVERNMENT_ALERTS"])

3. Location:
   - "near me", "around me", "nearby" -> {"type": "USER_LOCATION"}
   - "in [City/Area]", "around [Place]" -> {"type": "NAMED_LOCATION", "placeName": "..."}
   - "near my college", "near campus" -> {"type": "NEAR_COLLEGE"}
   - "within X km" -> include "radiusKm": X
   - If purely general question with no local context -> null

4. Time:
   - "today" -> {"type": "TODAY"}
   - "tomorrow" -> {"type": "TOMORROW"}
   - "yesterday" -> {"type": "YESTERDAY"}
   - "this week" -> {"type": "THIS_WEEK"}
   - "this weekend", "weekend" -> {"type": "THIS_WEEKEND"}
   - "next week" -> {"type": "NEXT_WEEK"}
   - "this month" -> {"type": "THIS_MONTH"}
   - "recent" / "latest" -> {"type": "RECENT"}
   - If no time mention -> null

5. Category: Map to one of [NEWS, EVENTS, GOVERNMENT_ALERT, PRICE, PG, COLLEGE, LOCAL, GENERAL].
   - For MIXED_LOCAL -> use LOCAL

6. Keywords: Specific extracted topic/place/organization keywords. Empty array if none.

7. Filters: Extract alertCategory for government alert queries (HEALTH, TRANSPORT, EDUCATION, WEATHER, SECURITY, CIVIC).
   Empty object {} if none.`;

    const structured = await this.aiService.generateStructured<StructuredQuery>(
      prompt,
      QUERY_SCHEMA_SPECIFICATION,
      validateStructuredQuery
    );

    // Enrich user coordinates into location when device GPS is provided
    if (userCoords && structured.location) {
      if (
        structured.location.type === 'USER_LOCATION' ||
        structured.location.type === 'NEAR_USER'
      ) {
        if (userCoords.latitude !== undefined && structured.location.latitude === undefined) {
          structured.location.latitude = userCoords.latitude;
        }
        if (userCoords.longitude !== undefined && structured.location.longitude === undefined) {
          structured.location.longitude = userCoords.longitude;
        }
      }
    }

    // Ensure intents array is always present
    if (!structured.intents) {
      structured.intents = [];
    }

    // Auto-populate intents for MIXED_LOCAL or LOCAL_OVERVIEW if the LLM didn't provide it
    if ((structured.intent === 'MIXED_LOCAL' || structured.intent === 'LOCAL_OVERVIEW') && structured.intents.length === 0) {
      structured.intents = ['LOCAL_NEWS', 'LOCAL_EVENTS', 'GOVERNMENT_ALERTS'] as QueryIntent[];
    }

    // Ensure retrievalPlan is always present and aligned with intent
    if (!structured.retrievalPlan || structured.retrievalPlan.length === 0) {
      if (structured.intent === 'LOCAL_OVERVIEW' || structured.intent === 'MIXED_LOCAL') {
        structured.retrievalPlan = structured.intents.length > 0
          ? structured.intents
          : (['LOCAL_NEWS', 'LOCAL_EVENTS', 'GOVERNMENT_ALERTS'] as QueryIntent[]);
      } else if (structured.intent === 'LOCAL_NEWS') {
        structured.retrievalPlan = ['LOCAL_NEWS' as QueryIntent];
      } else if (structured.intent === 'LOCAL_EVENTS') {
        structured.retrievalPlan = ['LOCAL_EVENTS' as QueryIntent];
      } else if (structured.intent === 'GOVERNMENT_ALERTS') {
        structured.retrievalPlan = ['GOVERNMENT_ALERTS' as QueryIntent];
      } else {
        structured.retrievalPlan = [structured.intent];
      }
    }

    return structured;
  }
}

// Export singleton instance for convenient usage
export const defaultQueryRouter = new AIQueryRouter();
