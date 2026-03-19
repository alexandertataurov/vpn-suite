import type { Meta, StoryObj } from "@storybook/react";
import { StorySection, StoryShowcase, StoryStack } from "@/design-system";
import { ONBOARDING_STEPS, OnboardingStepCard } from "./OnboardingStepCard";

const meta: Meta<typeof OnboardingStepCard> = {
  title: "Recipes/Onboarding/OnboardingStepCard",
  tags: ["autodocs"],
  component: OnboardingStepCard,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: "Step-driven onboarding card for intro, install, config, open-app, and confirm-connected flows.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

const baseArgs = {
  onboardingError: null,
  appAlreadyInstalled: false,
  onOpenIos: () => {},
  onOpenAndroid: () => {},
  onMarkInstalled: () => {},
  onPrimaryAction: () => {},
  isBusy: false,
  hasActivePlan: false,
  hasActiveDevice: false,
  hasDetectedActivity: false,
  detectedIp: null,
};

export const Default: Story = {
  args: {
    ...baseArgs,
    step: ONBOARDING_STEPS[0],
  },
  render: (args) => (
    <StoryShowcase>
      <OnboardingStepCard {...args} />
    </StoryShowcase>
  ),
};

export const Variants: Story = {
  render: () => (
    <StorySection title="Variants" description="Install, config-ready, and confirmed-activity onboarding states.">
      <StoryShowcase>
        <StoryStack>
          <OnboardingStepCard
            {...baseArgs}
            step={ONBOARDING_STEPS[1]}
          />
          <OnboardingStepCard
            {...baseArgs}
            step={ONBOARDING_STEPS[2]}
            hasActivePlan
          />
          <OnboardingStepCard
            {...baseArgs}
            step={ONBOARDING_STEPS[4]}
            hasActivePlan
            hasActiveDevice
            hasDetectedActivity
            detectedIp="203.0.113.8"
          />
        </StoryStack>
      </StoryShowcase>
    </StorySection>
  ),
};
