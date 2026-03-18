import type { Meta, StoryObj } from "@storybook/react";
import { StatusChip } from "./StatusChip";
import { Inline } from "@/design-system/core/primitives";

const meta = {
  title: "Patterns/StatusChip",
  tags: ["autodocs"],
  component: StatusChip,
  argTypes: {
    variant: {
      control: "select",
      options: ["active", "paid", "info", "pending", "pend", "offline", "blocked", "warning", "danger"],
    },
  },
} satisfies Meta<typeof StatusChip>;

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
