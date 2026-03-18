import type { Meta, StoryObj } from "@storybook/react";
import { SettingsSupportSection } from "./SettingsSupportSection";
import { StoryShowcase } from "@/design-system";

const meta: Meta<typeof SettingsSupportSection> = {
  title: "Recipes/SettingsSupportSection",
  tags: ["autodocs"],
  component: SettingsSupportSection,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: "Help section with setup guide, FAQ, contact support.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    sectionTitle: "Help",
    setupGuideTitle: "Setup guide",
    setupGuideDescription: "Connect your first device",
    onSetupGuideClick: () => {},
    faqTitle: "FAQ",
    faqDescription: "Common questions",
    onFaqClick: () => {},
    contactSupportTitle: "Contact support",
    contactSupportDescription: "Chat with us",
    onContactSupportClick: () => {},
  },
  render: (args) => (
    <StoryShowcase>
      <SettingsSupportSection {...args} />
    </StoryShowcase>
  ),
};
