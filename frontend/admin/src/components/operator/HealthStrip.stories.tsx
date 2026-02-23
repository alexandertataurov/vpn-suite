import type { Meta, StoryObj } from "@storybook/react";
import type { OperatorHealthStrip } from "@vpn-suite/shared/types";
import { HealthStrip } from "./HealthStrip";

const baseData: OperatorHealthStrip = {
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

const meta: Meta<typeof HealthStrip> = {
  title: "Patterns/HealthStrip",
  component: HealthStrip,
  parameters: {
    docs: {
      description: {
        component: "Operator health strip pattern: status, throughput, error rate, and freshness in one line.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof HealthStrip>;

export const Overview: Story = {
  args: { data: baseData },
};

export const Variants: Story = {
  render: () => (
    <div className="sb-stack">
      <HealthStrip data={baseData} />
      <HealthStrip data={{ ...baseData, api_status: "degraded", error_rate_pct: 4.8, avg_latency_ms: 210 }} />
      <HealthStrip data={{ ...baseData, api_status: "down", prometheus_status: "down", online_nodes: 0, total_nodes: 48, error_rate_pct: 18.2, freshness: "stale", refresh_mode: "poll" }} />
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="sb-stack">
      <p className="m-0">Size variants are not exposed; height is tokenized.</p>
      <HealthStrip data={baseData} />
    </div>
  ),
};

export const States: Story = {
  render: () => <HealthStrip data={baseData} />,
};

export const WithLongText: Story = {
  args: {
    data: { ...baseData, refresh_mode: "streaming-extended", last_updated: new Date().toISOString() },
  },
};

export const DarkMode: Story = {
  parameters: { themes: { themeOverride: "dark" } },
  args: { data: baseData },
};

export const Accessibility: Story = {
  args: { data: baseData },
};

export const EdgeCases = WithLongText;
