import { StructuredQuery } from '../ai/types';
import { RetrievalItem } from '../retrieval/types';
import { EvidenceItem } from '../retrieval/evidenceTypes';
import { StructuredPriceData } from '../price/priceAnalysisService';

export interface AnswerSource {
  id: string;
  name: string;
  url: string;
  publishedAt: string;
}

export interface AnswerHighlight {
  title: string;
  summary: string;
  location: string;
  publishedAt: string;
  sourceId?: string;
}

export interface AnswerMetadata {
  intent: string;
  resultCount: number;
  generatedAt: string;
  freshness?: 'CURRENT' | 'RECENT' | 'STALE' | 'UNKNOWN';
  latencyMs?: number;
}

export interface AIAnswerOutput {
  answer: string;
  highlights: AnswerHighlight[];
  sources: AnswerSource[];
  confidence?: 'HIGH' | 'MEDIUM' | 'LOW';
  metadata: AnswerMetadata;
  warnings: string[];
  priceData?: StructuredPriceData;
}

export interface AIAnswerInput {
  originalQuery: string;
  structuredQuery: StructuredQuery;
  results: (RetrievalItem | EvidenceItem)[];
  plan?: string[];
  evidence?: EvidenceItem[];
  metadata?: Record<string, any>;
}
