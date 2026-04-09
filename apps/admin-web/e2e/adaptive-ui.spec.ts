/**
 * Adaptive UI — breakpoints, sidebar, tables as cards, no horizontal scroll.
 * Viewports: XS 360, SM 640, MD 1024, LG 1440.
 */
import { test, expect } from "@playwright/test";
import { login } from "./helpers";

const VIEWPORTS = [
  { name: "XS", width: 360, height: 640 },
  { name: "SM", width: 640, height: 800 },
  { name: "MD", width: 1024, height: 800 },
  { name: "LG", width: 1440, height: 900 },
] as const;

test.describe("Adaptive UI", () => {
  test.beforeEach(async ({ page, request }) => {
    const ok = await login(page, request);
    test.skip(!ok, "Skipping: valid admin credentials or auth API unavailable.");
  });

  for (const vp of VIEWPORTS) {
    test("viewport " + vp.name + " no horizontal scroll on dashboard", async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto("/");
      await page.waitForLoadState("domcontentloaded");
      await expect(page.getByTestId("dashboard-page")).toBeVisible({ timeout: 10000 });
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
    });
  }

  test("XS sidebar is overlay", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 640 });
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    const sidebar = page.getByTestId("admin-sidebar");
    await expect(sidebar).toBeAttached();
    const box = await sidebar.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeLessThan(0);
  });

  test("MD sidebar persistent", async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 800 });
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    const sidebar = page.getByTestId("admin-sidebar");
    const box = await sidebar.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
  });

  test("XS Servers shows cards or table", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 640 });
    await page.goto("/servers");
    await page.waitForLoadState("domcontentloaded");
    const cards = page.getByTestId("servers-cards");
    const table = page.getByTestId("servers-table");
    const hasCards = await cards.isVisible().catch(() => false);
    const hasTable = await table.isVisible().catch(() => false);
    expect(hasCards || hasTable).toBe(true);
  });

  test("Skip link targets main", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    const skipLink = page.locator("a.skip-link[href=\"#main-content\"]");
    await expect(skipLink).toBeVisible();
    await skipLink.focus();
    await expect(skipLink).toBeFocused();
  });
});
