import type { Meta, StoryObj } from "@storybook/react";
import { FreshnessBadge } from "./FreshnessBadge";
import "../../styles/admin-operator.css";
import "../../styles/operator-dashboard.css";

const meta: Meta<typeof FreshnessBadge> = {
  title: "Patterns/FreshnessBadge",
  component: FreshnessBadge,
};

export default meta;

type Story = StoryObj<typeof FreshnessBadge>;

export const Overview: Story = {
  args: { freshness: "fresh", children: "3s ago" },
};

export const Variants: Story = {
  render: () => (
    <div className="sb-row">
      <FreshnessBadge freshness="fresh">3s ago</FreshnessBadge>
      <FreshnessBadge freshness="degraded">3m ago</FreshnessBadge>
      <FreshnessBadge freshness="stale" title="Data older than 5 minutes">12m ago</FreshnessBadge>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="sb-stack">
      <p className="m-0">Size variants are not exposed; uses tokenized badge sizing.</p>
      <FreshnessBadge freshness="fresh">3s ago</FreshnessBadge>
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <FreshnessBadge freshness="fresh">3s ago</FreshnessBadge>
  ),
};

export const WithLongText: Story = {
  args: { freshness: "stale", children: "Telemetry delayed for more than 30 minutes" },
};

export const DarkMode: Story = {
  parameters: { themes: { themeOverride: "dark" } },
  args: { freshness: "fresh", children: "3s ago" },
};

export const Accessibility: Story = {
  args: { freshness: "stale", children: "12m ago", title: "Data older than 5 minutes" },
};

export const EdgeCases = WithLongText;
