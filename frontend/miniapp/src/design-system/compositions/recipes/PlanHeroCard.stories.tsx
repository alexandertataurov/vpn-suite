import type { Meta, StoryObj } from "@storybook/react";
import { PlanHeroCard } from "./PlanHeroCard";
import { Stack } from "@/design-system/core/primitives";

const meta: Meta<typeof PlanHeroCard> = {
  title: "Patterns/PlanHeroCard",
  tags: ["autodocs"],
  component: PlanHeroCard,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Amnezia-spec plan hero card with status badge and stats grid. Uses design tokens.",
      },
    },
  },
  argTypes: {
    status: { control: "select", options: ["active", "expiring", "expired"] },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

const DEFAULT_STATS = [
  { label: "Devices", value: "2", dim: " / 5" },
  { label: "Duration", value: "30", dim: " days" },
  { label: "Expires", value: "Apr 15", tone: "default" as const },
];

export const Default: Story = {
  args: {
    eyebrow: "Pro Monthly",
    planName: "Pro Monthly",
    subtitle: "AmneziaWG · 3 devices",
    status: "active",
    stats: DEFAULT_STATS,
  },
};

export const States: Story = {
  render: () => (
    <Stack gap="6">
      <PlanHeroCard
        eyebrow="Pro Monthly"
        planName="Pro Monthly"
        subtitle="AmneziaWG · 3 devices"
        status="active"
        stats={DEFAULT_STATS}
      />
      <PlanHeroCard
        eyebrow="Pro Monthly"
        planName="Pro Monthly"
        subtitle="AmneziaWG · 3 devices"
        status="expiring"
        stats={[
          { label: "Devices", value: "3", dim: " / 5" },
          { label: "Duration", value: "30", dim: " days" },
          { label: "Expires", value: "Apr 15", tone: "expiring" as const },
        ]}
      />
      <PlanHeroCard
        eyebrow="Pro Monthly"
        planName="Pro Monthly"
        subtitle="AmneziaWG · 3 devices"
        status="expired"
        stats={[
          { label: "Devices", value: "3", dim: " / 5" },
          { label: "Duration", value: "30", dim: " days" },
          { label: "Expires", value: "Apr 15", tone: "expired" as const },
        ]}
      />
    </Stack>
  ),
};

export const Active: Story = {
  args: {
    eyebrow: "Pro Monthly",
    planName: "Pro Monthly",
    subtitle: "AmneziaWG · 3 devices",
    status: "active",
    stats: DEFAULT_STATS,
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
