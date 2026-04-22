import { expect, test, type Page } from "@playwright/test";
import { RESPONSIVE_VIEWPORTS } from "./responsive-matrix";

const ROUTES = [
  { path: "/", readyText: /Manage Devices|Setup Required|Renew Subscription|Invite Friends/i },
  { path: "/plan", readyText: /Plan\s*&\s*Billing|Pro|Basic|No plans available|Could not load/i },
  { path: "/plan/checkout/plan-pro", readyText: /Confirm your plan|Review and pay|Checkout|Payment|Plan ID/i },
  { path: "/devices", readyText: /Devices|Active|Config|Add device|No devices yet/i },
  { path: "/referral", readyText: /Referral|Referrals|Share link|Reward progress/i },
  { path: "/support", readyText: /Support|Troubleshooter|FAQ|Setup guide|Contact support|Help/i },
  { path: "/settings", readyText: /Settings|Profile|Plan|Cancel plan|Danger zone|Edit profile/i },
] as const;

async function injectTelegram(page: Page) {
  await page.addInitScript(() => {
    const fixedNow = new Date("2030-01-15T12:00:00.000Z").getTime();
    Date.now = () => fixedNow;
    const setE2EFlag = () => document.documentElement?.setAttribute("data-e2e", "true");
    setE2EFlag();
    window.addEventListener("DOMContentLoaded", setE2EFlag, { once: true });
    (window as unknown as { Telegram?: { WebApp: { initData: string; ready: () => void } } }).Telegram = {
      WebApp: { initData: "e2e-test", ready: () => {} },
    };
  });
}

