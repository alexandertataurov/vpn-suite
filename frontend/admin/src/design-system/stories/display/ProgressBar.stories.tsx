import type { Meta, StoryObj } from "@storybook/react";
import { ProgressBar } from "@/design-system";

const meta: Meta<typeof ProgressBar> = {
  title: "Components/ProgressBar",
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

export const Overview: Story = {
  args: { value: 50, label: "Progress" },
};

export const Variants: Story = {
  render: () => (
    <div className="sb-stack">
      <ProgressBar value={25} label="Quarter" />
      <ProgressBar value={50} label="Half" />
      <ProgressBar value={100} label="Complete" />
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="sb-stack">
      <p className="m-0">Size variants are not exposed; height is token-defined.</p>
      <ProgressBar value={60} />
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <div className="sb-stack">
      <ProgressBar value={0} label="Empty" />
      <ProgressBar value={50} label="In progress" />
      <ProgressBar value={100} label="Complete" />
    </div>
  ),
};

export const WithLongText: Story = {
  args: { value: 66, label: "Migration progress for eu-west cluster with extended label" },
};

export const DarkMode: Story = {
  parameters: { themes: { themeOverride: "dark" } },
  args: { value: 50, label: "Progress" },
};

export const Accessibility: Story = {
  args: { value: 50, label: "Progress bar" },
};

export const EdgeCases = WithLongText;
