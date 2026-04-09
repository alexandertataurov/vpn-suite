import type { Meta, StoryObj } from "@storybook/react";
import { SettingsButton } from "./SettingsButton";
import { Avatar } from "./Avatar";
import { PillChip } from "./PillChip";
import { Inline } from "@/design-system/core/primitives";
import { StorySection, StoryShowcase } from "@/design-system";

const meta = {
  title: "Patterns/SettingsButton",
  tags: ["autodocs"],
  component: SettingsButton,
  parameters: {
    layout: "padded",
    status: { type: "stable" },
    docs: {
      description: {
        component:
          "Compact circular settings button used in profile rows and other secondary action slots.",
      },
    },
  },
} satisfies Meta<typeof SettingsButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <StoryShowcase>
      <SettingsButton onClick={() => {}} />
    </StoryShowcase>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Default circular settings action for secondary controls. Use it as the isolated contract before embedding it in a profile or row layout.",
      },
    },
  },
};

export const InContext: Story = {
  render: () => (
    <StorySection title="In context" description="Profile row with avatar, plan badge, and trailing settings action.">
      <StoryShowcase>
        <Inline gap="2" wrap align="center">
          <Avatar initials="JD" size="md" />
          <div className="story-stack story-stack--tight">
            <span className="story-card-title">John Doe</span>
            <PillChip variant="active">PRO</PillChip>
          </div>
          <SettingsButton onClick={() => {}} />
        </Inline>
      </StoryShowcase>
    </StorySection>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Settings button inside a profile row with avatar and plan badge. This validates the trailing action slot and spacing in a realistic row composition.",
      },
    },
  },
};
