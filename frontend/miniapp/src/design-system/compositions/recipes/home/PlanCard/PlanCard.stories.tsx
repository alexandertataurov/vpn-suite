import type { Meta, StoryObj } from "@storybook/react";
import { PlanCard } from "./PlanCard";
import { StorySection, StoryShowcase, StoryStack } from "@/design-system";

const meta: Meta<typeof PlanCard> = {
  title: "Recipes/Home/PlanCard",
  tags: ["autodocs"],
  component: PlanCard,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Plan card contract per the miniapp spec: status badge, stats strip, border-only styling, and token-driven spacing.",
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
  parameters: {
    docs: {
      description: {
        story:
          "Active plan summary with the default stats strip and renewal date treatment.",
      },
    },
  },
  render: (args) => (
    <StoryShowcase>
      <PlanCard {...args} />
    </StoryShowcase>
  ),
};

export const Variants: Story = {
  render: () => (
    <StorySection
      title="Variants"
      description="Active, expiring, expired, and hero-stat variants in one canonical story."
    >
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
          <PlanCard
            eyebrow="YOUR PLAN"
            plan="Pro"
            planSub="5 devices · annual"
            status="active"
            stats={HERO_STATS}
          />
        </StoryStack>
      </StoryShowcase>
    </StorySection>
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
