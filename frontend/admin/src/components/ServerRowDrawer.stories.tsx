import { useEffect } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { ServerRowDrawer } from "./ServerRowDrawer";
import { api } from "../api/client";
import type { ServerOut, ServerSnapshotSummaryEntry } from "@vpn-suite/shared/types";

const meta: Meta<typeof ServerRowDrawer> = {
  title: "Components/Drawer/ServerRowDrawer",
  component: ServerRowDrawer,
};

export default meta;

type Story = StoryObj<typeof ServerRowDrawer>;

const server = {
  id: "srv-123",
  name: "core-edge-primary-01",
  created_at: "2025-01-01T00:00:00.000Z",
  status: "online",
  is_active: true,
  is_draining: false,
  is_provisioning_disabled: false,
  region: "us-east-1",
  vpn_endpoint: "vpn.example.com",
  api_endpoint: "https://api.example.com",
  last_seen_at: "2025-01-01T11:59:00.000Z",
  last_snapshot_at: "2025-01-01T11:58:00.000Z",
} as ServerOut;

const telemetrySnapshot: ServerSnapshotSummaryEntry = {
  cpu_pct: 52,
  ram_pct: 68,
  active_peers: 24,
  total_peers: 50,
  used_ips: 100,
  total_ips: 256,
  source: "snapshot",
} as ServerSnapshotSummaryEntry;

function ApiMock({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const originalGet = api.get;
    api.get = async <T,>(path: string): Promise<T> => {
      if (path.includes("/ips")) {
        return { items: [{ ip: "10.0.0.1" }, { ip: "10.0.0.2" }] } as T;
      }
      if (path.includes("/telemetry")) {
        return {
          source: "agent",
          container_name: "node-agent",
          agent_version: "1.8.2",
          reported_status: "healthy",
          total_rx_bytes: 12345678,
          total_tx_bytes: 9876543,
        } as T;
      }
      if (path.includes("/audit")) {
        return {
          items: [
            { created_at: "2025-01-01T10:00:00.000Z", action: "sync", description: "Manual sync" },
            { created_at: "2025-01-01T09:00:00.000Z", action: "restart", description: "Restarted" },
          ],
        } as T;
      }
      return {} as T;
    };
    return () => {
      api.get = originalGet;
    };
  }, []);
  return <>{children}</>;
}

export const Overview: Story = {
  render: () => (
    <ApiMock>
      <ServerRowDrawer server={server} onClose={() => {}} peerCount={12} telemetrySnapshot={telemetrySnapshot} />
    </ApiMock>
  ),
};

export const Variants: Story = {
  render: () => (
    <ApiMock>
      <div className="sb-stack">
        <ServerRowDrawer server={server} onClose={() => {}} peerCount={12} telemetrySnapshot={telemetrySnapshot} />
        <ServerRowDrawer server={{ ...server, status: "degraded" }} onClose={() => {}} peerCount={0} telemetrySnapshot={null} />
      </div>
    </ApiMock>
  ),
};

export const Sizes: Story = {
  render: () => (
    <ApiMock>
      <ServerRowDrawer server={server} onClose={() => {}} peerCount={12} telemetrySnapshot={telemetrySnapshot} />
    </ApiMock>
  ),
};

export const States: Story = {
  render: () => (
    <ApiMock>
      <ServerRowDrawer server={server} onClose={() => {}} peerCount={12} telemetrySnapshot={telemetrySnapshot} />
    </ApiMock>
  ),
};

export const WithLongText: Story = {
  render: () => (
    <ApiMock>
      <ServerRowDrawer server={{ ...server, name: "core-edge-primary-02-us-east-1" }} onClose={() => {}} peerCount={120} telemetrySnapshot={telemetrySnapshot} />
    </ApiMock>
  ),
};

export const EdgeCases = WithLongText;

export const DarkMode: Story = {
  parameters: { themes: { themeOverride: "dark" } },
  render: () => (
    <ApiMock>
      <ServerRowDrawer server={server} onClose={() => {}} peerCount={12} telemetrySnapshot={telemetrySnapshot} />
    </ApiMock>
  ),
};

export const Accessibility: Story = {
  render: () => (
    <ApiMock>
      <ServerRowDrawer server={server} onClose={() => {}} peerCount={12} telemetrySnapshot={telemetrySnapshot} />
    </ApiMock>
  ),
};
