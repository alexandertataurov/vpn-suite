import type { Meta, StoryObj } from "@storybook/react";
import { Skeleton, SkeletonLine, SkeletonCard, SkeletonList } from "@/design-system";

const meta: Meta<typeof Skeleton> = {
  title: "Primitives/Skeleton",
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

export const Overview: Story = {
  args: { width: "var(--spacing-32)", height: "var(--spacing-6)" },
};

export const Variants: Story = {
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

export const Sizes: Story = {
  render: () => (
    <div className="sb-stack">
      <Skeleton width="var(--spacing-24)" height="var(--spacing-4)" />
      <Skeleton width="var(--spacing-40)" height="var(--spacing-6)" />
      <Skeleton width="var(--spacing-64)" height="var(--spacing-8)" />
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <div className="sb-stack">
      <Skeleton width="var(--spacing-40)" height="var(--spacing-6)" />
      <Skeleton variant="shimmer" width="var(--spacing-40)" height="var(--spacing-6)" />
    </div>
  ),
};

export const WithLongText: Story = {
  render: () => <SkeletonLine width="var(--spacing-64)" />,
};

export const DarkMode: Story = {
  parameters: { themes: { themeOverride: "dark" } },
  args: { width: "var(--spacing-32)", height: "var(--spacing-6)" },
};

export const Accessibility: Story = {
  render: () => <SkeletonLine width="var(--spacing-40)" aria-hidden />,
};

export const EdgeCases = WithLongText;
