import { test, expect } from "@playwright/test";
import { createPlan, createSession, gotoMiniapp, injectTelegram, setupMiniappApi } from "./helpers/miniapp";

test.describe("Miniapp Onboarding Completion", () => {
  test("issuing the first device exits onboarding for new users", async ({ page }) => {
    await injectTelegram(page);
    const controller = await setupMiniappApi(page, {
      session: createSession({
        devices: [],
        onboarding: {
          completed: false,
          step: 1,
          version: 2,
          updated_at: null,
        },
        routing: { recommended_route: "/devices", reason: "no_device" },
      }),
      plans: {
        items: [
          createPlan({ id: "plan-1", name: "Plan 1", device_limit: 5, price_amount: 300 }),
        ],
      },
    });

    await gotoMiniapp(page, "/devices");
    await expect(page.getByRole("heading", { name: /^Devices$/i })).toBeVisible({ timeout: 10000 });

    await page.getByRole("button", { name: /^Add device$/i }).click();

    await expect(page.getByText(/^Config$/i)).toBeVisible({ timeout: 5000 });
    await expect
      .poll(() => controller.state.session.onboarding.completed, { timeout: 5000 })
      .toBe(true);

    await gotoMiniapp(page, "/onboarding");
    await expect(page).toHaveURL(/.*\/devices$/);
  });
});
