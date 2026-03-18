import type { Meta, StoryObj } from "@storybook/react";
import { PlanCard } from "./PlanCard";
import { Stack } from "@/design-system/core/primitives";

const meta: Meta<typeof PlanCard> = {
  title: "Patterns/PlanCard",
  tags: ["autodocs"],
  component: PlanCard,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Plan card per amnezia spec §4.3. Status badge + stats strip. Borders only, no shadows. Uses design tokens.",
      },
    },
  },
  argTypes: {
    status: { control: "select", options: ["active", "expiring", "expired"] },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    plan: "Pro",
    planSub: "5 devices · annual",
    status: "active",
    devices: 2,
    deviceLimit: 5,
    renewsLabel: "Apr 1",
  },
};

export const States: Story = {
  render: () => (
    <Stack gap="4">
      <PlanCard
        plan="Pro"
        planSub="5 devices · annual"
        status="active"
        devices={2}
        deviceLimit={5}
        renewsLabel="Apr 1"
      />
      <PlanCard
        plan="Pro"
        planSub="5 devices · annual"
        status="expiring"
        devices={3}
        deviceLimit={5}
        renewsLabel="14d"
      />
      <PlanCard
        plan="Pro"
        planSub="5 devices · annual"
        status="expired"
        devices={3}
        deviceLimit={5}
        renewsLabel="Mar 10"
      />
    </Stack>
  ),
};

export const Active: Story = {
  args: {
    plan: "Pro",
    planSub: "5 devices · annual",
    status: "active",
    devices: 2,
    deviceLimit: 5,
    renewsLabel: "Apr 1",
  },
};

export const Expiring: Story = {
  args: {
    plan: "Pro",
    planSub: "5 devices · annual",
    status: "expiring",
    devices: 3,
    deviceLimit: 5,
    renewsLabel: "14d",
  },
};

export const Expired: Story = {
  args: {
    plan: "Pro",
    planSub: "5 devices · annual",
    status: "expired",
    devices: 3,
    deviceLimit: 5,
    renewsLabel: "Mar 10",
  },
};
