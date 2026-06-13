import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

// 開発時のホットリロードで接続が増殖しないよう globalThis に保持する
const globalForDb = globalThis as unknown as { _shiftDb?: Database.Database };

export function getDb(): Database.Database {
  if (globalForDb._shiftDb) return globalForDb._shiftDb;

  const dataDir = path.join(process.cwd(), "data");
  fs.mkdirSync(dataDir, { recursive: true });

  const db = new Database(path.join(dataDir, "shift.db"));
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  migrate(db);

  globalForDb._shiftDb = db;
  return db;
}

function migrate(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS employees (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT    NOT NULL,
      color      TEXT    NOT NULL DEFAULT '#3b82f6',
      active     INTEGER NOT NULL DEFAULT 1,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS patterns (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
      weekday     INTEGER NOT NULL CHECK (weekday BETWEEN 0 AND 6),
      start_time  TEXT    NOT NULL,
      end_time    TEXT    NOT NULL
    );

    CREATE TABLE IF NOT EXISTS shifts (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id  INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
      date         TEXT    NOT NULL,
      plan_start   TEXT,
      plan_end     TEXT,
      actual_start TEXT,
      actual_end   TEXT,
      note         TEXT,
      UNIQUE (employee_id, date)
    );

    CREATE INDEX IF NOT EXISTS idx_shifts_date ON shifts(date);
  `);
}
