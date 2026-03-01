import type { Meta, StoryObj } from "@storybook/react";
import { Spinner } from "./Spinner";

const meta: Meta<typeof Spinner> = {
  title: "Primitives/Spinner",
  component: Spinner,
  parameters: {
    docs: {
      description: {
        component: "Loading indicator. Use for async operations. Size: sm, md, lg.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof Spinner>;

export const Overview: Story = {
  args: { size: "md" },
};

export const Variants: Story = {
  render: () => (
    <div className="sb-row">
      <Spinner size="sm" />
      <Spinner size="md" />
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="sb-row">
      <Spinner size="sm" />
      <Spinner size="md" />
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <div className="sb-row">
      <Spinner size="md" />
    </div>
  ),
};

export const WithLongText: Story = {
  render: () => (
    <div className="sb-row">
      <Spinner size="sm" />
      <span className="text-muted">Loading telemetry for the selected region and time window</span>
    </div>
  ),
};

export const DarkMode: Story = {
  parameters: { themes: { themeOverride: "dark" } },
  args: { size: "md" },
};

export const Accessibility: Story = {
  args: { size: "md", "aria-label": "Loading" },
};

export const EdgeCases = WithLongText;
