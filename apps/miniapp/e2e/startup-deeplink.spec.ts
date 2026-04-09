import { test, expect } from "@playwright/test";
import { createPlan, createSession, gotoMiniapp, injectTelegram, setupMiniappApi } from "./helpers/miniapp";

test.describe("Miniapp Startup Deep Links", () => {
  test("first-time user deep link to devices stays on allowed route and shows setup CTA", async ({ page }) => {
    await injectTelegram(page);
    await setupMiniappApi(page, {
      session: createSession({
        subscriptions: [],
        onboarding: {
          completed: false,
          step: 0,
          version: 2,
          updated_at: null,
        },
        routing: { recommended_route: "/devices", reason: "no_subscription" },
      }),
      plans: { items: [createPlan({ id: "plan-starter", name: "Starter" })] },
    });

    await gotoMiniapp(page, "/devices");

    await expect(page).toHaveURL(/\/devices/);
    await expect(page.getByText(/No active subscription/i)).toBeVisible({ timeout: 10000 });
    await page.getByRole("link", { name: /Choose plan/i }).click();
    await expect(page).toHaveURL(/\/plan$/);
  });

  test("completed user deep link stays on target route", async ({ page }) => {
    await injectTelegram(page);
    await setupMiniappApi(page, {
      session: createSession({
        routing: { recommended_route: "/devices", reason: "connected_user" },
      }),
    });

    await gotoMiniapp(page, "/devices");

    await expect(page).toHaveURL(/\/devices/);
    await expect(page.getByRole("heading", { name: /Devices/i })).toBeVisible();
  });
});
