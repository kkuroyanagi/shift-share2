import { test } from "@playwright/test";
import Database from "better-sqlite3";
import path from "path";
import { resetDb } from "./seed";

const SHOT_DIR = "screenshots";

// カレンダー/サマリーが空に見えないよう、パターンと数日分のシフトを投入する
function seedForScreenshots() {
  resetDb(); // 従業員2名 (山田花子=1, 田中一郎=2) を投入

  const db = new Database(path.resolve("data/test.db"));
  db.pragma("busy_timeout = 5000");
  db.pragma("foreign_keys = ON");

  // 基本パターン (月〜金)
  const pat = db.prepare(
    "INSERT INTO patterns (employee_id, weekday, start_time, end_time) VALUES (?, ?, ?, ?)"
  );
  for (let wd = 1; wd <= 5; wd++) {
    pat.run(1, wd, "09:00", "17:00");
    pat.run(2, wd, "13:00", "21:00");
  }

  // 2026年6月の数日分のシフト (計画と実績)
  const shift = db.prepare(
    `INSERT INTO shifts (employee_id, date, plan_start, plan_end, actual_start, actual_end, note)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  );
  shift.run(1, "2026-06-01", "09:00", "17:00", "09:00", "17:00", null); // 計画どおり
  shift.run(2, "2026-06-01", "13:00", "21:00", "13:30", "21:00", "遅刻"); // 変更あり
  shift.run(1, "2026-06-02", "09:00", "17:00", "09:00", "18:30", "残業"); // 変更あり
  shift.run(2, "2026-06-02", "13:00", "21:00", null, null, null); // 実績未入力
  shift.run(1, "2026-06-15", "09:00", "17:00", null, null, null);

  db.close();
}

test.beforeAll(() => seedForScreenshots());

test.describe("画面スクリーンショット", () => {
  test("カレンダー", async ({ page }) => {
    await page.goto("/?ym=2026-06");
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: `${SHOT_DIR}/01-calendar.png`, fullPage: true });
  });

  test("日別シフト入力", async ({ page }) => {
    await page.goto("/day/2026-06-01");
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: `${SHOT_DIR}/02-day.png`, fullPage: true });
  });

  test("従業員", async ({ page }) => {
    await page.goto("/employees");
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: `${SHOT_DIR}/03-employees.png`, fullPage: true });
  });

  test("基本パターン", async ({ page }) => {
    await page.goto("/patterns");
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: `${SHOT_DIR}/04-patterns.png`, fullPage: true });
  });

  test("年度サマリー", async ({ page }) => {
    await page.goto("/summary?fy=2026");
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: `${SHOT_DIR}/05-summary.png`, fullPage: true });
  });
});
