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
    const isAlert = /\b(?:alerts?|warnings?|advisory|advisories|curfew|diversion|road\s+closure|evacuation|government\s+notice|public\s+notice|official\s+notice|weather\s+warning|rain\s+alert|storm\s+warning)\b/i.test(lower);
    const isEvent = /\b(?:events?|concert|festival|workshop|meetup|exhibition|fair|match|tournament|celebration)\b/i.test(lower);
    const isNews = /\b(?:happened|happening|news|headline|incident|accident|traffic|update|crime|protest|weather)\b/i.test(lower);
    const isMixed = (isEvent && (isNews || isAlert)) || (isNews && isAlert) || (/\b(?:everything|what's\s+happening|whats\s+happening|what\s+is\s+happening)\b/i.test(lower) && /\b(?:weekend|near\s+me|around\s+me)\b/i.test(lower));

    if (isMixed) {
      intent = 'MIXED_LOCAL';
      category = 'LOCAL';
      if (!location) {
        location = { type: 'USER_LOCATION' };
      }
    } else if (isAlert) {
      intent = 'GOVERNMENT_ALERTS';
      category = 'GOVERNMENT_ALERT';
      if (!location) {
        location = { type: 'USER_LOCATION' };
      }
    } else if (isPG) {
      intent = 'PG_SEARCH';
      category = 'PG';
      if (!location) {
        location = { type: 'USER_LOCATION' };
      }
    } else if (isPrice) {
      intent = 'PRICE_SEARCH';
      category = 'PRICE';
      if (!location) {
        location = { type: 'NEAR_USER' };
      }
      // Extract commodity name as keyword
      const itemMatch = lower.match(/\b(tomato|onion|potato|wheat|rice|diesel|petrol|gold|silver|milk|oil|sugar|vegetable|vegetables)\b/i);
      if (itemMatch) {
        keywords.push(itemMatch[1]);
      }
    } else if (isCollege) {
      intent = 'COLLEGE_SEARCH';
      category = 'COLLEGE';
      const collegeMatch = lower.match(/\b(ptu|nit|lpu|gndu|dav|khalsa|engineering|medical|mba)\b/i);
      if (collegeMatch) {
        keywords.push(collegeMatch[1]);
      }
    } else if (isEvent) {
      intent = 'LOCAL_EVENTS';
      category = 'EVENTS';
      if (!location) {
        location = { type: 'USER_LOCATION' };
      }
    } else if (isNews) {
      intent = 'LOCAL_NEWS';
      category = 'NEWS';
      if (!location) {
        location = { type: 'USER_LOCATION' };
      }
    } else if (location) {
      intent = 'GENERAL_LOCAL_SEARCH';
      category = 'LOCAL';
    }

    const structured: StructuredQuery = {
      intent,
      location,
      timeRange,
      category,
      keywords,
      filters,
    };

    return structured as unknown as T;
  }
}
