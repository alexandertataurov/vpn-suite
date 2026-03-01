import type { Meta, StoryObj } from "@storybook/react";
import { LoadingSkeleton, SkeletonLine, SkeletonCard, Spinner, TableSkeleton } from "@/design-system";

const meta: Meta<typeof LoadingSkeleton> = {
  title: "Patterns/LoadingStates",
  component: LoadingSkeleton,
  parameters: {
    docs: {
      description: {
        component: "Loading state patterns: inline spinners, skeleton blocks, and table placeholders.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof LoadingSkeleton>;

export const Overview: Story = {
  render: () => (
    <div className="sb-stack">
      <div className="sb-row">
        <Spinner size="sm" />
        <span>Syncing data…</span>
      </div>
      <SkeletonLine width={240} />
      <SkeletonCard width={280} />
    </div>
  ),
};

export const Variants: Story = {
  render: () => (
    <div className="sb-stack">
      <SkeletonLine width="var(--spacing-40)" />
      <SkeletonCard width="var(--spacing-48)" />
      <LoadingSkeleton width="var(--spacing-32)" height="var(--spacing-6)" />
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="sb-stack">
      <p className="m-0">Size variants are not exposed; use tokenized widths/heights.</p>
      <SkeletonLine width="var(--spacing-40)" />
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <div className="sb-stack">
      <Spinner size="sm" />
      <SkeletonLine width="var(--spacing-40)" />
    </div>
  ),
};

export const Table: Story = {
  render: () => <TableSkeleton rows={4} columns={5} />, 
};

export const WithLongText: Story = {
  render: () => (
    <div className="sb-row">
      <Spinner size="sm" />
      <span>Loading telemetry for the selected region and time window</span>
    </div>
  ),
};

export const DarkMode: Story = {
  parameters: { themes: { themeOverride: "dark" } },
  render: () => (
    <div className="sb-stack">
      <LoadingSkeleton width="var(--spacing-32)" height="var(--spacing-6)" />
      <SkeletonLine width="var(--spacing-40)" />
    </div>
  ),
};

export const Accessibility: Story = {
  render: () => (
    <div className="sb-stack">
      <Spinner size="sm" />
      <span>Loading state uses aria-live where appropriate.</span>
    </div>
  ),
};

export const EdgeCases = WithLongText;
