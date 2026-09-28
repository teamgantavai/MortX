import { QueryIntent, QueryCategory, StructuredLocation, StructuredTimeRange, QueryFilters } from '../ai/types';

export type RetrievalItemType =
  | 'NEWS'
  | 'EVENT'
  | 'GOVERNMENT_ALERT'
  | 'PRICE'
  | 'PG'
  | 'COLLEGE'
  | 'LOCAL';

export interface ItemLocation {
  name: string;
  latitude?: number;
  longitude?: number;
  distanceKm?: number;
}

export interface ItemSource {
  name: string;
  url?: string;
  isMock: boolean;
  trustLevel?: string;
}

export interface RetrievalItem {
  id: string;
  type: RetrievalItemType;
  title: string;
  summary: string;
  location: ItemLocation;
  publishedAt: string; // ISO 8601
  source: ItemSource;
  metadata?: Record<string, any>;
}

export interface DateRange {
  startDate?: Date;
  endDate?: Date;
}

export interface RetrievalParams {
  intent: QueryIntent;
  category: QueryCategory;
  keywords: string[];
  location?: StructuredLocation | null;
  timeRange?: StructuredTimeRange | null;
  dateRange?: DateRange;
  filters?: QueryFilters;
  limit?: number;
}

export interface DataSource<T = RetrievalItem> {
  readonly name: string;
  search(params: RetrievalParams): Promise<T[]>;
  getById(id: string): Promise<T | null>;
  healthCheck(): Promise<boolean>;
}

export interface RetrievalResult {
  intent: QueryIntent;
  status: 'SUCCESS' | 'EMPTY' | 'NOT_IMPLEMENTED' | 'PARTIAL';
  message?: string;
  items: RetrievalItem[];
  total: number;
}
