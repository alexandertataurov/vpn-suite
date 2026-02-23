import type { Meta, StoryObj } from "@storybook/react";
import { TopStatusBar } from "./TopStatusBar";
import type { OperatorHealthStrip } from "@vpn-suite/shared/types";
import "../../styles/admin-operator.css";
import "../../styles/operator-dashboard.css";

const meta: Meta<typeof TopStatusBar> = {
  title: "Components/TopStatusBar",
  component: TopStatusBar,
};

export default meta;

const base: OperatorHealthStrip = {
  api_status: "ok",
  prometheus_status: "ok",
  total_nodes: 3,
  online_nodes: 3,
  active_sessions: 42,
  total_throughput_bps: 1_500_000_000,
  avg_latency_ms: 421,
  error_rate_pct: 0,
  last_updated: new Date().toISOString(),
  refresh_mode: "polling",
  freshness: "fresh",
};

type Story = StoryObj<typeof TopStatusBar>;

export const Overview: Story = { args: { data: base } };

export const Variants: Story = {
  render: () => (
    <div className="sb-stack">
      <TopStatusBar data={base} />
      <TopStatusBar data={{ ...base, api_status: "degraded", error_rate_pct: 2.5, freshness: "degraded" }} />
      <TopStatusBar data={{ ...base, api_status: "down", prometheus_status: "down", online_nodes: 1, error_rate_pct: 15, freshness: "stale", last_updated: new Date(Date.now() - 10 * 60_000).toISOString() }} />
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="sb-stack">
      <p className="m-0">Size variants are not exposed; height is tokenized.</p>
      <TopStatusBar data={base} />
    </div>
  ),
};

export const States: Story = {
  render: () => <TopStatusBar data={base} />,
};

export const WithLongText: Story = {
  args: { data: { ...base, refresh_mode: "streaming-extended" } },
};

export const DarkMode: Story = {
  parameters: { themes: { themeOverride: "dark" } },
  args: { data: base },
};

export const Accessibility: Story = {
  args: { data: base },
};

export const EdgeCases = WithLongText;
