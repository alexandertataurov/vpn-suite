import type { Meta, StoryObj } from "@storybook/react";
import { MetricTile } from "@/design-system";
import { IconUsers } from "@/design-system/icons";

const meta: Meta<typeof MetricTile> = {
  title: "Components/MetricTile",
  component: MetricTile,
  parameters: {
    docs: {
      description: {
        component: "KPI card: label, value, unit, trend, icon. Dashboard pattern.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof MetricTile>;

export const Overview: Story = {
  args: { label: "Active users", value: "1,234" },
};

export const Variants: Story = {
  render: () => (
    <div className="sb-grid" data-columns="3">
      <MetricTile label="Revenue" value="42" unit="K" />
      <MetricTile label="Sessions" value="5,678" trend={{ value: 12, direction: "up" }} />
      <MetricTile label="Users" value="100" icon={IconUsers} />
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="sb-stack">
      <p className="m-0">Size variants are not exposed; spacing is tokenized.</p>
      <MetricTile label="Active users" value="1,234" />
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <MetricTile label="Sessions" value="5,678" trend={{ value: 12, direction: "up" }} />
  ),
};

export const WithLongText: Story = {
  args: { label: "Active users across the primary and secondary regions", value: "1,234" },
};

export const DarkMode: Story = {
  parameters: { themes: { themeOverride: "dark" } },
  args: { label: "Active users", value: "1,234" },
};

export const Accessibility: Story = {
  args: { label: "Active users", value: "1,234" },
};

export const EdgeCases = WithLongText;
