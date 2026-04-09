import { test, expect } from "@playwright/test";
import {
  createDevice,
  createPlan,
  createSession,
  gotoMiniapp,
  injectTelegram,
  setupMiniappApi,
} from "./helpers/miniapp";

test.describe("Miniapp business flows", () => {
  test("bootstrap re-authenticates after an expired session", async ({ page }) => {
    await injectTelegram(page);
    const api = await setupMiniappApi(page, {
      session: createSession({ routing: { recommended_route: "/", reason: "connected_user" } }),
      meReplies: [
        { status: 401, body: { code: "UNAUTHORIZED", message: "expired" } },
        { status: 200, body: createSession({ routing: { recommended_route: "/", reason: "connected_user" } }) },
      ],
    });

    await gotoMiniapp(page, "/");

    await expect(page.getByText(/Quick Access/i)).toBeVisible({ timeout: 10000 });
    await expect.poll(() => api.requests.auth.length).toBeGreaterThan(1);
  });

  test("restore access reaches checkout", async ({ page }) => {
    await injectTelegram(page);
    await setupMiniappApi(page, {
      session: createSession({
        subscriptions: [
          {
            id: "sub-expired",
            plan_id: "plan-restore",
            status: "expired",
            access_status: "grace",
            valid_until: "2025-01-01T00:00:00Z",
            device_limit: 1,
          },
        ],
        routing: { recommended_route: "/restore-access", reason: "expired_with_grace" },
      }),
      plans: { items: [createPlan({ id: "plan-restore", name: "Restore", price_amount: 199 })] },
      restoreReplies: [
        {
          status: 200,
          body: {
            status: "restored",
            plan_id: "plan-restore",
            redirect_to: "/plan/checkout/plan-restore",
          },
        },
      ],
    });

    await gotoMiniapp(page, "/restore-access");

    await page.getByRole("button", { name: /Restore access/i }).click();
    await expect(page).toHaveURL(/\/plan\/checkout\/plan-restore$/);
    await expect(page.getByRole("heading", { name: /Checkout/i })).toBeVisible();
  });

  test("devices flow handles issue, replace, confirm, and revoke", async ({ page }) => {
    await injectTelegram(page);
    const api = await setupMiniappApi(page, {
      session: createSession({
        subscriptions: [
          {
            id: "sub-pro",
            plan_id: "plan-pro",
            status: "active",
            access_status: "enabled",
            valid_until: "2030-05-01T00:00:00Z",
            device_limit: 3,
            auto_renew: true,
          },
        ],
        routing: { recommended_route: "/devices", reason: "no_device" },
      }),
      plans: {
        items: [
          createPlan({ id: "plan-pro", name: "Pro", device_limit: 3, price_amount: 499 }),
          createPlan({ id: "plan-max", name: "Max", device_limit: 5, price_amount: 699 }),
        ],
      },
    });

    await gotoMiniapp(page, "/devices");

    await expect(page.getByText(/No devices yet/i)).toBeVisible({ timeout: 10000 });
    await page.getByRole("button", { name: /^Add device$/i }).click();
    await expect(page.getByText(/^Config$/i)).toBeVisible();
    await expect(page.locator("pre.config-block")).toContainText("[Interface]");

    await page.getByRole("button", { name: /Device actions/i }).click();
    await page.getByRole("menuitem", { name: /Replace config/i }).click();

    await page.getByRole("button", { name: /Device actions/i }).click();
    await page.getByRole("menuitem", { name: /Confirm setup/i }).click();

    await page.getByRole("button", { name: /Device actions/i }).click();
    await page.getByRole("menuitem", { name: /Revoke device/i }).click();
    await page.locator("button", { hasText: "Revoke device" }).last().click({ force: true });

    await expect.poll(() => api.requests.devices.map((entry) => entry.path)).toEqual([
      "/api/v1/webapp/devices/issue",
      "/api/v1/webapp/devices/device-1/replace-with-new",
      "/api/v1/webapp/devices/device-1/confirm-connected",
      "/api/v1/webapp/devices/device-1/revoke",
    ]);
  });

  test("device limit shows upsell copy when issue is blocked", async ({ page }) => {
    await injectTelegram(page);
    await setupMiniappApi(page, {
      session: createSession({
        subscriptions: [
          {
            id: "sub-basic",
            plan_id: "plan-basic",
            status: "active",
            access_status: "enabled",
            valid_until: "2030-05-01T00:00:00Z",
            device_limit: 1,
            auto_renew: true,
          },
        ],
        devices: [createDevice({ id: "device-at-limit", status: "connected" })],
        routing: { recommended_route: "/devices", reason: "connected_user" },
      }),
      plans: {
        items: [
          createPlan({ id: "plan-basic", name: "Basic", device_limit: 1, price_amount: 199, upsell_methods: ["device_limit"] }),
          createPlan({ id: "plan-plus", name: "Plus", device_limit: 3, price_amount: 399 }),
        ],
      },
      issueDeviceReplies: [
        { status: 400, body: { code: "DEVICE_LIMIT", message: "device limit reached" } },
      ],
    });

    await gotoMiniapp(page, "/devices");

    await expect(page.getByText(/Device limit reached/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole("link", { name: /Upgrade plan/i })).toBeVisible();
  });

  test("server routing switches to manual and back to auto", async ({ page }) => {
    await injectTelegram(page);
    const api = await setupMiniappApi(page, {
      session: createSession({
        devices: [createDevice({ status: "connected" })],
        routing: { recommended_route: "/", reason: "connected_user" },
      }),
    });

    await gotoMiniapp(page, "/servers");

    await expect(page.getByRole("heading", { name: /Servers/i })).toBeVisible({ timeout: 10000 });
    await page.getByRole("button", { name: /^Select$/i }).click();
    await expect(page.getByText(/Manual server preference is enabled/i)).toBeVisible();

    expect(api.requests.serverSelect[0]?.body).toEqual({ server_id: "srv-de", mode: "manual" });

    await page.getByRole("button", { name: /Use best server/i }).click();
    expect(api.requests.serverSelect[1]?.body).toEqual({ mode: "auto" });
    await expect(page.getByText(/Automatic server selection is enabled/i)).toBeVisible();
  });

  test("referral attach retries once from deep link and clears pending storage", async ({ page }) => {
    await injectTelegram(page, { startParam: "ref_CODE777" });
    const api = await setupMiniappApi(page, {
      session: createSession({
        subscriptions: [
          {
            id: "sub-plus",
            plan_id: "plan-plus",
            status: "active",
            access_status: "enabled",
            valid_until: "2030-05-01T00:00:00Z",
            device_limit: 2,
            auto_renew: true,
          },
        ],
      }),
      plans: { items: [createPlan({ id: "plan-plus", name: "Plus", device_limit: 2, price_amount: 399 })] },
      referralAttachReplies: [
        { status: 500, body: { code: "TEMPORARY", message: "retry" } },
        { status: 200, body: { status: "attached", attached: true, referrer_user_id: 77 } },
      ],
    });

    await gotoMiniapp(page, "/referral", "tgWebAppStartParam=ref_CODE777");

    await expect(page.getByText(/Read-only beta/i)).toBeVisible({ timeout: 10000 });
    await expect.poll(() => api.requests.referralAttach.length).toBe(2);
    await expect(page.getByText(/https:\/\/t\.me\/vpn_suite_bot\?startapp=ref_ABC123/i)).toBeVisible();

    const pending = await page.evaluate(() => ({
      code: sessionStorage.getItem("pending_referral_code"),
      source: sessionStorage.getItem("pending_referral_source"),
    }));
    expect(pending).toEqual({ code: null, source: null });
  });

  test("support troubleshooter and settings retention flows work end-to-end", async ({ page }) => {
    await injectTelegram(page);
    const api = await setupMiniappApi(page, {
      session: createSession({
        devices: [createDevice({ id: "device-settings", status: "connected" })],
        routing: { recommended_route: "/", reason: "connected_user" },
      }),
    });

    await gotoMiniapp(page, "/support");

    await expect(page.getByText(/Check access status/i)).toBeVisible({ timeout: 10000 });
    await page.getByRole("button", { name: /No, choose plan/i }).click();
    await expect(page).toHaveURL(/\/plan$/);

    await gotoMiniapp(page, "/settings");

    await page.getByLabel(/Profile/i).click();
    await page.getByLabel(/Display name/i).fill("Alex Doe");
    await page.getByLabel(/^Email$/i).fill("alex.doe@example.com");
    await page.getByLabel(/^Phone$/i).fill("+12025550199");
    await page.getByRole("button", { name: /Save profile/i }).click();
    await expect.poll(() => api.requests.profile.length).toBe(1);

    await page.getByRole("button", { name: /Pause subscription/i }).click();
    await expect(page.getByRole("button", { name: /Resume subscription/i })).toBeVisible();

    await page.getByRole("button", { name: /Cancel subscription/i }).click();
    await page.locator("button", { hasText: "Pause instead" }).last().click({ force: true });

    expect(api.requests.profile[0]?.body).toMatchObject({
      display_name: "Alex Doe",
      email: "alex.doe@example.com",
      phone: "+12025550199",
    });
    expect(api.requests.subscription.some((entry) => entry.path === "/api/v1/webapp/subscription/pause")).toBeTruthy();
    expect(api.requests.subscription.some((entry) => entry.path === "/api/v1/webapp/subscription/cancel")).toBeTruthy();
  });
});
