import type { Meta, StoryObj } from "@storybook/react";
import { EmptyStateBlock } from "./EmptyStateBlock";

const meta = {
  title: "Patterns/EmptyStateBlock",
  tags: ["autodocs"],
  component: EmptyStateBlock,
  argTypes: {
    variant: {
      control: "select",
      options: ["no_devices", "no_servers", "no_history", "no_results", "loading_failed"],
    },
  },
} satisfies Meta<typeof EmptyStateBlock>;

export default meta;

type Story = StoryObj<typeof meta>;

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
