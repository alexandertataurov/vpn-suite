import { describe, expect, it } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { AutomationPage } from "@/features/automation/AutomationPage";
import { server } from "@/test/mocks/server";
import { renderWithProviders } from "@/test/utils/render-with-providers";

const statusResponse = {
  enabled: true,
  interval_seconds: 60,
  unhealthy_health_threshold: 0.6,
  enterprise_plan_keywords: [],
  rebalance_high_watermark: 0.8,
  rebalance_target_watermark: 0.6,
  rebalance_max_moves_per_node: 10,
  rebalance_execute_enabled: true,
  rebalance_batch_size: 5,
  rebalance_max_executions_per_cycle: 10,
  rebalance_qos_idle_handshake_seconds: 120,
  rebalance_qos_hot_traffic_bytes: 100,
  throttling_enabled: false,
  throttling_dry_run: false,
  rebalance_stop_on_error: true,
  rebalance_rollback_on_error: true,
  last_run_at: null,
  last_run: null,
};

const healthResponse = {
  timestamp: new Date().toISOString(),
  health_score: 0.9,
  nodes_total: 1,
  status_counts: { healthy: 1 },
  current_load: 12,
  total_capacity: 100,
  load_factor: 0.12,
};

const topologyResponse = {
  timestamp: new Date().toISOString(),
  load_factor: 0.12,
  health_score: 0.9,
  topology_version: 3,
  current_load: 12,
  total_capacity: 100,
};

function nodesResponse(isDraining = false) {
  return {
    nodes: [
      {
        node_id: "node-1",
        container_name: "amnezia-awg-1",
        region: "eu",
        status: "healthy",
        health_score: 0.95,
        peer_count: 10,
        max_peers: 100,
        is_draining: isDraining,
      },
    ],
    total: 1,
  };
}

describe("AutomationPage", () => {
  it("sends dry-run and execute payloads", async () => {
    const runBodies: Array<Record<string, unknown>> = [];

    server.use(
      http.get("*/control-plane/automation/status", () => HttpResponse.json(statusResponse)),
      http.get("*/cluster/health", () => HttpResponse.json(healthResponse)),
      http.get("*/cluster/topology", () => HttpResponse.json(topologyResponse)),
      http.get("*/cluster/nodes", () => HttpResponse.json(nodesResponse(false))),
      http.post("*/control-plane/automation/run", async ({ request }) => {
        runBodies.push((await request.json()) as Record<string, unknown>);
        return HttpResponse.json({
          generated_at: new Date().toISOString(),
          load_factor: 0.2,
          health_score: 0.9,
          failed_nodes: 0,
          rebalance_moves: 0,
          rebalance_peers_to_move: 0,
          rebalance_execution_enabled: true,
          executed_migrations: 0,
          failed_migrations: 0,
          rollback_migrations: 0,
          rollback_failures: 0,
          paused_nodes: 0,
          resumed_nodes: 0,
          executions: [],
        });
      })
    );

    renderWithProviders(<AutomationPage />);

    await screen.findByText("Run automation");

    fireEvent.click(screen.getByRole("button", { name: "Dry run" }));
    await waitFor(() => {
      expect(runBodies).toHaveLength(1);
    });
    fireEvent.click(screen.getByRole("button", { name: "Execute" }));

    await waitFor(() => {
      expect(runBodies).toHaveLength(2);
      expect(runBodies[0]?.execute_rebalance).toBe(false);
      expect(runBodies[1]?.execute_rebalance).toBe(true);
    });
  });

  it("runs cluster actions and drains/undrains node", async () => {
    const actionPaths: string[] = [];
    let draining = false;

    server.use(
      http.get("*/control-plane/automation/status", () => HttpResponse.json(statusResponse)),
      http.get("*/cluster/health", () => HttpResponse.json(healthResponse)),
      http.get("*/cluster/topology", () => HttpResponse.json(topologyResponse)),
      http.get("*/cluster/nodes", () => HttpResponse.json(nodesResponse(draining))),
      http.post("*/cluster/scan", ({ request }) => {
        actionPaths.push(new URL(request.url).pathname);
        return HttpResponse.json({ status: "ok" });
      }),
      http.post("*/cluster/resync", ({ request }) => {
        actionPaths.push(new URL(request.url).pathname);
        return HttpResponse.json({ status: "ok" });
      }),
      http.post("*/cluster/nodes/:nodeId/drain", ({ params, request }) => {
        draining = true;
        actionPaths.push(`${new URL(request.url).pathname}:${String(params.nodeId)}`);
        return HttpResponse.json({ status: "ok" });
      }),
      http.post("*/cluster/nodes/:nodeId/undrain", ({ params, request }) => {
        draining = false;
        actionPaths.push(`${new URL(request.url).pathname}:${String(params.nodeId)}`);
        return HttpResponse.json({ status: "ok" });
      })
    );

    renderWithProviders(<AutomationPage />);

    await screen.findByText("Cluster operations");

    fireEvent.click(screen.getByRole("button", { name: "Discover nodes" }));
    await waitFor(() => {
      expect(actionPaths.some((path) => path.includes("/cluster/scan"))).toBe(true);
    });
    fireEvent.click(screen.getByRole("button", { name: "Resync topology" }));
    await waitFor(() => {
      expect(actionPaths.some((path) => path.includes("/cluster/resync"))).toBe(true);
    });
    fireEvent.click(screen.getByRole("button", { name: "Drain" }));

    await waitFor(() => {
      expect(actionPaths.some((path) => path.includes("/cluster/nodes/node-1/drain"))).toBe(true);
    });
  });

  it("surfaces cluster action errors", async () => {
    server.use(
      http.get("*/control-plane/automation/status", () => HttpResponse.json(statusResponse)),
      http.get("*/cluster/health", () => HttpResponse.json(healthResponse)),
      http.get("*/cluster/topology", () => HttpResponse.json(topologyResponse)),
      http.get("*/cluster/nodes", () => HttpResponse.json(nodesResponse(false))),
      http.post("*/cluster/scan", () => HttpResponse.json({ detail: "scan failed" }, { status: 500 }))
    );

    renderWithProviders(<AutomationPage />);

    await screen.findByText("Cluster operations");
    fireEvent.click(screen.getByRole("button", { name: "Discover nodes" }));

    await screen.findByText("Action failed");
    expect(screen.getByText("scan failed")).toBeInTheDocument();
  });
});
