import type { Meta, StoryObj } from "@storybook/react";
import { Skeleton, SkeletonLine, SkeletonCard, SkeletonList } from "../components/feedback/Skeleton";

const meta = {
  title: "Design System/Components/Skeleton",
  tags: ["autodocs"],
  parameters: {
    docs: { description: { component: "Skeleton loaders for body, card, list." } },
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Line: Story = {
  render: () => <SkeletonLine />,
};

export const Card: Story = {
  render: () => <SkeletonCard />,
};

export const List: Story = {
  render: () => <SkeletonList lines={4} />,
};

export const SkeletonVariants: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Skeleton variant="line" />
      <Skeleton variant="card" width={200} height={80} />
      <Skeleton variant="shimmer" width="100%" height={24} />
    </div>
  ),
};
