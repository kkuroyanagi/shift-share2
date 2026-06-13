import { test, expect } from "@playwright/test";
import { resetDb } from "./seed";

test.beforeAll(() => resetDb());

test.describe("従業員管理", () => {
  test("従業員ページが表示される", async ({ page }) => {
    await page.goto("/employees");
    await expect(page.locator("h1")).toContainText("従業員");
  });

  test("シードデータの従業員が表示される", async ({ page }) => {
    await page.goto("/employees");
    await expect(page.locator('input[name="name"][value="山田花子"]')).toBeVisible();
    await expect(page.locator('input[name="name"][value="田中一郎"]')).toBeVisible();
  });

  test("新しい従業員を追加できる", async ({ page }) => {
    await page.goto("/employees");

    const addForm = page.locator("form").last();
    await addForm.locator('input[name="name"]').fill("鈴木次郎");
    await addForm.locator('button:has-text("追加")').click();

    await expect(
      page.locator('input[name="name"][value="鈴木次郎"]')
    ).toBeVisible();
  });

  test("従業員の名前を更新できる", async ({ page }) => {
    await page.goto("/employees");

    // 山田花子の行を特定して更新
    const hanakoRow = page
      .locator("form")
      .filter({ has: page.locator('input[value="山田花子"]') });
    await hanakoRow.locator('input[name="name"]').fill("山田はな子");
    await hanakoRow.locator('button:has-text("保存")').click();

    await expect(
      page.locator('input[name="name"][value="山田はな子"]')
    ).toBeVisible();
  });

  test("在籍チェックを外して無効化できる", async ({ page }) => {
    await page.goto("/employees");

    const tanakaRow = page
      .locator("form")
      .filter({ has: page.locator('input[value="田中一郎"]') });
    const checkbox = tanakaRow.locator('input[name="active"]');
    await checkbox.uncheck();
    await tanakaRow.locator('button:has-text("保存")').click();

    // チェックが外れた状態で保存されている
    const updatedRow = page
      .locator("form")
      .filter({ has: page.locator('input[value="田中一郎"]') });
    await expect(updatedRow.locator('input[name="active"]')).not.toBeChecked();
  });
});
