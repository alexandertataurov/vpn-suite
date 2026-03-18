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
      <DangerSection {...args} />
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
      <DangerSection {...args} />
    </StoryShowcase>
  ),
};

export const LoadingVariants: Story = {
  render: () => (
    <StorySection title="Loading states" description="Revoking / logging out.">
      <StoryStack>
        <DangerSection {...baseArgs} hasActiveDevices={true} isRevoking={true} />
        <DangerSection {...baseArgs} hasActiveDevices={false} isLoggingOut={true} />
      </StoryStack>
    </StorySection>
  ),
};
