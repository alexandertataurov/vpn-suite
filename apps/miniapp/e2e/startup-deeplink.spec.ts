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
    await expect(page.getByText(/No active plan|Choose a plan/i).first()).toBeVisible({ timeout: 10000 });
    await page.locator("a,button", { hasText: /Choose plan/i }).first().click();
    await expect(page).toHaveURL(/\/(plan|onboarding|plan\/checkout\/[^/?#]+)(\?.*)?$/);
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
    await expect(page.getByRole("heading", { name: /Devices/i }).first()).toBeVisible();
  });
});
