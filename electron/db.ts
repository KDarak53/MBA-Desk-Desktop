import Database from 'better-sqlite3';
import { app } from 'electron';
import path from 'path';
import { Article, Upload, Report } from '../src/types';

let db: Database.Database;

export function initDb() {
  const dbPath = path.join(app.getPath('userData'), 'mba-desk.db');
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.exec(`
    CREATE TABLE IF NOT EXISTS uploads (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      filename    TEXT NOT NULL,
      page_count  INTEGER NOT NULL DEFAULT 0,
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS articles (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      upload_id        INTEGER NOT NULL REFERENCES uploads(id) ON DELETE CASCADE,
      headline         TEXT NOT NULL,
      page             INTEGER NOT NULL DEFAULT 1,
      summary          TEXT NOT NULL DEFAULT '',
      detailed_summary TEXT NOT NULL DEFAULT '',
      business_impact  TEXT NOT NULL DEFAULT '',
      functions        TEXT NOT NULL DEFAULT '[]',
      relevance_score  INTEGER NOT NULL DEFAULT 1,
      sector           TEXT,
      swot             TEXT,
      strategic_read   TEXT,
      created_at       TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
}

// ── Write ──────────────────────────────────────────────────────────────────────

export function saveReport(filename: string, articles: Omit<Article, 'id' | 'uploadId' | 'createdAt'>[]): Report {
  const insertUpload = db.prepare(
    `INSERT INTO uploads (filename, page_count) VALUES (?, ?) RETURNING *`
  );
  const upload = insertUpload.get(filename, 0) as { id: number; filename: string; page_count: number; created_at: string };

  const insertArticle = db.prepare(`
    INSERT INTO articles
      (upload_id, headline, page, summary, detailed_summary, business_impact,
       functions, relevance_score, sector, swot, strategic_read)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const savedArticles: Article[] = [];

  const insertAll = db.transaction(() => {
    for (const a of articles) {
      const result = insertArticle.run(
        upload.id,
        a.headline,
        a.page,
        a.summary,
        a.detailedSummary,
        a.businessImpact,
        JSON.stringify(a.functions),
        a.relevanceScore,
        a.sector ?? null,
        a.swot ? JSON.stringify(a.swot) : null,
        a.strategicRead?.length ? JSON.stringify(a.strategicRead) : null,
      );
      savedArticles.push({
        ...a,
        id: result.lastInsertRowid as number,
        uploadId: upload.id,
        createdAt: new Date().toISOString(),
      });
    }
  });

  insertAll();

  return {
    upload: {
      id: upload.id,
      filename: upload.filename,
      pageCount: upload.page_count,
      articleCount: savedArticles.length,
      createdAt: upload.created_at,
    },
    articles: savedArticles,
  };
}

// ── Read ───────────────────────────────────────────────────────────────────────

function rowToArticle(row: any): Article {
  return {
    id:              row.id,
    uploadId:        row.upload_id,
    headline:        row.headline,
    page:            row.page,
    summary:         row.summary,
    detailedSummary: row.detailed_summary,
    businessImpact:  row.business_impact,
    functions:       JSON.parse(row.functions ?? '[]'),
    relevanceScore:  row.relevance_score,
    sector:          row.sector ?? null,
    swot:            row.swot ? JSON.parse(row.swot) : null,
    strategicRead:   row.strategic_read ? JSON.parse(row.strategic_read) : [],
    createdAt:       row.created_at,
  };
}

export function getReport(uploadId: number): Report | null {
  const uploadRow = db.prepare('SELECT * FROM uploads WHERE id = ?').get(uploadId) as any;
  if (!uploadRow) return null;

  const articleRows = db.prepare('SELECT * FROM articles WHERE upload_id = ? ORDER BY relevance_score DESC').all(uploadId) as any[];

  return {
    upload: {
      id:           uploadRow.id,
      filename:     uploadRow.filename,
      pageCount:    uploadRow.page_count,
      articleCount: articleRows.length,
      createdAt:    uploadRow.created_at,
    },
    articles: articleRows.map(rowToArticle),
  };
}

export function getAllUploads(): Upload[] {
  const rows = db.prepare(`
    SELECT u.*, COUNT(a.id) as article_count
    FROM uploads u
    LEFT JOIN articles a ON a.upload_id = u.id
    GROUP BY u.id
    ORDER BY u.created_at DESC
  `).all() as any[];

  return rows.map((r) => ({
    id:           r.id,
    filename:     r.filename,
    pageCount:    r.page_count,
    articleCount: r.article_count,
    createdAt:    r.created_at,
  }));
}

export function deleteUpload(uploadId: number): void {
  db.prepare('DELETE FROM uploads WHERE id = ?').run(uploadId);
}
