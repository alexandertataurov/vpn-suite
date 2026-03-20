import type { Meta, StoryObj } from "@storybook/react";
import { SupportSection } from "./SupportSection";
import { StorySection, StoryShowcase, StoryStack } from "@/design-system";

const meta: Meta<typeof SupportSection> = {
  title: "Recipes/Settings/SupportSection",
  tags: ["autodocs"],
  component: SupportSection,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Support actions recipe used by Settings, with one canonical story file instead of wrapper-level duplication.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

const baseArgs = {
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
};

export const Default: Story = {
  args: baseArgs,
  parameters: {
    docs: {
      description: {
        story:
          "Support section with the setup guide, FAQ, and contact-support actions exposed together.",
      },
    },
  },
  render: (args) => (
    <StoryShowcase>
      <SupportSection {...args} />
    </StoryShowcase>
  ),
};

export const Variants: Story = {
  render: () => (
    <StorySection
      title="Variants"
      description="Default copy and a more urgent contact-support emphasis."
    >
      <StoryShowcase>
        <StoryStack>
          <SupportSection {...baseArgs} />
          <SupportSection
            {...baseArgs}
            sectionTitle="Need help now?"
            contactSupportDescription="Billing issue, setup failure, or account recovery"
          />
        </StoryStack>
      </StoryShowcase>
    </StorySection>
  ),
};
