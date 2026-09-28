import { articleRepository } from '../db/articleRepository';
import { eventRepository } from '../db/eventRepository';
import { alertRepository } from '../db/alertRepository';
import { cacheService } from '../cache/cacheService';
import { AIService } from '../ai/aiService';

export async function handleHealthRequest(_request: Request): Promise<Response> {
  const startTime = Date.now();
  let dbStatus = 'UP';
  let articleCount = 0;
  let eventCount = 0;
  let alertCount = 0;

  try {
    articleCount = articleRepository.countArticles();
    eventCount = eventRepository.countEvents();
    alertCount = alertRepository.countAlerts();
  } catch {
    dbStatus = 'DOWN';
  }

  const cacheStats = cacheService.getStats();
  const totalCacheOps = cacheStats.hits + cacheStats.misses;
  const hitRate = totalCacheOps > 0
    ? `${((cacheStats.hits / totalCacheOps) * 100).toFixed(1)}%`
    : 'N/A';

  const aiService = new AIService();
  const activeProvider = aiService.getActiveProviderName();

  const memMb = Math.round(process.memoryUsage().rss / 1024 / 1024);

  const isHealthy = dbStatus === 'UP';

  return Response.json(
    {
      status: isHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      version: '2.0.0',
      uptimeSeconds: Math.floor(process.uptime()),
      latencyMs: Date.now() - startTime,
      memoryMb: memMb,
      checks: {
        database: {
          status: dbStatus,
          articleCount,
          eventCount,
          alertCount,
        },
        cache: {
          status: 'UP',
          keysCount: cacheStats.keysCount,
          hits: cacheStats.hits,
          misses: cacheStats.misses,
          hitRate,
        },
        aiProvider: {
          status: 'UP',
          activeProvider,
        },
      },
    },
    { status: isHealthy ? 200 : 503 }
  );
}
