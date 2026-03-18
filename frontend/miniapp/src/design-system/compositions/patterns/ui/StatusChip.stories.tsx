import type { Meta, StoryObj } from "@storybook/react";
import { StatusChip } from "./StatusChip";
import { Inline } from "@/design-system/core/primitives";

const meta: Meta<typeof StatusChip> = {
  title: "Patterns/StatusChip",
  tags: ["autodocs"],
  component: StatusChip,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Status chip for subscription/connection states. Variants: active, paid, info, pending, offline, blocked, warning, danger. Uses design tokens.",
      },
    },
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["active", "paid", "info", "pending", "pend", "offline", "blocked", "warning", "danger"],
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { children: "Active", variant: "active" },
};

export const Variants: Story = {
  render: () => (
    <Inline gap="2" wrap>
      <StatusChip variant="active">Active</StatusChip>
      <StatusChip variant="paid">Paid</StatusChip>
      <StatusChip variant="info">Info</StatusChip>
      <StatusChip variant="pending">Pending</StatusChip>
      <StatusChip variant="offline">Offline</StatusChip>
      <StatusChip variant="blocked">Blocked</StatusChip>
      <StatusChip variant="warning">Warning</StatusChip>
      <StatusChip variant="danger">Danger</StatusChip>
    </Inline>
  ),
};
