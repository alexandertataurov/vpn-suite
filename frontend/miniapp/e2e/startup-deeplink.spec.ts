import { test, expect } from "@playwright/test";

async function injectTelegram(page: import("@playwright/test").Page) {
  await page.addInitScript(() => {
    (window as unknown as { Telegram?: { WebApp: { initData: string; ready: () => void } } }).Telegram = {
      WebApp: { initData: "e2e-test", ready: () => {} },
    };
  });
}

test.describe("Miniapp Startup Deep Links", () => {
  test("first-time user deep link is gated by onboarding then lands on plan", async ({ page }) => {
    await injectTelegram(page);

    let onboardingStep = 0;
    let onboardingCompleted = false;

    await page.route("**/*", async (route) => {
      const url = route.request().url();
      if (url.includes("/api/v1/webapp/telemetry")) {
        await route.fulfill({ status: 204, body: "" });
        return;
      }
      if (url.includes("/api/v1/health/ready")) {
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
              version: 1,
              updated_at: onboardingCompleted ? new Date().toISOString() : null,
            },
          }),
        });
        return;
      }
      if (url.includes("/api/v1/webapp/onboarding/state")) {
        const body = route.request().postDataJSON() as { step: number; completed?: boolean };
        onboardingStep = Math.max(onboardingStep, body.step ?? 0);
        if (body.completed) {
          onboardingCompleted = true;
          onboardingStep = 2;
        }
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            onboarding: {
              completed: onboardingCompleted,
              step: onboardingStep,
              version: 1,
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
            items: [
              {
                id: "plan-basic",
                name: "Basic",
                duration_days: 30,
                price_amount: 99,
                price_currency: "Stars",
              },
            ],
          }),
        });
        return;
      }
      await route.continue();
    });

    await page.goto("./devices?tgWebAppData=e2e-test");
    await expect(page).toHaveURL(/.*\/onboarding$/, { timeout: 15000 });

    await page.getByRole("button", { name: /Continue/i }).click();
    await page.getByRole("button", { name: /Continue/i }).click();
    await page.getByRole("button", { name: /Go to plans/i }).click();

    await expect(page).toHaveURL(/.*\/plan$/, { timeout: 15000 });
    await expect(page.getByRole("heading", { name: /Choose Your Plan/i })).toBeVisible();
  });

  test("completed user deep link stays on target route", async ({ page }) => {
    await injectTelegram(page);

    await page.route("**/*", async (route) => {
      const url = route.request().url();
      if (url.includes("/api/v1/webapp/telemetry")) {
        await route.fulfill({ status: 204, body: "" });
        return;
      }
      if (url.includes("/api/v1/health/ready")) {
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
        return;
      }
      await route.continue();
    });

    await page.goto("./devices?tgWebAppData=e2e-test");
    await expect(page).toHaveURL(/.*\/devices/, { timeout: 15000 });
    await expect(page.getByRole("heading", { name: /My devices/i })).toBeVisible();
  });
});
