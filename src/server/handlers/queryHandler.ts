import { defaultQueryRouter } from '../ai/queryRouter';
import { AIQueryInput } from '../ai/types';
import { defaultRetrievalService } from '../retrieval/retrievalService';
import { aiAnswerService } from '../answer/answerService';
import { generateRequestId, logger } from '../observability/logger';
import { rateLimiter } from '../security/rateLimiter';
import { inputValidator } from '../security/inputValidator';
import { cacheService } from '../cache/cacheService';
import { articleRepository } from '../db/articleRepository';
import { config } from '../config';

export async function handleQueryRequest(request: Request): Promise<Response> {
  const reqStart = Date.now();
  const requestId = generateRequestId();

  // 1. Method check
  if (request.method !== 'POST') {
    return Response.json(
      {
        success: false,
        error: { code: 'METHOD_NOT_ALLOWED', message: `Method ${request.method} not allowed. Use POST.` },
        requestId,
      },
      { status: 405, headers: { 'X-Request-Id': requestId } }
    );
  }

  // 2. Rate Limiting Check
  const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('cf-connecting-ip') || 'anonymous_client';
  const isAuth = Boolean(request.headers.get('authorization'));
  const rateLimitStatus = rateLimiter.check(clientIp, isAuth);

  if (!rateLimitStatus.allowed) {
    logger.warn(requestId, `Rate limit exceeded for client ${clientIp}`);
    return Response.json(
      {
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests. Please slow down and try again shortly.',
        },
        requestId,
      },
      {
        status: 429,
        headers: {
          'X-Request-Id': requestId,
          'Retry-After': String(Math.ceil(rateLimitStatus.resetTimeMs / 1000)),
        },
      }
    );
  }

  // 3. Body Parsing
  let body: AIQueryInput;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      {
        success: false,
        error: { code: 'INVALID_JSON', message: 'Invalid JSON body in request' },
        requestId,
      },
      { status: 400, headers: { 'X-Request-Id': requestId } }
    );
  }

  // 4. Input Validation & Security Guardrails
  const validation = inputValidator.validateQueryInput(body);
  if (!validation.valid) {
    return Response.json(
      {
        success: false,
        error: {
          code: validation.errorCode || 'VALIDATION_ERROR',
          message: validation.errorMessage || 'Invalid input parameter',
        },
        requestId,
      },
      { status: 400, headers: { 'X-Request-Id': requestId } }
    );
  }

  // 5. Caching Check
  const locationKey = body.location?.placeName || (body.location?.latitude ? `${body.location.latitude}_${body.location.longitude}` : undefined);
  const cacheKey = cacheService.generateQueryCacheKey(body.query, locationKey);
  const cachedResponse = cacheService.get<any>(cacheKey);

  if (cachedResponse) {
    const totalMs = Date.now() - reqStart;
    logger.logRequestMetrics({
      requestId,
      intent: cachedResponse.query?.intent,
      status: 'SUCCESS',
      cacheHit: true,
      retrievalCount: cachedResponse.results?.length || 0,
      timings: {
        queryRouterMs: 0,
        retrievalMs: 0,
        databaseMs: 0,
        answerEngineMs: 0,
        totalMs,
      },
    });

    return Response.json(
      {
        ...cachedResponse,
        requestId,
        metadata: {
          ...cachedResponse.metadata,
          cached: true,
          latencyMs: totalMs,
        },
      },
      {
        status: 200,
        headers: {
          'X-Request-Id': requestId,
          'X-Cache': 'HIT',
        },
      }
    );
  }

  // 6. Pipeline Execution with Detailed Internal Timing Breakdown
  let queryRouterMs = 0;
  let retrievalMs = 0;
  let answerEngineMs = 0;

  try {
    // Phase 1: Query Router
    const tRouterStart = Date.now();
    const structuredQuery = await defaultQueryRouter.routeQuery({
      query: body.query,
      location: body.location,
      userLocation: body.userLocation,
    });
    queryRouterMs = Date.now() - tRouterStart;

    // Phase 2: Retrieval Layer
    const tRetrievalStart = Date.now();
    const retrieval = await defaultRetrievalService.retrieve(structuredQuery);
    retrievalMs = Date.now() - tRetrievalStart;
    const databaseMs = articleRepository.lastQueryDurationMs || 0;

    // Phase 3: AI Answer Engine (with partial results fallback defense)
    const tAnswerStart = Date.now();
    let answerOutput: any;
    try {
      answerOutput = await aiAnswerService.generateAnswer({
        originalQuery: body.query,
        structuredQuery,
        results: retrieval.items,
      });
    } catch (aiErr: any) {
      logger.warn(requestId, `AI Answer Engine error, falling back to structured results`, aiErr);
      // Graceful degradation: never lose the retrieved results
      answerOutput = {
        answer: retrieval.items.length > 0
          ? `We found ${retrieval.items.length} relevant updates, but the AI synthesis is temporarily degraded.`
          : "I couldn't find reliable current information matching your request.",
        highlights: retrieval.items.map((it) => ({
          title: it.title,
          summary: it.summary,
          location: it.location.name,
          publishedAt: it.publishedAt,
        })),
        sources: retrieval.items.map((it) => ({
          id: it.source.name,
          name: it.source.name,
          url: it.source.url || '',
          publishedAt: it.publishedAt,
        })),
        confidence: 'LOW',
        metadata: { latencyMs: Date.now() - tAnswerStart },
        warnings: ['AI Answer Engine encountered a temporary error; showing direct evidence.'],
      };
    }
    answerEngineMs = Date.now() - tAnswerStart;

    const totalMs = Date.now() - reqStart;

    const responsePayload = {
      success: true,
      answer: {
        text: answerOutput.answer,
        highlights: answerOutput.highlights,
        sources: answerOutput.sources,
        confidence: answerOutput.confidence,
      },
      query: structuredQuery,
      results: retrieval.items,
      ...(retrieval.message ? { message: retrieval.message } : {}),
      requestId,
      metadata: {
        resultCount: retrieval.items.length,
        latencyMs: totalMs,
        timings: {
          queryRouterMs,
          retrievalMs,
          databaseMs,
          answerEngineMs,
          totalMs,
        },
        warnings: answerOutput.warnings || [],
      },
    };

    // Store in cache with intent-appropriate TTL
    let ttlSeconds = config.cacheTtlNewsSeconds;
    if (structuredQuery.intent === 'LOCAL_EVENTS') {
      ttlSeconds = config.cacheTtlEventsSeconds;
    } else if (structuredQuery.intent === 'GOVERNMENT_ALERTS') {
      ttlSeconds = config.cacheTtlAlertsSeconds;
    } else if (structuredQuery.intent === 'MIXED_LOCAL') {
      // Mixed: use shortest TTL among included types (alerts: 5 min)
      ttlSeconds = config.cacheTtlAlertsSeconds;
    }
    cacheService.set(cacheKey, responsePayload, ttlSeconds);

    // Record structured log
    logger.logRequestMetrics({
      requestId,
      intent: structuredQuery.intent,
      status: 'SUCCESS',
      cacheHit: false,
      retrievalCount: retrieval.items.length,
      timings: {
        queryRouterMs,
        retrievalMs,
        databaseMs,
        answerEngineMs,
        totalMs,
      },
    });

    return Response.json(responsePayload, {
      status: 200,
      headers: {
        'X-Request-Id': requestId,
        'X-Cache': 'MISS',
      },
    });
  } catch (err: any) {
    const totalMs = Date.now() - reqStart;
    logger.error(requestId, 'Request pipeline failure', err);

    logger.logRequestMetrics({
      requestId,
      status: 'ERROR',
      cacheHit: false,
      retrievalCount: 0,
      timings: {
        queryRouterMs,
        retrievalMs,
        databaseMs: 0,
        answerEngineMs,
        totalMs,
      },
      error: err.message,
    });

    return Response.json(
      {
        success: false,
        error: {
          code: 'PROCESSING_ERROR',
          message: err.message || 'Failed to process local query request',
        },
        requestId,
      },
      {
        status: 400,
        headers: { 'X-Request-Id': requestId },
      }
    );
  }
}
