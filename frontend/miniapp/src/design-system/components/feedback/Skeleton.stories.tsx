import type { Meta, StoryObj } from "@storybook/react";
import { Skeleton, SkeletonCard, SkeletonList } from "./Skeleton";
import { StorySection, StoryShowcase, StoryStack } from "@/design-system";
import { StoryPreviewCard } from "@/design-system";

const meta = {
  title: "Components/Skeleton",
  tags: ["autodocs"],
  component: Skeleton,
  args: {
    width: "120px",
    height: "24px",
  },
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
    variant: { control: "select", options: ["default", "line", "card", "list", "shimmer"], table: { category: "Appearance" } },
    width: { control: "text", table: { category: "Layout" } },
    height: { control: "text", table: { category: "Layout" } },
  },
} satisfies Meta<typeof Skeleton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Representative loading card for compact content blocks. Use this as the baseline contract, then move to the variant stories for line and list-specific placeholders.",
      },
    },
  },
  render: () => (
    <StorySection title="Default" description="Representative loading card that preserves final layout while content resolves.">
      <StoryShowcase>
        <StoryPreviewCard>
          <SkeletonCard />
        </StoryPreviewCard>
      </StoryShowcase>
    </StorySection>
  ),
};

export const Variants: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Compare line, card, list, and shimmer placeholders to match the density of the content that is still loading.",
      },
    },
  },
  render: () => (
    <StorySection title="Variants" description="Match the loading shape to the final content density.">
      <StoryShowcase>
        <StoryStack>
          <Skeleton variant="line" />
          <Skeleton variant="card" width="100%" height="80px" />
          <SkeletonCard />
          <SkeletonList lines={3} />
          <Skeleton variant="shimmer" width="120px" height="24px" />
        </StoryStack>
      </StoryShowcase>
    </StorySection>
  ),
};

export const InContext: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Card-sized loading state inside a preview shell. Use it to verify that the eventual page will not jump when data arrives.",
      },
    },
  },
  render: () => (
    <StorySection title="In context" description="Preserve final geometry while content resolves.">
      <StoryShowcase>
        <StoryPreviewCard>
          <SkeletonCard />
        </StoryPreviewCard>
      </StoryShowcase>
    </StorySection>
  ),
};

export const ListLoading: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Three-row skeleton list for pending collections and feed-like views.",
      },
    },
  },
  render: () => (
    <StorySection title="List loading" description="Use the list variant when several rows are pending at once.">
      <StoryShowcase>
        <SkeletonList lines={3} />
      </StoryShowcase>
    </StorySection>
  ),
};
