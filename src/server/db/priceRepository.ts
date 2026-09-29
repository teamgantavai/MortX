import { getDb } from './database';
import { PriceObservationRecord } from '../ingestion/types';
import { calculateDistanceKm } from '../retrieval/geoUtils';

export class PriceRepository {
  public lastQueryDurationMs: number = 0;

  public insertPrice(price: PriceObservationRecord): boolean {
    const db = getDb();

    // Deduplication check: contentHash or exact product + market + unit + observedAt date
    const checkStmt = db.prepare(`
      SELECT id FROM price_observations
      WHERE contentHash = ? OR (
        LOWER(productName) = LOWER(?) AND
        LOWER(market) = LOWER(?) AND
        LOWER(unit) = LOWER(?) AND
        DATE(observedAt) = DATE(?)
      )
      LIMIT 1;
    `);

    const existing = checkStmt.get(
      price.contentHash,
      price.productName.trim(),
      price.market.trim(),
      price.unit.trim(),
      price.observedAt
    ) as any;

    if (existing) {
      return false; // duplicate observation rejected
    }

    const stmt = db.prepare(`
      INSERT INTO price_observations (
        id, productName, category, price, unit, currency,
        market, locationName, latitude, longitude,
        observedAt, sourceId, sourceUrl, contentHash,
        status, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `);

    stmt.run(
      price.id,
      price.productName.trim(),
      price.category,
      price.price,
      price.unit.toLowerCase().trim(),
      price.currency || 'INR',
      price.market.trim(),
      price.locationName.trim(),
      price.latitude ?? null,
      price.longitude ?? null,
      price.observedAt,
      price.sourceId,
      price.sourceUrl ?? null,
      price.contentHash,
      price.status || 'active',
      price.createdAt,
      price.updatedAt
    );

    return true;
  }

  public searchPrices(params: {
    product?: string;
    market?: string;
    locationName?: string;
    latitude?: number;
    longitude?: number;
    radiusKm?: number;
    startDate?: Date;
    endDate?: Date;
    category?: string;
    includeFlagged?: boolean;
    limit?: number;
  }): PriceObservationRecord[] {
    const start = Date.now();
    const db = getDb();
    const conditions: string[] = [];
    const values: any[] = [];

    if (!params.includeFlagged) {
      conditions.push("status = 'active'");
    } else {
      conditions.push("status IN ('active', 'flagged')");
    }

    if (params.product) {
      conditions.push('(LOWER(productName) = LOWER(?) OR LOWER(productName) LIKE ?)');
      values.push(params.product.trim(), `%${params.product.trim().toLowerCase()}%`);
    }

    if (params.market) {
      conditions.push('LOWER(market) LIKE ?');
      values.push(`%${params.market.trim().toLowerCase()}%`);
    }

    if (params.category) {
      conditions.push('category = ?');
      values.push(params.category.toUpperCase());
    }

    if (params.startDate) {
      conditions.push('observedAt >= ?');
      values.push(params.startDate.toISOString());
    }

    if (params.endDate) {
      conditions.push('observedAt <= ?');
      values.push(params.endDate.toISOString());
    }

    if (params.locationName && !params.latitude) {
      conditions.push('(locationName LIKE ? OR market LIKE ?)');
      values.push(`%${params.locationName}%`, `%${params.locationName}%`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `
      SELECT * FROM price_observations
      ${whereClause}
      ORDER BY observedAt DESC
      LIMIT ?;
    `;
    values.push(params.limit || 50);

    const rows = db.prepare(sql).all(...values) as any[];

    // If geographic coords provided, filter and order by distance
    let results: PriceObservationRecord[] = rows;
    if (params.latitude !== undefined && params.longitude !== undefined && params.radiusKm) {
      results = rows.filter((r) => {
        if (r.latitude == null || r.longitude == null) return true; // keep records without exact coords
        const d = calculateDistanceKm(params.latitude!, params.longitude!, r.latitude, r.longitude);
        return d <= params.radiusKm!;
      });
    }

    this.lastQueryDurationMs = Date.now() - start;
    return results;
  }

  public getLatestPrice(
    product: string,
    options?: { market?: string; locationName?: string; unit?: string }
  ): PriceObservationRecord | null {
    const db = getDb();
    const conditions: string[] = ["status = 'active'", '(LOWER(productName) = LOWER(?) OR LOWER(productName) LIKE ?)'];
    const values: any[] = [product.trim(), `%${product.trim().toLowerCase()}%`];

    if (options?.market) {
      conditions.push('LOWER(market) LIKE ?');
      values.push(`%${options.market.trim().toLowerCase()}%`);
    }

    if (options?.locationName) {
      conditions.push('LOWER(locationName) LIKE ?');
      values.push(`%${options.locationName.trim().toLowerCase()}%`);
    }

    if (options?.unit) {
      conditions.push('LOWER(unit) = LOWER(?)');
      values.push(options.unit.trim());
    }

    const sql = `
      SELECT * FROM price_observations
      WHERE ${conditions.join(' AND ')}
      ORDER BY observedAt DESC
      LIMIT 1;
    `;

    const row = db.prepare(sql).get(...values) as any;
    return row || null;
  }

  public getHistoricalPrice(
    product: string,
    beforeDate: Date,
    options?: { market?: string; locationName?: string; unit?: string }
  ): PriceObservationRecord | null {
    const db = getDb();
    const conditions: string[] = [
      "status = 'active'",
      '(LOWER(productName) = LOWER(?) OR LOWER(productName) LIKE ?)',
      'observedAt <= ?'
    ];
    const values: any[] = [
      product.trim(),
      `%${product.trim().toLowerCase()}%`,
      beforeDate.toISOString()
    ];

    if (options?.market) {
      conditions.push('LOWER(market) LIKE ?');
      values.push(`%${options.market.trim().toLowerCase()}%`);
    }

    if (options?.locationName) {
      conditions.push('LOWER(locationName) LIKE ?');
      values.push(`%${options.locationName.trim().toLowerCase()}%`);
    }

    if (options?.unit) {
      conditions.push('LOWER(unit) = LOWER(?)');
      values.push(options.unit.trim());
    }

    const sql = `
      SELECT * FROM price_observations
      WHERE ${conditions.join(' AND ')}
      ORDER BY observedAt DESC
      LIMIT 1;
    `;

    const row = db.prepare(sql).get(...values) as any;
    return row || null;
  }

  public getById(id: string): PriceObservationRecord | null {
    const db = getDb();
    const row = db.prepare('SELECT * FROM price_observations WHERE id = ? LIMIT 1;').get(id) as any;
    return row || null;
  }

  public countPrices(): number {
    const db = getDb();
    const row = db.prepare('SELECT count(*) as count FROM price_observations;').get() as any;
    return row?.count || 0;
  }

  public getDistinctProducts(): string[] {
    const db = getDb();
    const rows = db.prepare("SELECT DISTINCT productName FROM price_observations WHERE status = 'active'").all() as any[];
    return rows.map((r) => r.productName);
  }
}

export const priceRepository = new PriceRepository();
