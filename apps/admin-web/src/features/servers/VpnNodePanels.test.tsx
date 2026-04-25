import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { LatencyQualityPanel } from "@/design-system/widgets/vpn-node/LatencyQualityPanel";
import { NodeSystemHealthPanel } from "@/design-system/widgets/vpn-node/NodeSystemHealthPanel";
import { renderWithProviders } from "@/test/utils/render-with-providers";

const kpis = {
  rtt_p50_ms: 20,
  rtt_p95_ms: 60,
  loss_p50_pct: 0.2,
  loss_p95_pct: 1.5,
};

describe("VPN node drilldown panels", () => {
  it("shows latency and loss trend summaries when timeseries exist", () => {
    renderWithProviders(
      <LatencyQualityPanel
        kpis={kpis}
        rtt1h={[
          { ts: 1, value: 20 },
          { ts: 2, value: 35 },
        ]}
        rtt24h={[
          { ts: 1, value: 50 },
          { ts: 2, value: 40 },
        ]}
        loss1h={[
          { ts: 1, value: 0.2 },
          { ts: 2, value: 0.4 },
        ]}
      />
    );

    expect(screen.getByText("RTT 1h trend")).toBeInTheDocument();
    expect(screen.getByText("35 ms · up 15 ms")).toBeInTheDocument();
    expect(screen.getByText("40 ms · down 10 ms")).toBeInTheDocument();
    expect(screen.getByText("0.4% · up 0.2%")).toBeInTheDocument();
  });

  it("shows clean empty state when latency timeseries are absent", () => {
    renderWithProviders(<LatencyQualityPanel kpis={kpis} rtt1h={[]} rtt24h={[]} loss1h={[]} />);

    expect(screen.getByText("No RTT/loss timeseries available for this node.")).toBeInTheDocument();
    expect(screen.queryByText(/placeholder/i)).not.toBeInTheDocument();
  });

  it("displays NTP telemetry without placeholder copy", () => {
    renderWithProviders(
      <NodeSystemHealthPanel
        system={{
          cpu_pct: 25,
          ram_pct: 40,
          disk_pct: 50,
          nic_errs: 0,
          container_health: "healthy",
          ntp_status: "synced",
        }}
      />
    );

    expect(screen.getByText("NTP")).toBeInTheDocument();
    expect(screen.getByText("synced")).toBeInTheDocument();
    expect(screen.queryByTitle(/placeholder/i)).not.toBeInTheDocument();
  });
});
