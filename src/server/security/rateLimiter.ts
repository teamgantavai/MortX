import { config } from '../config';

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

export class RateLimiter {
  private requests: Map<string, RateLimitRecord> = new Map();
  private windowMs: number = 60 * 1000; // 1 minute window

  public check(identifier: string, isAuthenticated: boolean = false): {
    allowed: boolean;
    limit: number;
    remaining: number;
    resetTimeMs: number;
  } {
    const now = Date.now();
    const limit = isAuthenticated
      ? config.rateLimitAuthenticatedPerMin
      : config.rateLimitAnonymousPerMin;

    const record = this.requests.get(identifier);

    if (!record || now > record.resetAt) {
      // New window
      this.requests.set(identifier, {
        count: 1,
        resetAt: now + this.windowMs,
      });
      return {
        allowed: true,
        limit,
        remaining: limit - 1,
        resetTimeMs: this.windowMs,
      };
    }

    if (record.count >= limit) {
      return {
        allowed: false,
        limit,
        remaining: 0,
        resetTimeMs: Math.max(0, record.resetAt - now),
      };
    }

    record.count++;
    return {
      allowed: true,
      limit,
      remaining: limit - record.count,
      resetTimeMs: Math.max(0, record.resetAt - now),
    };
  }

  public reset(): void {
    this.requests.clear();
  }
}

export const rateLimiter = new RateLimiter();
