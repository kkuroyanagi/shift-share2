import { test, expect } from "@playwright/test";
import { resetDb } from "./seed";

test.beforeAll(() => resetDb());

test.describe("基本パターン管理", () => {
  test("基本パターンページが表示される", async ({ page }) => {
    await page.goto("/patterns");
    await expect(page.locator("h1")).toContainText("基本パターン");
  });

  test("月曜日に山田花子のパターンを追加できる", async ({ page }) => {
    await page.goto("/patterns");

    // 月曜日 (weekday=1) の追加フォームを探す
    // WEEKDAYS = ['月','火','水','木','金','土','日'] なので月=index 0、実際のweekday=1
    // 月曜日セクションの中の追加フォームを特定
    const mondaySection = page
      .locator(".rounded-lg")
      .filter({ has: page.locator("div.text-lg:has-text('月')") });

    const addForm = mondaySection.locator("form").last();
    await addForm.locator('select[name="employee_id"]').selectOption({ label: "山田花子" });
    await addForm.locator('input[name="start_time"]').fill("09:00");
    await addForm.locator('input[name="end_time"]').fill("17:00");
    await addForm.locator('button:has-text("追加")').click();

    // パターンが追加されていることを確認
    await expect(
      mondaySection.locator("span.font-semibold:has-text('山田花子')")
    ).toBeVisible();
    await expect(mondaySection.locator("text=09:00 〜 17:00")).toBeVisible();
  });

  test("パターンを削除できる", async ({ page }) => {
    await page.goto("/patterns");

    const mondaySection = page
      .locator(".rounded-lg")
      .filter({ has: page.locator("div.text-lg:has-text('月')") });

    // 山田花子の月曜パターン行の削除ボタンをクリック
    const patternRow = mondaySection
      .locator("form")
      .filter({ has: page.locator("span:has-text('山田花子')") })
      .first();
    await patternRow.locator('button:has-text("削除")').click();

    // パターンが消えたことを確認
    await expect(
      mondaySection.locator("span.font-semibold:has-text('山田花子')")
    ).not.toBeVisible();
  });

  test("年度計画を生成できる", async ({ page }) => {
    // 事前にパターンを追加する
    await page.goto("/patterns");
    const mondaySection = page
      .locator(".rounded-lg")
      .filter({ has: page.locator("div.text-lg:has-text('月')") });
    const addForm = mondaySection.locator("form").last();
    await addForm.locator('select[name="employee_id"]').selectOption({ label: "山田花子" });
    await addForm.locator('input[name="start_time"]').fill("09:00");
    await addForm.locator('input[name="end_time"]').fill("17:00");
    await addForm.locator('button:has-text("追加")').click();

    // 年度計画生成フォーム
    await page.locator('button:has-text("計画を生成")').click();

    // 成功メッセージを確認
    await expect(page.locator("text=件作成しました")).toBeVisible();
  });
});
