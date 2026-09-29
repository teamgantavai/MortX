import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import {
  CREATE_SOURCES_TABLE,
  MIGRATE_SOURCES_TRUST_LEVEL,
  CREATE_NEWS_ARTICLES_TABLE,
  CREATE_EVENTS_TABLE,
  CREATE_GOVERNMENT_ALERTS_TABLE,
  CREATE_PRICE_OBSERVATIONS_TABLE,
  CREATE_INDEXES,
  CREATE_EVENTS_INDEXES,
  CREATE_ALERTS_INDEXES,
  CREATE_PRICE_INDEXES,
} from './schema';
import { seedInitialDataIfNeeded } from './seed';

class DatabaseManager {
  private db: DatabaseSync | null = null;
  private dbPath: string;

  constructor(customPath?: string) {
    if (customPath) {
      this.dbPath = customPath;
    } else if (process.env.DATABASE_PATH) {
      this.dbPath = process.env.DATABASE_PATH;
    } else {
      const dataDir = path.resolve(process.cwd(), 'data');
      if (!fs.existsSync(dataDir)) {
        try {
          fs.mkdirSync(dataDir, { recursive: true });
        } catch {
          // ignore error if directory already exists
        }
      }
      this.dbPath = path.join(dataDir, 'mortx.db');
    }
  }

  public getDatabase(): DatabaseSync {
    if (!this.db) {
      this.db = new DatabaseSync(this.dbPath);
      // Enable WAL mode and foreign keys for performance and integrity
      this.db.exec('PRAGMA journal_mode = WAL;');
      this.db.exec('PRAGMA foreign_keys = ON;');
      this.initializeSchema();
    }
    return this.db;
  }

  public initializeSchema(): void {
    if (!this.db) return;

    // Core tables
    this.db.exec(CREATE_SOURCES_TABLE);
    this.db.exec(CREATE_NEWS_ARTICLES_TABLE);
    this.db.exec(CREATE_EVENTS_TABLE);
    this.db.exec(CREATE_GOVERNMENT_ALERTS_TABLE);
    this.db.exec(CREATE_PRICE_OBSERVATIONS_TABLE);

    // Idempotent indexes
    this.db.exec(CREATE_INDEXES);
    this.db.exec(CREATE_EVENTS_INDEXES);
    this.db.exec(CREATE_ALERTS_INDEXES);
    this.db.exec(CREATE_PRICE_INDEXES);

    // Safe migration: add trustLevel column to existing databases
    try {
      this.db.exec(MIGRATE_SOURCES_TRUST_LEVEL);
    } catch {
      // Column already exists – this is expected on fresh databases; ignore
    }

    // Seed initial sources, events, alerts, and prices if needed
    try {
      seedInitialDataIfNeeded(this.db);
    } catch {
      // Non-fatal if seeding is already handled or in test mock
    }
  }

  public close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  public reset(): void {
    if (this.db) {
      this.db.exec('DROP TABLE IF EXISTS price_observations;');
      this.db.exec('DROP TABLE IF EXISTS government_alerts;');
      this.db.exec('DROP TABLE IF EXISTS events;');
      this.db.exec('DROP TABLE IF EXISTS news_articles;');
      this.db.exec('DROP TABLE IF EXISTS sources;');
      this.initializeSchema();
    }
  }
}

export const dbManager = new DatabaseManager();
export const getDb = () => dbManager.getDatabase();
export { DatabaseManager };
