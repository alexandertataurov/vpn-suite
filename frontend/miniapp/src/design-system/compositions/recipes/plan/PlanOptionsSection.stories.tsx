import type { Meta, StoryObj } from "@storybook/react";
import { StorySection, StoryShowcase, StoryStack } from "@/design-system";
import type { PlanItem } from "@/api";
import { PlanOptionsSection } from "./PlanOptionsSection";

const meta: Meta<typeof PlanOptionsSection> = {
  title: "Recipes/Plan/PlanOptionsSection",
  tags: ["autodocs"],
  component: PlanOptionsSection,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: "Plan-selection section with billing-period toggle, tier cards, and empty-state handling.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

const starterMonthly: PlanItem = {
  id: "starter_monthly",
  name: "Starter",
  duration_days: 30,
  device_limit: 1,
  price_amount: 300,
  price_currency: "XTR",
};

const starterAnnual: PlanItem = {
  id: "starter_annual",
  name: "Starter",
  duration_days: 365,
  device_limit: 2,
  price_amount: 2400,
  price_currency: "XTR",
};

const proMonthly: PlanItem = {
  id: "pro_monthly",
  name: "Pro",
  duration_days: 30,
  device_limit: 5,
  price_amount: 500,
  price_currency: "XTR",
};

const proAnnual: PlanItem = {
  id: "pro_annual",
  name: "Pro",
  duration_days: 365,
  device_limit: 10,
  price_amount: 4800,
  price_currency: "XTR",
};

const tierPairs = [
  {
    key: "starter",
    label: "Starter",
    description: "For one device",
    isCurrent: false,
    monthly: starterMonthly,
    annual: starterAnnual,
  },
  {
    key: "pro",
    label: "Pro",
    description: "For all your devices",
    isCurrent: true,
    monthly: proMonthly,
    annual: proAnnual,
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
  parameters: {
    docs: {
      description: {
        story:
          "Plan-selection section in the subscribed annual state. Use this to verify the tier cards, selected plan, and billing toggle work together.",
      },
    },
  },
  render: (args) => (
    <StoryShowcase>
      <PlanOptionsSection {...args} />
    </StoryShowcase>
  ),
};

export const Variants: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Subscribed, renewal-prompt, and empty-catalog states in one view. Review how the section degrades when there are no visible tiers to choose from.",
      },
    },
  },
  render: () => (
    <StorySection title="Variants" description="Subscribed annual selection, renewal prompt, and empty catalog states.">
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
