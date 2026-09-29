/**
 * POST /api/admin/ingest
 *
 * Manually triggers a news ingestion run and returns stats.
 * For local/dev use only — do not expose in production without auth.
 *
 * Response:
 *   {
 *     success: boolean,
 *     stats: IngestionJobStats,
 *     articleCountAfter: number,
 *   }
 */
import { newsIngestionService } from '../../../server/ingestion/ingestionJob';
import { articleRepository } from '../../../server/db/articleRepository';
import { ingestionScheduler } from '../../../server/ingestion/ingestionScheduler';
import { sourceCircuitBreaker } from '../../../server/ingestion/circuitBreaker';
import { ensureServerStarted } from '../../../server/startup';
import { getDb } from '../../../server/db/database';

/** Remove junk test sources that tests inserted into the DB */
function cleanTestSources(): number {
  const db = getDb();
  const result = db.prepare(`
    DELETE FROM sources 
    WHERE id LIKE 'e2e-source-%' 
       OR id LIKE 'prod-test-%' 
       OR id LIKE 'retrieval-test-%'
       OR id LIKE 'test-%'
  `).run();
  return (result as any).changes ?? 0;
}

/** Reset all circuit breakers so previously-failed real sources can be retried */
function resetRealSourceBreakers(): void {
  sourceCircuitBreaker.reset();
}

export async function POST(_request: Request): Promise<Response> {
  ensureServerStarted();

  try {
    console.log('[AdminIngest] Manual ingest triggered via API');

    // 1. Clean up junk test sources first
    const removedSources = cleanTestSources();
    if (removedSources > 0) {
      console.log(`[AdminIngest] Cleaned ${removedSources} test sources from DB`);
    }

    // 2. Reset circuit breakers so real sources aren't blocked from previous failures
    resetRealSourceBreakers();

    // 3. Run the actual ingestion
    const stats = await newsIngestionService.ingestNews();
    const articleCountAfter = articleRepository.countArticles();
    const schedulerStatus = ingestionScheduler.getStatus();

    return Response.json({
      success: true,
      removedTestSources: removedSources,
      stats,
      articleCountAfter,
      schedulerStatus,
    });
  } catch (err: any) {
    console.error('[AdminIngest] Error:', err);
    return Response.json(
      { success: false, error: err.message || 'Ingest failed' },
      { status: 500 }
    );
  }
}

export async function GET(_request: Request): Promise<Response> {
  ensureServerStarted();

  try {
    const articleCount = articleRepository.countArticles();
    const schedulerStatus = ingestionScheduler.getStatus();

    // Count sources by type
    const db = getDb();
    const sourceCounts = db.prepare(`
      SELECT trustLevel, enabled, COUNT(*) as count 
      FROM sources 
      GROUP BY trustLevel, enabled
    `).all() as any[];

    return Response.json({
      success: true,
      articleCount,
      schedulerStatus,
      sourceCounts,
      hint: 'POST to this endpoint to trigger a manual ingest run. DELETE to clean test sources.',
    });
  } catch (err: any) {
    return Response.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request): Promise<Response> {
  try {
    const removed = cleanTestSources();
    const db = getDb();
    const remaining = (db.prepare('SELECT COUNT(*) as count FROM sources').get() as any).count;
    return Response.json({ success: true, removedTestSources: removed, remainingSources: remaining });
  } catch (err: any) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}

