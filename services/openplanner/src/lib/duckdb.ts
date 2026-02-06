import duckdb from "duckdb";
import fs from "node:fs/promises";
import path from "node:path";

export type Duck = {
  db: duckdb.Database;
  conn: duckdb.Connection;
  ftsEnabled: boolean;
};

export async function openDuckDB(dbPath: string): Promise<Duck> {
  await fs.mkdir(path.dirname(dbPath), { recursive: true });

  const db = new duckdb.Database(dbPath);
  const conn = db.connect();

  await run(conn, "PRAGMA threads=4");

  await run(conn, `
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      ts TIMESTAMP,
      source TEXT,
      kind TEXT,
      project TEXT,
      session TEXT,
      message TEXT,
      role TEXT,
      author TEXT,
      model TEXT,
      tags JSON,
      text TEXT,
      attachments JSON,
      extra JSON
    );
  `);

  await run(conn, "CREATE INDEX IF NOT EXISTS events_ts_idx ON events(ts)");

  // Attempt to enable DuckDB FTS.
  // NOTE: On some systems `INSTALL fts` downloads the extension on first run.
  let ftsEnabled = false;
  try {
    await run(conn, "INSTALL fts");
    await run(conn, "LOAD fts");
    await run(conn, "PRAGMA create_fts_index('events', 'id', 'text')");
    ftsEnabled = true;
  } catch {
    ftsEnabled = false;
  }

  return { db, conn, ftsEnabled };
}

export function run(conn: duckdb.Connection, sql: string, params: any[] = []): Promise<void> {
  return new Promise((resolve, reject) => {
    conn.run(sql, ...params, (err: any) => (err ? reject(err) : resolve()));
  });
}

export function all<T = any>(conn: duckdb.Connection, sql: string, params: any[] = []): Promise<T[]> {
  return new Promise((resolve, reject) => {
    conn.all(sql, ...params, (err: any, rows: any) => (err ? reject(err) : resolve(rows as T[])));
  });
}
