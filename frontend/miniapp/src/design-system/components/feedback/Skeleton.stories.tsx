import type { Meta, StoryObj } from "@storybook/react";
import { Skeleton, SkeletonLine, SkeletonCard, SkeletonList } from "./Skeleton";
import { Stack } from "@/design-system/core/primitives";

const meta = {
  title: "Components/Skeleton",
  tags: ["autodocs"],
  component: Skeleton,
} satisfies Meta<typeof Skeleton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <Skeleton style={{ width: 120, height: 24 }} />,
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
      <SkeletonList count={3} />
    </Stack>
  ),
};
