import { test, expect } from "@playwright/test";
import { createPlan, createSession, gotoMiniapp, injectTelegram, setupMiniappApi } from "./helpers/miniapp";

test.describe("Miniapp Checkout Flow", () => {
  test("user can navigate from plans to checkout and complete payment", async ({ page }) => {
    await injectTelegram(page);
    await setupMiniappApi(page, {
      session: createSession({
        subscriptions: [],
        routing: { recommended_route: "/plan", reason: "no_subscription" },
      }),
      plans: {
        items: [
          createPlan({ id: "test-plan-1", name: "Test Plan 1", price_amount: 500, device_limit: 1 }),
        ],
      },
      createInvoiceReplies: [
        {
          status: 200,
          body: {
            invoice_id: "invoice-test-plan-1",
            payment_id: "payment-test-plan-1",
            title: "Test Plan 1",
            description: "VPN plan",
            currency: "XTR",
            star_count: 500,
            payload: "payload-test-plan-1",
            server_id: "srv-us",
            subscription_id: "sub-test-plan-1",
          },
        },
      ],
    });

    await gotoMiniapp(page, "/plan");

    await expect(page.getByRole("heading", { name: /Plan|Choose plan/i })).toBeVisible({ timeout: 10000 });
    await page.getByRole("button", { name: /Select|Choose|Switch/i }).first().click();

    await expect(page).toHaveURL(/\/plan\/checkout\/test-plan-1$/);
    await expect(page.getByRole("heading", { name: /Checkout/i })).toBeVisible();

    await page.getByRole("button", { name: /Pay/i }).click();
    await page.getByRole("button", { name: /Pay with Telegram Stars/i }).click();

    await expect(page).toHaveURL(/\/devices$/, { timeout: 10000 });
  });

  test("payment failure exposes retry and support recovery path", async ({ page }) => {
    await injectTelegram(page);
    await setupMiniappApi(page, {
      session: createSession({
        subscriptions: [],
        routing: { recommended_route: "/plan", reason: "no_subscription" },
      }),
      plans: {
        items: [
          createPlan({ id: "test-plan-2", name: "Test Plan 2", price_amount: 500, device_limit: 1 }),
        ],
      },
      createInvoiceReplies: [
        {
          status: 500,
          body: {
            code: "PAYMENT_UNAVAILABLE",
            message: "Payment backend unavailable",
          },
        },
      ],
    });

    await gotoMiniapp(page, "/plan/checkout/test-plan-2");

    await expect(page.getByRole("heading", { name: /Checkout/i })).toBeVisible();
    await page.getByRole("button", { name: /Pay/i }).click();
    await page.getByRole("button", { name: /Pay with Telegram Stars/i }).click();

    await expect(page.getByText(/Payment failed/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole("button", { name: /Try again/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Contact support/i })).toBeVisible();
  });
});
