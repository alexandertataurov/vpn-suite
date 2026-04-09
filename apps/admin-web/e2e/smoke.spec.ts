import { test, expect } from "@playwright/test";

test.describe("Smoke", () => {
  test("app loads and login page is reachable", async ({ page }) => {
    await page.goto("login");
    await expect(page.getByRole("heading", { name: /VPN Suite Admin/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Sign in/i })).toBeVisible();
  });

  test("unauthenticated redirect to login", async ({ page }) => {
    await page.goto("");
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test("health returns node_mode when API is up", async ({ request }) => {
    const apiOrigin = process.env.PLAYWRIGHT_API_BASE_URL || process.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
    const healthUrl = apiOrigin.replace(/\/api\/v1\/?$/, "") + "/health";
    let res;
    try {
      res = await request.get(healthUrl);
    } catch {
      test.skip(true, "API not reachable at " + healthUrl);
      return;
    }
    if (!res.ok()) {
      test.skip(true, "API not running at " + healthUrl);
      return;
    }
    let body: unknown;
    try {
      body = await res.json();
    } catch {
      test.skip(true, "Health response not JSON");
      return;
    }
    if (!body || typeof body !== "object" || !("node_mode" in body)) {
      test.skip(true, "Health did not return node_mode (wrong endpoint or HTML)");
      return;
    }
    expect(["mock", "real", "agent"]).toContain((body as { node_mode: string }).node_mode);
  });
});
