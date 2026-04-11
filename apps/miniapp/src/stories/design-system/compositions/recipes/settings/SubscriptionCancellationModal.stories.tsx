import type { Meta, StoryObj } from "@storybook/react";
import { StorySection, StoryShowcase, StoryStack } from "@/design-system";
import { SubscriptionCancellationModal } from "@/design-system/recipes";

const meta: Meta<typeof SubscriptionCancellationModal> = {
  title: "Recipes/Settings/SubscriptionCancellationModal",
  tags: ["autodocs"],
  component: SubscriptionCancellationModal,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Cancellation retention flow used from the Settings page.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

const offers = {
  subscription_id: "sub_123",
  status: "active" as const,
  valid_until: "2026-03-22T00:00:00.000Z",
  discount_percent: 20,
  can_pause: true,
  can_resume: false,
  offer_pause: true,
  offer_discount: true,
  offer_downgrade: true,
  reason_group: "price" as const,
};

export const Default: Story = {
  args: {
    isOpen: true,
    onClose: () => {},
    cancelReason: "price",
    offers,
    isCancelling: false,
    onReasonSelect: () => {},
    onPauseInstead: () => {},
    onCancelAtPeriodEnd: () => {},
    onCancelNow: () => {},
  },
  parameters: {
    docs: {
      description: {
        story:
          "Retention dialog in the initial selection state before the user chooses a cancellation reason. The warning note now appears before the action list so the destructive impact is visible early.",
      },
    },
  },
  render: (args) => (
    <StoryShowcase>
      <SubscriptionCancellationModal {...args} />
    </StoryShowcase>
  ),
};

export const Variants: Story = {
  render: () => (
    <StorySection
      title="Variants"
      description="No reason selected, discount retention, support retention, and early warning states."
    >
      <StoryShowcase>
        <StoryStack>
          <SubscriptionCancellationModal
            isOpen
            onClose={() => {}}
            cancelReason={null}
            offers={offers}
            onReasonSelect={() => {}}
            onPauseInstead={() => {}}
            onCancelAtPeriodEnd={() => {}}
            onCancelNow={() => {}}
          />
          <SubscriptionCancellationModal
            isOpen
            onClose={() => {}}
            cancelReason="price"
            offers={offers}
            onReasonSelect={() => {}}
            onPauseInstead={() => {}}
            onCancelAtPeriodEnd={() => {}}
            onCancelNow={() => {}}
          />
          <SubscriptionCancellationModal
            isOpen
            onClose={() => {}}
            cancelReason="technical"
            offers={{ ...offers, reason_group: "technical" }}
            onReasonSelect={() => {}}
            onPauseInstead={() => {}}
            onCancelAtPeriodEnd={() => {}}
            onCancelNow={() => {}}
          />
        </StoryStack>
      </StoryShowcase>
    </StorySection>
  ),
};
