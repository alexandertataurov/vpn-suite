import type { Meta, StoryObj } from "@storybook/react";
import { ProgressBar } from "../components/display/ProgressBar";

const meta = {
  title: "Design System/Components/ProgressBar",
  tags: ["autodocs"],
  component: ProgressBar,
  parameters: {
    docs: { description: { component: "Progress bar with optional tone." } },
  },
  argTypes: { value: { control: { type: "range", min: 0, max: 100 } } },
} satisfies Meta<typeof ProgressBar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { value: 60 },
};

export const Empty: Story = {
  args: { value: 0 },
};

export const Full: Story = {
  args: { value: 100 },
};
