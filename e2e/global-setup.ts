import Database from "better-sqlite3";
import path from "path";
import { mkdirSync } from "fs";

export default function globalSetup() {
  const dbPath = path.resolve("data/test.db");
  mkdirSync(path.dirname(dbPath), { recursive: true });

  // ファイルを unlink すると Windows では WAL/SHM のロックと衝突するため、
  // 既存ファイルを開いてテーブルを作成・全クリアする方式にする。
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

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

  db.close();
  // データの投入は各 spec の beforeAll (resetDb) で行う
}
