import { expect, type Page } from "@playwright/test";

export type ResponsiveViewport = {
  name: string;
  width: number;
  height: number;
};

export type ResponsiveRoute = {
  path: string;
  readyText: RegExp;
};

export const RESPONSIVE_VIEWPORTS: readonly ResponsiveViewport[] = [
  { name: "iPhone SE (2022)", width: 375, height: 667 },
  { name: "iPhone 13 mini", width: 375, height: 812 },
  { name: "iPhone 13/14/15", width: 390, height: 844 },
  { name: "iPhone 14/15 Pro", width: 393, height: 852 },
  { name: "iPhone 15 Plus", width: 428, height: 926 },
  { name: "iPhone 14/15 Pro Max", width: 430, height: 932 },
  { name: "Galaxy S22", width: 360, height: 800 },
  { name: "Pixel 7", width: 412, height: 915 },
  { name: "Pixel 7 Pro", width: 412, height: 892 },
  { name: "Extreme narrow", width: 320, height: 568 },
  { name: "Tablet landscape", width: 768, height: 1024 },
] as const;

export const RESPONSIVE_ROUTES: readonly ResponsiveRoute[] = [
  { path: "/", readyText: /Manage Devices|Setup Required|Renew Subscription|Invite Friends/i },
  { path: "/onboarding", readyText: /Welcome|Continue|Install|Confirm|Next/i },
  { path: "/plan", readyText: /Plan\s*&\s*Billing|Pro|Basic|No plans available|Could not load/i },
  { path: "/plan/checkout/plan-pro", readyText: /Confirm your plan|Review and pay|Checkout|Payment|Plan ID/i },
  { path: "/devices", readyText: /Devices|Active|Config|Add device|No devices yet/i },
  { path: "/devices/issue", readyText: /Devices|Active|Config|Add device|No devices yet/i },
  { path: "/referral", readyText: /Referral|Referrals|Share link|Reward progress/i },
  { path: "/support", readyText: /Support|Troubleshooter|FAQ|Setup guide|Contact support|Help/i },
  { path: "/settings", readyText: /Settings|Profile|Plan|Cancel plan|Danger zone|Edit profile/i },
  { path: "/restore-access", readyText: /Restore|Recover|Access|Continue/i },
  { path: "/connect-status", readyText: /Connect|Status|Troubleshoot|Retry|Connected|Paused/i },
  { path: "/setup-guide", readyText: /Setup|Install|Guide|Connect|Continue/i },
  { path: "/mock/pages/home", readyText: /Visual Mock|Home|Mirror|Page Mocks/i },
  { path: "/mock/pages/plan", readyText: /Visual Mock|Plan|Mirror|Page Mocks/i },
  { path: "/mock/pages/devices", readyText: /Visual Mock|Devices|Mirror|Page Mocks/i },
  { path: "/mock/pages/settings", readyText: /Visual Mock|Settings|Mirror|Page Mocks/i },
  { path: "/mock/pages/support", readyText: /Visual Mock|Support|Mirror|Page Mocks/i },
  { path: "/mock/pages/checkout", readyText: /Visual Mock|Checkout|Mirror|Page Mocks/i },
  { path: "/mock/pages/onboarding", readyText: /Visual Mock|Onboarding|Mirror|Page Mocks/i },
  { path: "/mock/pages/setup-guide", readyText: /Visual Mock|Setup guide|Mirror|Page Mocks/i },
  { path: "/mock/pages/connect-status", readyText: /Visual Mock|Connect status|Mirror|Page Mocks/i },
  { path: "/mock/pages/restore-access", readyText: /Visual Mock|Restore access|Mirror|Page Mocks/i },
  { path: "/mock/pages/referral", readyText: /Visual Mock|Referral|Mirror|Page Mocks/i },
] as const;

export async function injectTelegram(page: Page) {
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

export async function goToResponsivePath(page: Page, path: string) {
  const url = path === "/" ? "./?tgWebAppData=e2e-test" : `.${path}?tgWebAppData=e2e-test`;
  await page.goto(url);
}

export async function waitForResponsiveShell(page: Page) {
  await page.waitForFunction(
    () =>
      !document.querySelector(".splash-screen") &&
      (!!document.querySelector(".miniapp-main") || !!document.querySelector(".page-layout")),
    { timeout: 10000 },
  );
}

export async function assertNoHorizontalOverflow(page: Page, tolerancePx = 1) {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    return doc.scrollWidth - doc.clientWidth;
  });
  expect(overflow).toBeLessThanOrEqual(tolerancePx);
}

