import crypto from 'node:crypto';

export interface RequestMetrics {
  requestId: string;
  intent?: string;
  status: 'SUCCESS' | 'ERROR' | 'DEGRADED';
  cacheHit: boolean;
  retrievalCount: number;
  timings: {
    queryRouterMs: number;
    retrievalMs: number;
    databaseMs: number;
    answerEngineMs: number;
    totalMs: number;
  };
  aiModel?: string;
  aiLatencyMs?: number;
  error?: string;
}

export function generateRequestId(): string {
  const random = crypto.randomBytes(4).toString('hex');
  return `req_${random}`;
}

class Logger {
  public logRequestMetrics(metrics: RequestMetrics): void {
    const isProd = process.env.NODE_ENV === 'production';
    const logPayload = {
      level: metrics.status === 'ERROR' ? 'error' : 'info',
      timestamp: new Date().toISOString(),
      ...metrics,
    };

    if (isProd) {
      console.log(JSON.stringify(logPayload));
    } else {
      console.log(
        `[${logPayload.timestamp}] [${metrics.requestId}] ${metrics.intent || 'QUERY'} ` +
        `status=${metrics.status} cache=${metrics.cacheHit ? 'HIT' : 'MISS'} ` +
        `total=${metrics.timings.totalMs}ms (router=${metrics.timings.queryRouterMs}ms, ` +
        `retrieval=${metrics.timings.retrievalMs}ms, db=${metrics.timings.databaseMs}ms, ` +
        `ai=${metrics.timings.answerEngineMs}ms) count=${metrics.retrievalCount}`
      );
    }
  }

  public warn(requestId: string, message: string, meta?: any): void {
    console.warn(`[WARN] [${requestId}] ${message}`, meta || '');
  }

  public error(requestId: string, message: string, error?: any): void {
    console.error(`[ERROR] [${requestId}] ${message}`, error?.message || error || '');
  }
}

export const logger = new Logger();
