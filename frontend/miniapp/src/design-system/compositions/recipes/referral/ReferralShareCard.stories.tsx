import type { Meta, StoryObj } from "@storybook/react";
import { StorySection, StoryShowcase, StoryStack } from "@/design-system/utils";
import { ReferralShareCard } from "./ReferralShareCard";

const meta: Meta<typeof ReferralShareCard> = {
  title: "Recipes/Referral/ReferralShareCard",
  tags: ["autodocs"],
  component: ReferralShareCard,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: "Referral share card used on the referral page for copying and sharing the bot link.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <StoryShowcase>
      <ReferralShareCard
        botUsername="vpn_suite_bot"
        shareUrl="https://t.me/vpn_suite_bot?start=ref_123"
        isOnline={true}
        onCopy={() => Promise.resolve(true)}
      />
    </StoryShowcase>
  ),
};

export const Variants: Story = {
  render: () => (
    <StorySection title="Variants" description="Default share card, compact share card, and unavailable-link state.">
      <StoryShowcase>
        <StoryStack>
          <ReferralShareCard
            botUsername="vpn_suite_bot"
            shareUrl="https://t.me/vpn_suite_bot?start=ref_123"
            isOnline={true}
            onCopy={() => Promise.resolve(true)}
          />
          <ReferralShareCard
            botUsername="vpn_suite_bot"
            shareUrl="https://t.me/vpn_suite_bot?start=ref_123"
            isOnline={true}
            variant="compact"
            onCopy={() => Promise.resolve(true)}
          />
          <ReferralShareCard
            botUsername=""
            shareUrl=""
            isOnline={false}
            onCopy={() => Promise.resolve(false)}
          />
        </StoryStack>
      </StoryShowcase>
    </StorySection>
  ),
};
