import type { Meta, StoryObj } from "@storybook/react";
import { EmptyStateBlock } from "./EmptyStateBlock";
import { Stack } from "@/design-system/core/primitives";

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
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { variant: "no_devices", onAction: () => {} },
};

export const Variants: Story = {
  render: () => (
    <Stack gap="6">
      <EmptyStateBlock variant="no_devices" onAction={() => {}} />
      <EmptyStateBlock variant="no_servers" onAction={() => {}} />
      <EmptyStateBlock variant="no_results" onAction={() => {}} />
    </Stack>
  ),
};

export const NoDevices: Story = {
  args: { variant: "no_devices", onAction: () => {} },
};

export const NoServers: Story = {
  args: { variant: "no_servers", onAction: () => {} },
};

export const NoHistory: Story = {
  args: { variant: "no_history" },
};

export const NoResults: Story = {
  args: { variant: "no_results", onAction: () => {} },
};

export const LoadingFailed: Story = {
  args: { variant: "loading_failed", onAction: () => {} },
};

export const Custom: Story = {
  args: {
    title: "CUSTOM",
    message: "Custom empty state message.",
    actionLabel: "DO SOMETHING",
    onAction: () => {},
  },
};
