import { test, expect } from "@playwright/test";

async function injectTelegram(page: import("@playwright/test").Page) {
  await page.addInitScript(() => {
    (window as unknown as { Telegram?: { WebApp: { initData: string; ready: () => void } } }).Telegram = {
      WebApp: { initData: "e2e-test", ready: () => {} },
    };
  });
}

test.describe("Miniapp Subscription Lifecycle", () => {
  test("expired user can restore access and reach plan checkout", async ({ page }) => {
    await injectTelegram(page);

    await page.route("**/api/v1/webapp/telemetry", async (route) => {
      await route.fulfill({ status: 204, body: "" });
    });
    await page.route("**/health/ready", async (route) => {
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
              id: "sub-expired",
              plan_id: "plan-restore",
              status: "expired",
              access_status: "grace",
              valid_until: "2024-01-01T00:00:00Z",
            },
          ],
          devices: [],
          onboarding: { completed: true, step: 3, version: 2, updated_at: new Date().toISOString() },
          routing: { recommended_route: "/plan/checkout/plan-restore", reason: "expired_with_grace" },
        }),
      });
    });
    await page.route("**/api/v1/webapp/user/access", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          status: "expired",
          has_plan: true,
          plan_id: "plan-restore",
          plan_name: "Restore Plan",
          plan_duration_days: 30,
          devices_used: 0,
          device_limit: 1,
          traffic_used_bytes: 0,
          config_ready: false,
          config_id: null,
          expires_at: "2024-01-01T00:00:00Z",
          amnezia_vpn_key: null,
        }),
      });
    });
    await page.route("**/api/v1/webapp/subscription/restore", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          status: "restored",
          plan_id: "plan-restore",
          redirect_to: "/plan/checkout/plan-restore",
        }),
      });
    });
    await page.route("**/api/v1/webapp/plans", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          items: [
            {
              id: "plan-restore",
              name: "Restore Plan",
              duration_days: 30,
              price_amount: 100,
              price_currency: "Stars",
            },
          ],
        }),
      });
    });

    await page.goto("./restore-access?tgWebAppData=e2e-test");

    await expect(page.getByRole("button", { name: /Restore access/i })).toBeVisible({
      timeout: 10000,
    });

    await page.getByRole("button", { name: /Restore access/i }).click();

    await expect(page).toHaveURL(/.*\/plan\/checkout\/plan-restore$/, { timeout: 10000 });
    await expect(page.getByRole("heading", { name: /Confirm your plan|Checkout|Review and pay/i }).first()).toBeVisible();
  });
});
