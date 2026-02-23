import type { Meta, StoryObj } from "@storybook/react";
import { TimeSeriesPanel } from "./TimeSeriesPanel";
import { Button } from "@vpn-suite/shared/ui";

const meta: Meta<typeof TimeSeriesPanel> = {
  title: "Components/TimeSeriesPanel",
  component: TimeSeriesPanel,
};

export default meta;

type Story = StoryObj<typeof TimeSeriesPanel>;

const ChartPlaceholder = () => <div className="ref-chart-frame ref-chart-frame-size ref-chart-frame-state" />;

export const Overview: Story = {
  render: () => (
    <TimeSeriesPanel title="Latency" subtitle="p95" status="live" actions={<Button variant="ghost" size="sm">Refresh</Button>}>
      <ChartPlaceholder />
    </TimeSeriesPanel>
  ),
};

export const Variants: Story = {
  render: () => (
    <div className="sb-stack">
      <TimeSeriesPanel title="Live" status="live"><ChartPlaceholder /></TimeSeriesPanel>
      <TimeSeriesPanel title="Stale" status="stale"><ChartPlaceholder /></TimeSeriesPanel>
      <TimeSeriesPanel title="Partial" status="partial"><ChartPlaceholder /></TimeSeriesPanel>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="sb-stack">
      <p className="m-0">Height is tokenized via chart frame tokens.</p>
      <TimeSeriesPanel title="Default height" status="live"><ChartPlaceholder /></TimeSeriesPanel>
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <div className="sb-stack">
      <TimeSeriesPanel title="Loading" status="loading" loading />
      <TimeSeriesPanel title="Error" status="error" error="Network error" onRetry={() => {}} />
      <TimeSeriesPanel title="Empty" status="empty" empty />
    </div>
  ),
};

export const WithLongText: Story = {
  render: () => (
    <TimeSeriesPanel
      title="Throughput for core-edge-primary-02-us-east-1"
      subtitle="Last 24 hours"
      status="live"
      actions={<Button variant="ghost" size="sm">Refresh</Button>}
    >
      <ChartPlaceholder />
    </TimeSeriesPanel>
  ),
};

export const EdgeCases = WithLongText;

export const DarkMode: Story = {
  parameters: { themes: { themeOverride: "dark" } },
  render: () => (
    <TimeSeriesPanel title="Latency" status="live"><ChartPlaceholder /></TimeSeriesPanel>
  ),
};

export const Accessibility: Story = {
  render: () => (
    <TimeSeriesPanel title="Accessible panel" status="live"><ChartPlaceholder /></TimeSeriesPanel>
  ),
};
