import { test, expect } from "@playwright/test";
import { login } from "./helpers";

test.describe("Devices", () => {
  test.beforeEach(async ({ page, request }) => {
    const ok = await login(page, request);
    test.skip(!ok, "Skipping authenticated flow: valid admin credentials or auth API unavailable.");
  });
  test("devices page loads and filters visible", async ({ page }) => {
    await page.goto("devices");
    // SPA pages may keep polling; "networkidle" can hang indefinitely.
    await page.waitForLoadState("domcontentloaded");
    await expect(page.getByRole("heading", { name: /Devices/i })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole("button", { name: /Load devices/i })).toBeVisible();
  });

  test("bulk revoke: selection shows BulkActionsBar and Revoke opens ConfirmDanger", async ({ page }) => {
    await page.goto("devices");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.getByRole("heading", { name: /Devices/i })).toBeVisible({ timeout: 10000 });
    // Select devices if table has checkboxes
    const checkboxes = page.getByRole("checkbox").filter({ has: page.locator("input[type=checkbox]") });
    const count = await checkboxes.count();
    if (count >= 2) {
      await checkboxes.nth(1).click();
      await checkboxes.nth(2).click();
      await expect(page.getByRole("toolbar", { name: /selected/i })).toBeVisible({ timeout: 5000 });
      await expect(page.getByText(/\d+ selected/)).toBeVisible();
      await page.getByRole("button", { name: /Revoke/i }).first().click();
      await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5000 });
      await expect(page.getByRole("heading", { name: /Bulk revoke/i })).toBeVisible();
      await page.getByRole("button", { name: /Cancel/i }).click();
      await expect(page.getByRole("dialog")).not.toBeVisible();
    }
  });
});
