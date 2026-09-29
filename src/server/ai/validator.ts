import {
  StructuredQuery,
  QueryIntent,
  QueryCategory,
  LocationType,
  TimeRangeType,
} from './types';

const VALID_INTENTS: ReadonlySet<QueryIntent> = new Set([
  'LOCAL_OVERVIEW',
  'LOCAL_NEWS',
  'LOCAL_EVENTS',
  'GOVERNMENT_ALERTS',
  'MIXED_LOCAL',
  'PRICE_SEARCH',
  'PG_SEARCH',
  'COLLEGE_SEARCH',
  'GENERAL_LOCAL_SEARCH',
  'GENERAL_AI_QUERY',
]);

const VALID_CATEGORIES: ReadonlySet<QueryCategory> = new Set([
  'NEWS',
  'EVENTS',
  'GOVERNMENT_ALERT',
  'PRICE',
  'PG',
  'COLLEGE',
  'LOCAL',
  'GENERAL',
]);

const VALID_LOCATION_TYPES: ReadonlySet<LocationType> = new Set([
  'USER_LOCATION',
  'NEAR_USER',
  'NAMED_LOCATION',
  'NEAR_COLLEGE',
  'GLOBAL',
]);

const VALID_TIME_RANGES: ReadonlySet<TimeRangeType> = new Set([
  'TODAY',
  'TOMORROW',
  'THIS_WEEK',
  'THIS_WEEKEND',
  'NEXT_WEEK',
  'YESTERDAY',
  'THIS_MONTH',
  'RECENT',
  'NO_TIME_FILTER',
]);

const VALID_SUB_INTENTS: ReadonlySet<QueryIntent> = new Set([
  'LOCAL_NEWS',
  'LOCAL_EVENTS',
  'GOVERNMENT_ALERTS',
  'PRICE_SEARCH',
]);

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  sanitized?: StructuredQuery;
}

