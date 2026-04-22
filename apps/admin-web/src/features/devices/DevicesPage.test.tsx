import { describe, expect, it } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { DevicesPage } from "@/features/devices/DevicesPage";
import { server } from "@/test/mocks/server";
import { renderWithProviders } from "@/test/utils/render-with-providers";

const nowIso = new Date().toISOString();

function summaryResponse() {
  return {
    total: 2,
    active: 2,
    revoked: 0,
    handshake_ok_count: 1,
    no_handshake_count: 1,
    traffic_zero_count: 1,
    unused_configs: 0,
    no_allowed_ips: 0,
    telemetry_last_updated: nowIso,
  };
}

function listResponse() {
  return {
    items: [
      {
        id: "dev-good",
        user_id: 1,
        user_email: "good@example.com",
        server_id: "node-a",
        subscription_id: "sub-1",
        device_name: "Healthy device",
        allowed_ips: "10.0.0.2/32",
        suspended_at: null,
        revoked_at: null,
        telemetry: {
          node_health: "online",
          peer_present: true,
          handshake_latest_at: nowIso,
          handshake_age_sec: 12,
          rtt_ms: 30,
          transfer_rx_bytes: 1024,
          transfer_tx_bytes: 2048,
          reconciliation_status: "ok",
        },
      },
      {
        id: "dev-alert",
        user_id: 2,
        user_email: "alert@example.com",
        server_id: "node-b",
        subscription_id: "sub-2",
        device_name: "Alert device",
        allowed_ips: "10.0.0.3/32",
        suspended_at: null,
        revoked_at: null,
        telemetry: {
          node_health: "online",
          peer_present: false,
          handshake_latest_at: null,
          handshake_age_sec: null,
          rtt_ms: null,
          transfer_rx_bytes: null,
          transfer_tx_bytes: null,
          reconciliation_status: "needs_reconcile",
        },
      },
    ],
    total: 2,
    limit: 50,
    offset: 0,
  };
}

describe("DevicesPage", () => {
  it("applies attention filter and resets active filters", async () => {
    server.use(
      http.get("*/devices/summary", () => HttpResponse.json(summaryResponse())),
      http.get("*/devices", () => HttpResponse.json(listResponse())),
      http.get("*/devices/config-health", () =>
        HttpResponse.json({
          by_reconciliation: { ok: 1, needs_reconcile: 1, broken: 0 },
          no_telemetry_count: 1,
          devices_needing_attention: [],
          telemetry_last_updated: nowIso,
        })
      )
    );

    renderWithProviders(<DevicesPage />);

    await screen.findByRole("button", { name: "Load devices" });
    expect(screen.getByText("Healthy device")).toBeInTheDocument();
    expect(screen.getByText("Alert device")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Attention only \(2\)/ }));

    await waitFor(() => {
      expect(screen.queryByText("Healthy device")).not.toBeInTheDocument();
      expect(screen.getByText("Alert device")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Reset filters (1)" })).toBeEnabled();
    });

    fireEvent.click(screen.getByRole("button", { name: "Reset filters (1)" }));

    await waitFor(() => {
      expect(screen.getByText("Healthy device")).toBeInTheDocument();
    });
  });

  it("shows normalized telemetry fallback text", async () => {
    const listWithLatencyGap = {
      ...listResponse(),
      items: [
        ...listResponse().items,
        {
          id: "dev-latency-gap",
          user_id: 3,
          user_email: "latency@example.com",
          server_id: "node-c",
          subscription_id: "sub-3",
          device_name: "Latency pending",
          allowed_ips: "10.0.0.4/32",
          suspended_at: null,
          revoked_at: null,
          telemetry: {
            node_health: "online",
            peer_present: true,
            handshake_latest_at: nowIso,
            handshake_age_sec: 15,
            rtt_ms: null,
            transfer_rx_bytes: 100,
            transfer_tx_bytes: 200,
            reconciliation_status: "ok",
          },
        },
      ],
    };

    server.use(
      http.get("*/devices/summary", () => HttpResponse.json(summaryResponse())),
      http.get("*/devices", () => HttpResponse.json(listWithLatencyGap)),
      http.get("*/devices/config-health", () =>
        HttpResponse.json({
          by_reconciliation: { ok: 1, needs_reconcile: 1, broken: 0 },
          no_telemetry_count: 1,
          devices_needing_attention: [],
          telemetry_last_updated: nowIso,
        })
      )
    );

    renderWithProviders(<DevicesPage />);

    await screen.findByText("Alert device");
    expect(screen.getAllByText("No telemetry").length).toBeGreaterThan(0);
    expect(screen.getByText("Not measured")).toBeInTheDocument();
  });
});
