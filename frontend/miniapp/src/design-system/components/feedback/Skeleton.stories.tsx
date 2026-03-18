import type { Meta, StoryObj } from "@storybook/react";
import { Skeleton, SkeletonLine, SkeletonCard, SkeletonList } from "./Skeleton";
import { Stack } from "@/design-system/core/primitives";

const meta = {
  title: "Components/Skeleton",
  tags: ["autodocs"],
  component: Skeleton,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Loading placeholder. Variants: default, line, card, list, shimmer. Uses design tokens for animation.",
      },
    },
  },
  argTypes: {
    variant: { control: "select", options: ["default", "line", "card", "list", "shimmer"] },
  },
} satisfies Meta<typeof Skeleton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { width: "120px", height: "24px" },
};

export const Line: Story = {
  render: () => <SkeletonLine />,
};

export const Card: Story = {
  render: () => <SkeletonCard />,
};

export const List: Story = {
  render: () => (
    <Stack gap="2">
      <SkeletonList lines={3} />
    </Stack>
  ),
};

export const Variants: Story = {
  render: () => (
    <Stack gap="4">
      <Skeleton variant="line" />
      <Skeleton variant="card" width="100%" height="80px" />
      <Skeleton variant="shimmer" width="120px" height="24px" />
    </Stack>
  ),
};
