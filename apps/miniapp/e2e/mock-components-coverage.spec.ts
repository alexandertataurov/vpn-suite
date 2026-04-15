import { expect, test } from "@playwright/test";

const COMPONENT_ROUTES = [
  "/mock/components/buttons",
  "/mock/components/forms",
  "/mock/components/feedback",
  "/mock/components/cards",
] as const;

const VIEWPORTS = [
  { name: "mobile-360", width: 360, height: 800 },
  { name: "mobile-430", width: 430, height: 932 },
  { name: "desktop-1280", width: 1280, height: 900 },
] as const;

test.describe("Mock Components Coverage", () => {
  test.setTimeout(180_000);

  test("component pages render consistently across viewports", async ({ page }) => {
    for (const viewport of VIEWPORTS) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });

      for (const route of COMPONENT_ROUTES) {
        await page.goto(`/webapp${route}`);
        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(220);

        const routeId = route.replaceAll("/", "-").replace(/^-/, "");
        await expect(page).toHaveScreenshot(`mock-components-${routeId}-${viewport.name}.png`, {
          fullPage: true,
          maxDiffPixels: 1800,
          maxDiffPixelRatio: 0.006,
        });
      }
    }
  });

  test("forms component page covers interactive states", async ({ page }) => {
    await page.setViewportSize({ width: 430, height: 932 });
    await page.goto("/webapp/mock/components/forms");
    await page.waitForLoadState("networkidle");

    await page.getByLabel("Display name").fill("Alex Tester");
    await page.getByLabel("Email").fill("alex@example.com");
    await page.getByLabel("Phone").fill("+1 415 555 0100");
    await page.getByLabel("Support message").fill("Need help with config import flow.");
    await page.getByLabel("I agree to Terms").check();
    await page.getByRole("switch", { name: /Notifications/i }).click();

    const planTier = page.getByLabel("Plan tier");
    if (await planTier.count()) {
      await planTier.selectOption("starter");
    }

    await page.waitForTimeout(150);
    await expect(page).toHaveScreenshot("mock-components-forms-interactive-mobile-430.png", {
      fullPage: true,
      maxDiffPixels: 1800,
      maxDiffPixelRatio: 0.006,
    });
  });

  test("mock index routes to every component page", async ({ page }) => {
    await page.goto("/webapp/mock");
    await page.waitForLoadState("networkidle");

    await page.getByRole("button", { name: "Buttons" }).first().click();
    await expect(page).toHaveURL(/\/webapp\/mock\/components\/buttons$/);

    await page.getByRole("button", { name: "Forms" }).first().click();
    await expect(page).toHaveURL(/\/webapp\/mock\/components\/forms$/);

    await page.getByRole("button", { name: "Feedback" }).first().click();
    await expect(page).toHaveURL(/\/webapp\/mock\/components\/feedback$/);

    await page.getByRole("button", { name: "Cards" }).first().click();
    await expect(page).toHaveURL(/\/webapp\/mock\/components\/cards$/);
  });
});

