import type { Meta, StoryObj } from "@storybook/react";
import { PlanSection } from "./PlanSection";
import { StorySection, StoryShowcase, StoryStack } from "@/design-system";

const meta: Meta<typeof PlanSection> = {
  title: "Recipes/Settings/PlanSection",
  tags: ["autodocs"],
  component: PlanSection,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: "Plan and billing section with plan, devices, cancel, auto-renew toggle.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

const baseArgs = {
  sectionTitle: "Plan & billing",
  planTitle: "Change plan",
  planDescription: "Upgrade or downgrade",
  devicesTitle: "Devices",
  devicesSubtitle: "2 active",
  cancelPlanTitle: "Cancel plan",
  cancelPlanDescription: "Ends Apr 15, 2026",
  onPlanClick: () => {},
  onDevicesClick: () => {},
  onCancelClick: () => {},
  autoRenewTitle: "Auto-renew",
  autoRenewDescription: "Renews Apr 15, 2026",
  autoRenewChecked: true,
  autoRenewDisabled: false,
  onAutoRenewChange: () => {},
};

export const WithPlan: Story = {
  args: {
    ...baseArgs,
    hasPlan: true,
  },
  render: (args) => (
    <StoryShowcase>
      <PlanSection {...args} />
    </StoryShowcase>
  ),
};

export const WithoutPlan: Story = {
  args: {
    ...baseArgs,
    hasPlan: false,
    planTitle: "Choose plan",
    planDescription: "Get started with a VPN plan",
    autoRenewDisabled: true,
    autoRenewDisabledReason: "No active subscription",
  },
  render: (args) => (
    <StoryShowcase>
      <PlanSection {...args} />
    </StoryShowcase>
  ),
};

export const Variants: Story = {
  render: () => (
    <StorySection title="Variants" description="With plan, without plan.">
      <StoryStack>
        <PlanSection {...baseArgs} hasPlan={true} />
        <PlanSection
          {...baseArgs}
          hasPlan={false}
          planTitle="Choose plan"
          planDescription="Get started"
          autoRenewDisabled={true}
          autoRenewDisabledReason="No subscription"
        />
      </StoryStack>
    </StorySection>
  ),
};
