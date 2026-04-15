import { test, expect } from "@playwright/test";

async function injectTelegram(page: import("@playwright/test").Page) {
  await page.addInitScript(() => {
    (window as unknown as { Telegram?: { WebApp: { initData: string; ready: () => void } } }).Telegram = {
      WebApp: { initData: "e2e-test", ready: () => {} },
    };
  });
}

test.describe("Miniapp Onboarding", () => {
  async function continueToPlan(page: import("@playwright/test").Page) {
    for (let step = 0; step < 4; step += 1) {
      if (/\/plan$/.test(new URL(page.url()).pathname)) return;
      const choosePlan = page.getByRole("button", { name: /^Choose plan$/i });
      if (await choosePlan.count()) {
        await choosePlan.first().click();
      } else {
        const primaryContinue = page.getByRole("button", { name: /^Continue$/i });
        if (await primaryContinue.count()) {
          await primaryContinue.first().click();
        }
      }
      await page.waitForTimeout(150);
    }
  }

  test("first-time user can move from onboarding to plan", async ({ page }) => {
    await injectTelegram(page);

    let onboardingStep = 0;
    let onboardingCompleted = false;

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
            onboarding: {
              completed: onboardingCompleted,
              step: onboardingStep,
              version: 2,
              updated_at: onboardingCompleted ? new Date().toISOString() : null,
            },
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
        const body = route.request().postDataJSON() as {
          step: number;
          completed?: boolean;
          version?: number;
        };
        onboardingStep = Math.max(onboardingStep, body.step ?? 0);
        if (body.completed) {
          onboardingCompleted = true;
          onboardingStep = 3;
        }
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            onboarding: {
              completed: onboardingCompleted,
              step: onboardingStep,
              version: 2,
              updated_at: onboardingCompleted ? new Date().toISOString() : null,
            },
          }),
        });
        return;
      }
      if (url.includes("/api/v1/webapp/plans")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            items: [{ id: "plan-1", name: "Plan 1", duration_days: 30, price_amount: 100, price_currency: "Stars" }],
          }),
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

    await page.goto("./?tgWebAppData=e2e-test");

    await expect(page).toHaveURL(/.*\/onboarding$/);
    await expect(page.getByRole("heading", { name: /Set up VPN access/i })).toBeVisible();
    await continueToPlan(page);

    await expect(page).toHaveURL(/.*\/plan(\?.*)?$/);
  });

  test("onboarding sync still lets user reach plan", async ({ page }) => {
    await injectTelegram(page);

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
            onboarding: {
              completed: false,
              step: 0,
              version: 2,
              updated_at: null,
            },
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
        const body = route.request().postDataJSON() as { completed?: boolean };
        if (body.completed) {
          await route.fulfill({
            status: 500,
            contentType: "application/json",
            body: JSON.stringify({ detail: "temporary failure" }),
          });
          return;
        }
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            onboarding: {
              completed: false,
              step: 1,
              version: 2,
              updated_at: null,
            },
          }),
        });
        return;
      }
      if (url.includes("/api/v1/webapp/plans")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            items: [{ id: "plan-1", name: "Plan 1", duration_days: 30, price_amount: 100, price_currency: "Stars" }],
          }),
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

    await page.goto("./?tgWebAppData=e2e-test");

    await expect(page).toHaveURL(/.*\/onboarding$/);
    await continueToPlan(page);

    await expect(page).toHaveURL(/.*\/plan(\?.*)?$/);
  });
});
