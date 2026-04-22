import { test, type Page } from "@playwright/test";
import {
  RESPONSIVE_ROUTES,
  RESPONSIVE_VIEWPORTS,
  assertHeaderSafe,
  assertMinimumTouchTargets,
  assertNoClippedInteractiveTargets,
  assertNoHorizontalOverflow,
  assertNoTextClipping,
  assertPrimaryCtaVisible,
  goToResponsivePath,
  injectTelegram,
  waitForResponsiveShell,
} from "./responsive-matrix";
import { installResponsiveMockApi } from "./responsive-api";

const REAL_ROUTES = RESPONSIVE_ROUTES.filter((route) => !route.path.startsWith("/mock/"));
const MOCK_ROUTES = RESPONSIVE_ROUTES.filter((route) => route.path.startsWith("/mock/pages/"));

function viewportLabel(viewport: (typeof RESPONSIVE_VIEWPORTS)[number]) {
  return `${viewport.name} (${viewport.width}x${viewport.height})`;
}

async function assertResponsiveCase(page: Page, route: (typeof RESPONSIVE_ROUTES)[number], withCtaCheck: boolean) {
  await goToResponsivePath(page, route.path);
  await waitForResponsiveShell(page);
  if (withCtaCheck) {
    await assertPrimaryCtaVisible(page, route.readyText);
  }
  await assertHeaderSafe(page);
  await assertNoHorizontalOverflow(page);
  await assertNoTextClipping(page);
  await assertNoClippedInteractiveTargets(page);
  await assertMinimumTouchTargets(page);
}

for (const viewport of RESPONSIVE_VIEWPORTS) {
  test.describe(`real routes / ${viewportLabel(viewport)}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    test.beforeEach(async ({ page }) => {
      await injectTelegram(page);
      await installResponsiveMockApi(page);
    });

    for (const route of REAL_ROUTES) {
      test(route.path, async ({ page }) => {
        await assertResponsiveCase(page, route, true);
      });
    }
  });
}

for (const viewport of RESPONSIVE_VIEWPORTS) {
  test.describe(`mock sandboxes / ${viewportLabel(viewport)}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    test.beforeEach(async ({ page }) => {
      await injectTelegram(page);
      await installResponsiveMockApi(page);
    });

    for (const route of MOCK_ROUTES) {
      test(route.path, async ({ page }) => {
        await assertResponsiveCase(page, route, false);
      });
    }
  });
}
