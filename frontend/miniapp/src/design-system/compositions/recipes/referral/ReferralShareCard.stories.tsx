import type { Meta, StoryObj } from "@storybook/react";
import { StorySection, StoryShowcase, StoryStack } from "@/design-system";
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
  parameters: {
    docs: {
      description: {
        story: "Default share card for a live referral link with ready-state badge and copy action.",
      },
    },
  },
  render: () => (
    <StorySection title="Default" description="Live referral link with online sharing affordances.">
      <StoryShowcase>
        <ReferralShareCard
          botUsername="vpn_suite_bot"
          shareUrl="https://t.me/vpn_suite_bot?start=ref_123"
          isOnline={true}
          onCopy={() => Promise.resolve(true)}
        />
      </StoryShowcase>
    </StorySection>
  ),
};

export const Offline: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Offline share card with a live URL but disabled actions. The availability chip makes the blocked state obvious before the user tries to copy.",
      },
    },
  },
  render: () => (
    <StorySection title="Offline" description="Live URL present, but the share actions are disabled.">
      <StoryShowcase>
        <ReferralShareCard
          botUsername="vpn_suite_bot"
          shareUrl="https://t.me/vpn_suite_bot?start=ref_123"
          isOnline={false}
          onCopy={() => Promise.resolve(false)}
        />
      </StoryShowcase>
    </StorySection>
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
            isOnline={false}
            variant="compact"
            onCopy={() => Promise.resolve(true)}
          />
          <ReferralShareCard
            botUsername="vpn_suite_bot"
            shareUrl=""
            isOnline={false}
            onCopy={() => Promise.resolve(false)}
          />
        </StoryStack>
      </StoryShowcase>
    </StorySection>
  ),
};
