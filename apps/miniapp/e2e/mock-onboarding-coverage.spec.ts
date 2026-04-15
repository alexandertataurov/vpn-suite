import { expect, test } from "@playwright/test";

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

    await page.getByRole("button", { name: /Choose plan|Выбрать тариф/i }).first().click();
    await page.waitForTimeout(220);
    await expect(page).toHaveScreenshot("mirror-onboarding-step-install-mobile-430.png", {
      fullPage: true,
      maxDiffPixels: 1800,
      maxDiffPixelRatio: 0.006,
    });

    await page.getByRole("button", { name: /Continue|Продолжить/i }).first().click();
    await page.waitForTimeout(260);
    await expect(page).toHaveScreenshot("mirror-onboarding-step-open-vpn-mobile-430.png", {
      fullPage: true,
      maxDiffPixels: 1800,
      maxDiffPixelRatio: 0.006,
    });

    await page.getByRole("button", { name: /Open AmneziaVPN|Открыть AmneziaVPN/i }).first().click();
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

    await page.getByRole("button", { name: /Choose plan|Выбрать тариф/i }).first().click();
    await page.waitForTimeout(120);
    await page.getByRole("button", { name: /Continue|Продолжить/i }).first().click();
    await page.waitForTimeout(120);

    await page.getByRole("button", { name: /Choose plan|Выбрать тариф/i }).first().click();
    await expect(page).toHaveURL(/\/webapp\/mock\/mirror\/plan\?scenario=no_plan$/);

    await page.waitForLoadState("networkidle");
    await expect(page).toHaveScreenshot("mirror-onboarding-no-plan-redirect-plan-mobile-430.png", {
      fullPage: true,
      maxDiffPixels: 1800,
      maxDiffPixelRatio: 0.006,
    });
  });
});

