import type { Meta, StoryObj } from "@storybook/react";
import { Badge } from "./Badge";
import { Inline } from "@/design-system/core/primitives";

const meta: Meta<typeof Badge> = {
  title: "Components/Badge",
  tags: ["autodocs"],
  component: Badge,
  parameters: {
    layout: "padded",
    status: { type: "stable" },
    docs: {
      description: {
        component: "Inline status badge. Variants: warning, error, muted, success.",
      },
    },
  },
  argTypes: {
    variant: { control: "select", options: ["warning", "error", "muted", "success"] },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { label: "14d left", variant: "warning" },
};

export const Variants: Story = {
  render: () => (
    <Inline gap="2" wrap>
      <Badge label="Warning" variant="warning" />
      <Badge label="Error" variant="error" />
      <Badge label="Muted" variant="muted" />
      <Badge label="Success" variant="success" />
    </Inline>
  ),
};
