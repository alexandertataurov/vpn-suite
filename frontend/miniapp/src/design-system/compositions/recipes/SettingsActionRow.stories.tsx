import type { Meta, StoryObj } from "@storybook/react";
import { SettingsActionRow } from "./SettingsActionRow";
import { IconSettings, IconShield, IconTrash2 } from "@/design-system/icons";
import { StorySection, StoryShowcase, StoryStack } from "@/design-system";

const meta: Meta<typeof SettingsActionRow> = {
  title: "Recipes/SettingsActionRow",
  tags: ["autodocs"],
  component: SettingsActionRow,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Settings list row with icon, title, description, value, chevron/external indicator.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    icon: <IconSettings size={20} strokeWidth={1.75} aria-hidden />,
    title: "Account",
    description: "Manage email and password",
    onClick: () => {},
  },
  render: (args) => (
    <StoryShowcase>
      <SettingsActionRow {...args} />
    </StoryShowcase>
  ),
};

export const Variants: Story = {
  render: () => (
    <StorySection title="Variants" description="Default, with value, danger.">
      <StoryShowcase>
        <StoryStack>
          <SettingsActionRow
            icon={<IconSettings size={20} strokeWidth={1.75} aria-hidden />}
            title="Account"
            description="Manage email"
            onClick={() => {}}
          />
          <SettingsActionRow
            icon={<IconShield size={20} strokeWidth={1.75} aria-hidden />}
            title="Plan"
            value="Pro"
            onClick={() => {}}
          />
          <SettingsActionRow
            icon={<IconTrash2 size={20} strokeWidth={1.75} aria-hidden />}
            title="Delete account"
            description="Permanently remove"
            danger
            onClick={() => {}}
          />
        </StoryStack>
      </StoryShowcase>
    </StorySection>
  ),
};
