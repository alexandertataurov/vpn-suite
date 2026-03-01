import type { Meta, StoryObj } from "@storybook/react";
import { CommandBar, HealthStrip } from "@/components";
import { Panel, PanelHeader, PanelBody, LoadingSkeleton } from "@/design-system";
import type { OperatorHealthStrip } from "@vpn-suite/shared/types";

const health: OperatorHealthStrip = {
  api_status: "ok",
  prometheus_status: "ok",
  online_nodes: 42,
  total_nodes: 48,
  active_sessions: 1823,
  total_throughput_bps: 924000000,
  avg_latency_ms: 28,
  error_rate_pct: 0.12,
  refresh_mode: "stream",
  freshness: "fresh",
  last_updated: new Date().toISOString(),
};

const meta: Meta = {
  title: "Pages/Telemetry",
  parameters: {
    docs: {
      description: {
        component: "Reference telemetry layout with health strip and chart placeholders. Static data only.",
      },
    },
  },
};

export default meta;

type Story = StoryObj;

export const Overview: Story = {
  render: () => (
    <div className="sb-stack">
      <CommandBar title="TELEMETRY" description="Streaming system health and performance." />
      <HealthStrip data={health} />
      <div className="sb-grid" data-columns="2">
        <Panel>
          <PanelHeader title="Latency" />
          <PanelBody>
            <LoadingSkeleton height="var(--spacing-32)" width="100%" />
          </PanelBody>
        </Panel>
        <Panel>
          <PanelHeader title="Throughput" />
          <PanelBody>
            <LoadingSkeleton height="var(--spacing-32)" width="100%" />
          </PanelBody>
        </Panel>
      </div>
    </div>
  ),
};

export const Variants: Story = {
  render: () => (
    <div className="sb-stack">
      <CommandBar title="TELEMETRY" description="Streaming system health and performance." />
      <HealthStrip data={health} />
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="sb-stack">
      <p className="m-0">Reference layout only; size variants are not exposed.</p>
      <CommandBar title="TELEMETRY" description="Streaming system health and performance." />
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <div className="sb-stack">
      <CommandBar title="TELEMETRY" description="Streaming system health and performance." />
      <HealthStrip data={health} />
    </div>
  ),
};

export const WithLongText: Story = {
  render: () => (
    <div className="sb-stack">
      <CommandBar
        title="TELEMETRY FOR PRIMARY AND SECONDARY REGIONS"
        description="Streaming system health and performance across multiple environments."
      />
    </div>
  ),
};

export const DarkMode: Story = {
  parameters: { themes: { themeOverride: "dark" } },
  render: () => (
    <div className="sb-stack">
      <CommandBar title="TELEMETRY" description="Streaming system health and performance." />
    </div>
  ),
};

export const Accessibility: Story = {
  render: () => (
    <div className="sb-stack">
      <CommandBar title="TELEMETRY" description="Streaming system health and performance." />
    </div>
  ),
};

export const EdgeCases = WithLongText;
