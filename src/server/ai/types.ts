export type QueryIntent =
  | 'LOCAL_NEWS'
  | 'LOCAL_EVENTS'
  | 'GOVERNMENT_ALERTS'
  | 'PRICE_SEARCH'
  | 'PG_SEARCH'
  | 'COLLEGE_SEARCH'
  | 'GENERAL_LOCAL_SEARCH'
  | 'MIXED_LOCAL'       // multi-category: events + news + alerts in one pass
  | 'GENERAL_AI_QUERY';

export type QueryCategory =
  | 'NEWS'
  | 'EVENTS'
  | 'GOVERNMENT_ALERT'
  | 'PRICE'
  | 'PG'
  | 'COLLEGE'
  | 'LOCAL'
  | 'GENERAL';

export type LocationType =
  | 'USER_LOCATION'
  | 'NEAR_USER'
  | 'NAMED_LOCATION'
  | 'NEAR_COLLEGE'
  | 'GLOBAL';

export type TimeRangeType =
  | 'TODAY'
  | 'TOMORROW'
  | 'THIS_WEEK'
  | 'THIS_WEEKEND'
  | 'NEXT_WEEK'
  | 'YESTERDAY'
  | 'THIS_MONTH'
  | 'RECENT'
  | 'NO_TIME_FILTER';

export interface UserCoordinates {
  latitude?: number | string;
  longitude?: number | string;
  placeName?: string;
}

export interface StructuredLocation {
  type: LocationType;
  placeName?: string;
  radiusKm?: number;
  latitude?: number | string;
  longitude?: number | string;
}

export interface StructuredTimeRange {
  type: TimeRangeType;
}

export interface QueryFilters {
  maxPrice?: number;
  minPrice?: number;
  collegeType?: string;
  /** for government alerts: e.g. 'HEALTH' | 'TRANSPORT' | 'EDUCATION' */
  alertCategory?: string;
  /** whether to include expired events/alerts (default: false) */
  includeExpired?: boolean;
  [key: string]: any;
}

export interface StructuredQuery {
  intent: QueryIntent;
  /** For MIXED_LOCAL, all targeted intents */
  intents?: QueryIntent[];
  location: StructuredLocation | null;
  timeRange: StructuredTimeRange | null;
  category: QueryCategory;
  keywords: string[];
  filters: QueryFilters;
}

export interface AIQueryInput {
  query: string;
  userLocation?: UserCoordinates;
  location?: UserCoordinates;
}

export interface AIQueryResponse {
  success: boolean;
  query?: StructuredQuery;
  error?: string;
}
