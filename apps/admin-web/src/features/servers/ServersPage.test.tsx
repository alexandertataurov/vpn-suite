import { beforeEach, describe, expect, it } from "vitest";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { ServersPage } from "@/features/servers/ServersPage";
import { server } from "@/test/mocks/server";
import { renderWithProviders } from "@/test/utils/render-with-providers";

function setupServersHandlers() {
  server.use(
    http.get("*/servers/snapshots/summary", () =>
      HttpResponse.json({
        servers: {
          "node-1": {
            cpu_pct: 25,
            ram_pct: 40,
            ram_used_bytes: null,
            ram_total_bytes: null,
            active_peers: 7,
            total_peers: 10,
            used_ips: 7,
            total_ips: 100,
            free_ips: 93,
            health_score: 96,
            last_snapshot_at: new Date().toISOString(),
            source: "snapshot",
          },
        },
      })
    ),
    http.get("*/overview/operator", () =>
      HttpResponse.json({
        servers: [
          {
            id: "node-1",
            name: "Node 1",
            region: "eu-west",
            ip: "10.0.0.1",
            status: "online",
            cpu_pct: 25,
            ram_pct: 40,
            users: 7,
            throughput_bps: 8_000_000,
            last_heartbeat: new Date().toISOString(),
            freshness: "fresh",
            to: "/servers/node-1",
          },
        ],
        incidents: [],
      })
    ),
    http.get("*/servers/vpn-nodes", () => HttpResponse.json([])),
    http.get("*/servers", () =>
      HttpResponse.json({
        items: [],
        total: 0,
        limit: 50,
        offset: 0,
      })
    )
  );
}

describe("ServersPage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("estimates egress cost from throughput and persisted provider rate", async () => {
    setupServersHandlers();
    renderWithProviders(<ServersPage />);

    await screen.findByText("Egress cost estimator");
    const estimate = screen.getByLabelText("Egress cost estimate");
    expect(within(estimate).getByText("8.0 Mbps")).toBeInTheDocument();
    expect(within(estimate).getByText("86.40 GB")).toBeInTheDocument();
    expect(within(estimate).getByText("$0.43")).toBeInTheDocument();
    expect(within(estimate).getByText("$12.96")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Provider rate per TB"), { target: { value: "10" } });

    await waitFor(() => {
      expect(screen.getByText("$25.92")).toBeInTheDocument();
    });
    expect(window.localStorage.getItem("admin-web:servers-egress-rate-usd-per-tb")).toBe("10");
  });
});
