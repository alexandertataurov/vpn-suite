import type { Meta, StoryObj } from "@storybook/react";
import { EmptyStateBlock } from "./EmptyStateBlock";
import { StorySection, StoryShowcase, StoryStack } from "@/design-system";

const meta: Meta<typeof EmptyStateBlock> = {
  title: "Patterns/EmptyStateBlock",
  tags: ["autodocs"],
  component: EmptyStateBlock,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Empty state for lists. Variants: no_devices, no_servers, no_history, no_results, and loading_failed.",
      },
    },
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["no_devices", "no_servers", "no_history", "no_results", "loading_failed"],
    },
  },
} satisfies Meta<typeof EmptyStateBlock>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { variant: "no_devices", onAction: () => {} },
  render: (args) => (
    <StoryShowcase>
      <EmptyStateBlock {...args} />
    </StoryShowcase>
  ),
};

export const Variants: Story = {
  render: () => (
    <StorySection title="Variants" description="Empty, retry, and custom-action states in one matrix.">
      <StoryShowcase>
        <StoryStack>
          <EmptyStateBlock variant="no_devices" onAction={() => {}} />
          <EmptyStateBlock variant="no_servers" onAction={() => {}} />
          <EmptyStateBlock variant="no_results" onAction={() => {}} />
          <EmptyStateBlock variant="loading_failed" onAction={() => {}} />
          <EmptyStateBlock
            title="CUSTOM"
            message="Custom empty state message."
            actionLabel="DO SOMETHING"
            onAction={() => {}}
          />
        </StoryStack>
      </StoryShowcase>
    </StorySection>
  ),
};
