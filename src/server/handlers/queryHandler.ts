import { defaultQueryRouter } from '../ai/queryRouter';
import { AIQueryInput } from '../ai/types';
import { localIntelligenceRetrievalService } from '../retrieval/localIntelligenceRetrievalService';
import { aiAnswerService } from '../answer/answerService';
import { researchOrchestrator } from '../research/researchOrchestrator';
import { generateRequestId, logger } from '../observability/logger';
import { rateLimiter } from '../security/rateLimiter';
import { inputValidator } from '../security/inputValidator';
import { cacheService } from '../cache/cacheService';
import { articleRepository } from '../db/articleRepository';
import { config } from '../config';

// Intents that benefit from real-time research
const RESEARCH_INTENTS = new Set([
  'LOCAL_NEWS', 'GENERAL_LOCAL_SEARCH'
]);

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

  // 5. Caching Check (locality/area key based on 2 decimal places to avoid over-specific exact GPS caching)
  const roundCoord = (n?: number | string) => (typeof n === 'number' ? n.toFixed(2) : typeof n === 'string' && !isNaN(Number(n)) ? Number(n).toFixed(2) : '');
  const locationKey = body.location?.placeName || (body.location?.latitude ? `${roundCoord(body.location.latitude)}_${roundCoord(body.location.longitude)}` : undefined);
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

    // Phase 2: Retrieval Orchestrator + Research Engine (run in parallel)
    const tRetrievalStart = Date.now();

    const shouldResearch = RESEARCH_INTENTS.has(structuredQuery.intent);

    const [retrieval, researchSession] = await Promise.all([
      localIntelligenceRetrievalService.retrieve(structuredQuery),
      shouldResearch
        ? researchOrchestrator.research(requestId, body.query, structuredQuery).catch((err) => {
            logger.warn(requestId, `Research engine failed (non-fatal): ${err?.message}`);
            return null;
          })
        : Promise.resolve(null),
    ]);
    retrievalMs = Date.now() - tRetrievalStart;

    // Merge local DB evidence + research evidence
    let mergedEvidence = [...retrieval.evidence];
    if (researchSession && researchSession.evidence.length > 0) {
      // Convert research evidence items to the evidence format expected by answerService
      const researchEvidence = researchSession.evidence.slice(0, 8).map((item) => ({
        id: item.id,
        title: item.title,
        summary: item.evidenceText.slice(0, 400),
        publishedAt: item.publishedAt || new Date().toISOString(),
        type: 'NEWS' as const,
        source: {
          name: item.publisher,
          url: item.url,
          type: item.tier as any,
        },
        location: { name: researchSession.plan.locationContext, latitude: undefined, longitude: undefined },
        relevanceScore: item.rankScore,
        importance: 'NORMAL' as const,
        metadata: { researchItemId: item.id, url: item.url },
      }));

      // Merge: local DB first, then research (dedup by title similarity)
      const existingTitles = new Set(mergedEvidence.map((e) => e.title.toLowerCase().slice(0, 40)));
      const newResearchItems = researchEvidence.filter(
        (re) => !existingTitles.has(re.title.toLowerCase().slice(0, 40))
      );
      mergedEvidence = [...mergedEvidence, ...newResearchItems];
    }

    // Phase 3: AI Answer Engine
    const tAnswerStart = Date.now();
    let answerOutput: any;

    // If research engine found results, use research answer directly for single-category news
    const isSingleCategoryNews = structuredQuery.intent === 'LOCAL_NEWS' || structuredQuery.intent === 'GENERAL_LOCAL_SEARCH';
    if (isSingleCategoryNews && researchSession?.answer && researchSession.evidence.length > 0) {
      const researchAns = researchSession.answer;
      answerOutput = {
        answer: researchAns.answer,
        highlights: researchAns.claims.map((c) => ({
          title: c.text.slice(0, 100),
          summary: c.text,
          location: researchSession.plan.locationContext,
          publishedAt: new Date().toISOString(),
          sourceId: c.sourceIds[0] || 'research',
        })),
        sources: researchAns.sources.map((s) => ({
          id: s.id,
          name: s.publisher,
          url: s.url,
          publishedAt: s.publishedAt || new Date().toISOString(),
        })),
        confidence: researchSession.evidence.length >= 3 ? 'HIGH' : 'MEDIUM',
        metadata: { latencyMs: Date.now() - tAnswerStart },
        warnings: [],
      };
    } else {
      // Fallback: use local DB evidence with existing answer engine
      try {
        answerOutput = await aiAnswerService.generateAnswer({
          originalQuery: body.query,
          structuredQuery,
          results: mergedEvidence,
        });
      } catch (aiErr: any) {
        logger.warn(requestId, `AI Answer Engine error, falling back to structured results`, aiErr);
        answerOutput = {
          answer: mergedEvidence.length > 0
            ? `We found ${mergedEvidence.length} relevant updates, but the AI synthesis is temporarily degraded.`
            : "I couldn't find reliable current information matching your request.",
          highlights: mergedEvidence.map((it) => ({
            title: it.title,
            summary: it.summary,
            location: it.location.name,
            publishedAt: it.publishedAt,
          })),
          sources: mergedEvidence.map((it) => ({
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
        // Include research claims with citations if available
        ...(researchSession?.answer?.claims ? { claims: researchSession.answer.claims } : {}),
        ...(researchSession?.answer?.followUpQuestions ? { followUpQuestions: researchSession.answer.followUpQuestions } : {}),
      },
      sources: answerOutput.sources,
      ...(answerOutput.priceData ? { priceData: answerOutput.priceData } : {}),
      // Research metadata block
      ...(researchSession ? {
        research: {
          searchesPerformed: researchSession.meta.searchesPerformed,
          sourcesRead: researchSession.meta.sourcesRead,
          evidenceItems: researchSession.meta.evidenceItems,
          retrievedAt: researchSession.meta.retrievedAt,
          durationMs: researchSession.meta.durationMs,
          searchQueries: researchSession.plan.searchQueries,
          provider: 'google-news-rss',
        },
      } : {}),
      query: structuredQuery,
      retrievalPlan: retrieval.retrievalPlan,
      results: mergedEvidence,
      ...(retrieval.message ? { message: retrieval.message } : {}),
      requestId,
      metadata: {
        resultCount: mergedEvidence.length,
        latencyMs: totalMs,
        timings: {
          queryRouterMs,
          retrievalMs,
          databaseMs: retrieval.timings.parallelFetchMs,
          parallelFetchMs: retrieval.timings.parallelFetchMs,
          rankAndFilterMs: retrieval.timings.rankAndFilterMs,
          answerEngineMs,
          totalMs,
        },
        sourcesUsed: retrieval.sourcesUsed,
        sourcesFailed: retrieval.sourcesFailed,
        warnings: answerOutput.warnings || [],
      },
    };

    // Store in cache with intent-appropriate TTL
    // Research results get a shorter TTL since they change rapidly
    let ttlSeconds = researchSession?.evidence.length
      ? config.cacheTtlResearchSeconds  // 2 min for real-time research
      : config.cacheTtlNewsSeconds;     // 10 min for DB-only
    if (structuredQuery.intent === 'LOCAL_EVENTS') {
      ttlSeconds = config.cacheTtlEventsSeconds;
    } else if (structuredQuery.intent === 'PRICE_SEARCH') {
      ttlSeconds = config.cacheTtlPricesSeconds;
    } else if (structuredQuery.intent === 'GOVERNMENT_ALERTS') {
      ttlSeconds = Math.min(config.cacheTtlAlertsSeconds, config.cacheTtlResearchSeconds);
    }
    cacheService.set(cacheKey, responsePayload, ttlSeconds);

    // Record structured log
    logger.logRequestMetrics({
      requestId,
      intent: structuredQuery.intent,
      status: 'SUCCESS',
      cacheHit: false,
      retrievalCount: retrieval.evidence.length,
      timings: {
        queryRouterMs,
        retrievalMs,
        databaseMs: articleRepository.lastQueryDurationMs || 0,
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
