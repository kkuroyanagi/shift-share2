import { test, expect } from "@playwright/test";
import { resetDb } from "./seed";

// シードデータで山田花子(id=1)が存在する前提
const TEST_DATE = "2026-06-20";

test.beforeAll(() => resetDb());

test.describe("日別シフト入力", () => {
  test("日別ページが表示される", async ({ page }) => {
    await page.goto(`/day/${TEST_DATE}`);
    await expect(page.locator("h1")).toContainText("日 (");
    // 在籍中の従業員が表示される
    await expect(page.locator("span.font-bold:has-text('山田花子')")).toBeVisible();
    await expect(page.locator("span.font-bold:has-text('田中一郎')")).toBeVisible();
  });

  test("シフトの計画時刻を保存できる", async ({ page }) => {
    await page.goto(`/day/${TEST_DATE}`);

    const hanakoSection = page
      .locator(".rounded-lg")
      .filter({ has: page.locator("span.font-bold:has-text('山田花子')") });

    await hanakoSection.locator('input[name="plan_start"]').fill("09:00");
    await hanakoSection.locator('input[name="plan_end"]').fill("17:00");
    await hanakoSection.locator('button:has-text("保存")').click();

    // 保存後にページが更新され、入力した値が残っている
    await expect(
      hanakoSection.locator('input[name="plan_start"]')
    ).toHaveValue("09:00");
    await expect(
      hanakoSection.locator('input[name="plan_end"]')
    ).toHaveValue("17:00");
  });

  test("計画の時刻を実績にコピーできる", async ({ page }) => {
    await page.goto(`/day/${TEST_DATE}`);

    const hanakoSection = page
      .locator(".rounded-lg")
      .filter({ has: page.locator("span.font-bold:has-text('山田花子')") });

    // 「計画どおりに勤務した」ボタンが表示されている（前のテストで計画済み）
    await expect(
      hanakoSection.locator('button:has-text("計画どおりに勤務した")')
    ).toBeVisible();

    await hanakoSection
      .locator('button:has-text("計画どおりに勤務した")')
      .click();

    // 実績に計画と同じ値がコピーされている
    await expect(
      hanakoSection.locator('input[name="actual_start"]')
    ).toHaveValue("09:00");
    await expect(
      hanakoSection.locator('input[name="actual_end"]')
    ).toHaveValue("17:00");
  });

  test("メモを保存できる", async ({ page }) => {
    await page.goto(`/day/${TEST_DATE}`);

    const hanakoSection = page
      .locator(".rounded-lg")
      .filter({ has: page.locator("span.font-bold:has-text('山田花子')") });

    await hanakoSection.locator('input[name="note"]').fill("テストメモ");
    await hanakoSection.locator('button:has-text("保存")').click();

    await expect(
      hanakoSection.locator('input[name="note"]')
    ).toHaveValue("テストメモ");
  });

  test("前日・翌日リンクでナビゲートできる", async ({ page }) => {
    await page.goto(`/day/${TEST_DATE}`);

    await page.click("a:has-text('← 前日')");
    await expect(page).toHaveURL(/\/day\/2026-06-19/);

    await page.click("a:has-text('翌日 →')");
    await expect(page).toHaveURL(/\/day\/2026-06-20/);
  });

  test("月表示へリンクでカレンダーに戻れる", async ({ page }) => {
    await page.goto(`/day/${TEST_DATE}`);
    await page.click("a:has-text('月表示へ')");
    await expect(page).toHaveURL(/\?ym=2026-06/);
    await expect(page.locator("h1")).toContainText("2026年6月のシフト");
  });

  test("存在しない日付はNotFoundになる", async ({ page }) => {
    const response = await page.goto("/day/invalid-date");
    expect(response?.status()).toBe(404);
  });
});
