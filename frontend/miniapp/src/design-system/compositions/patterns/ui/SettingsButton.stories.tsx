import type { Meta, StoryObj } from "@storybook/react";
import { SettingsButton } from "./SettingsButton";
import { Avatar } from "./Avatar";
import { PillChip } from "./PillChip";
import { Inline } from "@/design-system/core/primitives";
import { StorySection, StoryShowcase } from "@/design-system";

const meta = {
  title: "Components/SettingsButton",
  tags: ["autodocs"],
  component: SettingsButton,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: "34×34 circular settings gear button for profile row.",
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
};

export const InContext: Story = {
  render: () => (
    <StorySection title="In context" description="Profile row.">
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
};