async function mockApi(page: Page) {
  await page.route("**/*", async (route) => {
    const url = route.request().url();
    if (url.includes("/api/v1/webapp/telemetry")) {
      await route.fulfill({ status: 204, body: "" });
      return;
    }
    const path = new URL(url).pathname.replace(/\/$/, "");
    if (path === "/health/ready" || path === "/health") {
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
              plan_id: "plan-pro",
              status: "active",
              valid_until: "2030-03-01T00:00:00Z",
              device_limit: 5,
            },
          ],
          devices: [],
          onboarding: { completed: true, step: 3, version: 2, updated_at: "2030-01-15T12:00:00Z" },
        }),
      });
      return;
    }
    if (url.includes("/api/v1/webapp/user/access")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          status: "needs_device",
          has_plan: true,
          plan_id: "plan-pro",
          plan_name: "Pro",
          plan_duration_days: 90,
          devices_used: 0,
          device_limit: 5,
          traffic_used_bytes: 0,
          config_ready: false,
          config_id: null,
          expires_at: "2030-03-01T00:00:00Z",
          amnezia_vpn_key: null,
        }),
      });
      return;
    }
    if (url.includes("/api/v1/webapp/support/faq")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          items: [
            { title_key: "support.faq_item_connection_title", body_key: "support.faq_item_connection_body" },
            { title_key: "support.faq_item_install_title", body_key: "support.faq_item_install_body" },
          ],
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
              name: "Standard",
              duration_days: 30,
              price_amount: 99,
              price_currency: "Stars",
            },
            {
              id: "plan-family",
              name: "Family",
              duration_days: 60,
              price_amount: 179,
              price_currency: "Stars",
            },
            {
              id: "plan-pro",
              name: "Pro",
              duration_days: 90,
              price_amount: 249,
              price_currency: "Stars",
            },
          ],
        }),
      });
      return;
    }
    if (url.includes("/api/v1/webapp/payments/history")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          total: 4,
          items: [
            {
              payment_id: "pay-1",
              plan_id: "plan-pro",
              plan_name: "Pro",
              amount: 59.88,
              currency: "USD",
              status: "paid",
              created_at: "2030-01-15T00:00:00Z",
              invoice_ref: "INV-2030-001",
            },
            {
              payment_id: "pay-2",
              plan_id: "plan-pro",
              plan_name: "Pro",
              amount: 5.99,
              currency: "USD",
              status: "refunded",
              created_at: "2030-01-10T00:00:00Z",
              invoice_ref: "INV-2030-000",
            },
            {
              payment_id: "pay-3",
              plan_id: "plan-basic",
              plan_name: "Basic",
              amount: 2.99,
              currency: "USD",
              status: "pending",
              created_at: "2030-01-08T00:00:00Z",
              invoice_ref: "INV-2029-999",
            },
            {
              payment_id: "pay-4",
              plan_id: "plan-basic",
              plan_name: "Basic",
              amount: 2.99,
              currency: "USD",
              status: "failed",
              created_at: "2030-01-05T00:00:00Z",
              invoice_ref: "INV-2029-998",
            },
          ],
        }),
      });
      return;
    }
    if (url.includes("/api/v1/webapp/servers")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          auto_select: true,
          items: [
            {
              id: "srv-1",
              name: "Frankfurt",
              region: "de",
              is_current: true,
              load_percent: 42,
              avg_ping_ms: 27,
            },
            {
              id: "srv-2",
              name: "New York",
              region: "us",
              is_current: false,
              load_percent: 63,
              avg_ping_ms: 104,
            },
          ],
        }),
      });
      return;
    }
    if (url.includes("/api/v1/webapp/usage")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          range: "7d",
          points: [
            { ts: "2030-01-09T00:00:00Z", bytes_in: 12_000_000, bytes_out: 8_500_000 },
            { ts: "2030-01-10T00:00:00Z", bytes_in: 15_500_000, bytes_out: 9_800_000 },
            { ts: "2030-01-11T00:00:00Z", bytes_in: 11_800_000, bytes_out: 7_200_000 },
            { ts: "2030-01-12T00:00:00Z", bytes_in: 13_900_000, bytes_out: 8_100_000 },
            { ts: "2030-01-13T00:00:00Z", bytes_in: 14_700_000, bytes_out: 9_100_000 },
            { ts: "2030-01-14T00:00:00Z", bytes_in: 16_400_000, bytes_out: 10_000_000 },
            { ts: "2030-01-15T00:00:00Z", bytes_in: 17_200_000, bytes_out: 10_800_000 },
          ],
        }),
      });
      return;
    }
    if (url.includes("/api/v1/webapp/referral/my-link")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ payload: "invite-token" }),
      });
      return;
    }
    if (url.includes("/api/v1/webapp/referral/stats")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          earned_days: 14,
          active_referrals: 2,
          pending_rewards: 1,
          total_referrals: 3,
          invite_goal: 4,
          invite_progress: 3,
          invite_remaining: 1,
          pending_reward_days: 7,
        }),
      });
      return;
    }
    if (url.includes("/api/v1/webapp/subscription/offers")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          subscription_id: "sub-1",
          status: "active",
          valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          can_pause: true,
          can_resume: false,
          discount_percent: 20,
          offer_pause: false,
          offer_discount: true,
          offer_downgrade: false,
          reason_group: null,
        }),
      });
      return;
    }
    await route.continue();
  });
}

test.describe("Miniapp Visual Regression", () => {
  test.setTimeout(180000);

  test("spacex layout snapshots remain stable across core routes and viewports", async ({ page }) => {
    await injectTelegram(page);
    await mockApi(page);

    for (const viewport of RESPONSIVE_VIEWPORTS) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });

      for (const route of ROUTES) {
        const url =
          route.path === "/" ? "/webapp/?tgWebAppData=e2e-test" : `/webapp${route.path}?tgWebAppData=e2e-test`;
        await page.goto(url);
        await expect(page.getByText(route.readyText).first()).toBeVisible({ timeout: 15000 });
        await page.waitForTimeout(300);

        const routeId = route.path === "/" ? "home" : route.path.replaceAll("/", "-").replace(/^-/, "");
        const viewportId = viewport.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        await expect(page).toHaveScreenshot(`spacex-${routeId}-${viewportId}.png`, {
          fullPage: true,
          maxDiffPixels: 1600,
          maxDiffPixelRatio: 0.005,
        });
      }
    }
  });
});
