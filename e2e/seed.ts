import Database from "better-sqlite3";
import path from "path";

/**
 * テスト用DBを既知の状態にリセットする。
 * テーブルは global-setup で作成済みの前提。各 spec の beforeAll から呼ぶ。
 */
export function resetDb() {
  const db = new Database(path.resolve("data/test.db"));
  db.pragma("busy_timeout = 5000");
  db.pragma("foreign_keys = ON");

  db.exec(`
    DELETE FROM shifts;
    DELETE FROM patterns;
    DELETE FROM employees;
    DELETE FROM sqlite_sequence WHERE name IN ('shifts', 'patterns', 'employees');
  `);

  const ins = db.prepare(
    "INSERT INTO employees (name, color, sort_order) VALUES (?, ?, ?)"
  );
  ins.run("山田花子", "#3b82f6", 1); // id = 1
  ins.run("田中一郎", "#f97316", 2); // id = 2

  db.close();
}
