import { test, expect } from "@playwright/test";
import { resetDb } from "./seed";

test.beforeAll(() => resetDb());

test.describe("カレンダー表示", () => {
  test("カレンダートップページが表示される", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toContainText("月のシフト");
  });

  test("前月に移動できる", async ({ page }) => {
    await page.goto("/");
    const heading = page.locator("h1");
    const currentText = await heading.textContent();

    await page.click("a:has-text('← 前月')");
    await expect(heading).not.toHaveText(currentText ?? "");
    await expect(heading).toContainText("月のシフト");
  });

  test("翌月に移動できる", async ({ page }) => {
    await page.goto("/");
    const heading = page.locator("h1");
    const currentText = await heading.textContent();

    await page.click("a:has-text('翌月 →')");
    await expect(heading).not.toHaveText(currentText ?? "");
    await expect(heading).toContainText("月のシフト");
  });

  test("「今月」リンクで現在月に戻れる", async ({ page }) => {
    await page.goto("/?ym=2025-01");
    await page.click("a:has-text('今月')");
    // URL に ?ym= が付かない、または今月のym
    await expect(page).toHaveURL(/\//);
    await expect(page.locator("h1")).toContainText("月のシフト");
  });

  test("日付セルをクリックするとday画面に遷移する", async ({ page }) => {
    await page.goto("/");
    // グリッド内の最初の日付リンクをクリック
    const dayLink = page.locator('a[href^="/day/"]').first();
    const href = await dayLink.getAttribute("href");
    await dayLink.click();

    await expect(page).toHaveURL(href ?? /\/day\//);
    await expect(page.locator("h1")).toContainText("日 (");
  });

  test("年度表示が正しい", async ({ page }) => {
    // 4月は年度開始月
    await page.goto("/?ym=2026-04");
    await expect(page.locator("h1")).toContainText("2026年4月のシフト");
    await expect(page.locator("text=2026年度")).toBeVisible();

    // 3月は前年度の最終月
    await page.goto("/?ym=2026-03");
    await expect(page.locator("text=2025年度")).toBeVisible();
  });
});
