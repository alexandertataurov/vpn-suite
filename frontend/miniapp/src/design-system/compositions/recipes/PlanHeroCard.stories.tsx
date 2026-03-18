import type { Meta, StoryObj } from "@storybook/react";
import { PlanHeroCard } from "./PlanHeroCard";

const meta = {
  title: "Patterns/PlanHeroCard",
  tags: ["autodocs"],
  component: PlanHeroCard,
  parameters: {
    docs: { description: { component: "Amnezia-spec plan hero card with status badge and stats grid." } },
  },
} satisfies Meta<typeof PlanHeroCard>;

export default meta;

type Story = StoryObj<typeof meta>;

const defaultStats = [
  { label: "Devices", value: "2", dim: " / 5" },
  { label: "Duration", value: "30", dim: " days" },
  { label: "Expires", value: "Apr 15", tone: "default" as const },
];

export const Active: Story = {
  args: {
    eyebrow: "Pro Monthly",
    planName: "Pro Monthly",
    subtitle: "AmneziaWG · 3 devices",
    status: "active",
    stats: defaultStats,
  },
};

export const Expiring: Story = {
  args: {
    eyebrow: "Pro Monthly",
    planName: "Pro Monthly",
    subtitle: "AmneziaWG · 3 devices",
    status: "expiring",
    stats: [
      { label: "Devices", value: "3", dim: " / 5" },
      { label: "Duration", value: "30", dim: " days" },
      { label: "Expires", value: "Apr 15", tone: "expiring" as const },
    ],
  },
};

export const Expired: Story = {
  args: {
    eyebrow: "Pro Monthly",
    planName: "Pro Monthly",
    subtitle: "AmneziaWG · 3 devices",
    status: "expired",
    stats: [
      { label: "Devices", value: "3", dim: " / 5" },
      { label: "Duration", value: "30", dim: " days" },
      { label: "Expires", value: "Apr 15", tone: "expired" as const },
    ],
  },
};
