import type { Meta, StoryObj } from "@storybook/react";
import { LiveIndicator } from "./LiveIndicator";

const meta: Meta<typeof LiveIndicator> = {
  title: "Shared/Components/LiveIndicator",
  component: LiveIndicator,
  parameters: {
    docs: {
      description: {
        component: "Status dot: connected, syncing, disconnected.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof LiveIndicator>;

export const LiveIndicatorOverview: Story = { args: { status: "live" } };

export const LiveIndicatorVariants: Story = {
  render: () => (
    <div className="sb-row">
      <LiveIndicator status="live" />
      <LiveIndicator status="paused" />
      <LiveIndicator status="reconnecting" />
      <LiveIndicator status="error" />
    </div>
  ),
};

export const LiveIndicatorSizes: Story = {
  render: () => (
    <div className="sb-stack">
      <p className="m-0">Size variants are not exposed; uses tokenized font size.</p>
      <LiveIndicator status="live" />
    </div>
  ),
};

export const LiveIndicatorStates: Story = {
  render: () => (
    <div className="sb-row">
      <LiveIndicator status="live" />
      <LiveIndicator status="paused" />
      <LiveIndicator status="reconnecting" />
    </div>
  ),
};

export const LiveIndicatorWithLongText: Story = {
  render: () => (
    <div className="sb-row">
      <LiveIndicator status="reconnecting" />
      <span className="text-muted">Live updates are delayed due to network instability across regions</span>
    </div>
  ),
};

export const LiveIndicatorDarkMode: Story = {
  parameters: { themes: { themeOverride: "dark" } },
  args: { status: "live" },
};

export const LiveIndicatorAccessibility: Story = {
  args: { status: "live" },
};

export const LiveIndicatorEdgeCases = WithLongText;
