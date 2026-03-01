import { test, expect } from "@playwright/test";

async function injectTelegram(page: import("@playwright/test").Page) {
  await page.addInitScript(() => {
    (window as unknown as { Telegram?: { WebApp: { initData: string; ready: () => void } } }).Telegram = {
      WebApp: { initData: "e2e-test", ready: () => {} },
    };
  });
}

test.describe("Miniapp Checkout Flow", () => {
    test("user can navigate from plans to checkout and request an invoice", async ({ page }) => {
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
                        onboarding: { completed: true, step: 2, version: 1, updated_at: new Date().toISOString() },
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
                                id: "test-plan-1",
                                name: "Test Plan 1",
                                duration_days: 30,
                                price_amount: 500,
                                price_currency: "Stars",
                            },
                        ],
                    }),
                });
                return;
            }
            if (url.includes("/webapp/payments/create-invoice")) {
                await route.fulfill({
                    status: 200,
                    contentType: "application/json",
                    body: JSON.stringify({
                        invoice_id: "e2e-payment-1",
                        payment_id: "e2e-payment-1",
                        title: "Test Plan 1",
                        description: "VPN plan, 30 days",
                        currency: "XTR",
                        star_count: 500,
                        payload: "e2e-payment-1",
                        server_id: "s1",
                        subscription_id: "sub1",
                        invoice_link: "https://t.me/$invoice/test",
                    }),
                });
                return;
            }
            if (url.includes("/webapp/payments/") && url.endsWith("/status")) {
                await route.fulfill({
                    status: 200,
                    contentType: "application/json",
                    body: JSON.stringify({ payment_id: "e2e-payment-1", status: "pending" }),
                });
                return;
            }
            await route.continue();
        });

        await page.goto("./?tgWebAppData=e2e-test");

        await expect(page.getByRole("link", { name: /Plan/i }).first()).toBeVisible({ timeout: 10000 });

        await page.getByRole("link", { name: /Plan/i }).first().click();

        await expect(page.locator("h1")).toContainText(/Choose Your Plan|Plan/i);
        await page.getByRole("link", { name: /Get Test Plan 1/i }).click();

        await expect(page).toHaveURL(/.*checkout\/test-plan-1/);
        await expect(page.getByText("Plan test-plan-1")).toBeVisible();

        await page.getByRole("button", { name: /Pay with Telegram Stars/i }).click();

        const paymentWaiting = page.locator(".payment-status-waiting");
        const reachedWaitingState = await paymentWaiting
            .isVisible({ timeout: 10000 })
            .catch(() => false);
        if (!reachedWaitingState) {
            await expect(page).toHaveURL(/.*\/devices$/, { timeout: 10000 });
        }
    });
});
