import type { Meta, StoryObj } from "@storybook/react";
import { PlanNextStepCard } from "./PlanNextStepCard";
import { StorySection, StoryShowcase, StoryStack } from "@/design-system";

const meta: Meta<typeof PlanNextStepCard> = {
  title: "Recipes/Plan/PlanNextStepCard",
  tags: ["autodocs"],
  component: PlanNextStepCard,
  parameters: {
    layout: "padded",
    status: { type: "stable" },
    docs: {
      description: {
        component: "Plan page next-step card pairing a helper note with primary and optional secondary actions.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: "Renew to keep all devices online",
    alertTone: "warning",
    alertTitle: "Subscription renewal needed",
    alertMessage: "Your current period ends soon. Renew now to avoid reconnecting devices later.",
    primaryLabel: "Renew plan",
    primaryTo: "/plan/checkout/pro-annual",
    secondaryLabel: "View plans",
    secondaryTo: "/plan",
    onPrimaryScrollAction: () => {},
  },
  render: (args) => (
    <StoryShowcase>
      <PlanNextStepCard {...args} />
    </StoryShowcase>
  ),
};

export const ScrollAction: Story = {
  args: {
    title: "Pick the best renewal option",
    alertTone: "info",
    alertTitle: "You can switch periods before renewing",
    alertMessage: "Compare monthly and annual plans, then continue when you are ready.",
    primaryLabel: "Show plans",
    primaryUsesScrollAction: true,
    onPrimaryScrollAction: () => {},
  },
  render: (args) => (
    <StoryShowcase>
      <PlanNextStepCard {...args} />
    </StoryShowcase>
  ),
};

export const Tones: Story = {
  render: () => (
    <StorySection title="Alert tones" description="Info, warning, and error variants used by plan renewal flows.">
      <StoryShowcase>
        <StoryStack>
          <PlanNextStepCard
            title="Upgrade available"
            alertTone="info"
            alertTitle="Priority servers included"
            alertMessage="Move to Pro Annual to unlock more devices and faster regions."
            primaryLabel="Upgrade"
            primaryTo="/plan/checkout/pro-annual"
            onPrimaryScrollAction={() => {}}
          />
          <PlanNextStepCard
            title="Renew soon"
            alertTone="warning"
            alertTitle="Access ends in 3 days"
            alertMessage="Renew now so your current devices keep their configuration."
            primaryLabel="Renew"
            primaryTo="/plan/checkout/pro-monthly"
            onPrimaryScrollAction={() => {}}
          />
          <PlanNextStepCard
            title="Payment failed"
            alertTone="error"
            alertTitle="Last renewal attempt did not complete"
            alertMessage="Update your payment method or choose another plan to restore service."
            primaryLabel="View plans"
            primaryTo="/plan"
            secondaryLabel="Support"
            secondaryTo="/support"
            onPrimaryScrollAction={() => {}}
          />
        </StoryStack>
      </StoryShowcase>
    </StorySection>
  ),
};
