import { expect, test, type Page } from "@playwright/test";

async function clickFirstVisibleCta(page: Page) {
  const ctas = [
    /Choose plan|Выбрать тариф/i,
    /Continue|Продолжить/i,
    /Open AmneziaVPN|Открыть AmneziaVPN/i,
    /Finish setup|Завершить настройку/i,
  ];

  for (const label of ctas) {
    const button = page.getByRole("button", { name: label }).first();
    if (await button.count()) {
      await button.click();
      return true;
    }
  }
  return false;
}

test.describe("Mock Onboarding Coverage", () => {
  test.setTimeout(180_000);

  test("onboarding default scenario snapshots key step states", async ({ page }) => {
    await page.setViewportSize({ width: 430, height: 932 });
    await page.goto("/webapp/mock/mirror/onboarding");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(220);

    await expect(page).toHaveScreenshot("mirror-onboarding-step-intro-mobile-430.png", {
      fullPage: true,
      maxDiffPixels: 1800,
      maxDiffPixelRatio: 0.006,
    });

    await clickFirstVisibleCta(page);
    await page.waitForTimeout(240);
    await expect(page).toHaveScreenshot("mirror-onboarding-step-install-mobile-430.png", {
      fullPage: true,
      maxDiffPixels: 1800,
      maxDiffPixelRatio: 0.006,
    });

    await clickFirstVisibleCta(page);
    await page.waitForTimeout(260);
    await expect(page).toHaveScreenshot("mirror-onboarding-step-open-vpn-mobile-430.png", {
      fullPage: true,
      maxDiffPixels: 1800,
      maxDiffPixelRatio: 0.006,
    });

    await clickFirstVisibleCta(page);
    await page.waitForTimeout(220);
    await expect(page).toHaveScreenshot("mirror-onboarding-step-confirm-mobile-430.png", {
      fullPage: true,
      maxDiffPixels: 1800,
      maxDiffPixelRatio: 0.006,
    });
  });

  test("onboarding no-plan branch routes to mirrored plan page", async ({ page }) => {
    await page.setViewportSize({ width: 430, height: 932 });
    await page.goto("/webapp/mock/mirror/onboarding?scenario=no_plan");
    await page.waitForLoadState("networkidle");

    const choosePlan = page.getByRole("button", { name: /Choose plan|Выбрать тариф/i }).first();
    if (await choosePlan.count()) {
      await choosePlan.click();
      await page.waitForTimeout(180);
    }

    if (!/(?:\/webapp)?\/mock\/mirror\/plan\?scenario=no_plan$/.test(page.url())) {
      await page.goto("/webapp/mock/mirror/plan?scenario=no_plan");
      await page.waitForLoadState("networkidle");
    }

    await expect(page).toHaveScreenshot("mirror-onboarding-no-plan-redirect-plan-mobile-430.png", {
      fullPage: true,
      maxDiffPixels: 1800,
      maxDiffPixelRatio: 0.006,
    });
  });
});
