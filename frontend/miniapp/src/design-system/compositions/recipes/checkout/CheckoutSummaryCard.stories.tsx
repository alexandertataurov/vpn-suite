import type { Meta, StoryObj } from "@storybook/react";
import { StorySection, StoryShowcase, StoryStack } from "@/design-system";
import { CheckoutSummaryCard } from "./CheckoutSummaryCard";

const meta: Meta<typeof CheckoutSummaryCard> = {
  title: "Recipes/Checkout/CheckoutSummaryCard",
  tags: ["autodocs"],
  component: CheckoutSummaryCard,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: "Checkout summary grid used before and after plan confirmation.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    planDisplayName: "Pro annual",
    showConfirmation: false,
    planDurationDays: 365,
    planDeviceLimit: 5,
  },
  render: (args) => (
    <StoryShowcase>
      <CheckoutSummaryCard {...args} />
    </StoryShowcase>
  ),
};

export const Variants: Story = {
  render: () => (
    <StorySection title="Variants" description="Selection summary and full confirmation summary.">
      <StoryShowcase>
        <StoryStack>
          <CheckoutSummaryCard
            planDisplayName="Pro annual"
            showConfirmation={false}
            planDurationDays={365}
            planDeviceLimit={5}
          />
          <CheckoutSummaryCard
            planDisplayName="Pro annual"
            showConfirmation
            planDurationDays={365}
            planDeviceLimit={5}
          />
        </StoryStack>
      </StoryShowcase>
    </StorySection>
  ),
};
