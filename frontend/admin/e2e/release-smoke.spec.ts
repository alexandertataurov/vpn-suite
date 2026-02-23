import { test, expect } from "@playwright/test";
import { login } from "./helpers";

/**
 * Release smoke: login → servers (table or empty) → server detail (if any) → sync (if available) → users → logout.
 * Skips when auth API or credentials unavailable. Create user / issue config / revoke are not automated here
 * (depend on API and test data); run manually or add when APIs are stable.
 */
test.describe("Release smoke — admin journey", () => {
  test.beforeEach(async ({ page, request }) => {
    const ok = await login(page, request);
    test.skip(!ok, "Skipping: valid admin credentials or auth API unavailable.");
  });

  test("login then servers page shows table or empty state", async ({ page }) => {
    await page.goto("servers");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.getByRole("heading", { name: /Servers/i })).toBeVisible({ timeout: 15000 });
    await expect(page.locator("main")).toBeVisible();
    await expect(page.locator("main")).toBeVisible();
  });

  test("server detail and manual sync when servers exist", async ({ page }) => {
    await page.goto("servers");
    await page.waitForLoadState("domcontentloaded");
    const editLink = page.getByRole("link", { name: /edit/i }).first();
    const hasEdit = await editLink.isVisible({ timeout: 8000 }).catch(() => false);
    if (hasEdit) {
      await editLink.click();
      await page.waitForLoadState("domcontentloaded");
      await expect(page).toHaveURL(/\/admin\/servers\/[^/]+\/edit/);
      await expect(page.locator("main")).toBeVisible({ timeout: 10000 });
    }
    await page.goto("servers");
    await page.waitForLoadState("domcontentloaded");
    const syncBtn = page.getByRole("button", { name: /Sync from node|^Sync$/i }).first();
    const hasSync = await syncBtn.isVisible({ timeout: 5000 }).catch(() => false);
    if (hasSync) {
      await syncBtn.click();
      await page.waitForTimeout(3000);
      await expect(page.locator("main")).toBeVisible();
    }
  });

  test("users page loads", async ({ page }) => {
    await page.goto("users");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.getByRole("heading", { name: /Users/i })).toBeVisible({ timeout: 15000 });
    await expect(page.locator("main")).toBeVisible();
  });

  test("settings page loads", async ({ page }) => {
    await page.goto("settings");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.getByTestId("settings-page")).toBeVisible({ timeout: 15000 });
    await expect(page.locator("main")).toBeVisible();
  });

  test("logout returns to login", async ({ page }) => {
    // Clicking layout-level logout is flaky due to responsive layouts and duplicate "Log out" buttons.
    // Use the Settings page "Account" card button, scoped by data-testid.
    await page.goto("settings");
    await page.waitForLoadState("domcontentloaded");
    const settings = page.getByTestId("settings-page");
    const logoutBtn = settings.getByRole("button", { name: /log out|sign out/i });
    await expect(logoutBtn).toBeVisible({ timeout: 10000 });
    await logoutBtn.click();
    await expect(page).toHaveURL(/\/admin\/login/, { timeout: 15000 });
  });
});
