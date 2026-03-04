import type { Meta, StoryObj } from "@storybook/react";
import { Stat } from "./Stat";

const meta: Meta<typeof Stat> = {
  title: "Shared/Components/Stat",
  component: Stat,
  parameters: {
    docs: {
      description: {
        component: "Numeric stat with optional label, delta.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof Stat>;

export const StatOverview: Story = {
  args: { value: "1,234", label: "Total users" },
};

export const StatVariants: Story = {
  render: () => (
    <div className="sb-row">
      <Stat value="42" unit="ms" label="Latency" />
      <Stat value="100" label="Requests" delta={{ value: "+12%", direction: "up" }} />
      <Stat value="50" label="Errors" delta={{ value: "-5%", direction: "down" }} />
    </div>
  ),
};

export const StatSizes: Story = {
  render: () => (
    <div className="sb-stack">
      <p className="m-0">Size variants are not exposed; uses tokenized type.</p>
      <Stat value="1,234" label="Total users" />
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <div className="sb-row">
      <Stat value="1,234" label="Total users" />
    </div>
  ),
};

export const StatWithLongText: Story = {
  args: { value: "1,234", label: "Total users in the primary region and secondary edge cluster" },
};

export const StatDarkMode: Story = {
  parameters: { themes: { themeOverride: "dark" } },
  args: { value: "1,234", label: "Total users" },
};

export const StatAccessibility: Story = {
  args: { value: "1,234", label: "Total users" },
};

export const StatEdgeCases = WithLongText;
