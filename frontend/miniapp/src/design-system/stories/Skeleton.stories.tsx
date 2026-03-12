import type { Meta, StoryObj } from "@storybook/react";
import { Skeleton, SkeletonLine, SkeletonCard, SkeletonList } from "../components/feedback/Skeleton";
import { StoryCard, StoryPage, StorySection, ThreeColumn, UsageExample } from "./foundations.story-helpers";

const meta = {
  title: "Components/Skeleton",
  tags: ["autodocs"],
  parameters: {
    docs: { description: { component: "Skeleton loaders for body, card, list." } },
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <StoryPage
      eyebrow="Components"
      title="Skeleton"
      summary="Skeleton loaders hold layout structure while content is still resolving. The story mirrors the foundations documentation style so loading patterns are reviewed in context."
      stats={[
        { label: "Variants", value: "5" },
        { label: "Helpers", value: "3" },
        { label: "Examples", value: "3" },
      ]}
    >
      <StorySection
        title="Loading patterns"
        description="Skeleton should preserve information architecture even before data arrives."
      >
        <ThreeColumn>
          <StoryCard title="Text lines" caption="Use for paragraph and metadata placeholders.">
            <SkeletonLine />
          </StoryCard>
          <StoryCard title="Card blocks" caption="Use for cards and larger modules.">
            <SkeletonCard />
          </StoryCard>
          <StoryCard title="List state" caption="Use when rows are loading in a predictable stack.">
            <SkeletonList lines={4} />
          </StoryCard>
        </ThreeColumn>
      </StorySection>

      <StorySection
        title="Miniapp showcase"
        description="Loading states are most useful when they preserve the shell of a real product block."
      >
        <UsageExample title="Plan loading card" description="The skeleton keeps the price-card shape stable while plan data is fetched.">
          <div style={{ display: "grid", gap: 16 }}>
            <Skeleton variant="line" width={160} />
            <Skeleton variant="card" width="100%" height={96} />
            <Skeleton variant="shimmer" width="60%" height={16} />
          </div>
        </UsageExample>
      </StorySection>
    </StoryPage>
  ),
};

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
      <Skeleton variant="line" width={160} />
      <Skeleton variant="card" width={220} height={90} />
      <Skeleton variant="shimmer" width="100%" height={24} />
    </div>
  ),
};

export const CustomSize: Story = {
  render: () => (
    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
      <Skeleton width={48} height={48} />
      <Skeleton width={120} height={16} />
      <Skeleton width="40%" height={12} />
    </div>
  ),
};
