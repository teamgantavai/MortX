/**
 * Ingestion Scheduler
 *
 * Runs background ingestion jobs for news, events, and government alerts
 * on configurable intervals. Never runs during a user's chat request.
 *
 * Usage:
 *   import { ingestionScheduler } from './ingestionScheduler';
 *   ingestionScheduler.start();
 */
import { newsIngestionService } from './ingestionJob';
import { eventIngestionService } from './eventIngestionJob';
import { alertIngestionService } from './alertIngestionJob';
import { config } from '../config';

type JobName = 'NEWS' | 'EVENTS' | 'ALERTS' | 'PRICES';

interface JobStatus {
  name: JobName;
  lastRunAt: string | null;
  lastResult: 'SUCCESS' | 'FAILED' | null;
  lastInserted: number;
  timerId: ReturnType<typeof setInterval> | null;
}

export class IngestionScheduler {
  private jobs: Map<JobName, JobStatus> = new Map([
    ['NEWS',   { name: 'NEWS',   lastRunAt: null, lastResult: null, lastInserted: 0, timerId: null }],
    ['EVENTS', { name: 'EVENTS', lastRunAt: null, lastResult: null, lastInserted: 0, timerId: null }],
    ['ALERTS', { name: 'ALERTS', lastRunAt: null, lastResult: null, lastInserted: 0, timerId: null }],
    ['PRICES', { name: 'PRICES', lastRunAt: null, lastResult: null, lastInserted: 0, timerId: null }],
  ]);

  private log(msg: string): void {
    console.log(`[IngestionScheduler] ${msg}`);
  }

  public start(): void {
    this.scheduleJob('NEWS', config.ingestionIntervalNewsMs, () => this.runNews());
    this.scheduleJob('EVENTS', config.ingestionIntervalEventsMs, () => this.runEvents());
    this.scheduleJob('ALERTS', config.ingestionIntervalAlertsMs, () => this.runAlerts());
    this.scheduleJob('PRICES', config.ingestionIntervalPricesMs, () => this.runPrices());
    this.log('All ingestion jobs scheduled.');
  }

  public stop(): void {
    for (const [name, status] of this.jobs.entries()) {
      if (status.timerId !== null) {
        clearInterval(status.timerId);
        status.timerId = null;
        this.log(`Stopped job: ${name}`);
      }
    }
  }

  public getStatus(): Record<JobName, Omit<JobStatus, 'timerId'>> {
    const result: any = {};
    for (const [name, status] of this.jobs.entries()) {
      result[name] = {
        name: status.name,
        lastRunAt: status.lastRunAt,
        lastResult: status.lastResult,
        lastInserted: status.lastInserted,
      };
    }
    return result;
  }

  private scheduleJob(name: JobName, intervalMs: number, fn: () => Promise<void>): void {
    const status = this.jobs.get(name)!;
    // Run immediately on first start (non-blocking)
    fn().catch((err) => this.log(`Initial run of ${name} failed: ${err?.message}`));

    status.timerId = setInterval(() => {
      fn().catch((err) => this.log(`Scheduled run of ${name} failed: ${err?.message}`));
    }, intervalMs);
  }

  private async runNews(): Promise<void> {
    const status = this.jobs.get('NEWS')!;
    this.log('Running NEWS ingestion...');
    try {
      const stats = await newsIngestionService.ingestNews();
      status.lastRunAt = new Date().toISOString();
      status.lastResult = stats.failedSources === 0 ? 'SUCCESS' : 'FAILED';
      status.lastInserted = stats.totalInserted;
      this.log(`NEWS done — inserted: ${stats.totalInserted}, duplicates: ${stats.totalDuplicates}, failed sources: ${stats.failedSources}`);
    } catch (err: any) {
      status.lastResult = 'FAILED';
      this.log(`NEWS ingestion error: ${err?.message}`);
    }
  }

  private async runEvents(): Promise<void> {
    const status = this.jobs.get('EVENTS')!;
    this.log('Running EVENTS ingestion...');
    try {
      const stats = await eventIngestionService.ingestEvents();
      status.lastRunAt = new Date().toISOString();
      status.lastResult = stats.failedSources === 0 ? 'SUCCESS' : 'FAILED';
      status.lastInserted = stats.totalInserted;
      this.log(`EVENTS done — inserted: ${stats.totalInserted}, duplicates: ${stats.totalDuplicates}`);
    } catch (err: any) {
      status.lastResult = 'FAILED';
      this.log(`EVENTS ingestion error: ${err?.message}`);
    }
  }

  private async runAlerts(): Promise<void> {
    const status = this.jobs.get('ALERTS')!;
    this.log('Running ALERTS ingestion...');
    try {
      const stats = await alertIngestionService.ingestAlerts();
      status.lastRunAt = new Date().toISOString();
      status.lastResult = stats.failedSources === 0 ? 'SUCCESS' : 'FAILED';
      status.lastInserted = stats.totalInserted;
      this.log(`ALERTS done — inserted: ${stats.totalInserted}, duplicates: ${stats.totalDuplicates}`);
    } catch (err: any) {
      status.lastResult = 'FAILED';
      this.log(`ALERTS ingestion error: ${err?.message}`);
    }
  }

  private async runPrices(): Promise<void> {
    const status = this.jobs.get('PRICES')!;
    this.log('Running PRICES ingestion...');
    try {
      const { priceRepository } = await import('../db/priceRepository');
      const count = priceRepository.countPrices();
      status.lastRunAt = new Date().toISOString();
      status.lastResult = 'SUCCESS';
      status.lastInserted = 0;
      this.log(`PRICES active check done — current observations in DB: ${count}`);
    } catch (err: any) {
      status.lastResult = 'FAILED';
      this.log(`PRICES ingestion error: ${err?.message}`);
    }
  }
}

export const ingestionScheduler = new IngestionScheduler();
