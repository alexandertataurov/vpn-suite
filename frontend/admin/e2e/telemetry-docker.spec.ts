import { expect, test, type Page } from "@playwright/test";
import { login } from "./helpers";

type DockerActionKind = "start" | "stop" | "restart";

let lastDockerAction: { type: DockerActionKind; containerId: string } | null = null;

async function mockDockerTelemetry(
  page: Page,
  opts?: {
    logsForbidden?: boolean;
    logsErrorStatus?: number;
    alertsError?: boolean;
    metricsCase?: "default" | "empty" | "allNull" | "stale" | "partial" | "errorWithRequestId";
  }
) {
  await page.route("**/api/v1/telemetry/docker/**", async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    const method = route.request().method();

    if (method === "POST" && path.includes("/telemetry/docker/container/")) {
      const parts = path.split("/");
      const action = parts[parts.length - 1] as DockerActionKind;
      const containerId = parts[parts.length - 2];
      if (action === "start" || action === "stop" || action === "restart") {
        lastDockerAction = { type: action, containerId };
        return route.fulfill({
          status: 204,
          contentType: "application/json",
          body: "",
        });
      }
    }

    if (path.endsWith("/telemetry/docker/hosts")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          items: [
            {
              host_id: "local",
              name: "Local Docker Host",
              endpoint_kind: "unix",
              is_reachable: true,
              containers_total: 2,
              running: 1,
              stopped: 1,
              unhealthy: 1,
              restart_loops: 1,
              last_seen_at: "2026-02-15T12:00:00Z",
            },
          ],
          total: 1,
        }),
      });
    }

    if (path.endsWith("/telemetry/docker/containers")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          items: [
            {
              host_id: "local",
              container_id: "abc123def456",
              name: "docker-api",
              compose_service: "admin-api",
              compose_project: "vpn-suite",
              image: "vpn-suite-admin-api:0.1.0-rc.1",
              image_tag: "0.1.0-rc.1",
              state: "running",
              health_status: "healthy",
              restart_count: 0,
              is_restart_loop: false,
              uptime_seconds: 8640,
              cpu_pct: 12.4,
              mem_bytes: 187842560,
              mem_limit_bytes: 2147483648,
              mem_pct: 8.75,
              net_rx_bytes: 9512381,
              net_tx_bytes: 13002291,
              blk_read_bytes: 0,
              blk_write_bytes: 328192,
              ports: [{ ip: "0.0.0.0", private_port: 8000, public_port: 8000, protocol: "tcp" }],
              image_version: "0.1.0-rc.1",
              env_hash: "sha256:aaaa1111",
              error_rate_5m: 0.0021,
              created_at: "2026-02-14T19:12:33Z",
              started_at: "2026-02-14T19:13:01Z",
            },
            {
              host_id: "local",
              container_id: "fff111222333",
              name: "worker",
              compose_service: "worker",
              compose_project: "vpn-suite",
              image: "vpn-suite-worker:2.1.0",
              image_tag: "2.1.0",
              state: "restarting",
              health_status: "unhealthy",
              restart_count: 4,
              is_restart_loop: true,
              uptime_seconds: 120,
              cpu_pct: 97.3,
              mem_bytes: 1048576000,
              mem_limit_bytes: 2147483648,
              mem_pct: 48.8,
              net_rx_bytes: 1234,
              net_tx_bytes: 9876,
              blk_read_bytes: 12345,
              blk_write_bytes: 67890,
              ports: [],
              image_version: "2.1.0",
              env_hash: "sha256:bbbb2222",
              error_rate_5m: 0.45,
              created_at: "2026-02-15T10:00:00Z",
              started_at: "2026-02-15T11:58:00Z",
            },
          ],
          total: 2,
        }),
      });
    }

    if (path.includes("/telemetry/docker/container/") && path.endsWith("/metrics")) {
      const now = Date.now();
      const iso = (ms: number) => new Date(ms).toISOString();

      if (opts?.metricsCase === "errorWithRequestId") {
        return route.fulfill({
          status: 503,
          contentType: "application/json",
          body: JSON.stringify({
            success: false,
            data: null,
            error: { code: "TELEMETRY_UNAVAILABLE", message: "Telemetry unavailable" },
            meta: { timestamp: new Date().toISOString(), code: 503, request_id: "req-metrics-123" },
          }),
        });
      }

      if (opts?.metricsCase === "empty") {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            host_id: "local",
            container_id: "abc123def456",
            from: iso(now - 60 * 60 * 1000),
            to: iso(now),
            step_seconds: 15,
            points: [],
          }),
        });
      }

      if (opts?.metricsCase === "stale") {
        const t0 = now - 10 * 60 * 1000;
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            host_id: "local",
            container_id: "abc123def456",
            from: iso(t0 - 60 * 60 * 1000),
            to: iso(t0),
            step_seconds: 15,
            points: [
              { ts: iso(t0 - 15_000), cpu_pct: 25.2, mem_bytes: 200000000, net_rx_bps: 35000, net_tx_bps: 24000, blk_read_bps: 1200, blk_write_bps: 1400 },
              { ts: iso(t0), cpu_pct: 35.7, mem_bytes: 210000000, net_rx_bps: 47000, net_tx_bps: 31000, blk_read_bps: 1800, blk_write_bps: 1600 },
            ],
          }),
        });
      }

      if (opts?.metricsCase === "partial") {
        const t2 = now - 15_000;
        const t1 = t2 - 6 * 60_000; // big gap relative to 15s step => partial
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            host_id: "local",
            container_id: "abc123def456",
            from: iso(now - 60 * 60 * 1000),
            to: iso(now),
            step_seconds: 15,
            points: [
              { ts: iso(t1 - 15_000), cpu_pct: 25.2, mem_bytes: 200000000, net_rx_bps: 35000, net_tx_bps: 24000, blk_read_bps: 1200, blk_write_bps: 1400 },
              { ts: iso(t1), cpu_pct: 35.7, mem_bytes: 210000000, net_rx_bps: 47000, net_tx_bps: 31000, blk_read_bps: 1800, blk_write_bps: 1600 },
              { ts: iso(t2), cpu_pct: 31.1, mem_bytes: 208000000, net_rx_bps: 52000, net_tx_bps: 28000, blk_read_bps: 1400, blk_write_bps: 1900 },
            ],
          }),
        });
      }

      if (opts?.metricsCase === "allNull") {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            host_id: "local",
            container_id: "abc123def456",
            from: iso(now - 60 * 60 * 1000),
            to: iso(now),
            step_seconds: 15,
            points: [
              { ts: iso(now - 30_000), cpu_pct: null, mem_bytes: null, net_rx_bps: null, net_tx_bps: null, blk_read_bps: null, blk_write_bps: null },
              { ts: iso(now - 15_000), cpu_pct: null, mem_bytes: null, net_rx_bps: null, net_tx_bps: null, blk_read_bps: null, blk_write_bps: null },
            ],
          }),
        });
      }

      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          host_id: "local",
          container_id: "abc123def456",
          from: iso(now - 60 * 60 * 1000),
          to: iso(now),
          step_seconds: 15,
          points: [
            {
              ts: iso(now - 30_000),
              cpu_pct: 25.2,
              mem_bytes: 200000000,
              mem_pct: 9.4,
              net_rx_bps: 35000,
              net_tx_bps: 24000,
              blk_read_bps: 1200,
              blk_write_bps: 1400,
            },
            {
              ts: iso(now - 15_000),
              cpu_pct: 35.7,
              mem_bytes: 210000000,
              mem_pct: 9.8,
              net_rx_bps: 47000,
              net_tx_bps: 31000,
              blk_read_bps: 1800,
              blk_write_bps: 1600,
            },
          ],
        }),
      });
    }

    if (path.includes("/telemetry/docker/container/") && path.endsWith("/logs")) {
      if (opts?.logsErrorStatus) {
        return route.fulfill({
          status: opts.logsErrorStatus,
          contentType: "application/json",
          body: JSON.stringify({
            success: false,
            data: null,
            error: { code: "LOGS_UNAVAILABLE", message: "Logs unavailable" },
            meta: { timestamp: new Date().toISOString(), code: opts.logsErrorStatus, request_id: "req-logs-501" },
          }),
        });
      }
      if (opts?.logsForbidden) {
        return route.fulfill({
          status: 403,
          contentType: "application/json",
          body: JSON.stringify({
            success: false,
            data: null,
            error: { code: "FORBIDDEN", message: "Forbidden" },
            meta: { timestamp: new Date().toISOString(), code: 403, request_id: "req-logs-403" },
          }),
        });
      }
      const since = url.searchParams.get("since");
      const items = since
        ? [
            {
              ts: "2026-02-15T12:00:02Z",
              stream: "stderr",
              severity: "error",
              message: "panic: crashloop detected",
            },
          ]
        : [
            {
              ts: "2026-02-15T12:00:00Z",
              stream: "stdout",
              severity: "info",
              message: "service started",
            },
            {
              ts: "2026-02-15T12:00:01Z",
              stream: "stderr",
              severity: "warn",
              message: "retry timeout",
            },
          ];
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ items, total: items.length }),
      });
    }

    if (path.endsWith("/telemetry/docker/alerts")) {
      if (opts?.alertsError) {
        return route.fulfill({
          status: 503,
          contentType: "application/json",
          body: JSON.stringify({
            success: false,
            data: null,
            error: { code: "TELEMETRY_UNAVAILABLE", message: "Telemetry unavailable" },
            meta: { timestamp: new Date().toISOString(), code: 503, request_id: "req-alerts-503" },
          }),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          items: [
            {
              id: "alert-1",
              severity: "critical",
              rule: "DockerContainerRestartLoop",
              host_id: "local",
              container_id: "fff111222333",
              container_name: "worker",
              created_at: "2026-02-15T11:59:30Z",
              status: "firing",
              context: { restart_count: 4 },
            },
          ],
          total: 1,
        }),
      });
    }

    return route.fallback();
  });
}

