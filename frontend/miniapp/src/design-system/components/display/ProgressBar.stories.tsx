import type { Meta, StoryObj } from "@storybook/react";
import { ProgressBar } from "./ProgressBar";
import { Stack } from "@/design-system/core/primitives";

const meta = {
  title: "Components/ProgressBar",
  tags: ["autodocs"],
  component: ProgressBar,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Progress indicator with value, label, thresholds. Layouts: stacked, inline, split. Uses design tokens.",
      },
    },
  },
  argTypes: {
    value: { control: { type: "range", min: 0, max: 100 } },
    layout: { control: "select", options: ["stacked", "inline", "split"] },
    size: { control: "select", options: ["primary", "secondary", "connection"] },
  },
} satisfies Meta<typeof ProgressBar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { value: 65, label: "Usage" },
};

export const States: Story = {
  render: () => (
    <Stack gap="6">
      <ProgressBar value={0} label="Empty" valueLabel="0" valueSuffix="GB" />
      <ProgressBar value={50} label="Healthy" valueLabel="50" valueSuffix="GB" />
      <ProgressBar value={85} label="High" valueLabel="85" valueSuffix="GB" />
      <ProgressBar value={100} label="Full" valueLabel="100" valueSuffix="GB" />
    </Stack>
  ),
};

export const Layouts: Story = {
  render: () => (
    <Stack gap="6">
      <ProgressBar value={65} label="Stacked" layout="stacked" valueLabel="65" valueSuffix="%" />
      <ProgressBar value={65} label="Inline" layout="inline" valueLabel="65" valueSuffix="%" />
      <ProgressBar value={65} label="Split" layout="split" valueLabel="65" valueSuffix="%" />
    </Stack>
  ),
};

export const Loading: Story = {
  args: { label: "Loading", loading: true },
};

export const Empty: Story = {
  args: { value: 0, label: "Empty" },
};

export const Full: Story = {
  args: { value: 100, label: "Full" },
};
