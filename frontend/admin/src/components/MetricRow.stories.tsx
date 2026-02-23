import type { Meta, StoryObj } from "@storybook/react";
import { MetricTile } from "./MetricTile";
import { Activity, ShieldCheck, TriangleAlert } from "lucide-react";

const meta: Meta<typeof MetricTile> = {
  title: "Patterns/MetricRow",
  component: MetricTile,
  parameters: {
    docs: {
      description: {
        component: "Metric row pattern: consistent tile layout for key KPIs.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof MetricTile>;

export const Overview: Story = {
  render: () => (
    <div className="sb-grid" data-columns="3">
      <MetricTile label="Active sessions" value={1823} trend={{ value: 3.2, direction: "up" }} icon={Activity} />
      <MetricTile label="Compliance" value={"99.9"} unit="%" state="success" icon={ShieldCheck} />
      <MetricTile label="Incidents" value={2} state="warning" icon={TriangleAlert} />
    </div>
  ),
};

export const Variants: Story = {
  render: () => (
    <div className="sb-grid" data-columns="3">
      <MetricTile label="Active sessions" value={1823} trend={{ value: 3.2, direction: "up" }} icon={Activity} />
      <MetricTile label="Compliance" value={"99.9"} unit="%" state="success" icon={ShieldCheck} />
      <MetricTile label="Incidents" value={2} state="warning" icon={TriangleAlert} />
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="sb-stack">
      <p className="m-0">Size variants are not exposed; grid density uses layout tokens.</p>
      <div className="sb-grid" data-columns="2">
        <MetricTile label="Active sessions" value={1823} />
        <MetricTile label="Compliance" value={"99.9"} unit="%" />
      </div>
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <div className="sb-grid" data-columns="2">
      <MetricTile label="Active sessions" value={1823} />
      <MetricTile label="Incidents" value={2} state="warning" />
    </div>
  ),
};

export const WithLongText: Story = {
  render: () => (
    <div className="sb-grid" data-columns="2">
      <MetricTile label="Average time to mitigate network instability across regions" value={"12.4"} unit="min" />
      <MetricTile label="Extended label with multi-line subtitle" value={"1.2"} unit="%" subtitle="7-day rolling" />
    </div>
  ),
};

export const DarkMode: Story = {
  parameters: { themes: { themeOverride: "dark" } },
  render: () => (
    <div className="sb-grid" data-columns="3">
      <MetricTile label="Active sessions" value={1823} trend={{ value: 3.2, direction: "up" }} icon={Activity} />
      <MetricTile label="Compliance" value={"99.9"} unit="%" state="success" icon={ShieldCheck} />
      <MetricTile label="Incidents" value={2} state="warning" icon={TriangleAlert} />
    </div>
  ),
};

export const Accessibility: Story = {
  render: () => (
    <div className="sb-grid" data-columns="2">
      <MetricTile label="Accessible label" value={"42"} subtitle="Use clear labels" />
      <MetricTile label="Trend indicator" value={"-1.2"} unit="%" trend={{ value: 1.2, direction: "down" }} />
    </div>
  ),
};

export const EdgeCases = WithLongText;
