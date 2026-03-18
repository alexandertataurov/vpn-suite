import type { Meta, StoryObj } from "@storybook/react";
import { Textarea } from "./Textarea";

const meta = {
  title: "Components/Textarea",
  tags: ["autodocs"],
  component: Textarea,
} satisfies Meta<typeof Textarea>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { placeholder: "Enter text..." },
};

export const WithLabel: Story = {
  args: {
    label: "Notes",
    placeholder: "Optional notes",
    description: "Add any details.",
  },
};

export const WithError: Story = {
  args: {
    label: "Feedback",
    error: "Required field",
  },
};

export const Disabled: Story = {
  args: {
    label: "Read-only",
    value: "Pre-filled content",
    disabled: true,
  },
};
