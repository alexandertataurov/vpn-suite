import { expect, test, type Page } from "@playwright/test";

const VIEWPORT_WIDTHS = [320, 360, 390, 768, 1024] as const;
const VIEWPORT_HEIGHT = 840;

const CORE_PAGES = [
  { path: "/", ctaLabel: /Connect Now|Get config|Manage Connection/i },
  { path: "/plan", ctaLabel: /Start free trial|Select plan|Current|Contact support/i },
  { path: "/devices", ctaLabel: /Add device/i },
  { path: "/support", ctaLabel: /Contact support/i },
  { path: "/settings", ctaLabel: /Manage devices/i },
] as const;

async function injectTelegram(page: Page) {
  await page.addInitScript(() => {
    const events = new Map<string, Set<() => void>>();
    (window as unknown as { __tgVerticalSwipesDisabled?: number }).__tgVerticalSwipesDisabled = 0;
    (window as unknown as { Telegram?: { WebApp: { initData: string; ready: () => void; expand: () => void; disableVerticalSwipes: () => void; onEvent: (event: string, cb: () => void) => void; offEvent: (event: string, cb: () => void) => void } } }).Telegram = {
      WebApp: {
        initData: "e2e-test",
        ready: () => {},
        expand: () => {},
        disableVerticalSwipes: () => {
          (window as unknown as { __tgVerticalSwipesDisabled?: number }).__tgVerticalSwipesDisabled =
            ((window as unknown as { __tgVerticalSwipesDisabled?: number }).__tgVerticalSwipesDisabled ?? 0) + 1;
        },
        onEvent: (event: string, cb: () => void) => {
          if (!events.has(event)) events.set(event, new Set());
          events.get(event)?.add(cb);
        },
        offEvent: (event: string, cb: () => void) => {
          events.get(event)?.delete(cb);
        },
      },
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

async function assertBottomTabsTapTarget(page: Page) {
  const tabs = page.locator(".miniapp-bottom-nav .miniapp-tab");
  const count = await tabs.count();
  if (count === 0) return;
  for (let index = 0; index < count; index += 1) {
    const tab = tabs.nth(index);
    const box = await tab.boundingBox();
    expect(box).toBeTruthy();
    expect(box!.height).toBeGreaterThanOrEqual(48);
    expect(box!.width).toBeGreaterThanOrEqual(48);
  }
}

async function assertHeaderAndActionSafe(page: Page) {
  const header = page.locator(".miniapp-header");
  await expect(header).toBeVisible();
  const headerMetrics = await header.evaluate((el) => {
    const rect = el.getBoundingClientRect();
    return { top: rect.top, height: rect.height };
  });
  expect(headerMetrics.top).toBeGreaterThanOrEqual(-1);
  expect(headerMetrics.height).toBeGreaterThanOrEqual(56);

  const actionZone = page.locator(".miniapp-bottom-nav-wrap");
  const actionCount = await actionZone.count();
  if (actionCount === 0) return;
  await expect(actionZone).toBeVisible();
  const actionMetrics = await actionZone.first().evaluate((el) => {
    const rect = el.getBoundingClientRect();
    return { bottom: rect.bottom, height: rect.height, viewportHeight: window.innerHeight };
  });
  expect(actionMetrics.bottom).toBeLessThanOrEqual(actionMetrics.viewportHeight + 1);
  expect(actionMetrics.height).toBeGreaterThanOrEqual(72);
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
        await assertBottomTabsTapTarget(page);
        await assertHeaderAndActionSafe(page);
        await assertNoHorizontalOverflow(page);
        await assertNoTextClipping(page);
      }
    }
  });

  test("pull gesture keeps route stable and does not trigger close-like navigation", async ({ page }) => {
    await injectTelegram(page);
    await mockApi(page);
    await page.setViewportSize({ width: 390, height: VIEWPORT_HEIGHT });
    await goToPath(page, "/");

    const hasTouchApi = await page.evaluate(
      () => typeof Touch === "function" && typeof TouchEvent === "function",
    );
    test.skip(!hasTouchApi, "Touch API unavailable for desktop profile");

    const beforePath = new URL(page.url()).pathname;
    await page.evaluate(() => {
      const scrollNode = document.querySelector(".miniapp-main");
      if (!(scrollNode instanceof HTMLElement)) return;
      scrollNode.scrollTop = 0;
      const makeTouch = (y: number) =>
        new Touch({
          identifier: 1,
          target: scrollNode,
          clientX: 24,
          clientY: y,
          pageX: 24,
          pageY: y,
          screenX: 24,
          screenY: y,
          radiusX: 2,
          radiusY: 2,
          rotationAngle: 0,
          force: 1,
        });
      const start = makeTouch(40);
      const move = makeTouch(170);

      scrollNode.dispatchEvent(
        new TouchEvent("touchstart", {
          touches: [start],
          targetTouches: [start],
          changedTouches: [start],
          bubbles: true,
          cancelable: true,
        }),
      );
      scrollNode.dispatchEvent(
        new TouchEvent("touchmove", {
          touches: [move],
          targetTouches: [move],
          changedTouches: [move],
          bubbles: true,
          cancelable: true,
        }),
      );
      scrollNode.dispatchEvent(
        new TouchEvent("touchend", {
          touches: [],
          targetTouches: [],
          changedTouches: [move],
          bubbles: true,
          cancelable: true,
        }),
      );
    });

    const afterPath = new URL(page.url()).pathname;
    expect(afterPath).toBe(beforePath);
  });
});
