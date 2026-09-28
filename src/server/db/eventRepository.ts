import { getDb } from './database';
import { EventRecord } from '../ingestion/types';
import { calculateDistanceKm } from '../retrieval/geoUtils';

export class EventRepository {
  public lastQueryDurationMs: number = 0;

  public insertEvent(event: EventRecord): boolean {
    const db = getDb();

    // Deduplication: canonical URL (sourceUrl+title hash) or contentHash
    const checkStmt = db.prepare(`
      SELECT id FROM events
      WHERE contentHash = ? OR (LOWER(title) = LOWER(?) AND sourceId = ?)
      LIMIT 1;
    `);
    const existing = checkStmt.get(
      event.contentHash,
      event.title.trim(),
      event.sourceId
    ) as any;

    if (existing) {
      return false; // duplicate
    }

    const stmt = db.prepare(`
      INSERT INTO events (
        id, title, description, startAt, endAt, venue,
        locationName, latitude, longitude,
        sourceId, sourceUrl, contentHash, status,
        createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `);

    stmt.run(
      event.id,
      event.title,
      event.description,
      event.startAt,
      event.endAt ?? null,
      event.venue ?? null,
      event.locationName,
      event.latitude ?? null,
      event.longitude ?? null,
      event.sourceId,
      event.sourceUrl,
      event.contentHash,
      event.status,
      event.createdAt,
      event.updatedAt
    );

    return true;
  }

  public searchEvents(params: {
    locationName?: string;
    latitude?: number;
    longitude?: number;
    radiusKm?: number;
    startDate?: Date;
    endDate?: Date;
    keywords?: string[];
    includeExpired?: boolean;
    limit?: number;
  }): EventRecord[] {
    const start = Date.now();
    const db = getDb();
    const conditions: string[] = ["status = 'active'"];
    const values: any[] = [];

    // Date range: match events whose startAt falls within range, or overlap
    if (params.startDate) {
      conditions.push("(startAt >= ? OR endAt >= ?)");
      values.push(params.startDate.toISOString(), params.startDate.toISOString());
    }
    if (params.endDate) {
      conditions.push('startAt <= ?');
      values.push(params.endDate.toISOString());
    }

    if (params.locationName && !params.latitude) {
      conditions.push('(locationName LIKE ? OR title LIKE ? OR venue LIKE ?)');
      const pattern = `%${params.locationName}%`;
      values.push(pattern, pattern, pattern);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `
      SELECT id, title, description, startAt, endAt, venue,
             locationName, latitude, longitude,
             sourceId, sourceUrl, contentHash, status, createdAt, updatedAt
      FROM events ${whereClause}
      ORDER BY startAt ASC
      LIMIT 100;
    `;
    const stmt = db.prepare(sql);
    let rows = (stmt.all(...values) as any[]).map(this.mapRow);
    this.lastQueryDurationMs = Date.now() - start;

    // Distance filter
    if (params.latitude !== undefined && params.longitude !== undefined) {
      const radiusKm = params.radiusKm || 30;
      rows = rows.filter((ev) => {
        if (ev.latitude != null && ev.longitude != null) {
          return calculateDistanceKm(params.latitude!, params.longitude!, ev.latitude, ev.longitude) <= radiusKm;
        }
        if (params.locationName) {
          return ev.locationName.toLowerCase().includes(params.locationName.toLowerCase());
        }
        return true;
      });
    }

    // Keywords
    if (params.keywords && params.keywords.length > 0) {
      rows = rows.filter((ev) => {
        const text = `${ev.title} ${ev.description} ${ev.locationName} ${ev.venue ?? ''}`.toLowerCase();
        return params.keywords!.some((kw) => text.includes(kw.toLowerCase()));
      });
    }

    if (params.limit && params.limit > 0) {
      rows = rows.slice(0, params.limit);
    }

    return rows;
  }

  public countEvents(): number {
    const db = getDb();
    const row = db.prepare(`SELECT COUNT(*) as count FROM events`).get() as any;
    return row ? Number(row.count) : 0;
  }

  private mapRow(r: any): EventRecord {
    return {
      id: r.id,
      title: r.title,
      description: r.description,
      startAt: r.startAt,
      endAt: r.endAt ?? null,
      venue: r.venue ?? null,
      locationName: r.locationName,
      latitude: r.latitude !== null ? Number(r.latitude) : null,
      longitude: r.longitude !== null ? Number(r.longitude) : null,
      sourceId: r.sourceId,
      sourceUrl: r.sourceUrl,
      contentHash: r.contentHash,
      status: r.status,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    };
  }
}

export const eventRepository = new EventRepository();
