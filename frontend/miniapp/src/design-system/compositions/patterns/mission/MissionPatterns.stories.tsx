import type { Meta, StoryObj } from "@storybook/react";
import { MemoryRouter } from "react-router-dom";
import {
  MissionPrimaryButton,
  MissionSecondaryButton,
  MissionOperationButton,
  MissionCard,
  MissionChip,
  MissionAlert,
} from "@/design-system/compositions/patterns";
import { Panel, Heading, Text } from "@/design-system/core/primitives";
import { StorySection, StoryShowcase, StoryStack, StoryGrid } from "@/design-system";

const meta: Meta = {
  title: "Patterns/Mission",
  tags: ["autodocs", "contract-test"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Mission patterns for operational screens: buttons, chips, alerts, cards. Uses design tokens.",
      },
    },
  },
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Buttons: Story = {
  render: () => (
    <StorySection title="Buttons" description="Primary, secondary, and operation buttons.">
      <StoryShowcase>
        <StoryStack>
          <MissionPrimaryButton>Connect now</MissionPrimaryButton>
          <MissionSecondaryButton>Maybe later</MissionSecondaryButton>
          <MissionOperationButton
            tone="blue"
            icon="↻"
            title="Refresh config"
            description="Generate new profile"
          />
        </StoryStack>
      </StoryShowcase>
    </StorySection>
  ),
};

export const Chips: Story = {
  render: () => (
    <StorySection title="Chips" description="Status chips for mission screens.">
      <StoryShowcase>
        <StoryGrid>
          <MissionChip tone="neutral">Neutral</MissionChip>
          <MissionChip tone="blue">Blue</MissionChip>
          <MissionChip tone="green">Connected</MissionChip>
          <MissionChip tone="amber">Warning</MissionChip>
          <MissionChip tone="red">Error</MissionChip>
        </StoryGrid>
      </StoryShowcase>
    </StorySection>
  ),
};

export const Alerts: Story = {
  render: () => (
    <StorySection title="Alerts" description="Mission alert variants.">
      <StoryShowcase>
        <StoryStack>
          <MissionAlert tone="info" title="Info" message="Info message" />
          <MissionAlert tone="warning" title="Warning" message="Warning message" />
          <MissionAlert tone="error" title="Error" message="Error message" />
          <MissionAlert tone="success" title="Success" message="Success message" />
        </StoryStack>
      </StoryShowcase>
    </StorySection>
  ),
};

export const Card: Story = {
  render: () => (
    <StorySection title="Card" description="Mission card with tone.">
      <StoryShowcase>
        <MissionCard tone="blue">
          <Panel padding="md">
            <StoryStack>
              <Heading level={3}>Mission card</Heading>
              <Text as="p" className="story-text-muted">
                Content for operational screens.
              </Text>
            </StoryStack>
          </Panel>
        </MissionCard>
      </StoryShowcase>
    </StorySection>
  ),
};
