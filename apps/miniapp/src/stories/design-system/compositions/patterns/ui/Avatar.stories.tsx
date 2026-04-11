import type { Meta, StoryObj } from "@storybook/react";
import { Avatar } from "@/design-system/patterns";
import { Inline } from "@/design-system/primitives";
import { StorySection, StoryShowcase } from "@/design-system";

const meta = {
  title: "Patterns/Avatar",
  tags: ["autodocs"],
  component: Avatar,
  parameters: {
    layout: "padded",
    status: { type: "stable" },
    docs: {
      description: {
        component: "Profile avatar with gradient background and initials. Optional image src.",
      },
    },
  },
  argTypes: {
    size: { control: "select", options: ["sm", "md"] },
  },
} satisfies Meta<typeof Avatar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { initials: "JD", size: "md" },
  parameters: {
    docs: {
      description: {
        story: "Default avatar sizing for a profile row or header.",
      },
    },
  },
  render: (args) => (
    <StoryShowcase>
      <Avatar {...args} />
    </StoryShowcase>
  ),
};

export const Sizes: Story = {
  render: () => (
    <StorySection title="Sizes" description="Small and medium sizes side by side.">
      <StoryShowcase>
        <Inline gap="2" align="center">
          <Avatar initials="AB" size="sm" />
          <Avatar initials="CD" size="md" />
        </Inline>
      </StoryShowcase>
    </StorySection>
  ),
};

export const WithImage: Story = {
  render: () => (
    <StorySection title="With image" description="Image fallback stays available when a src is provided.">
      <StoryShowcase>
        <Avatar
          initials="JD"
          size="md"
          src="https://api.dicebear.com/7.x/initials/svg?seed=JD"
        />
      </StoryShowcase>
    </StorySection>
  ),
};

export const InContext: Story = {
  render: () => (
    <StorySection title="In context" description="Avatar paired with a display name in a profile row.">
      <StoryShowcase>
        <Inline gap="2" align="center">
          <Avatar initials="JD" size="md" />
          <span className="story-card-title">John Doe</span>
        </Inline>
      </StoryShowcase>
    </StorySection>
  ),
};
