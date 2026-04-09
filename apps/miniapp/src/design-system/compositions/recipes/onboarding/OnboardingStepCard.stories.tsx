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
        component:
          "Step-driven onboarding card for intro, install, config, open-app, and confirm-connected flows.",
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
  parameters: {
    docs: {
      description: {
        story:
          "Intro step before the user has installed the app or created a device.",
      },
    },
  },
  render: (args) => (
    <StoryShowcase>
      <OnboardingStepCard {...args} />
    </StoryShowcase>
  ),
};

export const Variants: Story = {
  render: () => (
    <StorySection
      title="Variants"
      description="Install, config-ready, and confirmed-activity onboarding states."
    >
      <StoryShowcase>
        <StoryStack>
          <OnboardingStepCard
            {...baseArgs}
            step={ONBOARDING_STEPS[1]}
          />
          <OnboardingStepCard
            {...baseArgs}
            step={ONBOARDING_STEPS[1]}
            appAlreadyInstalled
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

export const FlowSequence: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "A compact sequence of the most common onboarding waypoints. Use this to check how the guidance and primary CTA evolve as the user moves from install to confirmation.",
      },
    },
  },
  render: () => (
    <StorySection title="Flow sequence" description="Install, config, and confirm waypoints shown together.">
      <StoryShowcase>
        <StoryStack>
          <OnboardingStepCard
            {...baseArgs}
            step={ONBOARDING_STEPS[0]}
          />
          <OnboardingStepCard
            {...baseArgs}
            step={ONBOARDING_STEPS[1]}
            appAlreadyInstalled
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