export function validateStructuredQuery(raw: any): ValidationResult {
  const errors: string[] = [];

  if (!raw || typeof raw !== 'object') {
    return { valid: false, errors: ['Output is not a valid JSON object'] };
  }

  // 1. Intent validation
  const rawIntent = String(raw.intent || '').toUpperCase().trim() as QueryIntent;
  if (!VALID_INTENTS.has(rawIntent)) {
    errors.push(`Invalid intent: "${raw.intent}". Must be one of: ${[...VALID_INTENTS].join(', ')}`);
  }

  // 2. intents[] for MIXED_LOCAL or LOCAL_OVERVIEW
  let sanitizedIntents: QueryIntent[] = [];
  if (Array.isArray(raw.intents)) {
    sanitizedIntents = raw.intents
      .map((i: any) => String(i || '').toUpperCase().trim() as QueryIntent)
      .filter((i: QueryIntent) => VALID_SUB_INTENTS.has(i));
  }

  // 2b. retrievalPlan calculation & sanitization
  let sanitizedRetrievalPlan: QueryIntent[] = [];
  if (Array.isArray(raw.retrievalPlan)) {
    sanitizedRetrievalPlan = raw.retrievalPlan
      .map((i: any) => String(i || '').toUpperCase().trim() as QueryIntent)
      .filter((i: QueryIntent) => VALID_SUB_INTENTS.has(i));
  }

  // If retrievalPlan not provided or empty, resolve deterministic default plan based on intent
  if (sanitizedRetrievalPlan.length === 0) {
    if (rawIntent === 'LOCAL_OVERVIEW' || rawIntent === 'MIXED_LOCAL') {
      sanitizedRetrievalPlan = sanitizedIntents.length > 0
        ? sanitizedIntents
        : ['LOCAL_NEWS', 'LOCAL_EVENTS', 'GOVERNMENT_ALERTS'];
    } else if (rawIntent === 'LOCAL_NEWS') {
      sanitizedRetrievalPlan = ['LOCAL_NEWS'];
    } else if (rawIntent === 'LOCAL_EVENTS') {
      sanitizedRetrievalPlan = ['LOCAL_EVENTS'];
    } else if (rawIntent === 'GOVERNMENT_ALERTS') {
      sanitizedRetrievalPlan = ['GOVERNMENT_ALERTS'];
    } else {
      sanitizedRetrievalPlan = [rawIntent];
    }
  }

  // 3. Category validation + fallback mapping
  let category: QueryCategory = String(raw.category || '').toUpperCase().trim() as QueryCategory;
  if (!VALID_CATEGORIES.has(category)) {
    if (rawIntent === 'LOCAL_NEWS') category = 'NEWS';
    else if (rawIntent === 'LOCAL_EVENTS') category = 'EVENTS';
    else if (rawIntent === 'GOVERNMENT_ALERTS') category = 'GOVERNMENT_ALERT';
    else if (rawIntent === 'LOCAL_OVERVIEW' || rawIntent === 'MIXED_LOCAL') category = 'LOCAL';
    else if (rawIntent === 'PRICE_SEARCH') category = 'PRICE';
    else if (rawIntent === 'PG_SEARCH') category = 'PG';
    else if (rawIntent === 'COLLEGE_SEARCH') category = 'COLLEGE';
    else if (rawIntent === 'GENERAL_LOCAL_SEARCH') category = 'LOCAL';
    else category = 'GENERAL';
  }

  // 4. Location validation
  let sanitizedLocation = null;
  if (raw.location && typeof raw.location === 'object') {
    const rawLocType = String(raw.location.type || '').toUpperCase().trim() as LocationType;
    if (!VALID_LOCATION_TYPES.has(rawLocType)) {
      errors.push(`Invalid location.type: "${raw.location.type}". Must be one of: ${[...VALID_LOCATION_TYPES].join(', ')}`);
    } else {
      sanitizedLocation = {
        type: rawLocType,
        ...(raw.location.placeName ? { placeName: String(raw.location.placeName).trim() } : {}),
        ...(raw.location.radiusKm ? { radiusKm: Number(raw.location.radiusKm) } : {}),
        ...(raw.location.latitude !== undefined ? { latitude: raw.location.latitude } : {}),
        ...(raw.location.longitude !== undefined ? { longitude: raw.location.longitude } : {}),
      };
    }
  }

  // 5. Time range validation
  let sanitizedTimeRange = null;
  if (raw.timeRange && typeof raw.timeRange === 'object') {
    const rawTimeType = String(raw.timeRange.type || '').toUpperCase().trim() as TimeRangeType;
    if (!VALID_TIME_RANGES.has(rawTimeType)) {
      errors.push(`Invalid timeRange.type: "${raw.timeRange.type}". Must be one of: ${[...VALID_TIME_RANGES].join(', ')}`);
    } else if (rawTimeType !== 'NO_TIME_FILTER') {
      sanitizedTimeRange = { type: rawTimeType };
    }
  }

  // 6. Keywords validation
  let sanitizedKeywords: string[] = [];
  if (Array.isArray(raw.keywords)) {
    sanitizedKeywords = raw.keywords
      .filter((k: any) => typeof k === 'string' && k.trim().length > 0)
      .map((k: string) => k.trim());
  } else if (typeof raw.keywords === 'string' && raw.keywords.trim()) {
    sanitizedKeywords = [raw.keywords.trim()];
  }

  // 7. Filters validation
  let sanitizedFilters: Record<string, any> = {};
  if (raw.filters && typeof raw.filters === 'object' && !Array.isArray(raw.filters)) {
    for (const [key, value] of Object.entries(raw.filters)) {
      if (value !== undefined && value !== null) {
        if (key.toLowerCase().includes('price')) {
          const num = Number(value);
          sanitizedFilters[key] = isNaN(num) ? value : num;
        } else {
          sanitizedFilters[key] = value;
        }
      }
    }
  }

  // 8. Price-specific properties
  let product: string | undefined = undefined;
  if (typeof raw.product === 'string' && raw.product.trim()) {
    product = raw.product.trim().toLowerCase();
  }

  let comparison: { type: 'HISTORICAL' | 'LAST_WEEK' | 'YESTERDAY' } | null | undefined = undefined;
  if (raw.comparison && typeof raw.comparison === 'object') {
    const compType = String(raw.comparison.type || '').toUpperCase().trim();
    if (['HISTORICAL', 'LAST_WEEK', 'YESTERDAY'].includes(compType)) {
      comparison = { type: compType as any };
    }
  } else if (raw.comparison === null) {
    comparison = null;
  }

  let unit: string | undefined = undefined;
  if (typeof raw.unit === 'string' && raw.unit.trim()) {
    unit = raw.unit.trim().toLowerCase();
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  const sanitized: StructuredQuery = {
    intent: rawIntent,
    intents: sanitizedIntents,
    retrievalPlan: sanitizedRetrievalPlan,
    location: sanitizedLocation,
    timeRange: sanitizedTimeRange,
    category,
    keywords: sanitizedKeywords,
    filters: sanitizedFilters,
    ...(product ? { product } : {}),
    ...(comparison !== undefined ? { comparison } : {}),
    ...(unit ? { unit } : {}),
  };

  return { valid: true, errors: [], sanitized };
}
