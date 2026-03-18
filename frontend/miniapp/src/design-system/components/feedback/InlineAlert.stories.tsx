import type { Meta, StoryObj } from "@storybook/react";
import { InlineAlert } from "./InlineAlert";
import { Stack } from "@/design-system/core/primitives";
import { Button } from "@/design-system/components/Button";

const meta = {
  title: "Components/InlineAlert",
  tags: ["autodocs"],
  component: InlineAlert,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Inline feedback banner. Variants: info, warning, error, success. Uses semantic color tokens.",
      },
    },
  },
  argTypes: {
    variant: { control: "select", options: ["info", "warning", "error", "success"] },
  },
} satisfies Meta<typeof InlineAlert>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { variant: "info", title: "Info", message: "Inline alert message." },
};

export const Variants: Story = {
  render: () => (
    <Stack gap="4">
      <InlineAlert variant="info" title="Info" message="Info message" />
      <InlineAlert variant="warning" title="Warning" message="Warning message" />
      <InlineAlert variant="error" title="Error" message="Error message" />
      <InlineAlert variant="success" title="Success" message="Success message" />
    </Stack>
  ),
};

export const WithActions: Story = {
  render: () => (
    <InlineAlert
      variant="warning"
      title="Action required"
      message="Please review your settings."
      actions={<Button size="sm">Review</Button>}
    />
  ),
};
