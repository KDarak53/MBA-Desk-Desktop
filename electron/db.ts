import { app } from 'electron';
import path from 'path';
import fs from 'fs';
import initSqlJs, { Database } from 'sql.js';

// ── Inline types ────────────────────────────────────────────────────────────────
interface SwotData {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
}
interface Article {
  id: number;
  uploadId: number;
  headline: string;
  page: number;
  summary: string;
  detailedSummary: string;
  businessImpact: string;
  functions: string[];
  relevanceScore: number;
  sector: string | null;
  swot: SwotData | null;
  strategicRead: string[];
  createdAt: string;
}
interface Upload {
  id: number;
  filename: string;
  pageCount: number;
  articleCount: number;
  createdAt: string;
}
interface Report {
  upload: Upload;
  articles: Article[];
}

// ── State ───────────────────────────────────────────────────────────────────────
let db: Database;
let dbPath: string;

// ── Init ────────────────────────────────────────────────────────────────────────
export async function initDb(): Promise<void> {
  dbPath = path.join(app.getPath('userData'), 'mba-desk.db');

  // sql.js needs the WASM binary — point it to the file inside node_modules
  const wasmPath = path.join(
    app.getAppPath(),
    'node_modules',
    'sql.js',
    'dist',
    'sql-wasm.wasm'
  );

  const SQL = await initSqlJs({ locateFile: () => wasmPath });

  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  db.run(`PRAGMA journal_mode = WAL;`);
  db.run(`
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

  persist();
}

// ── Persist to disk ─────────────────────────────────────────────────────────────
function persist(): void {
  if (!db || !dbPath) return;
  const data = db.export();
  fs.writeFileSync(dbPath, Buffer.from(data));
}

// ── Write ───────────────────────────────────────────────────────────────────────
export function saveReport(
  filename: string,
  articles: Omit<Article, 'id' | 'uploadId' | 'createdAt'>[]
): Report {
  db.run('INSERT INTO uploads (filename, page_count) VALUES (?, ?)', [filename, 0]);

  // Get last inserted upload id
  const uploadResult = db.exec('SELECT last_insert_rowid() as id');
  const uploadId = uploadResult[0].values[0][0] as number;

  const savedArticles: Article[] = [];

  for (const a of articles) {
    db.run(
      `INSERT INTO articles
        (upload_id, headline, page, summary, detailed_summary, business_impact,
         functions, relevance_score, sector, swot, strategic_read)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        uploadId,
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
      ]
    );

    const idResult = db.exec('SELECT last_insert_rowid() as id');
    const articleId = idResult[0].values[0][0] as number;

    savedArticles.push({
      ...a,
      id: articleId,
      uploadId,
      createdAt: new Date().toISOString(),
    });
  }

  persist();

  // Fetch the upload row to get server-generated created_at
  const uploadRow = db.exec(`SELECT * FROM uploads WHERE id = ?`, [uploadId]);
  const row = uploadRow[0]?.values[0];

  return {
    upload: {
      id: uploadId,
      filename: row ? String(row[1]) : filename,
      pageCount: 0,
      articleCount: savedArticles.length,
      createdAt: row ? String(row[3]) : new Date().toISOString(),
    },
    articles: savedArticles,
  };
}

// ── Read ────────────────────────────────────────────────────────────────────────
function rowToArticle(row: any[]): Article {
  return {
    id:              Number(row[0]),
    uploadId:        Number(row[1]),
    headline:        String(row[2]),
    page:            Number(row[3]),
    summary:         String(row[4]),
    detailedSummary: String(row[5]),
    businessImpact:  String(row[6]),
    functions:       JSON.parse(String(row[7] ?? '[]')),
    relevanceScore:  Number(row[8]),
    sector:          row[9] ? String(row[9]) : null,
    swot:            row[10] ? JSON.parse(String(row[10])) : null,
    strategicRead:   row[11] ? JSON.parse(String(row[11])) : [],
    createdAt:       String(row[12]),
  };
}

export function getReport(uploadId: number): Report | null {
  const uploadRows = db.exec('SELECT * FROM uploads WHERE id = ?', [uploadId]);
  if (!uploadRows.length || !uploadRows[0].values.length) return null;
  const u = uploadRows[0].values[0];

  const articleRows = db.exec(
    'SELECT * FROM articles WHERE upload_id = ? ORDER BY relevance_score DESC',
    [uploadId]
  );

  const articles = articleRows.length ? articleRows[0].values.map(rowToArticle) : [];

  return {
    upload: {
      id:           Number(u[0]),
      filename:     String(u[1]),
      pageCount:    Number(u[2]),
      articleCount: articles.length,
      createdAt:    String(u[3]),
    },
    articles,
  };
}

export function getAllUploads(): Upload[] {
  const result = db.exec(`
    SELECT u.id, u.filename, u.page_count, u.created_at, COUNT(a.id) as article_count
    FROM uploads u
    LEFT JOIN articles a ON a.upload_id = u.id
    GROUP BY u.id
    ORDER BY u.created_at DESC
  `);

  if (!result.length) return [];

  return result[0].values.map((row: any[]) => ({
    id:           Number(row[0]),
    filename:     String(row[1]),
    pageCount:    Number(row[2]),
    createdAt:    String(row[3]),
    articleCount: Number(row[4]),
  }));
}

export function deleteUpload(uploadId: number): void {
  db.run('DELETE FROM articles WHERE upload_id = ?', [uploadId]);
  db.run('DELETE FROM uploads WHERE id = ?', [uploadId]);
  persist();
}
