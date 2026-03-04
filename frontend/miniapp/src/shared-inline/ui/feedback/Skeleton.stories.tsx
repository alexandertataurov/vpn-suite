import type { Meta, StoryObj } from "@storybook/react";
import { Skeleton, SkeletonLine, SkeletonCard, SkeletonList } from "./Skeleton";

const meta: Meta<typeof Skeleton> = {
  title: "Shared/Primitives/Skeleton",
  component: Skeleton,
  parameters: {
    docs: {
      description: {
        component: "Loading placeholder. SkeletonLine, SkeletonCard, SkeletonList variants.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof Skeleton>;

export const SkeletonOverview: Story = {
  args: { width: "var(--spacing-32)", height: "var(--spacing-6)" },
};

export const SkeletonVariants: Story = {
  render: () => (
    <div className="sb-stack">
      <Skeleton />
      <SkeletonLine width="var(--spacing-40)" />
      <SkeletonCard width="var(--spacing-48)" />
      <SkeletonList lines={3} />
      <Skeleton variant="shimmer" width="var(--spacing-40)" height="var(--spacing-6)" />
    </div>
  ),
};

export const SkeletonSizes: Story = {
  render: () => (
    <div className="sb-stack">
      <Skeleton width="var(--spacing-24)" height="var(--spacing-4)" />
      <Skeleton width="var(--spacing-40)" height="var(--spacing-6)" />
      <Skeleton width="var(--spacing-64)" height="var(--spacing-8)" />
    </div>
  ),
};

export const SkeletonStates: Story = {
  render: () => (
    <div className="sb-stack">
      <Skeleton width="var(--spacing-40)" height="var(--spacing-6)" />
      <Skeleton variant="shimmer" width="var(--spacing-40)" height="var(--spacing-6)" />
    </div>
  ),
};

export const SkeletonWithLongText: Story = {
  render: () => <SkeletonLine width="var(--spacing-64)" />,
};

export const SkeletonDarkMode: Story = {
  parameters: { themes: { themeOverride: "dark" } },
  args: { width: "var(--spacing-32)", height: "var(--spacing-6)" },
};

export const SkeletonAccessibility: Story = {
  render: () => <SkeletonLine width="var(--spacing-40)" aria-hidden />,
};

export const SkeletonEdgeCases = WithLongText;
