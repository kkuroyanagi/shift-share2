import { test, expect } from "@playwright/test";
import { resetDb } from "./seed";

test.beforeAll(() => resetDb());

test.describe("年度サマリー", () => {
  test("サマリーページが表示される", async ({ page }) => {
    await page.goto("/summary");
    await expect(page.locator("h1")).toContainText("年度サマリー");
  });

  test("前年度・翌年度に移動できる", async ({ page }) => {
    await page.goto("/summary?fy=2026");
    await expect(page.locator("h1")).toContainText("2026年度サマリー");

    await page.click("a:has-text('2025年度')");
    await expect(page.locator("h1")).toContainText("2025年度サマリー");

    await page.click("a:has-text('2026年度')");
    await expect(page.locator("h1")).toContainText("2026年度サマリー");
  });

  test("在籍従業員が列ヘッダーに表示される", async ({ page }) => {
    await page.goto("/summary");
    await expect(page.locator("th:has-text('山田花子')")).toBeVisible();
    await expect(page.locator("th:has-text('田中一郎')")).toBeVisible();
  });
});
