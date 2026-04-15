import { expect, test } from "@playwright/test";

const FULL_APP_ROUTES = [
  "/mock/mirror/home",
  "/mock/mirror/onboarding",
  "/mock/mirror/setup-guide",
  "/mock/mirror/plan",
  "/mock/mirror/plan/checkout/pro-annual",
  "/mock/mirror/devices",
  "/mock/mirror/settings",
  "/mock/mirror/support",
  "/mock/mirror/connect-status",
  "/mock/mirror/restore-access",
  "/mock/mirror/referral",
] as const;

const EDGE_CASES = [
  { scenario: "no_plan", route: "/mock/mirror/home" },
  { scenario: "no_plan", route: "/mock/mirror/plan" },
  { scenario: "no_devices", route: "/mock/mirror/devices" },
  { scenario: "device_limit", route: "/mock/mirror/devices" },
  { scenario: "expired", route: "/mock/mirror/home" },
  { scenario: "expired", route: "/mock/mirror/restore-access" },
  { scenario: "faq_offline", route: "/mock/mirror/support" },
  { scenario: "faq_offline", route: "/mock/mirror/settings" },
] as const;

const SCENARIO_ROUTE_MATRIX = [
  { scenario: "default", route: "/mock/mirror/home" },
  { scenario: "default", route: "/mock/mirror/plan" },
  { scenario: "default", route: "/mock/mirror/devices" },
  { scenario: "default", route: "/mock/mirror/support" },
  { scenario: "default", route: "/mock/mirror/settings" },
  { scenario: "default", route: "/mock/mirror/restore-access" },
  { scenario: "no_plan", route: "/mock/mirror/home" },
  { scenario: "no_plan", route: "/mock/mirror/plan" },
  { scenario: "no_plan", route: "/mock/mirror/devices" },
  { scenario: "no_plan", route: "/mock/mirror/support" },
  { scenario: "expired", route: "/mock/mirror/home" },
  { scenario: "expired", route: "/mock/mirror/plan" },
  { scenario: "expired", route: "/mock/mirror/restore-access" },
  { scenario: "expired", route: "/mock/mirror/settings" },
  { scenario: "no_devices", route: "/mock/mirror/home" },
  { scenario: "no_devices", route: "/mock/mirror/devices" },
  { scenario: "no_devices", route: "/mock/mirror/connect-status" },
  { scenario: "device_limit", route: "/mock/mirror/devices" },
  { scenario: "device_limit", route: "/mock/mirror/plan" },
  { scenario: "faq_offline", route: "/mock/mirror/support" },
  { scenario: "faq_offline", route: "/mock/mirror/settings" },
] as const;

const MIRROR_NAV_LINKS = [
  { from: "/mock/mirror/home", clickText: /View setup guide/i, expect: /(?:\/webapp)?\/mock\/mirror\/setup-guide/ },
  { from: "/mock/mirror/plan", clickText: /View setup guide/i, expect: /(?:\/webapp)?\/mock\/mirror\/setup-guide/ },
  { from: "/mock/mirror/devices", clickText: /View setup guide/i, expect: /(?:\/webapp)?\/mock\/mirror\/setup-guide/ },
  { from: "/mock/mirror/settings", clickText: /View setup guide/i, expect: /(?:\/webapp)?\/mock\/mirror\/setup-guide/ },
  { from: "/mock/mirror/connect-status", clickText: /View setup guide/i, expect: /(?:\/webapp)?\/mock\/mirror\/setup-guide/ },
  { from: "/mock/mirror/referral", clickText: /View setup guide/i, expect: /(?:\/webapp)?\/mock\/mirror\/setup-guide/ },
  { from: "/mock/mirror/restore-access", clickText: /View setup guide/i, expect: /(?:\/webapp)?\/mock\/mirror\/setup-guide/ },
] as const;

const VIEWPORTS = [
  { name: "mobile-360", width: 360, height: 800 },
  { name: "mobile-430", width: 430, height: 932 },
  { name: "desktop-1280", width: 1280, height: 900 },
] as const;

test.describe("Mock Mirror Coverage", () => {
  test.setTimeout(180_000);

  test("default mirror snapshots cover all real app pages", async ({ page }) => {
    for (const viewport of VIEWPORTS) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });

      for (const route of FULL_APP_ROUTES) {
        await page.goto(`/webapp${route}`);
        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(220);

        const routeId = route.replaceAll("/", "-").replace(/^-/, "");
        await expect(page).toHaveScreenshot(`mirror-default-${routeId}-${viewport.name}.png`, {
          fullPage: true,
          maxDiffPixels: 1800,
          maxDiffPixelRatio: 0.006,
        });
      }
    }
  });

  test("edge-case snapshots cover scenario variants", async ({ page }) => {
    await page.setViewportSize({ width: 430, height: 932 });

    for (const edgeCase of EDGE_CASES) {
      await page.goto(`/webapp${edgeCase.route}?scenario=${edgeCase.scenario}`);
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(220);

      const routeId = edgeCase.route.replaceAll("/", "-").replace(/^-/, "");
      await expect(page).toHaveScreenshot(`mirror-${edgeCase.scenario}-${routeId}-mobile-430.png`, {
        fullPage: true,
        maxDiffPixels: 1800,
        maxDiffPixelRatio: 0.006,
      });
    }
  });

  test("scenario matrix snapshots cover key routes and edge states", async ({ page }) => {
    await page.setViewportSize({ width: 430, height: 932 });

    for (const item of SCENARIO_ROUTE_MATRIX) {
      const routeWithScenario =
        item.scenario === "default"
          ? `/webapp${item.route}`
          : `/webapp${item.route}?scenario=${item.scenario}`;
      await page.goto(routeWithScenario);
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(220);

      const routeId = item.route.replaceAll("/", "-").replace(/^-/, "");
      await expect(page).toHaveScreenshot(`mirror-matrix-${item.scenario}-${routeId}-mobile-430.png`, {
        fullPage: true,
        maxDiffPixels: 1800,
        maxDiffPixelRatio: 0.006,
      });
    }
  });

  test("mirror link traversal stays in mirror routes", async ({ page }) => {
    for (const linkCase of MIRROR_NAV_LINKS) {
      await page.goto(`/webapp${linkCase.from}`);
      await page.waitForLoadState("networkidle");
      await page.getByText(linkCase.clickText).first().click();
      await expect(page).toHaveURL(linkCase.expect);
    }
  });

  test("mirror navigation keeps internal paths inside /mock/mirror", async ({ page }) => {
    await page.goto("/webapp/mock/mirror/home?scenario=expired");
    await page.waitForLoadState("networkidle");

    await page.evaluate(() => {
      window.history.pushState({}, "", "/plan");
    });
    await expect(page).toHaveURL(/(?:\/webapp)?\/mock\/mirror\/plan\?scenario=expired$/);

    await page.evaluate(() => {
      window.history.replaceState({}, "", "/settings");
    });
    await expect(page).toHaveURL(/(?:\/webapp)?\/mock\/mirror\/settings\?scenario=expired$/);

    await page.evaluate(() => {
      window.history.pushState({}, "", "/support");
    });
    await expect(page).toHaveURL(/(?:\/webapp)?\/mock\/mirror\/support\?scenario=expired$/);
  });
});
