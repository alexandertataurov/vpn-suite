import { test, expect } from "@playwright/test";
import { createDevice, createSession, gotoMiniapp, injectTelegram, setupMiniappApi } from "./helpers/miniapp";

test.describe("Miniapp Home", () => {
  test("home screen loads and shows access summary with device management", async ({ page }) => {
    await injectTelegram(page);
    await setupMiniappApi(page, {
      session: createSession({
        devices: [createDevice({ status: "connected" })],
        latest_device_delivery: {
          device_id: "device-1",
          device_name: "iPhone 15",
          issued_at: "2030-01-10T10:00:00.000Z",
          amnezia_vpn_key: "vpn://test-amnezia-key",
        },
        routing: { recommended_route: "/", reason: "connected_user" },
      }),
    });

    await gotoMiniapp(page, "/");

    await expect(page.getByText(/Access is ready/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole("button", { name: "Open AmneziaVPN" })).toBeVisible();
    await expect(page.getByText(/Your devices/i)).toBeVisible();
    await expect(page.getByText(/Share beta access/i)).toBeVisible();
  });
});
