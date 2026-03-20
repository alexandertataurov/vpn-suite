import type { Meta, StoryObj } from "@storybook/react";
import { Skeleton, SkeletonCard, SkeletonList } from "./Skeleton";
import { StorySection, StoryShowcase, StoryStack } from "@/design-system";
import { StoryPreviewCard } from "@/design-system";

const meta = {
  title: "Components/Skeleton",
  tags: ["autodocs"],
  component: Skeleton,
  parameters: {
    layout: "padded",
    status: { type: "stable" },
    docs: {
      description: {
        component:
          "Loading placeholder for content that has not resolved yet. Use `Skeleton` to preserve layout during loading, then swap to the final content once data arrives.",
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
  render: (args) => (
    <StoryShowcase>
      <Skeleton {...args} />
    </StoryShowcase>
  ),
};

export const Variants: Story = {
  render: () => (
    <StorySection title="Variants" description="Line, card, list, and shimmer show different loading densities.">
      <StoryShowcase>
        <StoryStack>
          <Skeleton variant="line" />
          <Skeleton variant="card" width="100%" height="80px" />
          <Skeleton variant="shimmer" width="120px" height="24px" />
        </StoryStack>
      </StoryShowcase>
    </StorySection>
  ),
};

export const InContext: Story = {
  render: () => (
    <StorySection title="In context" description="Card loading state. Preserve the final geometry so the page does not jump.">
      <StoryShowcase>
        <StoryPreviewCard>
          <SkeletonCard />
        </StoryPreviewCard>
      </StoryShowcase>
    </StorySection>
  ),
};

export const ListLoading: Story = {
  render: () => (
    <StorySection title="List loading" description="SkeletonList with three rows.">
      <StoryShowcase>
        <SkeletonList lines={3} />
      </StoryShowcase>
    </StorySection>
  ),
};
