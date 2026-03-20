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
        component: "Plan-page next-step card pairing helper text with primary and optional secondary actions.",
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
  parameters: {
    docs: {
      description: {
        story:
          "Primary next-step card for renewal flows. Review the alert copy and the action pairing that should move the user back into the plan journey.",
      },
    },
  },
  render: (args) => (
    <StoryShowcase>
      <PlanNextStepCard {...args} />
    </StoryShowcase>
  ),
};

export const Variants: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Scroll-action, upgrade, renewal, and payment-failure states shown together. Use the matrix to confirm the CTA changes with the user’s next task.",
      },
    },
  },
  render: () => (
    <StorySection title="Variants" description="Scroll-action, warning, and error-state plan next-step flows.">
      <StoryShowcase>
        <StoryStack>
          <PlanNextStepCard
            title="Pick the best renewal option"
            alertTone="info"
            alertTitle="You can switch periods before renewing"
            alertMessage="Compare monthly and annual plans, then continue when you are ready."
            primaryLabel="Show plans"
            primaryUsesScrollAction={true}
            onPrimaryScrollAction={() => {}}
          />
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
