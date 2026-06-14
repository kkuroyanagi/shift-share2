import { test, expect } from "@playwright/test";
import { resetDb } from "./seed";

test.beforeAll(() => resetDb());

test.describe("年間予定・実績", () => {
  test("年間予定・実績ページが表示される", async ({ page }) => {
    await page.goto("/list");
    await expect(page.locator("h1")).toContainText("年間予定・実績");
  });

  test("前年度・翌年度に移動できる", async ({ page }) => {
    await page.goto("/list?fy=2026");
    await expect(page.locator("h1")).toContainText("2026年度 年間予定・実績");

    await page.click("a:has-text('2025年度')");
    await expect(page.locator("h1")).toContainText("2025年度 年間予定・実績");

    await page.click("a:has-text('2026年度')");
    await expect(page.locator("h1")).toContainText("2026年度 年間予定・実績");
  });

  test("従業員が計画・実績・差の列ヘッダーに表示される", async ({ page }) => {
    await page.goto("/list");
    await expect(page.locator("th:has-text('山田花子')")).toBeVisible();
    await expect(page.locator("th:has-text('田中一郎')")).toBeVisible();
    await expect(page.locator("th:has-text('計画')").first()).toBeVisible();
    await expect(page.locator("th:has-text('実績')").first()).toBeVisible();
    await expect(page.locator("th:has-text('差')").first()).toBeVisible();
  });

  test("1日1行で月見出しと日付が並ぶ", async ({ page }) => {
    await page.goto("/list?fy=2026");
    await expect(page.locator("td:has-text('2026年4月')")).toBeVisible();
    // 年度内の日付リンク (例: 4/1)
    await expect(page.locator("a[href='/day/2026-04-01']")).toBeVisible();
  });
});
