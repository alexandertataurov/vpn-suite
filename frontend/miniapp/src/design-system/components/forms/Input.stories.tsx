import type { Meta, StoryObj } from "@storybook/react";
import { Input } from "./Input";
import { Stack } from "@/design-system/core/primitives";

const meta = {
  title: "Components/Input",
  tags: ["autodocs", "contract-test"],
  component: Input,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Text input with optional label, description, error, success. Uses Field primitive and design tokens.",
      },
    },
  },
  argTypes: {
    type: { control: "select", options: ["text", "email", "password"] },
  },
} satisfies Meta<typeof Input>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { placeholder: "Enter value" },
};

export const WithLabel: Story = {
  args: { label: "Email", placeholder: "you@example.com", type: "email" },
};

export const WithDescription: Story = {
  args: {
    label: "Username",
    placeholder: "username",
    description: "Choose a unique username.",
  },
};

export const WithError: Story = {
  args: { label: "Username", placeholder: "username", error: "Username is required" },
};

export const WithSuccess: Story = {
  args: {
    label: "Email",
    value: "valid@example.com",
    success: "Email verified",
  },
};

export const Disabled: Story = {
  args: { label: "Protocol", value: "AmneziaWG", disabled: true },
};

export const Stacked: Story = {
  render: () => (
    <Stack gap="4">
      <Input label="First" placeholder="First field" />
      <Input label="Second" placeholder="Second field" />
    </Stack>
  ),
};
