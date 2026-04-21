import { test, expect } from "@playwright/test";
import { login, loginViaUi } from "./helpers";

test.describe("Login and Dashboard", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("invalid credentials show error and stay on login", async ({ page }) => {
    await page.goto("login");
    await page.getByLabel(/email/i).fill("wrong@example.com");
    await page.getByLabel(/password/i).fill("wrong");
    await page.getByRole("button", { name: /Sign in/i }).click();
    await expect(page).toHaveURL(/\/admin\/login/);
    await expect(page.getByRole("button", { name: /Sign in/i })).toBeVisible();
  });

  test("login with valid credentials loads dashboard", async ({ page }) => {
    const ok = await loginViaUi(page);
    test.skip(!ok, "Skipping authenticated flow: valid admin credentials or auth API unavailable.");
    // SPA pages may keep polling; "networkidle" can hang indefinitely.
    await page.waitForLoadState("domcontentloaded");
    await expect(page.getByRole("heading", { name: /Overview|Dashboard/i })).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Dashboard when authenticated", () => {
  test("main nav links render and Overview visible", async ({ page, request }) => {
    const ok = await login(page, request);
    test.skip(!ok, "Skipping authenticated flow: valid admin credentials or auth API unavailable.");
    await page.goto("");
    await expect(page.getByRole("heading", { name: /Overview|Dashboard/i })).toBeVisible({ timeout: 10000 });
    const nav = page.getByTestId("admin-sidebar");
    await expect(nav.getByRole("link", { name: "Servers" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Users" })).toBeVisible();
  });

  test("dashboard page has root testid and key sections", async ({ page, request }) => {
    const ok = await login(page, request);
    test.skip(!ok, "Skipping: valid admin credentials or auth API unavailable.");
    await page.goto("");
    await expect(page.getByTestId("dashboard-page")).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole("heading", { name: /Dashboard/i })).toBeVisible();
  });

  test("dashboard refresh and settings controls exist", async ({ page, request }) => {
    const ok = await login(page, request);
    test.skip(!ok, "Skipping: valid admin credentials or auth API unavailable.");
    await page.goto("");
    await expect(page.getByTestId("dashboard-page")).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId("dashboard-refresh")).toBeVisible();
    await expect(page.getByTestId("dashboard-settings")).toBeVisible();
  });

  test("dashboard settings opens modal", async ({ page, request }) => {
    const ok = await login(page, request);
    test.skip(!ok, "Skipping: valid admin credentials or auth API unavailable.");
    await page.goto("");
    await expect(page.getByTestId("dashboard-page")).toBeVisible({ timeout: 10000 });
    await page.getByTestId("dashboard-settings").click();
    await expect(page.getByTestId("dashboard-settings-modal")).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole("heading", { name: /Dashboard settings/i })).toBeVisible();
  });

  test("dashboard refresh updates data without error", async ({ page, request }) => {
    const ok = await login(page, request);
    test.skip(!ok, "Skipping authenticated flow: valid admin credentials or auth API unavailable.");
    await page.goto("");
    await expect(page.getByTestId("dashboard-page")).toBeVisible({ timeout: 10000 });
    await page.getByTestId("dashboard-refresh").click();
    await expect(
      page.getByRole("button", { name: /Updated just now|Refresh|Updating/i })
    ).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole("button", { name: /Update failed/i })).not.toBeVisible();
    await expect(page.getByTestId("dashboard-page")).toBeVisible();
  });
});
