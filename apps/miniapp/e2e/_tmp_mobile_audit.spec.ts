import { test, expect } from "@playwright/test";

const PAGES = [
  "/mock/pages/home",
  "/mock/pages/plan",
  "/mock/pages/devices",
  "/mock/pages/settings",
  "/mock/pages/support",
  "/mock/pages/checkout",
  "/mock/pages/onboarding",
  "/mock/pages/setup-guide",
  "/mock/pages/connect-status",
  "/mock/pages/restore-access",
  "/mock/pages/referral",
];

for (const width of [320, 390]) {
  test(`mobile audit width ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    for (const route of PAGES) {
      await page.goto(`.${route}`);
      await page.waitForTimeout(150);
      const issues = await page.evaluate(() => {
        const viewportWidth = window.innerWidth;
        const doc = document.documentElement;
        const overflow = doc.scrollWidth - doc.clientWidth;
        const offenders: string[] = [];
        const all = Array.from(document.querySelectorAll<HTMLElement>("body *"));
        for (const el of all) {
          const style = window.getComputedStyle(el);
          if (style.display === "none" || style.visibility === "hidden") continue;
          const rect = el.getBoundingClientRect();
          if (rect.width <= 0 || rect.height <= 0) continue;
          if (rect.left < -2 || rect.right > viewportWidth + 2) {
            const cls = (el.className || "").toString().trim().split(/\s+/).slice(0, 2).join(".");
            offenders.push(`${el.tagName.toLowerCase()}${cls ? "." + cls : ""}`);
            if (offenders.length >= 8) break;
          }
        }
        return { overflow, offenders };
      });
      expect.soft(issues.overflow, `${route} overflow`).toBeLessThanOrEqual(1);
      expect.soft(issues.offenders.length, `${route} offenders: ${issues.offenders.join(", ")}`).toBe(0);
    }
  });
}
