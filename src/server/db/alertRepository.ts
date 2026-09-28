import { getDb } from './database';
import { GovernmentAlertRecord } from '../ingestion/types';
import { calculateDistanceKm } from '../retrieval/geoUtils';

export class AlertRepository {
  public lastQueryDurationMs: number = 0;

  public insertAlert(alert: GovernmentAlertRecord): boolean {
    const db = getDb();

    // Deduplication: contentHash or title+department+publishedAt
    const checkStmt = db.prepare(`
      SELECT id FROM government_alerts
      WHERE contentHash = ? OR (LOWER(title) = LOWER(?) AND department = ? AND DATE(publishedAt) = DATE(?))
      LIMIT 1;
    `);
    const existing = checkStmt.get(
      alert.contentHash,
      alert.title.trim(),
      alert.department,
      alert.publishedAt
    ) as any;

    if (existing) {
      return false; // duplicate
    }

    const stmt = db.prepare(`
      INSERT INTO government_alerts (
        id, title, description, department,
        publishedAt, effectiveFrom, effectiveUntil,
        locationName, latitude, longitude,
        category, sourceId, sourceUrl, contentHash,
        status, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `);

    stmt.run(
      alert.id,
      alert.title,
      alert.description,
      alert.department,
      alert.publishedAt,
      alert.effectiveFrom ?? null,
      alert.effectiveUntil ?? null,
      alert.locationName,
      alert.latitude ?? null,
      alert.longitude ?? null,
      alert.category,
      alert.sourceId,
      alert.sourceUrl,
      alert.contentHash,
      alert.status,
      alert.createdAt,
      alert.updatedAt
    );

    return true;
  }

  public searchAlerts(params: {
    locationName?: string;
    latitude?: number;
    longitude?: number;
    radiusKm?: number;
    startDate?: Date;
    endDate?: Date;
    category?: string;
    keywords?: string[];
    includeExpired?: boolean;
    limit?: number;
  }): GovernmentAlertRecord[] {
    const start = Date.now();
    const db = getDb();
    const conditions: string[] = ["status = 'active'"];
    const values: any[] = [];

    // Exclude alerts that have already expired unless caller wants them
    if (!params.includeExpired) {
      const now = new Date().toISOString();
      conditions.push(`(effectiveUntil IS NULL OR effectiveUntil >= ?)`);
      values.push(now);
    }

    if (params.startDate) {
      conditions.push('publishedAt >= ?');
      values.push(params.startDate.toISOString());
    }
    if (params.endDate) {
      conditions.push('publishedAt <= ?');
      values.push(params.endDate.toISOString());
    }

    if (params.category) {
      conditions.push('category = ?');
      values.push(params.category);
    }

    if (params.locationName && !params.latitude) {
      conditions.push('(locationName LIKE ? OR title LIKE ? OR description LIKE ?)');
      const pattern = `%${params.locationName}%`;
      values.push(pattern, pattern, pattern);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `
      SELECT id, title, description, department,
             publishedAt, effectiveFrom, effectiveUntil,
             locationName, latitude, longitude,
             category, sourceId, sourceUrl, contentHash,
             status, createdAt, updatedAt
      FROM government_alerts ${whereClause}
      ORDER BY publishedAt DESC
      LIMIT 100;
    `;
    const stmt = db.prepare(sql);
    let rows = (stmt.all(...values) as any[]).map(this.mapRow);
    this.lastQueryDurationMs = Date.now() - start;

    // Distance filter
    if (params.latitude !== undefined && params.longitude !== undefined) {
      const radiusKm = params.radiusKm || 50; // slightly wider for regional alerts
      rows = rows.filter((al) => {
        if (al.latitude != null && al.longitude != null) {
          return calculateDistanceKm(params.latitude!, params.longitude!, al.latitude, al.longitude) <= radiusKm;
        }
        if (params.locationName) {
          return al.locationName.toLowerCase().includes(params.locationName.toLowerCase());
        }
        return true;
      });
    }

    // Keywords
    if (params.keywords && params.keywords.length > 0) {
      rows = rows.filter((al) => {
        const text = `${al.title} ${al.description} ${al.locationName}`.toLowerCase();
        return params.keywords!.some((kw) => text.includes(kw.toLowerCase()));
      });
    }

    if (params.limit && params.limit > 0) {
      rows = rows.slice(0, params.limit);
    }

    return rows;
  }

  public countAlerts(): number {
    const db = getDb();
    const row = db.prepare(`SELECT COUNT(*) as count FROM government_alerts`).get() as any;
    return row ? Number(row.count) : 0;
  }

  private mapRow(r: any): GovernmentAlertRecord {
    return {
      id: r.id,
      title: r.title,
      description: r.description,
      department: r.department,
      publishedAt: r.publishedAt,
      effectiveFrom: r.effectiveFrom ?? null,
      effectiveUntil: r.effectiveUntil ?? null,
      locationName: r.locationName,
      latitude: r.latitude !== null ? Number(r.latitude) : null,
      longitude: r.longitude !== null ? Number(r.longitude) : null,
      category: r.category,
      sourceId: r.sourceId,
      sourceUrl: r.sourceUrl,
      contentHash: r.contentHash,
      status: r.status,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    };
  }
}

export const alertRepository = new AlertRepository();
