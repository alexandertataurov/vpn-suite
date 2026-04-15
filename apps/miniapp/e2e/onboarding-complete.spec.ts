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

    await gotoMiniapp(page, "/onboarding");
    await expect(page.getByRole("heading", { name: /Set up VPN access/i })).toBeVisible({ timeout: 10000 });
    for (let step = 0; step < 4 && !/\/plan$/.test(new URL(page.url()).pathname); step += 1) {
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
    await gotoMiniapp(page, "/devices");
    await page.getByRole("button", { name: /Add new device|Add device/i }).first().click();
    await expect(page.getByPlaceholder(/My iPhone/i)).toBeVisible({ timeout: 5000 });
    await page.locator('button:has-text("Continue")').last().click();
    await page.locator('button:has-text("Create")').last().click();

    await expect(page.getByText(/^Config$/i)).toBeVisible({ timeout: 5000 });
    await expect
      .poll(() => controller.state.session.onboarding.completed, { timeout: 5000 })
      .toBe(true);

    await gotoMiniapp(page, "/onboarding");
    await expect(page).toHaveURL(/.*\/devices$/);
  });
});
