import type { Meta, StoryObj } from "@storybook/react";
import { MemoryRouter } from "react-router-dom";
import { PillChip, StorySection, StoryShowcase, StoryStack } from "@/design-system";
import { ModernHeader } from "./ModernHeader";

const meta: Meta<typeof ModernHeader> = {
  title: "Recipes/Home/ModernHeader",
  tags: ["autodocs"],
  component: ModernHeader,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: "Adaptive home and inner-page header recipe used across the miniapp for profile and page navigation.",
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

export const Default: Story = {
  args: {
    displayName: "Alex",
    subtitle: "Pro Monthly",
    pillChip: <PillChip variant="active">PRO</PillChip>,
    onSettingsClick: () => {},
  },
  parameters: {
    docs: {
      description: {
        story:
          "Home-header baseline with profile identity, subscription chip, and settings action. Use it to check the top-of-screen balance before adding page content underneath.",
      },
    },
  },
  render: (args) => (
    <StoryShowcase>
      <ModernHeader {...args} />
    </StoryShowcase>
  ),
};

export const Variants: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Profile, avatar-only, derived-initials, and inner-page header forms shown together. Review the spacing and action placement across all supported header modes.",
      },
    },
  },
  render: () => (
    <StorySection title="Variants" description="Profile header, avatar-only header, and inner-page header states.">
      <StoryShowcase>
        <StoryStack>
          <ModernHeader
            displayName="Alex"
            subtitle="Pro Monthly"
            pillChip={<PillChip variant="active">PRO</PillChip>}
            onSettingsClick={() => {}}
          />
          <ModernHeader
            displayName="Alex"
            avatarInitial="AL"
            subtitle="Manage your subscription"
            onSettingsClick={() => {}}
          />
          <ModernHeader
            displayName="Alexandra Morgan"
            subtitle="Pro Monthly"
            onSettingsClick={() => {}}
          />
          <ModernHeader
            title="Settings"
            subtitle="Manage plan, billing, and support."
            onBack={() => {}}
            showSettings={false}
          />
        </StoryStack>
      </StoryShowcase>
    </StorySection>
  ),
};
