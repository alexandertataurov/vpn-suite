import type { Meta, StoryObj } from "@storybook/react";
import { SettingsCard, ToggleRow } from "./ContentForms";
import { StorySection, StoryShowcase } from "@/design-system";

const meta: Meta<typeof SettingsCard> = {
  title: "Patterns/SettingsCard",
  tags: ["autodocs"],
  component: SettingsCard,
  parameters: {
    layout: "padded",
    status: { type: "stable" },
    docs: {
      description: {
        component:
          "Settings card with automatic dividers between rows. Use it to group ToggleRow, SettingsButton, and related settings content.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story: "Standard settings block with two toggles and automatic separators.",
      },
    },
  },
  render: () => (
    <StoryShowcase>
      <SettingsCard>
        <ToggleRow
          name="Notifications"
          description="Receive push notifications"
          checked={true}
          onChange={() => {}}
        />
        <ToggleRow
          name="Dark mode"
          description="Use dark theme"
          checked={false}
          onChange={() => {}}
        />
      </SettingsCard>
    </StoryShowcase>
  ),
};

export const WithDividers: Story = {
  render: () => (
    <StorySection title="With dividers" description="Explicit divider mode for compact preference groups.">
      <StoryShowcase>
        <SettingsCard divider>
          <ToggleRow name="Option A" checked={true} onChange={() => {}} />
          <ToggleRow name="Option B" checked={false} onChange={() => {}} />
        </SettingsCard>
      </StoryShowcase>
    </StorySection>
  ),
};
