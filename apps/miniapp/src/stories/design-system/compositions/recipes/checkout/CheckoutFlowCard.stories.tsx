import type { Meta, StoryObj } from "@storybook/react";
import { StorySection, StoryShowcase, StoryStack } from "@/design-system";
import { CheckoutFlowCard } from "@/design-system/recipes";

const meta: Meta<typeof CheckoutFlowCard> = {
  title: "Recipes/Checkout/CheckoutFlowCard",
  tags: ["autodocs"],
  component: CheckoutFlowCard,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Checkout flow contract for promo validation, confirmation, payment waiting, and recovery states.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

const baseArgs = {
  selectedPlanId: "pro_annual",
  promoCode: "SAVE20",
  promoStatus: "idle" as const,
  promoErrorKey: "",
  promoErrorAction: "clear" as const,
  displayLabel: null,
  isValidatingPromo: false,
  isCreatingInvoice: false,
  isFreePlan: false,
  hasToken: true,
  isOnline: true,
  planId: "pro_annual",
  phase: "idle" as const,
  errorMessage: "",
  onPromoCodeChange: () => {},
  onApplyPromo: () => {},
  onPromoRemove: () => {},
  onPromoRecovery: () => {},
  onContinue: () => {},
  onPay: () => {},
  onRetry: () => {},
};

export const Default: Story = {
  args: {
    ...baseArgs,
    showConfirmation: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Promo entry state before confirmation. Use this to verify validation, apply, and recovery affordances.",
      },
    },
  },
  render: (args) => (
    <StoryShowcase>
      <CheckoutFlowCard {...args} />
    </StoryShowcase>
  ),
};

export const Variants: Story = {
  render: () => (
    <StorySection
      title="Variants"
      description="Promo success, confirmation, waiting, and error recovery states."
    >
      <StoryShowcase>
        <StoryStack>
          <CheckoutFlowCard
            {...baseArgs}
            showConfirmation={false}
            promoStatus="valid"
            displayLabel="20% off applied"
          />
          <CheckoutFlowCard
            {...baseArgs}
            showConfirmation
            promoStatus="valid"
            displayLabel="20% off applied"
          />
          <CheckoutFlowCard
            {...baseArgs}
            showConfirmation
            phase="waiting"
            isCreatingInvoice
          />
          <CheckoutFlowCard
            {...baseArgs}
            showConfirmation
            phase="error"
            errorMessage="Telegram payment could not be created. Please try again."
          />
        </StoryStack>
      </StoryShowcase>
    </StorySection>
  ),
};
