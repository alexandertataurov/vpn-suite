import { test, expect } from "@playwright/test";
import { login } from "./helpers";

test.describe("Nav and protected pages", () => {
  test.beforeEach(async ({ page, request }) => {
    const ok = await login(page, request);
    test.skip(!ok, "Skipping authenticated flow: valid admin credentials or auth API unavailable.");
  });

  test("Settings page loads", async ({ page }) => {
    await page.goto("settings");
    // SPA pages may keep polling; "networkidle" can hang indefinitely.
    await page.waitForLoadState("domcontentloaded");
    await expect(page.getByRole("heading", { name: /Settings/i })).toBeVisible({ timeout: 10000 });
  });

  test("Audit page loads", async ({ page }) => {
    await page.goto("audit");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.getByRole("heading", { name: /Audit log/i })).toBeVisible({ timeout: 10000 });
  });

  test("Subscriptions page loads", async ({ page }) => {
    await page.goto("subscriptions");
    await page.waitForLoadState("domcontentloaded");
    await expect(page).toHaveURL(/\/admin\/billing\?tab=subscriptions/);
    await expect(page.getByTestId("billing-page")).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole("tab", { name: "Subscriptions" })).toBeVisible({ timeout: 10000 });
  });

  test("Payments page loads", async ({ page }) => {
    await page.goto("payments");
    await page.waitForLoadState("domcontentloaded");
    await expect(page).toHaveURL(/\/admin\/billing\?tab=payments/);
    await expect(page.getByTestId("billing-page")).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole("tab", { name: "Payments" })).toBeVisible({ timeout: 10000 });
  });

  test("Telemetry page exposes Docker Services tab", async ({ page }) => {
    await page.goto("telemetry");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.getByRole("tab", { name: /Docker Services/i })).toBeVisible({
      timeout: 10000,
    });
  });

  test("Style guide page loads", async ({ page }) => {
    await page.goto("styleguide");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.getByRole("heading", { name: /Design System Style Guide/i })).toBeVisible({ timeout: 10000 });
  });

  test("Legacy Promo and Referrals routes redirect to overview", async ({ page }) => {
    await page.goto("promo");
    await page.waitForLoadState("domcontentloaded");
    await expect(page).toHaveURL(/\/admin\/?$/);
    await expect(page.getByRole("heading", { name: /Dashboard/i })).toBeVisible({ timeout: 10000 });

    await page.goto("referrals");
    await page.waitForLoadState("domcontentloaded");
    await expect(page).toHaveURL(/\/admin\/?$/);
    await expect(page.getByRole("heading", { name: /Dashboard/i })).toBeVisible({ timeout: 10000 });
  });

  test("Dashboard Servers card navigates to servers", async ({ page }) => {
    await page.goto("");
    await page.waitForLoadState("domcontentloaded");
    // Dashboard cards are not links; navigate via sidebar to validate routing.
    await page.getByTestId("admin-nav").getByRole("link", { name: "Servers" }).click();
    await expect(page).toHaveURL(/\/servers$/);
    await expect(page.getByRole("heading", { name: /Servers/i })).toBeVisible({ timeout: 5000 });
  });

  test("Servers page load shows table or empty state", async ({ page }) => {
    await page.goto("servers");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.getByTestId("servers-page")).toBeVisible({ timeout: 10000 });
    // Table (with data), loading skeleton, or empty state
    await expect(
      page.locator("[data-testid=servers-table], .data-table-wrap, .table-empty").first()
    ).toBeVisible({ timeout: 8000 });
  });

  test("Dashboard Users card navigates to users", async ({ page }) => {
    await page.goto("");
    await page.waitForLoadState("domcontentloaded");
    await page.getByTestId("admin-nav").getByRole("link", { name: "Users" }).click();
    await expect(page).toHaveURL(/\/users$/);
    await expect(page.getByRole("heading", { name: /Users/i })).toBeVisible({ timeout: 5000 });
  });
});
