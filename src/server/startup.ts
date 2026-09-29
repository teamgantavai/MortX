/**
 * Server Startup
 *
 * Called once at server boot to start background ingestion workers.
 * Designed to be safe to import multiple times — the scheduler only
 * starts on the very first call.
 */
import { ingestionScheduler } from './ingestion/ingestionScheduler';

let started = false;

export function ensureServerStarted(): void {
  if (started) return;
  started = true;
  console.log('[Startup] Starting ingestion scheduler...');
  ingestionScheduler.start();
}
