import type { Meta, StoryObj } from "@storybook/react";
import { FallbackScreen } from "@/design-system/patterns";
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
          "Full-page fallback for load failures. Scenarios: retryable, non-retryable, auth failure, and timeout.",
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
  parameters: {
    docs: {
      description: {
        story:
          "Retryable fallback for fetch failures. Use it when the screen should recover in place instead of leaving the user at a dead end.",
      },
    },
  },
};

export const Variants: Story = {
  render: () => (
    <StorySection title="Variants" description="Retryable and non-retryable fallback flows.">
      <StoryShowcase>
        <>
          <FallbackScreen
            title="Couldn't load"
            message="Check your connection and try again."
            onRetry={() => {}}
            retryable={true}
          />
          <FallbackScreen
            title="Something went wrong"
            message="We couldn't complete your request."
            retryable={false}
            contactSupportHref="https://t.me/support"
          />
        </>
      </StoryShowcase>
    </StorySection>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Retryable and non-retryable fallback flows shown side by side. The comparison is useful when deciding whether the user should retry in place or contact support.",
      },
    },
  },
};
