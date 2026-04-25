import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { OverviewPage } from "@/features/overview/OverviewPage";
import { server } from "@/test/mocks/server";
import { renderWithProviders } from "@/test/utils/render-with-providers";

const now = new Date().toISOString();

class TestResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

function setupOverviewHandlers(observed?: { health: number; operator: number }) {
  server.use(
    http.get("*/overview/health-snapshot", () => {
      if (observed) observed.health += 1;
      return HttpResponse.json({
        telemetry_last_at: now,
        snapshot_last_at: now,
        sessions_active: 7,
        incidents_count: 0,
        metrics_freshness: {},
      });
    }),
    http.get("*/overview/operator", () => {
      if (observed) observed.operator += 1;
      return HttpResponse.json({
        health_strip: {
          avg_latency_ms: 24,
          total_throughput_bps: 8_000_000,
          peers_active: 7,
          active_sessions: 7,
          error_rate_pct: 0,
          freshness: "fresh",
        },
        servers: [
          {
            id: "node-1",
            name: "Node 1",
            region: "eu-west",
            cpu_pct: 25,
            ram_pct: 40,
            throughput_bps: 8_000_000,
            status: "online",
          },
        ],
        timeseries: [
          { ts: 1, peers: 5, rx: 100, tx: 100 },
          { ts: 2, peers: 7, rx: 200, tx: 300 },
        ],
        latency_timeseries: [
          { ts: 1, latency_ms: 30 },
          { ts: 2, latency_ms: 24 },
        ],
        incidents: [],
      });
    })
  );
}

describe("OverviewPage", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.ResizeObserver = TestResizeObserver;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders working dashboard settings and persists layout preferences", async () => {
    setupOverviewHandlers();
    renderWithProviders(<OverviewPage />);

    await screen.findByTestId("dashboard-settings");
    fireEvent.click(screen.getByTestId("dashboard-settings"));

    fireEvent.change(screen.getByLabelText("Dashboard density"), { target: { value: "compact" } });
    fireEvent.change(screen.getByLabelText("Widget emphasis"), { target: { value: "operational" } });

    await waitFor(() => {
      expect(screen.getByTestId("dashboard-page")).toHaveClass("overview-page--density-compact");
      expect(screen.getByTestId("dashboard-page")).toHaveClass("overview-page--emphasis-operational");
    });
    expect(window.localStorage.getItem("admin-web:overview-preferences")).toContain("compact");
  });

  it("auto-refresh setting schedules dashboard refetches", async () => {
    const observed = { health: 0, operator: 0 };
    setupOverviewHandlers(observed);
    renderWithProviders(<OverviewPage />);

    await screen.findByTestId("dashboard-settings");
    fireEvent.click(screen.getByTestId("dashboard-settings"));
    vi.useFakeTimers();
    fireEvent.change(screen.getByLabelText("Auto-refresh"), { target: { value: "30" } });

    const before = observed.health;
    await act(async () => {
      await vi.advanceTimersByTimeAsync(30_000);
    });

    expect(observed.health).toBeGreaterThan(before);
    expect(observed.operator).toBeGreaterThan(1);
  });
});
