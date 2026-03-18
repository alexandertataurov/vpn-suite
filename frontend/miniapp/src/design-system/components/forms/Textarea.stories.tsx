import type { Meta, StoryObj } from "@storybook/react";
import { Textarea } from "./Textarea";
import { Stack } from "@/design-system/core/primitives";

const meta: Meta<typeof Textarea> = {
  title: "Components/Textarea",
  tags: ["autodocs"],
  component: Textarea,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Multi-line text input with optional label, description, error. Uses Field primitive and design tokens.",
      },
    },
  },
};

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

export const Stacked: Story = {
  render: () => (
    <Stack gap="4">
      <Textarea label="First" placeholder="First field" />
      <Textarea label="Second" placeholder="Second field" />
    </Stack>
  ),
};
