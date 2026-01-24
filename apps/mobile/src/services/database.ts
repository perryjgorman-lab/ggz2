import * as SQLite from 'expo-sqlite';
import { Report, Evidence, ScoringResult } from '@scamsight/shared';

const DB_NAME = 'scamsight.db';

export class Database {
  private db: SQLite.SQLiteDatabase | null = null;

  async init() {
    this.db = await SQLite.openDatabaseAsync(DB_NAME);
    await this.createTables();
  }

  private async createTables() {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.execAsync(`
      PRAGMA journal_mode = WAL;

      CREATE TABLE IF NOT EXISTS reports (
        id TEXT PRIMARY KEY,
        platform TEXT NOT NULL,
        url TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        evidence TEXT NOT NULL,
        result TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS photos (
        id TEXT PRIMARY KEY,
        report_id TEXT NOT NULL,
        uri TEXT NOT NULL,
        perceptual_hash TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_reports_platform ON reports(platform);
      CREATE INDEX IF NOT EXISTS idx_photos_hash ON photos(perceptual_hash);
      CREATE INDEX IF NOT EXISTS idx_photos_report_id ON photos(report_id);
    `);
  }

  async saveReport(report: Report): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const evidenceJson = JSON.stringify(report.evidence);
    const resultJson = JSON.stringify(report.result);

    await this.db.runAsync(
      `INSERT OR REPLACE INTO reports (id, platform, url, created_at, updated_at, evidence, result)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        report.id,
        report.evidence.platform,
        report.evidence.url,
        report.createdAt,
        report.updatedAt,
        evidenceJson,
        resultJson,
      ]
    );
  }

  async getReport(id: string): Promise<Report | null> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getFirstAsync<{
      id: string;
      created_at: string;
      updated_at: string;
      evidence: string;
      result: string;
    }>('SELECT * FROM reports WHERE id = ?', [id]);

    if (!result) return null;

    return {
      id: result.id,
      createdAt: result.created_at,
      updatedAt: result.updated_at,
      evidence: JSON.parse(result.evidence) as Evidence,
      result: JSON.parse(result.result) as ScoringResult,
    };
  }

  async getAllReports(limit = 50, offset = 0): Promise<Report[]> {
    if (!this.db) throw new Error('Database not initialized');

    const results = await this.db.getAllAsync<{
      id: string;
      created_at: string;
      updated_at: string;
      evidence: string;
      result: string;
    }>('SELECT * FROM reports ORDER BY created_at DESC LIMIT ? OFFSET ?', [limit, offset]);

    return results.map((row) => ({
      id: row.id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      evidence: JSON.parse(row.evidence) as Evidence,
      result: JSON.parse(row.result) as ScoringResult,
    }));
  }

  async searchReports(query: string): Promise<Report[]> {
    if (!this.db) throw new Error('Database not initialized');

    const results = await this.db.getAllAsync<{
      id: string;
      created_at: string;
      updated_at: string;
      evidence: string;
      result: string;
    }>(
      `SELECT * FROM reports
       WHERE evidence LIKE ? OR url LIKE ?
       ORDER BY created_at DESC
       LIMIT 50`,
      [`%${query}%`, `%${query}%`]
    );

    return results.map((row) => ({
      id: row.id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      evidence: JSON.parse(row.evidence) as Evidence,
      result: JSON.parse(row.result) as ScoringResult,
    }));
  }

  async filterReports(filters: {
    platform?: string;
    riskLevel?: string;
  }): Promise<Report[]> {
    if (!this.db) throw new Error('Database not initialized');

    let sql = 'SELECT * FROM reports WHERE 1=1';
    const params: any[] = [];

    if (filters.platform) {
      sql += ' AND platform = ?';
      params.push(filters.platform);
    }

    if (filters.riskLevel) {
      sql += ' AND result LIKE ?';
      params.push(`%"riskLevel":"${filters.riskLevel}"%`);
    }

    sql += ' ORDER BY created_at DESC LIMIT 50';

    const results = await this.db.getAllAsync<{
      id: string;
      created_at: string;
      updated_at: string;
      evidence: string;
      result: string;
    }>(sql, params);

    return results.map((row) => ({
      id: row.id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      evidence: JSON.parse(row.evidence) as Evidence,
      result: JSON.parse(row.result) as ScoringResult,
    }));
  }

  async deleteReport(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.runAsync('DELETE FROM reports WHERE id = ?', [id]);
  }

  async deleteAllReports(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.runAsync('DELETE FROM reports');
    await this.db.runAsync('DELETE FROM photos');
  }

  async savePhoto(photo: {
    id: string;
    reportId: string;
    uri: string;
    perceptualHash?: string;
  }): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.runAsync(
      `INSERT OR REPLACE INTO photos (id, report_id, uri, perceptual_hash, created_at)
       VALUES (?, ?, ?, ?, ?)`,
      [photo.id, photo.reportId, photo.uri, photo.perceptualHash || null, new Date().toISOString()]
    );
  }

  async findSimilarPhotos(
    perceptualHash: string,
    threshold = 10
  ): Promise<Array<{ id: string; reportId: string; uri: string; hammingDistance: number }>> {
    if (!this.db) throw new Error('Database not initialized');

    // Get all photos with hashes
    const photos = await this.db.getAllAsync<{
      id: string;
      report_id: string;
      uri: string;
      perceptual_hash: string;
    }>('SELECT id, report_id, uri, perceptual_hash FROM photos WHERE perceptual_hash IS NOT NULL');

    // Calculate Hamming distance for each
    const similar: Array<{
      id: string;
      reportId: string;
      uri: string;
      hammingDistance: number;
    }> = [];

    for (const photo of photos) {
      const distance = this.hammingDistance(perceptualHash, photo.perceptual_hash);
      if (distance <= threshold) {
        similar.push({
          id: photo.id,
          reportId: photo.report_id,
          uri: photo.uri,
          hammingDistance: distance,
        });
      }
    }

    return similar.sort((a, b) => a.hammingDistance - b.hammingDistance);
  }

  private hammingDistance(hash1: string, hash2: string): number {
    if (hash1.length !== hash2.length) return Infinity;

    let distance = 0;
    for (let i = 0; i < hash1.length; i++) {
      if (hash1[i] !== hash2[i]) {
        distance++;
      }
    }
    return distance;
  }

  async getSetting(key: string): Promise<string | null> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getFirstAsync<{ value: string }>(
      'SELECT value FROM settings WHERE key = ?',
      [key]
    );

    return result ? result.value : null;
  }

  async setSetting(key: string, value: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.runAsync(
      `INSERT OR REPLACE INTO settings (key, value, updated_at)
       VALUES (?, ?, ?)`,
      [key, value, new Date().toISOString()]
    );
  }

  async close() {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
    }
  }
}

// Singleton instance
export const db = new Database();
