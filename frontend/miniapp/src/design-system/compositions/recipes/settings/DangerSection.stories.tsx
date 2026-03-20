import type { Meta, StoryObj } from "@storybook/react";
import { DangerSection } from "./DangerSection";
import { StorySection, StoryShowcase, StoryStack } from "@/design-system";

const meta: Meta<typeof DangerSection> = {
  title: "Recipes/Settings/DangerSection",
  tags: ["autodocs"],
  component: DangerSection,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Destructive actions recipe for Settings, covering device-dependent and loading states in one canonical file.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

const baseArgs = {
  sectionTitle: "Danger zone",
  warningText: "These actions cannot be undone.",
  resetConfigsTitle: "Reset configs",
  resetConfigsDescription: "Revoke all device configs",
  onResetConfigs: () => {},
  isRevoking: false,
  logoutTitle: "Log out",
  logoutDescription: "Sign out of this device",
  onLogout: () => {},
  isLoggingOut: false,
  deleteAccountTitle: "Delete account",
  deleteAccountDescription: "Permanently remove your data",
  onDeleteAccount: () => {},
};

export const Default: Story = {
  args: {
    ...baseArgs,
    hasActiveDevices: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Danger zone with active devices present. This is the primary settings safety surface.",
      },
    },
  },
  render: (args) => (
    <StoryShowcase>
      <DangerSection {...args} />
    </StoryShowcase>
  ),
};

export const Variants: Story = {
  render: () => (
    <StorySection
      title="Variants"
      description="With devices, without devices, and loading states."
    >
      <StoryShowcase>
        <StoryStack>
          <DangerSection {...baseArgs} hasActiveDevices />
          <DangerSection {...baseArgs} hasActiveDevices={false} />
          <DangerSection {...baseArgs} hasActiveDevices isRevoking />
          <DangerSection {...baseArgs} hasActiveDevices={false} isLoggingOut />
        </StoryStack>
      </StoryShowcase>
    </StorySection>
  ),
};
