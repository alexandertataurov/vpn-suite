import { test, expect } from "@playwright/test";

async function injectTelegram(page: import("@playwright/test").Page) {
  await page.addInitScript(() => {
    (window as unknown as { Telegram?: { WebApp: { initData: string; ready: () => void } } }).Telegram = {
      WebApp: { initData: "e2e-test", ready: () => {} },
    };
  });
}

async function mockBootstrapApis(page: import("@playwright/test").Page) {
  await page.route("**/*", async (route) => {
    const url = route.request().url();
    if (url.includes("/api/v1/webapp/telemetry")) {
      await route.fulfill({ status: 204, body: "" });
      return;
    }
    if (url.includes("/health/ready")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ status: "ok" }),
      });
      return;
    }
    if (url.includes("/api/v1/webapp/auth")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ session_token: "e2e-session", expires_in: 3600 }),
      });
      return;
    }
    if (url.includes("/api/v1/webapp/me")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          user: { id: 1, tg_id: 12345 },
          subscriptions: [],
          devices: [],
          onboarding: { completed: false, step: 0, version: 2, updated_at: null },
        }),
      });
      return;
    }
    if (url.includes("/api/v1/webapp/user/access")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          status: "no_plan",
          has_plan: false,
          plan_id: null,
          plan_name: null,
          plan_duration_days: null,
          devices_used: 0,
          device_limit: null,
          traffic_used_bytes: 0,
          config_ready: false,
          config_id: null,
          expires_at: null,
          amnezia_vpn_key: null,
        }),
      });
      return;
    }
    if (url.includes("/api/v1/webapp/onboarding/state")) {
      const body = route.request().postDataJSON() as { step: number; completed?: boolean };
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          onboarding: {
            completed: !!body.completed,
            step: body.completed ? 3 : body.step ?? 0,
            version: 2,
            updated_at: body.completed ? new Date().toISOString() : null,
          },
        }),
      });
      return;
    }
    if (url.includes("/api/v1/webapp/plans")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ items: [] }),
      });
      return;
    }
    if (url.includes("/api/v1/webapp/usage")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ sessions: 0, points: [] }),
      });
      return;
    }
    if (url.includes("/api/v1/webapp/payments/history")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ total: 0, items: [] }),
      });
      return;
    }
    await route.continue();
  });
}

test.describe("Miniapp Onboarding Resume", () => {
  test("corrupted onboarding storage is ignored safely", async ({ page }) => {
    await injectTelegram(page);
    await page.addInitScript(() => {
      window.localStorage.setItem("vpn-suite-miniapp-onboarding:1", "{broken_json");
    });
    await mockBootstrapApis(page);

    await page.goto("./?tgWebAppData=e2e-test");

    await expect(page).toHaveURL(/.*\/onboarding$/, { timeout: 15000 });
    await expect(page.getByRole("heading", { name: /Set up VPN access/i })).toBeVisible();
    const storedValue = await page.evaluate(() =>
      window.localStorage.getItem("vpn-suite-miniapp-onboarding:1"),
    );
    expect(storedValue).not.toBeNull();
    const parsed = JSON.parse(storedValue ?? "{}") as {
      step?: number;
      completed?: boolean;
      version?: number;
    };
    expect(parsed.step).toBe(0);
    expect(parsed.completed).toBe(false);
    expect(parsed.version).toBe(2);
  });

  test("valid onboarding resume state restores mid-flow step", async ({ page }) => {
    await injectTelegram(page);
    await page.addInitScript(() => {
      window.localStorage.setItem(
        "vpn-suite-miniapp-onboarding:1",
        JSON.stringify({
          step: 2,
          version: 2,
          completed: false,
          updatedAt: new Date().toISOString(),
        }),
      );
    });
    await mockBootstrapApis(page);

    await page.goto("./?tgWebAppData=e2e-test");

    await expect(page).toHaveURL(/\/(onboarding)?(\?.*)?$/, { timeout: 15000 });
    await expect(page.getByText(/Set up VPN access|Choose a plan|Manage Devices|Amnezia/i).first()).toBeVisible();
  });
});
