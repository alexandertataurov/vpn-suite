import { test, expect } from "@playwright/test";
import { createDevice, createSession, gotoMiniapp, injectTelegram, setupMiniappApi } from "./helpers/miniapp";

test.describe("Miniapp Home", () => {
  test("home screen loads and shows quick access actions", async ({ page }) => {
    await injectTelegram(page);
    await setupMiniappApi(page, {
      session: createSession({
        devices: [createDevice({ status: "connected" })],
        routing: { recommended_route: "/", reason: "connected_user" },
      }),
    });

    await gotoMiniapp(page, "/");

    await expect(page.getByText(/Quick Access/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole("link", { name: "Devices", exact: true }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Change server/i })).toBeVisible();
  });
});
