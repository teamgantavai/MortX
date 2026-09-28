import { config } from '../config';

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  keysCount: number;
}

export class CacheService {
  private store: Map<string, CacheEntry<any>> = new Map();
  private hits: number = 0;
  private misses: number = 0;

  /**
   * Generates a normalized cache key for query responses.
   * e.g. "query:local_news:jalandhar:today"
   */
  public generateQueryCacheKey(query: string, placeName?: string, timeType?: string): string {
    const cleanQ = query.toLowerCase().trim().replace(/[^a-z0-9]/g, '_').slice(0, 40);
    const cleanPlace = (placeName || 'default').toLowerCase().trim();
    const cleanTime = (timeType || 'none').toLowerCase();
    return `query:${cleanPlace}:${cleanTime}:${cleanQ}`;
  }

  public get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) {
      this.misses++;
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      this.misses++;
      return null;
    }

    this.hits++;
    return entry.value as T;
  }

  public set<T>(key: string, value: T, ttlSeconds: number = config.cacheTtlNewsSeconds): void {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.store.set(key, { value, expiresAt });

    // Eviction if store exceeds 5000 keys
    if (this.store.size > 5000) {
      this.evictExpiredOrOldest();
    }
  }

  public delete(key: string): void {
    this.store.delete(key);
  }

  public clear(): void {
    this.store.clear();
    this.hits = 0;
    this.misses = 0;
  }

  public getStats(): CacheStats {
    return {
      hits: this.hits,
      misses: this.misses,
      keysCount: this.store.size,
    };
  }

  private evictExpiredOrOldest(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
      }
    }
    // If still large, remove oldest
    if (this.store.size > 4000) {
      const keysToDelete = Array.from(this.store.keys()).slice(0, 1000);
      for (const k of keysToDelete) {
        this.store.delete(k);
      }
    }
  }
}

export const cacheService = new CacheService();
