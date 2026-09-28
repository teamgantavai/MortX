import { getDb } from './database';
import { NewsArticleRecord } from '../ingestion/types';
import { calculateDistanceKm } from '../retrieval/geoUtils';

export class ArticleRepository {
  public lastQueryDurationMs: number = 0;

  public insertArticle(article: NewsArticleRecord): boolean {
    const db = getDb();

    // Fast single query check for duplicate by URL, contentHash, or title+source
    const checkStmt = db.prepare(`
      SELECT id FROM news_articles 
      WHERE articleUrl = ? OR contentHash = ? OR (LOWER(title) = LOWER(?) AND sourceId = ?) 
      LIMIT 1;
    `);
    const existing = checkStmt.get(
      article.articleUrl,
      article.contentHash,
      article.title.trim(),
      article.sourceId
    ) as any;

    if (existing) {
      this.updateLastSeen(existing.id);
      return false; // Duplicate
    }

    const stmt = db.prepare(`
      INSERT INTO news_articles (
        id, title, description, sourceId, sourceUrl, articleUrl,
        publishedAt, firstSeenAt, lastSeenAt, locationName,
        latitude, longitude, category, language, contentHash,
        status, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `);

    stmt.run(
      article.id,
      article.title,
      article.description,
      article.sourceId,
      article.sourceUrl,
      article.articleUrl,
      article.publishedAt,
      article.firstSeenAt,
      article.lastSeenAt,
      article.locationName,
      article.latitude ?? null,
      article.longitude ?? null,
      article.category,
      article.language,
      article.contentHash,
      article.status,
      article.createdAt,
      article.updatedAt
    );

    return true;
  }

  public findByUrl(url: string): NewsArticleRecord | null {
    const db = getDb();
    const stmt = db.prepare(`SELECT * FROM news_articles WHERE articleUrl = ? LIMIT 1`);
    const row = stmt.get(url) as any;
    return row ? this.mapRow(row) : null;
  }

  public findByContentHash(hash: string): NewsArticleRecord | null {
    const db = getDb();
    const stmt = db.prepare(`SELECT * FROM news_articles WHERE contentHash = ? LIMIT 1`);
    const row = stmt.get(hash) as any;
    return row ? this.mapRow(row) : null;
  }

  public findByTitleAndSource(title: string, sourceId: string): NewsArticleRecord | null {
    const db = getDb();
    const stmt = db.prepare(`
      SELECT * FROM news_articles 
      WHERE LOWER(title) = LOWER(?) AND sourceId = ? 
      LIMIT 1
    `);
    const row = stmt.get(title.trim(), sourceId) as any;
    return row ? this.mapRow(row) : null;
  }

  public updateLastSeen(id: string): void {
    const db = getDb();
    const now = new Date().toISOString();
    const stmt = db.prepare(`UPDATE news_articles SET lastSeenAt = ?, updatedAt = ? WHERE id = ?`);
    stmt.run(now, now, id);
  }

  public searchArticles(params: {
    locationName?: string;
    latitude?: number;
    longitude?: number;
    radiusKm?: number;
    startDate?: Date;
    endDate?: Date;
    keywords?: string[];
    category?: string;
    limit?: number;
  }): NewsArticleRecord[] {
    const start = Date.now();
    const db = getDb();
    const conditions: string[] = ["status = 'active'"];
    const values: any[] = [];

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
      SELECT id, title, description, sourceId, sourceUrl, articleUrl,
             publishedAt, firstSeenAt, lastSeenAt, locationName,
             latitude, longitude, category, language, contentHash,
             status, createdAt, updatedAt
      FROM news_articles ${whereClause} 
      ORDER BY publishedAt DESC 
      LIMIT 100;
    `;
    const stmt = db.prepare(sql);
    let rows = (stmt.all(...values) as any[]).map(this.mapRow);
    this.lastQueryDurationMs = Date.now() - start;

    // Apply distance filtering in application layer if coordinates & radius provided
    if (params.latitude !== undefined && params.longitude !== undefined) {
      const radiusKm = params.radiusKm || 30; // default 30km
      rows = rows.filter((art) => {
        if (art.latitude !== null && art.latitude !== undefined &&
            art.longitude !== null && art.longitude !== undefined) {
          const dist = calculateDistanceKm(
            params.latitude!,
            params.longitude!,
            art.latitude,
            art.longitude
          );
          return dist <= radiusKm;
        }
        // If article has no coordinates, check locationName matching
        if (params.locationName) {
          return art.locationName.toLowerCase().includes(params.locationName.toLowerCase());
        }
        return true;
      });
    }

    // Apply keywords filtering if specified
    if (params.keywords && params.keywords.length > 0) {
      rows = rows.filter((art) => {
        const text = `${art.title} ${art.description} ${art.locationName}`.toLowerCase();
        return params.keywords!.some((kw) => text.includes(kw.toLowerCase()));
      });
    }

    if (params.limit && params.limit > 0) {
      rows = rows.slice(0, params.limit);
    }

    return rows;
  }

  public countArticles(): number {
    const db = getDb();
    const row = db.prepare(`SELECT COUNT(*) as count FROM news_articles`).get() as any;
    return row ? Number(row.count) : 0;
  }

  private mapRow(r: any): NewsArticleRecord {
    return {
      id: r.id,
      title: r.title,
      description: r.description,
      sourceId: r.sourceId,
      sourceUrl: r.sourceUrl,
      articleUrl: r.articleUrl,
      publishedAt: r.publishedAt,
      firstSeenAt: r.firstSeenAt,
      lastSeenAt: r.lastSeenAt,
      locationName: r.locationName,
      latitude: r.latitude !== null ? Number(r.latitude) : null,
      longitude: r.longitude !== null ? Number(r.longitude) : null,
      category: r.category,
      language: r.language,
      contentHash: r.contentHash,
      status: r.status,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    };
  }
}

export const articleRepository = new ArticleRepository();
