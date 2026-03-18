import type { Meta, StoryObj } from "@storybook/react";
import { PlanCard } from "./PlanCard";
import { StorySection, StoryShowcase, StoryStack } from "@/design-system";

const meta: Meta<typeof PlanCard> = {
  title: "Recipes/PlanCard",
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
  render: (args) => (
    <StoryShowcase>
      <PlanCard {...args} />
    </StoryShowcase>
  ),
};

export const States: Story = {
  render: () => (
    <StorySection title="States" description="Active, expiring, expired.">
      <StoryShowcase>
        <StoryStack>
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
        </StoryStack>
      </StoryShowcase>
    </StorySection>
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
  render: (args) => (
    <StoryShowcase>
      <PlanCard {...args} />
    </StoryShowcase>
  ),
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
  render: (args) => (
    <StoryShowcase>
      <PlanCard {...args} />
    </StoryShowcase>
  ),
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
  render: (args) => (
    <StoryShowcase>
      <PlanCard {...args} />
    </StoryShowcase>
  ),
};

const HERO_STATS = [
  { label: "Devices", value: "2", dim: " / 5", tone: "default" as const },
  { label: "Renews", value: "Apr 1", tone: "default" as const },
  { label: "Traffic", value: "∞", tone: "default" as const },
];

export const HeroVariant: Story = {
  args: {
    eyebrow: "YOUR PLAN",
    plan: "Pro",
    planSub: "5 devices · annual",
    status: "active",
    stats: HERO_STATS,
  },
  render: (args) => (
    <StoryShowcase>
      <PlanCard {...args} />
    </StoryShowcase>
  ),
};
