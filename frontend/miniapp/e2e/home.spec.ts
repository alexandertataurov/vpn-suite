import { test, expect } from "@playwright/test";

async function injectTelegram(page: import("@playwright/test").Page) {
  await page.addInitScript(() => {
    (window as unknown as { Telegram?: { WebApp: { initData: string; ready: () => void } } }).Telegram = {
      WebApp: { initData: "e2e-test", ready: () => {} },
    };
  });
}

test.describe("Miniapp Home", () => {
  test("home screen loads and shows primary CTA", async ({ page }) => {
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
          subscriptions: [],
          devices: [],
          onboarding: { completed: true, step: 2, version: 1, updated_at: new Date().toISOString() },
        }),
      });
    });

    await page.goto("./?tgWebAppData=e2e-test");

    await expect(
      page.getByRole("link", { name: /Connect Now|Get config|Manage Connection/i })
    ).toBeVisible({ timeout: 10000 });
  });
});
