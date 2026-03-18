import type { Meta, StoryObj } from "@storybook/react";
import { PlanCard } from "./PlanCard";

const meta = {
  title: "Patterns/PlanCard",
  tags: ["autodocs"],
  component: PlanCard,
  parameters: {
    docs: { description: { component: "Plan card per amnezia spec §4.3. Borders only, no shadows." } },
  },
} satisfies Meta<typeof PlanCard>;

export default meta;

type Story = StoryObj<typeof meta>;

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
