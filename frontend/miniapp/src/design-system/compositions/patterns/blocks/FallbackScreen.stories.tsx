import type { Meta, StoryObj } from "@storybook/react";
import { FallbackScreen } from "./FallbackScreen";
import { StorySection, StoryShowcase } from "@/design-system";

const meta: Meta<typeof FallbackScreen> = {
  title: "Patterns/FallbackScreen",
  tags: ["autodocs"],
  component: FallbackScreen,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Full-page fallback for load failures. Scenarios: retryable, non_retryable, auth_failure, timeout.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: "Couldn't load",
    message: "Something went wrong. Try again.",
    onRetry: () => {},
    retryable: true,
  },
  render: (args) => (
    <StoryShowcase>
      <FallbackScreen {...args} />
    </StoryShowcase>
  ),
};

export const Retryable: Story = {
  render: () => (
    <StorySection title="Retryable" description="With retry button.">
      <StoryShowcase>
        <FallbackScreen
          title="Couldn't load"
          message="Check your connection and try again."
          onRetry={() => {}}
          retryable
        />
      </StoryShowcase>
    </StorySection>
  ),
};

export const NonRetryable: Story = {
  render: () => (
    <StorySection title="Non-retryable" description="Contact support CTA.">
      <StoryShowcase>
        <FallbackScreen
          title="Something went wrong"
          message="We couldn't complete your request."
          retryable={false}
          contactSupportHref="https://t.me/support"
        />
      </StoryShowcase>
    </StorySection>
  ),
};
