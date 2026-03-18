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
import { Stack, Panel, Heading, Text } from "@/design-system/core/primitives";

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
    <Stack gap="2">
      <MissionPrimaryButton>Connect now</MissionPrimaryButton>
      <MissionSecondaryButton>Maybe later</MissionSecondaryButton>
      <MissionOperationButton tone="blue" icon="↻" title="Refresh config" description="Generate new profile" />
    </Stack>
  ),
};

export const Chips: Story = {
  render: () => (
    <Stack gap="2" direction="horizontal" wrap>
      <MissionChip tone="neutral">Neutral</MissionChip>
      <MissionChip tone="blue">Blue</MissionChip>
      <MissionChip tone="green">Connected</MissionChip>
      <MissionChip tone="amber">Warning</MissionChip>
      <MissionChip tone="red">Error</MissionChip>
    </Stack>
  ),
};

export const Alerts: Story = {
  render: () => (
    <Stack gap="2">
      <MissionAlert tone="info" title="Info" message="Info message" />
      <MissionAlert tone="warning" title="Warning" message="Warning message" />
      <MissionAlert tone="error" title="Error" message="Error message" />
      <MissionAlert tone="success" title="Success" message="Success message" />
    </Stack>
  ),
};

export const Card: Story = {
  render: () => (
    <MissionCard tone="blue">
      <Panel padding="md">
        <Stack gap="2">
          <Heading level={3}>Mission card</Heading>
          <Text as="p" className="story-text-muted">
            Content
          </Text>
        </Stack>
      </Panel>
    </MissionCard>
  ),
};
