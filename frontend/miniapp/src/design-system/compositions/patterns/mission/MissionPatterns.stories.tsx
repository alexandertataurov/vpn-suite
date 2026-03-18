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
import { Stack } from "@/design-system/core/primitives";

const meta = {
  title: "Patterns/Mission",
  tags: ["autodocs", "contract-test"],
  parameters: {
    docs: { description: { component: "Mission patterns for operational screens." } },
  },
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
} satisfies Meta;

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
      <div style={{ padding: "var(--spacing-4)" }}>
        <h3 style={{ margin: 0, fontSize: "var(--typo-h3-size)" }}>Mission card</h3>
        <p style={{ margin: "var(--spacing-2) 0 0", color: "var(--color-text-muted)" }}>Content</p>
      </div>
    </MissionCard>
  ),
};
