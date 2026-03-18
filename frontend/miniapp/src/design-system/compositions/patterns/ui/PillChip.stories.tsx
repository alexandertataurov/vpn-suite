import type { Meta, StoryObj } from "@storybook/react";
import { PillChip } from "./PillChip";
import { Inline } from "@/design-system/core/primitives";

const meta = {
  title: "Patterns/PillChip",
  tags: ["autodocs"],
  component: PillChip,
  argTypes: {
    variant: { control: "select", options: ["beta", "active", "expiring", "expired"] },
  },
} satisfies Meta<typeof PillChip>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { children: "PRO", variant: "active" },
};

export const Variants: Story = {
  render: () => (
    <Inline gap="2" wrap>
      <PillChip variant="beta">Beta</PillChip>
      <PillChip variant="active">PRO</PillChip>
      <PillChip variant="expiring">Expiring</PillChip>
      <PillChip variant="expired">Expired</PillChip>
    </Inline>
  ),
};
