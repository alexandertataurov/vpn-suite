import type { Meta, StoryObj } from "@storybook/react";
import { LiveIndicator } from "./LiveIndicator";

const meta: Meta<typeof LiveIndicator> = {
  title: "Components/LiveIndicator",
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

export const Overview: Story = { args: { status: "live" } };

export const Variants: Story = {
  render: () => (
    <div className="sb-row">
      <LiveIndicator status="live" />
      <LiveIndicator status="paused" />
      <LiveIndicator status="reconnecting" />
      <LiveIndicator status="error" />
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="sb-stack">
      <p className="m-0">Size variants are not exposed; uses tokenized font size.</p>
      <LiveIndicator status="live" />
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <div className="sb-row">
      <LiveIndicator status="live" />
      <LiveIndicator status="paused" />
      <LiveIndicator status="reconnecting" />
    </div>
  ),
};

export const WithLongText: Story = {
  render: () => (
    <div className="sb-row">
      <LiveIndicator status="reconnecting" />
      <span className="text-muted">Live updates are delayed due to network instability across regions</span>
    </div>
  ),
};

export const DarkMode: Story = {
  parameters: { themes: { themeOverride: "dark" } },
  args: { status: "live" },
};

export const Accessibility: Story = {
  args: { status: "live" },
};

export const EdgeCases = WithLongText;
