import type { Meta, StoryObj } from "@storybook/react";
import { SettingsDangerSection } from "./SettingsDangerSection";
import { StorySection, StoryShowcase, StoryStack } from "@/design-system";

const meta: Meta<typeof SettingsDangerSection> = {
  title: "Recipes/SettingsDangerSection",
  tags: ["autodocs"],
  component: SettingsDangerSection,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: "Danger zone with reset configs, logout, delete account.",
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

export const WithDevices: Story = {
  args: {
    ...baseArgs,
    hasActiveDevices: true,
  },
  render: (args) => (
    <StoryShowcase>
      <SettingsDangerSection {...args} />
    </StoryShowcase>
  ),
};

export const WithoutDevices: Story = {
  args: {
    ...baseArgs,
    hasActiveDevices: false,
  },
  render: (args) => (
    <StoryShowcase>
      <SettingsDangerSection {...args} />
    </StoryShowcase>
  ),
};

export const LoadingVariants: Story = {
  render: () => (
    <StorySection title="Loading states" description="Revoking / logging out.">
      <StoryStack>
        <SettingsDangerSection {...baseArgs} hasActiveDevices={true} isRevoking={true} />
        <SettingsDangerSection {...baseArgs} hasActiveDevices={false} isLoggingOut={true} />
      </StoryStack>
    </StorySection>
  ),
};
