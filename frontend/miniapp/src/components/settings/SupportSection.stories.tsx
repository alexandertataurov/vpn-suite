import type { Meta, StoryObj } from "@storybook/react";
import { SupportSection } from "./SupportSection";
import { StoryShowcase } from "@/design-system";

const meta: Meta<typeof SupportSection> = {
  title: "Recipes/Settings/SupportSection",
  tags: ["autodocs"],
  component: SupportSection,
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
      <SupportSection {...args} />
    </StoryShowcase>
  ),
};
