import { test, expect } from "@playwright/test";
import { createPlan, createSession, gotoMiniapp, injectTelegram, setupMiniappApi } from "./helpers/miniapp";

test.describe("Miniapp Device Issue Flow", () => {
  test("user with active subscription can add device and see config", async ({ page }) => {
    await injectTelegram(page);
    await setupMiniappApi(page, {
      session: createSession({
        subscriptions: [
          {
            id: "sub-1",
            plan_id: "plan-1",
            status: "active",
            access_status: "enabled",
            valid_until: "2030-01-01T00:00:00Z",
            device_limit: 5,
          },
        ],
        routing: { recommended_route: "/devices", reason: "no_device" },
      }),
      plans: {
        items: [
          createPlan({ id: "plan-1", name: "Plan 1", device_limit: 5, price_amount: 300 }),
        ],
      },
    });

    await gotoMiniapp(page, "/devices");
    await expect(page.getByRole("heading", { name: /Devices/i })).toBeVisible({ timeout: 10000 });

    await page.getByRole("button", { name: /Add new device|Add device/i }).first().click();
    await page.getByPlaceholder(/My iPhone/i).fill("My iPhone");
    await page.locator('button:has-text("Continue")').last().click();
    await expect(page.getByText(/Install AmneziaVPN|Download app/i).first()).toBeVisible({ timeout: 5000 });
    await page.locator('button:has-text("Create")').last().click();

    await expect(page.getByText(/^Config$/i)).toBeVisible({ timeout: 5000 });
    await expect(page.locator("pre.config-block")).toContainText("[Interface]");
  });
});
