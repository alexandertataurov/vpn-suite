import { test, expect } from "@playwright/test";
import { login } from "./helpers";

test.describe("Servers", () => {
  test.beforeEach(async ({ page, request }) => {
    const ok = await login(page, request);
    test.skip(!ok, "Skipping authenticated flow: valid admin credentials or auth API unavailable.");
  });
  test("servers list loads", async ({ page }) => {
    await page.goto("servers");
    // SPA pages may keep polling; "networkidle" can hang indefinitely.
    await page.waitForLoadState("domcontentloaded");
    await expect(page.getByRole("heading", { name: /Servers/i })).toBeVisible({ timeout: 10000 });
    // Page may render either an empty state, a table, or an error state; verify it's not stuck loading.
    await expect(page.locator("main")).toBeVisible({ timeout: 8000 });
  });

  test("navigate to new server and back", async ({ page }) => {
    await page.goto("servers");
    await page.waitForLoadState("domcontentloaded");
    const serversPage = page.getByTestId("servers-page");
    const addServerLink = serversPage.getByRole("link", { name: /^Add Server$/i });
    await expect(addServerLink).toBeVisible({ timeout: 10000 });
    await expect(addServerLink).toHaveAttribute("href", /\/servers\/new$/);

    await page.goto("servers/new");
    await page.waitForLoadState("domcontentloaded");
    const serverNewPage = page.getByTestId("server-new-page");
    await expect(serverNewPage).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole("heading", { name: /Add Server/i })).toBeVisible({ timeout: 10000 });

    await serverNewPage.getByRole("link", { name: /^Cancel$/i }).click();
    await expect(page).toHaveURL(/\/servers$/, { timeout: 15000 });
  });

  test("servers page shows table or empty state; when table present, Sync and Telemetry columns exist", async ({
    page,
  }) => {
    await page.goto("servers");
    await page.waitForLoadState("domcontentloaded");
    const serversPage = page.getByTestId("servers-page");
    await expect(serversPage).toBeVisible({ timeout: 10000 });
    // Wait for content: either empty state or servers table
    const table = page.getByTestId("servers-table");
    const emptyState = page.getByTestId("servers-empty");
    await expect(table.or(emptyState)).toBeVisible({ timeout: 15000 });
    if (await table.isVisible()) {
      await expect(page.getByRole("button", { name: /Sync from node/i }).first()).toBeVisible({
        timeout: 5000,
      });
      await expect(page.getByRole("columnheader", { name: /Telemetry/i })).toBeVisible();
    }
  });

  test("delete server: menu item opens confirmation modal; cancel closes", async ({ page }) => {
    await page.goto("servers");
    await page.waitForLoadState("domcontentloaded");
    const moreBtn = page.getByRole("button", { name: /More actions/i }).first();
    if (!(await moreBtn.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip(true, "No servers: cannot open row menu");
      return;
    }
    await moreBtn.click();
    const deleteItem = page.getByRole("menuitem", { name: /Delete/i });
    await expect(deleteItem).toBeVisible({ timeout: 3000 });
    await deleteItem.click();
    await expect(page.getByRole("dialog", { name: /Delete server/i })).toBeVisible({ timeout: 3000 });
    await expect(page.getByText(/Type.*to confirm/i)).toBeVisible({ timeout: 2000 });
    await page.getByRole("button", { name: /Cancel/i }).click();
    await expect(page.getByRole("dialog", { name: /Delete server/i })).not.toBeVisible();
  });

  test("delete server: full flow with mocked 204 shows success toast and closes modal", async ({ page }) => {
    const serverId = "mock-delete-server";
    const serverName = "ToDeleteServer";
    const items = [
      {
        id: serverId,
        name: serverName,
        region: "us-east",
        api_endpoint: "https://example.com",
        vpn_endpoint: null,
        public_key: null,
        status: "online",
        is_active: true,
        created_at: new Date().toISOString(),
        last_seen_at: new Date().toISOString(),
      },
    ];
    await page.route(/\/api\/v1\/servers(\?|$)/, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ items, total: 1 }),
      })
    );
    await page.route(`**/api/v1/servers/${serverId}`, async (route) => {
      if (route.request().method() === "DELETE") {
        await route.fulfill({ status: 204 });
      } else {
        await route.continue();
      }
    });
    await page.route("**/api/v1/servers/telemetry/summary*", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ servers: {} }) })
    );
    await page.route("**/api/v1/servers/snapshots/summary*", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ servers: {} }) })
    );
    await page.route("**/api/v1/servers/device-counts*", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ counts: {} }) })
    );
    await page.goto("servers");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.getByText(serverName)).toBeVisible({ timeout: 10000 });
    const moreBtn = page.getByRole("button", { name: /More actions/i }).first();
    await moreBtn.click();
    await page.getByRole("menuitem", { name: /Delete/i }).click();
    await expect(page.getByRole("dialog", { name: /Delete server/i })).toBeVisible({ timeout: 3000 });
    await page.getByRole("textbox").fill(serverName);
    await page.getByRole("button", { name: /^Delete$/i }).click();
    await expect(page.getByRole("alert")).toContainText(/removed|success/i, { timeout: 5000 });
    await expect(page.getByRole("dialog", { name: /Delete server/i })).not.toBeVisible();
  });

  test("server detail loads and tabs are present", async ({ page }) => {
    await page.goto("servers");
    await page.waitForLoadState("domcontentloaded");
    const configureLink = page.getByRole("link", { name: /Configure/i }).first();
    if (!(await configureLink.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip(true, "No servers: cannot open server detail");
      return;
    }
    const href = await configureLink.getAttribute("href");
    if (!href || !href.includes("/servers/") || !href.includes("/edit")) {
      test.skip(true, "Could not get server detail URL from Configure link");
      return;
    }
    const serverId = href.replace(/\/edit\/?$/, "").split("/servers/")[1]?.split("/")[0];
    if (!serverId) {
      test.skip(true, "Could not parse server id");
      return;
    }
    await page.goto(`servers/${serverId}`);
    await page.waitForLoadState("domcontentloaded");
    await expect(page.getByTestId("server-detail-page")).toBeVisible({ timeout: 10000 });
    const tablist = page.getByRole("tablist", { name: /Server sections/i });
    await expect(tablist).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole("tab", { name: /Overview/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /Peers/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /Telemetry/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /Actions/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /Logs/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /Config/i })).toBeVisible();
  });

  test("Issue config modal opens from server detail", async ({ page }) => {
    await page.goto("servers");
    await page.waitForLoadState("domcontentloaded");
    const configureLink = page.getByRole("link", { name: /Configure/i }).first();
    if (!(await configureLink.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip(true, "No servers: cannot open server detail");
      return;
    }
    const href = await configureLink.getAttribute("href");
    const serverId = href?.replace(/\/edit\/?$/, "").split("/servers/")[1]?.split("/")[0];
    if (!serverId) {
      test.skip(true, "Could not parse server id");
      return;
    }
    await page.goto(`servers/${serverId}`);
    await page.waitForLoadState("domcontentloaded");
    await expect(page.getByTestId("server-detail-page")).toBeVisible({ timeout: 10000 });
    await page.getByRole("button", { name: /Issue config/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole("heading", { name: /Issue config/i })).toBeVisible();
    await page.getByRole("button", { name: /Close/i }).first().click();
    await expect(page.getByRole("dialog")).not.toBeVisible();
  });

  test("Sync from node: clicking Sync triggers sync flow and shows toast", async ({ page }) => {
    await page.goto("servers");
    await page.waitForLoadState("domcontentloaded");
    const syncBtn = page.getByRole("button", { name: /Sync from node/i }).first();
    if (!(await syncBtn.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip(true, "No servers: Sync button not visible");
      return;
    }
    await syncBtn.click();
    await expect(page.getByRole("alert").filter({ hasText: /Sync (completed|queued|failed)/i })).toBeVisible({
      timeout: 10000,
    });
  });

  test("Restart server opens ConfirmDanger dialog", async ({ page }) => {
    await page.goto("servers");
    await page.waitForLoadState("domcontentloaded");
    const restartBtn = page.getByRole("button", { name: /Restart/i }).first();
    if (!(await restartBtn.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip(true, "No servers or Restart button not visible");
      return;
    }
    await restartBtn.click();
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole("heading", { name: /Restart/i })).toBeVisible();
    await page.getByRole("button", { name: /Cancel/i }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();
  });

  test("Revoke peer opens ConfirmDanger with reason", async ({ page }) => {
    await page.goto("servers");
    await page.waitForLoadState("domcontentloaded");
    const configureLink = page.getByRole("link", { name: /Configure/i }).first();
    if (!(await configureLink.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip(true, "No servers");
      return;
    }
    const href = await configureLink.getAttribute("href");
    const serverId = href?.replace(/\/edit\/?$/, "").split("/servers/")[1]?.split("/")[0];
    if (!serverId) {
      test.skip(true, "Could not parse server id");
      return;
    }
    await page.goto(`servers/${serverId}`);
    await page.waitForLoadState("domcontentloaded");
    await expect(page.getByTestId("server-detail-page")).toBeVisible({ timeout: 10000 });
    await page.getByRole("tab", { name: /Peers/i }).click();
    await page.waitForTimeout(500);
    const revokeBtn = page.getByRole("button", { name: /^Revoke$/i }).first();
    if (!(await revokeBtn.isVisible({ timeout: 3000 }).catch(() => false))) {
      test.skip(true, "No peers or Revoke button not visible");
      return;
    }
    await revokeBtn.click();
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole("heading", { name: /Revoke peer/i })).toBeVisible();
    await page.getByRole("button", { name: /Cancel/i }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();
  });
});

test.describe("Users", () => {
  test.beforeEach(async ({ page, request }) => {
    const ok = await login(page, request);
    test.skip(!ok, "Skipping authenticated flow: valid admin credentials or auth API unavailable.");
  });
  test("users list loads", async ({ page }) => {
    await page.goto("users");
    // SPA pages may keep polling; "networkidle" can hang indefinitely.
    await page.waitForLoadState("domcontentloaded");
    await expect(page.getByRole("heading", { name: /Users/i })).toBeVisible({ timeout: 10000 });
  });

  test("open user panel when list has rows", async ({ page }) => {
    await page.goto("users");
    await page.waitForLoadState("domcontentloaded");
    const openPanelBtn = page.getByRole("button", { name: /Open panel/i }).first();
    if (await openPanelBtn.isVisible()) {
      await openPanelBtn.click();
      await expect(page.getByRole("heading", { name: /User #/i })).toBeVisible();
      await expect(page.getByRole("button", { name: /Close panel/i })).toBeVisible();
    }
  });
});
