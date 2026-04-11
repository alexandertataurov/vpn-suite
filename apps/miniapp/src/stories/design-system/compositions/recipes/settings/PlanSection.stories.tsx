import type { Meta, StoryObj } from "@storybook/react";
import { PlanSection } from "@/design-system/recipes";
import { StorySection, StoryShowcase, StoryStack } from "@/design-system";

const meta: Meta<typeof PlanSection> = {
  title: "Recipes/Settings/PlanSection",
  tags: ["autodocs"],
  component: PlanSection,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: "Canonical plan and billing recipe used by Settings, covering active-plan and no-plan states without wrapper duplication.",
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

export const Default: Story = {
  args: {
    ...baseArgs,
    hasPlan: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Settings plan-and-billing section for an active subscription. Review the plan, device, and auto-renew actions as a single grouped control surface.",
      },
    },
  },
  render: (args) => (
    <StoryShowcase>
      <PlanSection {...args} />
    </StoryShowcase>
  ),
};

export const Variants: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Active, no-plan, and disabled-auto-renew states shown together. Use this matrix to check the settings section remains coherent as subscription state changes.",
      },
    },
  },
  render: () => (
    <StorySection title="Variants" description="Active subscription, no subscription, and disabled auto-renew states.">
      <StoryShowcase>
        <StoryStack>
          <PlanSection {...baseArgs} hasPlan />
          <PlanSection
            {...baseArgs}
            hasPlan={false}
            planTitle="Choose plan"
            planDescription="Get started with a VPN plan"
            autoRenewDisabled
            autoRenewDisabledReason="No active subscription"
          />
          <PlanSection
            {...baseArgs}
            hasPlan
            autoRenewChecked={false}
            autoRenewDisabled
            autoRenewDisabledReason="Updating auto-renew"
          />
        </StoryStack>
      </StoryShowcase>
    </StorySection>
  ),
};
