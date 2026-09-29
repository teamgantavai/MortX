import { LLMProvider, LLMOptions } from './base';
import { StructuredQuery, QueryIntent, QueryCategory, StructuredLocation, StructuredTimeRange } from '../types';

export class HeuristicProvider implements LLMProvider {
  public readonly name = 'heuristic';

  public async generate(prompt: string, _options?: LLMOptions): Promise<string> {
    return `Heuristic response for prompt: ${prompt}`;
  }

  public async generateStructured<T>(
    prompt: string,
    _schemaDescription: string,
    _options?: LLMOptions
  ): Promise<T> {
    // Extract query text from prompt if it was formatted inside a prompt template
    const queryMatch = prompt.match(/Query:\s*"([^"]+)"/i) || prompt.match(/Query:\s*([^\n]+)/i);
    const rawQuery = queryMatch ? queryMatch[1].trim() : prompt.trim();

    const lower = rawQuery.toLowerCase();

    // 1. Time extraction
    let timeRange: StructuredTimeRange | null = null;
    if (/\btoday\b|\baaj\b/.test(lower)) {
      timeRange = { type: 'TODAY' };
    } else if (/\byesterday\b|\bkal\b/.test(lower)) {
      timeRange = { type: 'YESTERDAY' };
    } else if (/\bthis\s+weekend\b|\bweekend\b/.test(lower)) {
      timeRange = { type: 'THIS_WEEKEND' };
    } else if (/\bthis\s+week\b/.test(lower)) {
      timeRange = { type: 'THIS_WEEK' };
    } else if (/\bthis\s+month\b/.test(lower)) {
      timeRange = { type: 'THIS_MONTH' };
    } else if (/\brecent\b|\blatest\b|\bbreaking\b/.test(lower)) {
      timeRange = { type: 'RECENT' };
    }

    // 2. Location extraction
    let location: StructuredLocation | null = null;
    const radiusMatch = lower.match(/within\s+(\d+(?:\.\d+)?)\s*km/);
    const radiusKm = radiusMatch ? parseFloat(radiusMatch[1]) : undefined;

    if (/\bnear\s+my\s+college\b|\baround\s+my\s+college\b|\bnear\s+campus\b/.test(lower)) {
      location = {
        type: 'NEAR_COLLEGE',
        ...(radiusKm ? { radiusKm } : {}),
      };
    } else if (/\bnear\s+me\b|\baround\s+me\b|\bnearby\b|\bclose\s+to\s+me\b|\baaspaas\b|\blocal\b/.test(lower)) {
      location = {
        type: 'USER_LOCATION',
        ...(radiusKm ? { radiusKm } : {}),
      };
    } else {
      // Check for named locations, e.g. "in Jalandhar", "in Ludhiana", "around Model Town", "near NIT"
      const nonPlacePhrases = new Set([
        'me', 'my college', 'here', 'the area', 'simple terms', 'detail', 'english',
        'hindi', 'punjabi', 'general', 'short', 'brief', 'a sentence', 'a paragraph',
        'plain english', 'bullet points', 'summary'
      ]);

      const namedMatch =
        rawQuery.match(/\b(?:in|around|near|at)\b\s+([A-Z][a-zA-Z0-9\s]+?)(?:\s+(?:today|yesterday|this week|this month|under|below|for|with|$|\?))/i) ||
        rawQuery.match(/\b(?:in|around|near|at)\b\s+([A-Z][a-zA-Z0-9\s]+?)(?:$|\?)/);

      if (namedMatch && namedMatch[1]) {
        const place = namedMatch[1].trim();
        if (!nonPlacePhrases.has(place.toLowerCase())) {
          location = {
            type: 'NAMED_LOCATION',
            placeName: place,
            ...(radiusKm ? { radiusKm } : {}),
          };
        }
      }

      if (!location && radiusKm) {
        location = {
          type: 'USER_LOCATION',
          radiusKm,
        };
      }
    }

