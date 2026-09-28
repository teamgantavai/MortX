import { getDb } from './database';
import { NewsSourceConfig } from '../ingestion/types';

export class SourceRepository {
  public upsertSource(source: NewsSourceConfig): void {
    const db = getDb();
    const stmt = db.prepare(`
      INSERT INTO sources (id, name, type, baseUrl, feedUrl, enabled, language, region, trustLevel, lastFetchedAt, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        type = excluded.type,
        baseUrl = excluded.baseUrl,
        feedUrl = excluded.feedUrl,
        enabled = excluded.enabled,
        language = excluded.language,
        region = excluded.region,
        trustLevel = excluded.trustLevel,
        lastFetchedAt = excluded.lastFetchedAt,
        updatedAt = excluded.updatedAt;
    `);

    stmt.run(
      source.id,
      source.name,
      source.type,
      source.baseUrl,
      source.feedUrl,
      source.enabled ? 1 : 0,
      source.language,
      source.region,
      source.trustLevel || 'NEWS',
      source.lastFetchedAt || null,
      source.createdAt,
      source.updatedAt
    );
  }

  public getEnabledSources(): NewsSourceConfig[] {
    const db = getDb();
    const stmt = db.prepare(`SELECT * FROM sources WHERE enabled = 1`);
    const rows = stmt.all() as any[];

    return rows.map((r) => this.mapRow(r));
  }

  public getEnabledSourcesByType(type: string): NewsSourceConfig[] {
    const db = getDb();
    const stmt = db.prepare(`SELECT * FROM sources WHERE enabled = 1 AND type = ?`);
    const rows = stmt.all(type) as any[];
    return rows.map((r) => this.mapRow(r));
  }

  public getEnabledSourcesByTrustLevel(trustLevel: string): NewsSourceConfig[] {
    const db = getDb();
    const stmt = db.prepare(`SELECT * FROM sources WHERE enabled = 1 AND trustLevel = ?`);
    const rows = stmt.all(trustLevel) as any[];
    return rows.map((r) => this.mapRow(r));
  }

  public getSourceById(id: string): NewsSourceConfig | null {
    const db = getDb();
    const stmt = db.prepare(`SELECT * FROM sources WHERE id = ?`);
    const r = stmt.get(id) as any;
    if (!r) return null;
    return this.mapRow(r);
  }

  public updateLastFetched(id: string, timestamp: string): void {
    const db = getDb();
    const stmt = db.prepare(`
      UPDATE sources SET lastFetchedAt = ?, updatedAt = ? WHERE id = ?
    `);
    stmt.run(timestamp, new Date().toISOString(), id);
  }

  private mapRow(r: any): NewsSourceConfig {
    return {
      id: r.id,
      name: r.name,
      type: r.type,
      baseUrl: r.baseUrl,
      feedUrl: r.feedUrl,
      enabled: Boolean(r.enabled),
      language: r.language,
      region: r.region,
      trustLevel: r.trustLevel || 'NEWS',
      lastFetchedAt: r.lastFetchedAt,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    };
  }
}

export const sourceRepository = new SourceRepository();
