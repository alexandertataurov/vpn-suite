import type { Meta, StoryObj } from "@storybook/react";
import { Placeholder } from "./Placeholder";
import "../../styles/admin-operator.css";
import "../../styles/operator-dashboard.css";

const meta: Meta<typeof Placeholder> = {
  title: "Patterns/LoadingStates/Placeholder",
  component: Placeholder,
};

export default meta;

type Story = StoryObj<typeof Placeholder>;

export const Overview: Story = { args: { children: "No data" } };

export const Variants: Story = {
  render: () => (
    <div className="sb-stack">
      <Placeholder>No data</Placeholder>
      <Placeholder title="Data is being fetched">Loading…</Placeholder>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="sb-stack">
      <p className="m-0">Size variants are not exposed; uses tokenized type.</p>
      <Placeholder>No data</Placeholder>
    </div>
  ),
};

export const States: Story = {
  render: () => <Placeholder>No data</Placeholder>,
};

export const WithLongText: Story = {
  args: { children: "No data for the selected time window in this region" },
};

export const DarkMode: Story = {
  parameters: { themes: { themeOverride: "dark" } },
  args: { children: "No data" },
};

export const Accessibility: Story = {
  args: { children: "No data" },
};

export const EdgeCases = WithLongText;