    // 3. Price & Filters extraction
    const filters: Record<string, any> = {};
    const underPriceMatch = lower.match(/(?:under|below|less\s+than|max(?:imum)?)\s*(?:rs\.?|inr|₹)?\s*(\d+)/i) ||
                            lower.match(/(?:rs\.?|inr|₹)?\s*(\d+)\s*(?:under|below|max)/i);
    if (underPriceMatch) {
      filters.maxPrice = parseInt(underPriceMatch[1], 10);
    }

    const minPriceMatch = lower.match(/(?:above|more\s+than|min(?:imum)?)\s*(?:rs\.?|inr|₹)?\s*(\d+)/i);
    if (minPriceMatch) {
      filters.minPrice = parseInt(minPriceMatch[1], 10);
    }

    // 4. Intent & Category detection
    let intent: QueryIntent = 'GENERAL_AI_QUERY';
    let category: QueryCategory = 'GENERAL';
    const keywords: string[] = [];

    const isPrice = /\b(?:price|rate|cost|mandi|bhav|petrol|diesel|tomato|onion|potato|gold|silver|vegetable|fruits?)\b/i.test(lower);
    const isPG = /\b(?:pg|hostel|paying\s+guest|room\s+for\s+rent|flat\s+for\s+rent|accommodation)\b/i.test(lower);
    const isCollege = /\b(?:college|university|ptu|nit|campus|admissions?|btech|mba|degree|syllabus|cutoff)\b/i.test(lower) && !/\b(?:pg|hostel)\b/i.test(lower);
    const isExplicitAlert = /\b(?:alerts?|warnings?|advisories|advisory|curfew|evacuations?|government\s+notices?|public\s+notices?|official\s+notices?|weather\s+warnings?|rain\s+alerts?|storm\s+warnings?)\b/i.test(lower);
    const isExplicitEvent = /\b(?:events?|concerts?|festivals?|workshops?|meetups?|exhibitions?|fairs?|matches?|tournaments?|celebrations?)\b/i.test(lower);
    const isExplicitNews = /\b(?:happened|headline|headlines|incidents?|accidents?|crimes?|protests?|traffic\s+jam|water\s+pipeline|flyover\s+inaugurated)\b/i.test(lower);

