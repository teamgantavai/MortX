export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

interface SourceState {
  failureCount: number;
  lastFailureTime: number;
  state: CircuitState;
}

export class CircuitBreaker {
  private sources: Map<string, SourceState> = new Map();
  private maxFailures: number;
  private cooldownMs: number;

  constructor(maxFailures: number = 3, cooldownMs: number = 5 * 60 * 1000) {
    this.maxFailures = maxFailures;
    this.cooldownMs = cooldownMs;
  }

  public canAttempt(sourceId: string): boolean {
    const state = this.sources.get(sourceId);
    if (!state) return true;

    if (state.state === 'OPEN') {
      const elapsed = Date.now() - state.lastFailureTime;
      if (elapsed > this.cooldownMs) {
        state.state = 'HALF_OPEN';
        return true;
      }
      return false; // Circuit is open (tripped)
    }

    return true;
  }

  public recordSuccess(sourceId: string): void {
    this.sources.delete(sourceId);
  }

  public recordFailure(sourceId: string): void {
    const now = Date.now();
    const state = this.sources.get(sourceId) || {
      failureCount: 0,
      lastFailureTime: now,
      state: 'CLOSED',
    };

    state.failureCount++;
    state.lastFailureTime = now;

    if (state.failureCount >= this.maxFailures) {
      state.state = 'OPEN';
    }

    this.sources.set(sourceId, state);
  }

  public getState(sourceId: string): CircuitState {
    const s = this.sources.get(sourceId);
    return s ? s.state : 'CLOSED';
  }

  public reset(): void {
    this.sources.clear();
  }
}

export const sourceCircuitBreaker = new CircuitBreaker();