test.describe("Telemetry Docker tab", () => {
  test.beforeEach(async ({ page, request }) => {
    const ok = await login(page, request);
    test.skip(!ok, "Skipping authenticated flow: valid admin credentials or auth API unavailable.");
  });

  test("telemetry page shows docker services tab", async ({ page }) => {
    await page.goto("telemetry");
    // Telemetry pages poll; "networkidle" can hang indefinitely.
    await page.waitForLoadState("domcontentloaded");

    await expect(page.getByRole("tab", { name: /Docker Services/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /VPN Nodes/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Telemetry/i })).toBeVisible();
  });

  test("telemetry page has Refresh now button", async ({ page }) => {
    await page.goto("telemetry");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.getByRole("button", { name: /Refresh now/i })).toBeVisible();
  });

  test("switch to vpn tab", async ({ page }) => {
    await page.goto("telemetry?tab=docker");
    await page.getByRole("tab", { name: /VPN Nodes/i }).click();
    await expect(page).toHaveURL(/tab=vpn/);
  });

  test("docker tab shows data source health strip when configured", async ({ page }) => {
    await mockDockerTelemetry(page);
    await page.goto("telemetry?tab=docker");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.getByRole("status", { name: /Data source health/i })).toBeVisible();
    await expect(page.getByText(/Last updated/i)).toBeVisible();
  });

  test("docker overview renders mocked containers and alerts", async ({ page }) => {
    await mockDockerTelemetry(page);
    await page.goto("telemetry?tab=docker");
    await page.waitForLoadState("domcontentloaded");

    await expect(page.locator("[data-testid=table-row]", { hasText: "docker-api" })).toBeVisible();
    await expect(page.locator("[data-testid=table-row]", { hasText: "worker" })).toBeVisible();
    await expect(page.getByText("DockerContainerRestartLoop")).toBeVisible();

    const workerRow = page.locator("[data-testid=table-row]", { hasText: "worker" });
    await workerRow.getByRole("button", { name: "Details" }).click();
    await expect(page.getByText("Restarts: 4")).toBeVisible();
  });

  test("charts show empty state when metrics points is empty", async ({ page }) => {
    await mockDockerTelemetry(page, { metricsCase: "empty" });
    await page.goto("telemetry?tab=docker");
    await page.waitForLoadState("domcontentloaded");

    await expect(page.getByText("No data for the selected range.").first()).toBeVisible();
  });

  test("charts treat all-null series as empty", async ({ page }) => {
    await mockDockerTelemetry(page, { metricsCase: "allNull" });
    await page.goto("telemetry?tab=docker");
    await page.waitForLoadState("domcontentloaded");

    await expect(page.getByText("No data for the selected range.").first()).toBeVisible();
  });

  test("charts show stale banner when latest sample is delayed", async ({ page }) => {
    await mockDockerTelemetry(page, { metricsCase: "stale" });
    await page.goto("telemetry?tab=docker");
    await page.waitForLoadState("domcontentloaded");

    await expect(page.getByText(/Stale data/i).first()).toBeVisible();
  });

  test("charts show partial banner when samples are missing", async ({ page }) => {
    await mockDockerTelemetry(page, { metricsCase: "partial" });
    await page.goto("telemetry?tab=docker");
    await page.waitForLoadState("domcontentloaded");

    await expect(page.getByText(/Partial data/i).first()).toBeVisible();
  });

  test("charts surface request id and Retry button on API failures", async ({ page }) => {
    await mockDockerTelemetry(page, { metricsCase: "errorWithRequestId" });
    await page.goto("telemetry?tab=docker");
    await page.waitForLoadState("domcontentloaded");

    await expect(page.locator("code", { hasText: "req-metrics-123" }).first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole("button", { name: /Retry/i }).first()).toBeVisible();
  });

  test("logs panel shows permission guard when logs endpoint returns 403", async ({ page }) => {
    await mockDockerTelemetry(page, { logsForbidden: true });
    await page.goto("telemetry?tab=docker");
    await page.waitForLoadState("domcontentloaded");

    await expect(
      page.getByText("Logs require admin permission: telemetry:logs:read.")
    ).toBeVisible();
  });

  test("alerts panel surfaces API failure explicitly", async ({ page }) => {
    await mockDockerTelemetry(page, { alertsError: true });
    await page.goto("telemetry?tab=docker");
    await page.waitForLoadState("domcontentloaded");

    const alertsRegion = page.getByRole("region", { name: "Alerts" });
    await expect(alertsRegion).toBeVisible({ timeout: 10000 });
    await expect(alertsRegion.getByRole("alert")).toHaveText("Failed to load alerts telemetry.", { timeout: 15000 });
  });

  test("logs panel surfaces API failure explicitly", async ({ page }) => {
    await mockDockerTelemetry(page, { logsErrorStatus: 501 });
    await page.goto("telemetry?tab=docker");
    await page.waitForLoadState("domcontentloaded");

    const logsRegion = page.getByRole("region", { name: "Logs" });
    await expect(logsRegion).toBeVisible({ timeout: 10000 });
    await expect(logsRegion.getByRole("alert")).toHaveText("Failed to load logs for this container.", { timeout: 15000 });
  });

  test("docker controls can restart a running container from details panel and toolbar", async ({ page }) => {
    await mockDockerTelemetry(page);
    lastDockerAction = null;

    await page.goto("telemetry?tab=docker");
    await page.waitForLoadState("domcontentloaded");

    const dockerApiRow = page.locator("[data-testid=table-row]", { hasText: "docker-api" });
    await dockerApiRow.getByRole("button", { name: "Details" }).click();

    const startButton = page.getByRole("button", { name: "Start" });
    const stopButton = page.getByRole("button", { name: "Stop" });
    const restartButton = page.getByRole("button", { name: "Restart" });

    await expect(startButton).toBeDisabled();
    await expect(stopButton).toBeEnabled();
    await expect(restartButton).toBeEnabled();

    await restartButton.click();

    expect(lastDockerAction).not.toBeNull();
    expect(lastDockerAction?.type).toBe("restart");
    expect(lastDockerAction?.containerId).toBe("abc123def456");

    lastDockerAction = null;

    const restartSelectedButton = page.getByRole("button", { name: "Restart selected" });
    await expect(restartSelectedButton).toBeEnabled();
    await restartSelectedButton.click();

    expect(lastDockerAction).not.toBeNull();
    expect(lastDockerAction?.type).toBe("restart");
    expect(lastDockerAction?.containerId).toBe("abc123def456");
  });
});
