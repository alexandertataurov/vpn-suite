import { test, expect } from "@playwright/test";
import { login } from "./helpers";

test.describe("Telemetry events", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      (window as unknown as { __telemetryEvents?: { event: string; payload: Record<string, unknown> }[] }).__telemetryEvents = [];
    });
  });

  test("page_view emitted after navigation to dashboard", async ({ page, request }) => {
    const ok = await login(page, request);
    test.skip(!ok, "Skipping: auth API unavailable or invalid credentials.");
    await page.goto("");
    await expect(page.getByRole("heading", { name: /Dashboard/i })).toBeVisible({ timeout: 10000 });
    const events = await page.evaluate(() => (window as unknown as { __telemetryEvents?: { event: string; payload: Record<string, unknown> }[] }).__telemetryEvents ?? []);
    const pageViews = events.filter((e) => e.event === "page_view");
    expect(pageViews.length).toBeGreaterThanOrEqual(1);
    const hasDashboardRoute = pageViews.some((e) => e.payload?.route === "/" || e.payload?.route === "/admin" || String(e.payload?.route).endsWith("/"));
    expect(hasDashboardRoute).toBe(true);
  });

  test("api_request or api_error emitted after dashboard load", async ({ page, request }) => {
    const ok = await login(page, request);
    test.skip(!ok, "Skipping: auth API unavailable or invalid credentials.");
    await page.goto("");
    await expect(page.getByRole("heading", { name: /Dashboard/i })).toBeVisible({ timeout: 10000 });
    const events = await page.evaluate(() => (window as unknown as { __telemetryEvents?: { event: string }[] }).__telemetryEvents ?? []);
    const hasApiEvent = events.some((e) => e.event === "api_request" || e.event === "api_error");
    expect(hasApiEvent).toBe(true);
  });
});
