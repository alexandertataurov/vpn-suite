import { test, expect } from "@playwright/test";

async function injectTelegram(page: import("@playwright/test").Page) {
  await page.addInitScript(() => {
    (window as unknown as { Telegram?: { WebApp: { initData: string; ready: () => void } } }).Telegram = {
      WebApp: { initData: "e2e-test", ready: () => {} },
    };
  });
}

test.describe("Miniapp Onboarding", () => {
  test("first-time user completes onboarding then lands on plan", async ({ page }) => {
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
        const body = route.request().postDataJSON() as {
          step: number;
          completed?: boolean;
          version?: number;
        };
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
            items: [{ id: "plan-1", name: "Plan 1", duration_days: 30, price_amount: 100, price_currency: "Stars" }],
          }),
        });
        return;
      }
      await route.continue();
    });

    await page.goto("./?tgWebAppData=e2e-test");

    await expect(page).toHaveURL(/.*\/onboarding$/);
    await expect(page.getByRole("heading", { name: /Welcome/i })).toBeVisible();
    await page.getByRole("button", { name: /Continue/i }).click();
    await page.getByRole("button", { name: /Continue/i }).click();
    await page.getByRole("button", { name: /Go to plans/i }).click();

    await expect(page).toHaveURL(/.*\/plan$/);
    await expect(page.getByRole("heading", { name: /Choose Your Plan/i })).toBeVisible();
  });

  test("completion falls through to plan when onboarding endpoint fails", async ({ page }) => {
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
            subscriptions: [],
            devices: [],
            onboarding: {
              completed: false,
              step: 0,
              version: 1,
              updated_at: null,
            },
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
              version: 1,
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
      await route.continue();
    });

    await page.goto("./?tgWebAppData=e2e-test");

    await expect(page).toHaveURL(/.*\/onboarding$/);
    await page.getByRole("button", { name: /Continue/i }).click();
    await page.getByRole("button", { name: /Continue/i }).click();
    await page.getByRole("button", { name: /Go to plans/i }).click();

    await expect(page).toHaveURL(/.*\/plan$/);
    await expect(page.getByRole("heading", { name: /Choose Your Plan/i })).toBeVisible();
  });
});
