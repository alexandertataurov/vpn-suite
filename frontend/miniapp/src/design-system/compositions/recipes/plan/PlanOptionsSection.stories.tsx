import type { Meta, StoryObj } from "@storybook/react";
import { StorySection, StoryShowcase, StoryStack } from "@/design-system";
import { PlanOptionsSection } from "./PlanOptionsSection";

const meta: Meta<typeof PlanOptionsSection> = {
  title: "Recipes/Plan/PlanOptionsSection",
  tags: ["autodocs"],
  component: PlanOptionsSection,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: "Plan selection section with billing-period toggle, tier cards, and empty-state handling.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

const tierPairs = [
  {
    key: "starter",
    label: "Starter",
    description: "For one device",
    isCurrent: false,
    monthly: { id: "starter_monthly", duration_days: 30, price_amount: 300 },
    annual: { id: "starter_annual", duration_days: 365, price_amount: 2400 },
    features: [
      { kind: "device_limit", value: 1 },
      { kind: "protocol", value: "amneziawg" },
    ],
  },
  {
    key: "pro",
    label: "Pro",
    description: "For all your devices",
    isCurrent: true,
    monthly: { id: "pro_monthly", duration_days: 30, price_amount: 500 },
    annual: { id: "pro_annual", duration_days: 365, price_amount: 4800 },
    features: [
      { kind: "device_limit", value: 5 },
      { kind: "support", value: "priority" },
    ],
  },
];

const baseArgs = {
  isSubscribed: true,
  billingPeriod: "annual" as const,
  hasAnnualOptions: true,
  visibleTierPairs: tierPairs,
  primaryPlanId: "pro_annual",
  subscriptionState: "active",
  showRenewOrUpgradeCta: false,
  selectedTierKey: "pro",
  onBillingPeriodChange: () => {},
  onTierFocus: () => {},
  onTierSelect: () => {},
};

export const Default: Story = {
  args: baseArgs,
  render: (args) => (
    <StoryShowcase>
      <PlanOptionsSection {...args} />
    </StoryShowcase>
  ),
};

export const Variants: Story = {
  render: () => (
    <StorySection title="Variants" description="Subscribed annual selection, renewal prompt, and empty plan catalog states.">
      <StoryShowcase>
        <StoryStack>
          <PlanOptionsSection {...baseArgs} />
          <PlanOptionsSection
            {...baseArgs}
            subscriptionState="expiring"
            showRenewOrUpgradeCta
          />
          <PlanOptionsSection
            {...baseArgs}
            isSubscribed={false}
            visibleTierPairs={[]}
            primaryPlanId={null}
            selectedTierKey=""
          />
        </StoryStack>
      </StoryShowcase>
    </StorySection>
  ),
};
