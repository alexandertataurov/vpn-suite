import type { Meta, StoryObj } from "@storybook/react";
import { PillChip } from "@/design-system/patterns";
import { Avatar } from "@/design-system/patterns";
import { SettingsButton } from "@/design-system/patterns";
import { Inline } from "@/design-system/primitives";
import { StorySection, StoryShowcase } from "@/design-system";

const meta = {
  title: "Patterns/PillChip",
  tags: ["autodocs"],
  component: PillChip,
  parameters: {
    layout: "padded",
    status: { type: "stable" },
    docs: {
      description: {
        component:
          "Profile row pill for subscription state and short metadata. Variants: beta, active, expiring, expired.",
      },
    },
  },
  argTypes: {
    variant: { control: "select", options: ["beta", "active", "expiring", "expired"] },
  },
} satisfies Meta<typeof PillChip>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { variant: "beta", children: "Beta" },
  render: (args) => (
    <StoryShowcase>
      <PillChip {...args} />
    </StoryShowcase>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Default pill chip used for short profile metadata. Keep the label concise so the chip can sit beside avatars, buttons, or plan text without wrapping.",
      },
    },
  },
};

export const Variants: Story = {
  render: () => (
    <StorySection title="Variants" description="Beta, active, expiring, and expired states shown together.">
      <StoryShowcase>
        <Inline gap="2" wrap>
          <PillChip variant="beta">Beta</PillChip>
          <PillChip variant="active">PRO</PillChip>
          <PillChip variant="expiring">Expiring</PillChip>
          <PillChip variant="expired">Expired</PillChip>
        </Inline>
      </StoryShowcase>
    </StorySection>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Beta, active, expiring, and expired pill states shown together. Use this matrix to verify the semantic palette before placing the chip in a profile row.",
      },
    },
  },
};

export const WithDimPart: Story = {
  render: () => (
    <StorySection title="Split label format" description="Use the separator to split primary and secondary label fragments.">
      <StoryShowcase>
        <Inline gap="2" wrap>
          <PillChip variant="expiring">Expiring · 14d</PillChip>
          <PillChip variant="active">PRO · 30d left</PillChip>
        </Inline>
      </StoryShowcase>
    </StorySection>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Split primary and secondary fragments inside one pill. This is the pattern for compact metadata like plan status plus remaining time.",
      },
    },
  },
};

export const InContext: Story = {
  render: () => (
    <StorySection title="In context" description="Profile row with avatar, name, and a trailing settings action.">
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
          "Pill chip shown in a profile row with avatar and trailing settings action. The layout checks whether the chip still reads clearly in a dense row.",
      },
    },
  },
};
