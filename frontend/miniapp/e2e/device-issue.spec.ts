import { test, expect } from "@playwright/test";

/** Inject Telegram WebApp stub so startup bootstrap can auth and proceed. */
async function injectTelegram(page: import("@playwright/test").Page) {
  await page.addInitScript(() => {
    (window as unknown as { Telegram?: { WebApp: { initData: string; ready: () => void } } }).Telegram = {
      WebApp: { initData: "e2e-test", ready: () => {} },
    };
  });
}

test.describe("Miniapp Device Issue Flow", () => {
  test("user with active subscription can add device and see config", async ({ page }) => {
    await injectTelegram(page);

    await page.route("**/api/v1/webapp/telemetry", async (route) => {
      await route.fulfill({ status: 204, body: "" });
    });
    await page.route("**/api/v1/health/ready", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ status: "ok" }),
      });
    });

    await page.route("**/api/v1/webapp/auth", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ session_token: "e2e-session", expires_in: 3600 }),
      });
    });

    await page.route("**/api/v1/webapp/me", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          user: { id: 1, tg_id: 12345 },
          subscriptions: [
            {
              id: "sub-1",
              plan_id: "plan-1",
              status: "active",
              valid_until: "2030-01-01T00:00:00Z",
              device_limit: 5,
            },
          ],
          devices: [],
          onboarding: { completed: true, step: 2, version: 1, updated_at: new Date().toISOString() },
        }),
      });
    });

    await page.route("**/api/v1/webapp/devices/issue", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          device_id: "dev-e2e-1",
          config: "[Interface]\nPrivateKey = x\nAddress = 10.0.0.2/32",
          issued_at: new Date().toISOString(),
          node_mode: "awg",
          peer_created: true,
        }),
      });
    });

    await page.goto("./devices?tgWebAppData=e2e-test");
    await expect(page.getByRole("heading", { name: /My devices/i })).toBeVisible({ timeout: 10000 });

    await page.getByRole("button", { name: /Add (first )?device/i }).click();

    await expect(page.getByRole("heading", { name: /Your config/i })).toBeVisible({ timeout: 5000 });
    await expect(page.locator("pre.config-block")).toContainText("[Interface]");
  });
});
