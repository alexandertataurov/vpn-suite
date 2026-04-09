import type { Meta, StoryObj } from "@storybook/react";
import { StorySection, StoryShowcase, StoryStack } from "@/design-system";
import { DevicesEmptyState } from "./DevicesEmptyState";

const meta: Meta<typeof DevicesEmptyState> = {
  title: "Recipes/Devices/DevicesEmptyState",
  tags: ["autodocs"],
  component: DevicesEmptyState,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Devices-specific empty state used on the Devices page when no active devices are available yet.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: "No devices yet",
    message: "Add your first device to issue a config, then import it in AmneziaVPN.",
  },
  parameters: {
    docs: {
      description: {
        story:
          "Primary empty state for subscribed users who can start by adding their first device.",
      },
    },
  },
  render: (args) => (
    <StoryShowcase>
      <DevicesEmptyState {...args} />
    </StoryShowcase>
  ),
};

export const Variants: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Subscribed and no-subscription copy variants shown together to match the live Devices page branches.",
      },
    },
  },
  render: () => (
    <StorySection
      title="Variants"
      description="Device onboarding copy changes depending on whether the user already has an active subscription."
    >
      <StoryShowcase>
        <StoryStack>
          <DevicesEmptyState
            title="No devices yet"
            message="Add your first device to issue a config, then import it in AmneziaVPN."
          />
          <DevicesEmptyState
            title="No devices yet"
            message="Choose a plan first, then come back here to issue and manage your device configs."
          />
        </StoryStack>
      </StoryShowcase>
    </StorySection>
  ),
};
