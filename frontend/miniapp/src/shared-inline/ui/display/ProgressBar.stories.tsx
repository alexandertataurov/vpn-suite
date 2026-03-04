import type { Meta, StoryObj } from "@storybook/react";
import { ProgressBar } from "./ProgressBar";

const meta: Meta<typeof ProgressBar> = {
  title: "Shared/Components/ProgressBar",
  component: ProgressBar,
  parameters: {
    docs: {
      description: {
        component: "Progress indicator. value 0-100. Indeterminate when no value.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof ProgressBar>;

export const ProgressBarOverview: Story = {
  args: { value: 50, label: "Progress" },
};

export const ProgressBarVariants: Story = {
  render: () => (
    <div className="sb-stack">
      <ProgressBar value={25} label="Quarter" />
      <ProgressBar value={50} label="Half" />
      <ProgressBar value={100} label="Complete" />
    </div>
  ),
};

export const ProgressBarSizes: Story = {
  render: () => (
    <div className="sb-stack">
      <p className="m-0">Size variants are not exposed; height is token-defined.</p>
      <ProgressBar value={60} />
    </div>
  ),
};

export const ProgressBarStates: Story = {
  render: () => (
    <div className="sb-stack">
      <ProgressBar value={0} label="Empty" />
      <ProgressBar value={50} label="In progress" />
      <ProgressBar value={100} label="Complete" />
    </div>
  ),
};

export const ProgressBarWithLongText: Story = {
  args: { value: 66, label: "Migration progress for eu-west cluster with extended label" },
};

export const ProgressBarDarkMode: Story = {
  parameters: { themes: { themeOverride: "dark" } },
  args: { value: 50, label: "Progress" },
};

export const ProgressBarAccessibility: Story = {
  args: { value: 50, label: "Progress bar" },
};

export const ProgressBarEdgeCases = WithLongText;
