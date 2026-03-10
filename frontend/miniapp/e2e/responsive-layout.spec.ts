import { expect, test, type Page } from "@playwright/test";

const VIEWPORT_WIDTHS = [320, 360, 390, 768, 1024] as const;
const VIEWPORT_HEIGHT = 840;

const CORE_PAGES = [
  { path: "/", ctaLabel: /Manage Devices|Get Plan|Subscription/i },
  { path: "/plan", ctaLabel: /Renew plan|Upgrade Plan|Choose plan|Current Plan/i },
  { path: "/devices", ctaLabel: /Issue first device|Add device|Choose plan/i },
  { path: "/support", ctaLabel: /Contact support/i },
  { path: "/settings", ctaLabel: /Invite friends|Billing details|Pause subscription|Resume subscription/i },
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
            access_status: "enabled",
            valid_until: validUntil,
            device_limit: 5,
            created_at: nowIso,
            updated_at: nowIso,
          },
        ],
        devices: [],
        onboarding: { completed: true, step: 3, version: 2, updated_at: nowIso },
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
  await page.route("**/api/v1/webapp/payments/history", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        total: 2,
        items: [
          {
            payment_id: "pay-1",
            plan_id: "basic",
            plan_name: "Basic",
            amount: 9,
            currency: "USD",
            status: "paid",
            created_at: nowIso,
            invoice_ref: "INV-RESP-001",
          },
          {
            payment_id: "pay-2",
            plan_id: "pro",
            plan_name: "Pro",
            amount: 21,
            currency: "USD",
            status: "pending",
            created_at: nowIso,
            invoice_ref: "INV-RESP-002",
          },
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
  await page.route("**/api/v1/webapp/usage", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        range: "7d",
        points: [
          { ts: nowIso, bytes_in: 12_000_000, bytes_out: 8_500_000 },
          { ts: nowIso, bytes_in: 15_500_000, bytes_out: 9_800_000 },
        ],
      }),
    });
  });
  await page.route("**/api/v1/webapp/subscription/offers", async (route) => {
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
  });
}

async function goToPath(page: Page, path: string) {
  const url = path === "/" ? "./?tgWebAppData=e2e-test" : `.${path}?tgWebAppData=e2e-test`;
  await page.goto(url);
}

async function waitForShellReady(page: Page) {
  await page.waitForFunction(() => {
    return !document.querySelector(".splash-screen") &&
      !!document.querySelector(".miniapp-main") &&
      !!document.querySelector(".miniapp-header") &&
      !!document.querySelector(".miniapp-bottom-nav");
  }, { timeout: 10000 });
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
  const tabBoxes = await page.evaluate(() => {
    return [...document.querySelectorAll(".miniapp-bottom-nav .miniapp-tab")]
      .map((node) => {
        const el = node as HTMLElement;
        const rect = el.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) return null;
        return { width: rect.width, height: rect.height };
      })
      .filter((value): value is { width: number; height: number } => value != null);
  });
  if (tabBoxes.length === 0) return;
  for (const box of tabBoxes) {
    expect(box.height).toBeGreaterThanOrEqual(48);
    expect(box.width).toBeGreaterThanOrEqual(48);
  }
}

async function assertHeaderAndActionSafe(page: Page) {
  const headerProbe = await page.waitForFunction(() => {
    const header = document.querySelector(".miniapp-header") as HTMLElement | null;
    if (!header) return null;
    const rect = header.getBoundingClientRect();
    if (rect.height <= 0) return null;
    return { top: rect.top, height: rect.height };
  }, { timeout: 10000 });
  const headerMetrics = await headerProbe.jsonValue() as { top: number; height: number } | null;
  expect(headerMetrics).not.toBeNull();
  expect(headerMetrics.top).toBeGreaterThanOrEqual(-1);
  expect(headerMetrics.height).toBeGreaterThanOrEqual(48);

  const actionProbe = await page.waitForFunction(() => {
    const actionZone = document.querySelector(".miniapp-bottom-nav-wrap") as HTMLElement | null;
    if (!actionZone) return null;
    const rect = actionZone.getBoundingClientRect();
    if (rect.height <= 0) return null;
    return { bottom: rect.bottom, height: rect.height, viewportHeight: window.innerHeight };
  }, { timeout: 10000 }).catch(() => null);
  const actionMetrics = actionProbe
    ? await actionProbe.jsonValue() as { bottom: number; height: number; viewportHeight: number } | null
    : null;
  if (!actionMetrics) return;
  expect(actionMetrics.bottom).toBeLessThanOrEqual(actionMetrics.viewportHeight + 1);
  expect(actionMetrics.height).toBeGreaterThanOrEqual(72);
}

async function assertPrimaryCtaVisible(page: Page, ctaLabel: RegExp) {
  const ctaProbe = await page.waitForFunction(
    ({ source, flags }) => {
      const matcher = new RegExp(source, flags);
      const main = document.querySelector(".miniapp-main");
      if (!main) return null;
      for (const node of main.querySelectorAll("button,a")) {
        const el = node as HTMLElement;
        const label = el.getAttribute("aria-label") || el.textContent?.trim() || "";
        if (!matcher.test(label)) continue;
        const rect = el.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) continue;
        return {
          left: rect.left,
          right: rect.right,
          width: rect.width,
          viewportWidth: window.innerWidth,
        };
      }
      return null;
    },
    { source: ctaLabel.source, flags: ctaLabel.flags },
    { timeout: 10000 },
  );

  const ctaMetrics = await ctaProbe.jsonValue() as
    | { left: number; right: number; width: number; viewportWidth: number }
    | null;
  expect(ctaMetrics).not.toBeNull();
  expect(ctaMetrics!.left).toBeGreaterThanOrEqual(-1);
  expect(ctaMetrics!.right).toBeLessThanOrEqual(ctaMetrics!.viewportWidth + 1);
}

test.describe("Miniapp Responsive Layout", () => {
  test.setTimeout(180000);

  test("core pages keep CTA visibility and avoid overflow across required widths", async ({ page }) => {
    await injectTelegram(page);
    await mockApi(page);

    for (const width of VIEWPORT_WIDTHS) {
      await page.setViewportSize({ width, height: VIEWPORT_HEIGHT });
      for (const pageConfig of CORE_PAGES) {
        await goToPath(page, pageConfig.path);
        await waitForShellReady(page);
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
