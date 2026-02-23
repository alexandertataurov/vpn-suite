import type { Meta, StoryObj } from "@storybook/react";
import { ErrorState } from "./ErrorState";

const meta: Meta<typeof ErrorState> = {
  title: "Primitives/ErrorState",
  component: ErrorState,
  parameters: {
    docs: {
      description: {
        component: "Full-page or section error. Use for fetch failure. Supports retry action.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof ErrorState>;

export const Overview: Story = {
  args: { title: "Failed to load" },
};

export const Variants: Story = {
  render: () => (
    <div className="sb-stack">
      <ErrorState title="Failed to load" message="Network error. Check your connection." />
      <ErrorState title="Failed to load" retry={() => {}} />
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="sb-stack">
      <p className="m-0">Size variants are not exposed; spacing is tokenized.</p>
      <ErrorState title="Failed to load" />
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <ErrorState title="Failed to load" message="Network error." />
  ),
};

export const WithLongText: Story = {
  args: {
    title: "Failed to load telemetry",
    message: "The metrics provider did not respond in time. Retry or check the upstream data source configuration and network status.",
  },
};

export const Accessibility: Story = {
  args: { title: "Failed to load", message: "Error state announces failure." },
};

export const DarkMode: Story = {
  parameters: { themes: { themeOverride: "dark" } },
  args: { title: "Failed to load" },
};

export const EdgeCases = WithLongText;
