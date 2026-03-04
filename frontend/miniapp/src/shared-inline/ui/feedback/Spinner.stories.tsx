import type { Meta, StoryObj } from "@storybook/react";
import { Spinner } from "./Spinner";

const meta: Meta<typeof Spinner> = {
  title: "Shared/Primitives/Spinner",
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

export const SpinnerOverview: Story = {
  args: { size: "md" },
};

export const SpinnerVariants: Story = {
  render: () => (
    <div className="sb-row">
      <Spinner size="sm" />
      <Spinner size="md" />
    </div>
  ),
};

export const SpinnerSizes: Story = {
  render: () => (
    <div className="sb-row">
      <Spinner size="sm" />
      <Spinner size="md" />
    </div>
  ),
};

export const SpinnerStates: Story = {
  render: () => (
    <div className="sb-row">
      <Spinner size="md" />
    </div>
  ),
};

export const SpinnerWithLongText: Story = {
  render: () => (
    <div className="sb-row">
      <Spinner size="sm" />
      <span className="text-muted">Loading telemetry for the selected region and time window</span>
    </div>
  ),
};

export const SpinnerDarkMode: Story = {
  parameters: { themes: { themeOverride: "dark" } },
  args: { size: "md" },
};

export const SpinnerAccessibility: Story = {
  args: { size: "md", "aria-label": "Loading" },
};

export const SpinnerEdgeCases = WithLongText;