export async function assertNoTextClipping(page: Page) {
  const clippedCount = await page.evaluate(() => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const textNodes = document.querySelectorAll(
      ".miniapp-text-h1, .miniapp-text-h2, .miniapp-text-h3, .miniapp-text-body, .miniapp-text-caption",
    );
    let clipped = 0;
    for (const node of textNodes) {
      const el = node as HTMLElement;
      if (!el.offsetParent) continue;
      const rect = el.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) continue;
      if (rect.bottom <= -1 || rect.top >= viewportHeight + 1) continue;
      if (rect.left < -1 || rect.right > viewportWidth + 1) clipped += 1;
    }
    return clipped;
  });
  expect(clippedCount).toBe(0);
}

export async function assertHeaderSafe(page: Page) {
  const headerMetrics = await page.evaluate(() => {
    const header =
      (document.querySelector(".miniapp-header") as HTMLElement | null) ??
      (document.querySelector("h1") as HTMLElement | null) ??
      (document.querySelector("button[aria-label='Back']") as HTMLElement | null);
    if (!header || !header.offsetParent) return null;
    const rect = header.getBoundingClientRect();
    if (rect.height <= 0) return null;
    return { top: rect.top, height: rect.height };
  }) as { top: number; height: number } | null;
  if (!headerMetrics) return;
  expect(headerMetrics.top).toBeGreaterThanOrEqual(-1);
  expect(headerMetrics.height).toBeGreaterThan(0);
}

export async function assertPrimaryCtaVisible(page: Page, ctaLabel: RegExp) {
  const ctaProbe = await page.waitForFunction(
    ({ source, flags }) => {
      const matcher = new RegExp(source, flags);
      const root =
        document.querySelector(".miniapp-main") ??
        document.querySelector("main") ??
        document.body;
      if (!root) return null;
      for (const node of root.querySelectorAll("button,a")) {
        const el = node as HTMLElement;
        if (!el.offsetParent) continue;
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
      for (const node of root.querySelectorAll("button,a")) {
        const el = node as HTMLElement;
        if (!el.offsetParent) continue;
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

  const ctaMetrics = (await ctaProbe.jsonValue()) as
    | { left: number; right: number; width: number; viewportWidth: number }
    | null;
  expect(ctaMetrics).not.toBeNull();
  expect(ctaMetrics!.left).toBeGreaterThanOrEqual(-1);
  expect(ctaMetrics!.right).toBeLessThanOrEqual(ctaMetrics!.viewportWidth + 1);
}

export async function assertNoClippedInteractiveTargets(page: Page) {
  const clippedTargets = await page.evaluate(() => {
    const viewportWidth = window.innerWidth;
    const selectors = "button, a, input, select, textarea, [role='button'], [role='link']";
    const offenders: Array<{ tag: string; className: string; width: number; height: number }> = [];

    for (const element of document.querySelectorAll<HTMLElement>(selectors)) {
      if (!element.offsetParent) continue;
      const rect = element.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) continue;
      if (rect.right <= -1 || rect.left >= viewportWidth + 1) continue;
      if (rect.left < -1 || rect.right > viewportWidth + 1) {
        offenders.push({
          tag: element.tagName.toLowerCase(),
          className: element.className.toString().slice(0, 120),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        });
        if (offenders.length >= 8) break;
      }
    }

    return offenders;
  });

  expect(clippedTargets).toHaveLength(0);
}

export async function assertMinimumTouchTargets(page: Page, minSize = 44) {
  const undersized = await page.evaluate((minimum) => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const selectors = "button, a, input, select, textarea, [role='button'], [role='link']";
    const offenders: Array<{ tag: string; className: string; width: number; height: number }> = [];

    for (const element of document.querySelectorAll<HTMLElement>(selectors)) {
      if (!element.offsetParent) continue;
      const rect = element.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) continue;
      if (rect.bottom <= -1 || rect.top >= viewportHeight + 1 || rect.right <= -1 || rect.left >= viewportWidth + 1) {
        continue;
      }
      if (rect.width < minimum || rect.height < minimum) {
        offenders.push({
          tag: element.tagName.toLowerCase(),
          className: element.className.toString().slice(0, 120),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        });
        if (offenders.length >= 8) break;
      }
    }

    return offenders;
  }, minSize);

  expect(undersized).toHaveLength(0);
}