    // Broad queries asking what is happening / any updates / around me / overview
    const isOverview =
      (/\b(?:what(?:'s|\s+is)\s+happening|what\s+is\s+going\s+on|whats\s+going\s+on|any\s+(?:important\s+)?updates?|overview|summary\s+of\s+area|what's\s+new|whats\s+new)\b/i.test(lower) && !isExplicitEvent && !isExplicitAlert) ||
      (/\bhappening\s+(?:near\s+me|around\s+me|this\s+weekend)\b/i.test(lower) && !isExplicitEvent && !isExplicitAlert) ||
      (/\b(?:important\s+updates\s+near\s+me|updates\s+near\s+me)\b/i.test(lower) && !isExplicitEvent && !isExplicitAlert);

    let product: string | undefined;
    let comparison: { type: 'HISTORICAL' | 'LAST_WEEK' | 'YESTERDAY' } | null = null;
    let unit: string | undefined;
    let retrievalPlan: QueryIntent[] = [];

    if (isOverview) {
      intent = 'LOCAL_OVERVIEW';
      category = 'LOCAL';
      retrievalPlan = ['LOCAL_NEWS', 'LOCAL_EVENTS', 'GOVERNMENT_ALERTS'];
      if (!location) {
        location = { type: 'USER_LOCATION' };
      }
    } else if (isExplicitAlert) {
      intent = 'GOVERNMENT_ALERTS';
      category = 'GOVERNMENT_ALERT';
      retrievalPlan = ['GOVERNMENT_ALERTS'];
      if (!location) {
        location = { type: 'USER_LOCATION' };
      }
    } else if (isExplicitEvent) {
      intent = 'LOCAL_EVENTS';
      category = 'EVENTS';
      retrievalPlan = ['LOCAL_EVENTS'];
      if (!location) {
        location = { type: 'USER_LOCATION' };
      }
    } else if (isPG) {
      intent = 'PG_SEARCH';
      category = 'PG';
      retrievalPlan = ['PG_SEARCH'];
      if (!location) {
        location = { type: 'USER_LOCATION' };
      }
    } else if (isPrice) {
      intent = 'PRICE_SEARCH';
      category = 'PRICE';
      retrievalPlan = ['PRICE_SEARCH'];
      if (!location) {
        location = { type: 'NEAR_USER' };
      }

      // 1. Extract product
      const itemMatch = lower.match(
        /\b(tomato(?:es)?|onion(?:s)?|potato(?:es)?|wheat|rice|diesel|petrol|gold|silver|milk|oil|sugar|cauliflower|ginger|garlic|cabbage|carrot|peas|spinach|apple(?:s)?|banana(?:s)?|mango(?:es)?|vegetable(?:s)?|fruits?)\b/i
      );
      if (itemMatch) {
        let p = itemMatch[1].toLowerCase();
        if (p.startsWith('tomato')) p = 'tomato';
        else if (p.startsWith('onion')) p = 'onion';
        else if (p.startsWith('potato')) p = 'potato';
        else if (p.startsWith('apple')) p = 'apple';
        else if (p.startsWith('banana')) p = 'banana';
        else if (p.startsWith('mango')) p = 'mango';
        else if (p.startsWith('vegetable')) p = 'vegetable';
        product = p;
        keywords.push(p);
      }

      // 2. Extract comparison request
      if (/\b(?:compare|compared|more expensive|cheaper|less expensive|increased|decreased|higher|lower|difference|vs|versus|last week|yesterday|past week)\b/i.test(lower)) {
        if (/\blast week\b/i.test(lower)) {
          comparison = { type: 'LAST_WEEK' };
        } else if (/\byesterday\b/i.test(lower)) {
          comparison = { type: 'YESTERDAY' };
        } else {
          comparison = { type: 'HISTORICAL' };
        }
      }

      // 3. Extract unit if specified
      const unitMatch = lower.match(/\bper\s+(kg|gram|gm|g|litre|liter|ltr|dozen|piece|quintal)\b/i) ||
                        lower.match(/\b(kg|gram|litre|dozen|piece|quintal)\b/i);
      if (unitMatch) {
        const u = unitMatch[1].toLowerCase();
        if (/kg/.test(u)) unit = 'kg';
        else if (/gram|gm|g/.test(u)) unit = 'gram';
        else if (/litre|liter|ltr/.test(u)) unit = 'litre';
        else if (/dozen/.test(u)) unit = 'dozen';
        else if (/piece/.test(u)) unit = 'piece';
        else if (/quintal/.test(u)) unit = 'quintal';
      }

      // 4. Default timeRange to TODAY for price if not specified
      if (!timeRange) {
        timeRange = { type: 'TODAY' };
      }
    } else if (isCollege) {
      intent = 'COLLEGE_SEARCH';
      category = 'COLLEGE';
      retrievalPlan = ['COLLEGE_SEARCH'];
      const collegeMatch = lower.match(/\b(ptu|nit|lpu|gndu|dav|khalsa|engineering|medical|mba)\b/i);
      if (collegeMatch) {
        keywords.push(collegeMatch[1]);
      }
    } else if (isExplicitNews || /\b(?:news|update|traffic|weather)\b/i.test(lower)) {
      intent = 'LOCAL_NEWS';
      category = 'NEWS';
      retrievalPlan = ['LOCAL_NEWS'];
      if (!location) {
        location = { type: 'USER_LOCATION' };
      }
    } else if (location) {
      intent = 'GENERAL_LOCAL_SEARCH';
      category = 'LOCAL';
      retrievalPlan = ['GENERAL_LOCAL_SEARCH'];
    }

    if (retrievalPlan.length === 0) {
      retrievalPlan = [intent];
    }

    const structured: StructuredQuery = {
      intent,
      intents: intent === 'LOCAL_OVERVIEW' ? ['LOCAL_NEWS', 'LOCAL_EVENTS', 'GOVERNMENT_ALERTS'] : [],
      retrievalPlan,
      location,
      timeRange,
      category,
      keywords,
      filters,
      ...(product ? { product } : {}),
      ...(comparison !== undefined ? { comparison } : {}),
      ...(unit ? { unit } : {}),
    };

    return structured as unknown as T;
  }
}
