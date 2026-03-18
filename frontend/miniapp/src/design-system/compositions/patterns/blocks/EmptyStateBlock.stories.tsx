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
          "Empty state for lists. Variants: no_devices, no_servers, no_history, no_results, loading_failed. Uses design tokens.",
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
    <StorySection title="Variants" description="Empty state for different contexts.">
      <StoryShowcase>
        <StoryStack>
          <EmptyStateBlock variant="no_devices" onAction={() => {}} />
          <EmptyStateBlock variant="no_servers" onAction={() => {}} />
          <EmptyStateBlock variant="no_results" onAction={() => {}} />
        </StoryStack>
      </StoryShowcase>
    </StorySection>
  ),
};

export const NoDevices: Story = {
  render: () => (
    <StorySection title="No devices" description="Add device CTA.">
      <StoryShowcase>
        <EmptyStateBlock variant="no_devices" onAction={() => {}} />
      </StoryShowcase>
    </StorySection>
  ),
};

export const NoServers: Story = {
  render: () => (
    <StorySection title="No servers" description="Server selection empty.">
      <StoryShowcase>
        <EmptyStateBlock variant="no_servers" onAction={() => {}} />
      </StoryShowcase>
    </StorySection>
  ),
};

export const LoadingFailed: Story = {
  render: () => (
    <StorySection title="Loading failed" description="Retry CTA.">
      <StoryShowcase>
        <EmptyStateBlock variant="loading_failed" onAction={() => {}} />
      </StoryShowcase>
    </StorySection>
  ),
};

export const Custom: Story = {
  render: () => (
    <StorySection title="Custom" description="Custom title, message, and action.">
      <StoryShowcase>
        <EmptyStateBlock
          title="CUSTOM"
          message="Custom empty state message."
          actionLabel="DO SOMETHING"
          onAction={() => {}}
        />
      </StoryShowcase>
    </StorySection>
  ),
};
