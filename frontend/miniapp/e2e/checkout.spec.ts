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
        await page.route("**/api/v1/webapp/auth", async (route) => {
            await route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({ session_token: "e2e-session", expires_in: 3600 }),
            });
        });
        // 1. Mock the API responses
        await page.route("**/api/v1/webapp/me", async (route) => {
            await route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({
                    id: 12345,
                    username: "test_user",
                    subscriptions: [],
                    devices: [],
                }),
            });
        });

        await page.route("**/api/v1/webapp/plans", async (route) => {
            await route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({
                    items: [
                        {
                            id: "test-plan-1",
                            name: "Test Plan 1",
                            duration_days: 30,
                            price_amount: "500",
                            price_currency: "Stars",
                        },
                    ],
                }),
            });
        });

        await page.route("**/api/v1/webapp/payments/create-invoice", async (route) => {
            await route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({ success: true, invoice_link: "https://t.me/invoice/test" }),
            });
        });

        // 2. Start at the root (Overview page)
        await page.goto("./");

        // Wait for the page to load and title to be visible
        await expect(page.locator("h1")).toContainText(/Overview/i);

        // 3. Navigate to Plans
        await page.getByRole("link", { name: /Choose plan/i }).click();

        // 4. Select a plan
        await expect(page.locator("h1")).toContainText(/Plans/i);
        await expect(page.getByText("Test Plan 1")).toBeVisible();
        await page.getByRole("button", { name: /Select/i }).click();

        // 5. Verify checkout page
        await expect(page).toHaveURL(/.*checkout\/test-plan-1/);
        await expect(page.getByText("Plan test-plan-1")).toBeVisible();

        // 6. Pay
        await page.getByRole("button", { name: /Pay with Telegram Stars/i }).click();

        // 7. Verify status
        await expect(page.getByText(/Waiting for payment/i)).toBeVisible();
    });
});
