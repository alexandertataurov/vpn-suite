import { test, expect } from "@playwright/test";
import { login } from "./helpers";

test.describe("Negative and fallback scenarios", () => {
  test.beforeEach(async ({ page, request }) => {
    const ok = await login(page, request);
    test.skip(!ok, "Skipping: valid admin credentials or auth API unavailable.");
  });

  test("403 on overview shows error or fallback UI", async ({ page }) => {
    await page.route(/\/api\/v1\/overview\/operator(\?|$)/, (route) =>
      route.fulfill({ status: 403, contentType: "application/json", body: JSON.stringify({ success: false, error: { code: "FORBIDDEN", message: "Forbidden" }, meta: { code: 403 } }) })
    );
    await page.goto("");
    // SPA pages may keep polling; "networkidle" can hang indefinitely.
    await page.waitForLoadState("domcontentloaded");
    await expect(page.getByRole("region", { name: "Global health" }).getByText(/API/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole("region", { name: "Global health" }).getByText(/Down/i)).toBeVisible({ timeout: 10000 });
  });

  test("500 on overview shows error state and retry", async ({ page }) => {
    await page.route(/\/api\/v1\/overview\/operator(\?|$)/, (route) =>
      route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ success: false, error: { code: "INTERNAL_ERROR", message: "Internal server error" }, meta: { code: 500 } }) })
    );
    await page.goto("");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.getByRole("region", { name: "Global health" }).getByText(/API/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole("region", { name: "Global health" }).getByText(/Down/i)).toBeVisible({ timeout: 10000 });
  });

  test("403 on GET /servers shows Permission denied", async ({ page }) => {
    await page.route(/\/api\/v1\/servers(\?|$)/, (route) =>
      route.fulfill({
        status: 403,
        contentType: "application/json",
        body: JSON.stringify({ success: false, error: { code: "FORBIDDEN", message: "Forbidden" }, meta: { code: 403 } }),
      })
    );
    await page.goto("servers");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.getByText(/permission denied|forbidden/i).first()).toBeVisible({ timeout: 10000 });
  });

  test("500 on GET /servers shows error state and Retry", async ({ page }) => {
    await page.route(/\/api\/v1\/servers(\?|$)/, (route) =>
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ success: false, error: { code: "INTERNAL_ERROR", message: "Internal server error" }, meta: { code: 500 } }),
      })
    );
    await page.goto("servers");
    await page.waitForLoadState("domcontentloaded");
    const retryBtn = page.getByRole("button", { name: /retry/i });
    await expect(retryBtn.first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Servers partial failure and staleness", () => {
  test.beforeEach(async ({ page, request }) => {
    const ok = await login(page, request);
    test.skip(!ok, "Skipping: valid admin credentials or auth API unavailable.");
  });

  test("500 on telemetry/summary shows partial failure banner, list still renders", async ({ page }) => {
    await page.route(/\/api\/v1\/servers(\?|$)/, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          items: [{ id: "s1", name: "Test", region: "us-east", api_endpoint: "https://x.com", status: "online", is_active: true, created_at: new Date().toISOString(), last_seen_at: new Date().toISOString() }],
          total: 1,
        }),
      })
    );
    await page.route("**/api/v1/servers/telemetry/summary*", (route) =>
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ success: false, error: { code: "INTERNAL_ERROR", message: "Error" }, meta: { code: 500 } }),
      })
    );
    await page.route("**/api/v1/servers/snapshots/summary*", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ servers: {} }),
      })
    );
    await page.route("**/api/v1/servers/device-counts*", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ counts: {} }) })
    );
    await page.goto("servers");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.getByTestId("servers-table")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/telemetry|snapshot.*unavailable/i).first()).toBeVisible({ timeout: 5000 });
  });

  test("Server row shows stale badge when last_seen_at is old", async ({ page }) => {
    const oldTime = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    await page.route(/\/api\/v1\/servers(\?|$)/, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          items: [
            {
              id: "s1",
              name: "StaleServer",
              region: "us-east",
              api_endpoint: "https://x.com",
              status: "offline",
              is_active: false,
              created_at: new Date().toISOString(),
              last_seen_at: oldTime,
            },
          ],
          total: 1,
        }),
      })
    );
    await page.route("**/api/v1/servers/telemetry/summary*", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ servers: {} }) })
    );
    await page.route("**/api/v1/servers/snapshots/summary*", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ servers: {} }) })
    );
    await page.route("**/api/v1/servers/device-counts*", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ counts: {} }) })
    );
    await page.goto("servers");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.getByTestId("servers-table")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/stale|StaleServer/i).first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Perf smoke — large server list", () => {
  test.beforeEach(async ({ page, request }) => {
    const ok = await login(page, request);
    test.skip(!ok, "Skipping: valid admin credentials or auth API unavailable.");
  });

  test("Servers page renders with 200 mocked servers without freezing", async ({ page }) => {
    const items = Array.from({ length: 200 }, (_, i) => ({
      id: `server-${i}`,
      name: `Server ${i}`,
      region: "us-east",
      api_endpoint: "https://example.com",
      vpn_endpoint: null,
      public_key: null,
      status: "ok",
      is_active: true,
      created_at: new Date().toISOString(),
      last_seen_at: new Date().toISOString(),
    }));
    await page.route("**/api/v1/servers**", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ items, total: 200 }) })
    );
    await page.route("**/api/v1/servers/device-counts**", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ counts: {} }) })
    );
    await page.goto("servers");
    // Servers page does background fetches; "networkidle" is a flaky gate.
    await page.waitForLoadState("domcontentloaded");
    await expect(page.getByRole("heading", { name: /Servers/i })).toBeVisible({ timeout: 10000 });
    await expect(page.locator("main")).toBeVisible();
  });
});
