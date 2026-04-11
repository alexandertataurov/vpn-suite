import type { Meta, StoryObj } from "@storybook/react";
import { StorySection, StoryShowcase, StoryStack } from "@/design-system";
import { TroubleshooterFlowCard } from "@/design-system/recipes";

const meta: Meta<typeof TroubleshooterFlowCard> = {
  title: "Recipes/Support/TroubleshooterFlowCard",
  tags: ["autodocs"],
  component: TroubleshooterFlowCard,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Troubleshooter flow card for guided support steps and branching actions.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof TroubleshooterFlowCard>;

export const Default: Story = {
  args: {
    eyebrow: "Troubleshooter",
    stepLabel: "Step 1/4",
    title: "Check access status",
    body: "Open Home or Plan. If there is no active plan, choose one before trying device setup.",
    altAction: { label: "No, choose plan", onClick: () => {} },
    nextAction: { label: "Access is active", onClick: () => {} },
  },
  parameters: {
    docs: {
      description: {
        story:
          "First-step troubleshooting card with a back-out action and a forward action. On mobile, the primary next action stays last in the visual stack instead of jumping to the top.",
      },
    },
  },
};

export const Variants: Story = {
  render: () => (
    <StorySection
      title="Variants"
      description="Initial step and back-enabled follow-up step."
    >
      <StoryShowcase>
        <StoryStack>
          <TroubleshooterFlowCard
            eyebrow="Troubleshooter"
            stepLabel="Step 1/4"
            title="Check access status"
            body="Open Home or Plan. If there is no active plan, choose one before trying device setup."
            altAction={{ label: "No, choose plan", onClick: () => {} }}
            nextAction={{ label: "Access is active", onClick: () => {} }}
          />
          <TroubleshooterFlowCard
            eyebrow="Troubleshooter"
            stepLabel="Step 2/4"
            title="Check device setup"
            body="Open Devices and verify your config is imported."
            backAction={{ label: "Back", onClick: () => {} }}
            nextAction={{ label: "Next", onClick: () => {} }}
          />
        </StoryStack>
      </StoryShowcase>
    </StorySection>
  ),
};
