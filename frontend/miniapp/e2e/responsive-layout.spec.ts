import { expect, test, type Page } from "@playwright/test";

const VIEWPORT_WIDTHS = [320, 360, 390, 768, 1024] as const;
const VIEWPORT_HEIGHT = 840;

const CORE_PAGES = [
  { path: "/", ctaLabel: /Connect Now|Get config|Manage Connection/i },
  { path: "/plan", ctaLabel: /Start free trial|Get\s+\w+|Contact support/i },
  { path: "/devices", ctaLabel: /Add device/i },
  { path: "/support", ctaLabel: /Contact support/i },
  { path: "/settings", ctaLabel: /Manage devices/i },
] as const;

async function injectTelegram(page: Page) {
  await page.addInitScript(() => {
    (window as unknown as { Telegram?: { WebApp: { initData: string; ready: () => void } } }).Telegram = {
      WebApp: { initData: "e2e-test", ready: () => {} },
    };
  });
}

async function mockApi(page: Page) {
  const nowIso = new Date().toISOString();
  const validUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  await page.route("**/api/v1/webapp/telemetry", async (route) => {
    await route.fulfill({ status: 204, body: "" });
  });
  await page.route("**/api/v1/health/ready", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ status: "ok" }),
    });
  });
  await page.route("**/api/v1/webapp/auth", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ session_token: "e2e-session", expires_in: 3600 }),
    });
  });
  await page.route("**/api/v1/webapp/me", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        user: { id: 1, tg_id: 12345 },
        subscriptions: [
          {
            id: "sub-1",
            plan_id: "basic",
            status: "active",
            valid_until: validUntil,
            device_limit: 5,
            created_at: nowIso,
            updated_at: nowIso,
          },
        ],
        devices: [],
        onboarding: { completed: true, step: 2, version: 1, updated_at: nowIso },
      }),
    });
  });
  await page.route("**/api/v1/webapp/plans", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        items: [
          { id: "basic", name: "Basic", duration_days: 30, price_amount: 9, price_currency: "USD" },
          { id: "pro", name: "Pro", duration_days: 90, price_amount: 21, price_currency: "USD" },
        ],
      }),
    });
  });
  await page.route("**/api/v1/webapp/servers", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ auto_select: true, items: [] }),
    });
  });
  await page.route("**/api/v1/webapp/subscription/offers", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        subscription_id: "sub-1",
        can_pause: true,
        can_resume: false,
        discount_percent: 20,
      }),
    });
  });
}

async function goToPath(page: Page, path: string) {
  const url = path === "/" ? "./?tgWebAppData=e2e-test" : `.${path}?tgWebAppData=e2e-test`;
  await page.goto(url);
}

async function assertNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    return doc.scrollWidth - doc.clientWidth;
  });
  expect(overflow).toBeLessThanOrEqual(1);
}

async function assertNoTextClipping(page: Page) {
  const clippedCount = await page.evaluate(() => {
    const viewportWidth = window.innerWidth;
    const textNodes = document.querySelectorAll(
      ".miniapp-text-h1, .miniapp-text-h2, .miniapp-text-h3, .miniapp-text-body, .miniapp-text-caption",
    );
    let clipped = 0;
    for (const node of textNodes) {
      const el = node as HTMLElement;
      if (!el.offsetParent) continue;
      const rect = el.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) continue;
      if (rect.left < -1 || rect.right > viewportWidth + 1) clipped += 1;
    }
    return clipped;
  });
  expect(clippedCount).toBe(0);
}

async function assertPrimaryCtaVisible(page: Page, ctaLabel: RegExp) {
  const button = page.getByRole("button", { name: ctaLabel });
  const link = page.getByRole("link", { name: ctaLabel });
  const cta = button.or(link).first();
  await expect(cta).toBeVisible({ timeout: 10000 });
  const isClipped = await cta.evaluate((el) => {
    const rect = el.getBoundingClientRect();
    return rect.left < -1 || rect.right > window.innerWidth + 1 || rect.width <= 0 || rect.height <= 0;
  });
  expect(isClipped).toBeFalsy();
}

test.describe("Miniapp Responsive Layout", () => {
  test("core pages keep CTA visibility and avoid overflow across required widths", async ({ page }) => {
    await injectTelegram(page);
    await mockApi(page);

    for (const width of VIEWPORT_WIDTHS) {
      await page.setViewportSize({ width, height: VIEWPORT_HEIGHT });
      for (const pageConfig of CORE_PAGES) {
        await goToPath(page, pageConfig.path);
        await assertPrimaryCtaVisible(page, pageConfig.ctaLabel);
        await assertNoHorizontalOverflow(page);
        await assertNoTextClipping(page);
      }
    }
  });
});
