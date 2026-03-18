import type { Meta, StoryObj } from "@storybook/react";
import { Skeleton, SkeletonCard, SkeletonList } from "./Skeleton";
import { StorySection, StoryShowcase, StoryStack } from "@/design-system";

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
  render: (args) => (
    <StoryShowcase>
      <Skeleton {...args} />
    </StoryShowcase>
  ),
};

export const Variants: Story = {
  render: () => (
    <StorySection title="Variants" description="line, card, list, shimmer.">
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
    <StorySection title="In context" description="Card loading state.">
      <StoryShowcase>
        <div className="story-preview-card">
          <SkeletonCard />
        </div>
      </StoryShowcase>
    </StorySection>
  ),
};

export const ListLoading: Story = {
  render: () => (
    <StorySection title="List loading" description="SkeletonList with 3 lines.">
      <StoryShowcase>
        <SkeletonList lines={3} />
      </StoryShowcase>
    </StorySection>
  ),
};
