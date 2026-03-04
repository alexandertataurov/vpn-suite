import type { Meta, StoryObj } from "@storybook/react";
import { EmptyState, Button } from "@vpn-suite/shared/ui";

const meta: Meta<typeof EmptyState> = {
  title: "Shared/Patterns/EmptyStates",
  component: EmptyState,
  parameters: {
    docs: {
      description: {
        component: "Empty state patterns: no data, filtered, and first-run experiences.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof EmptyState>;

export const EmptyStatesOverview: Story = {
  render: () => (
    <div className="sb-grid" data-columns="2">
      <EmptyState title="No servers" description="Add your first VPN node to get started." actions={<Button>Add server</Button>} />
      <EmptyState title="No results" description="Try adjusting filters or search terms." />
    </div>
  ),
};

export const EmptyStatesVariants: Story = {
  render: () => (
    <div className="sb-stack">
      <EmptyState title="No servers" description="Add your first VPN node to get started." />
      <EmptyState title="No results" description="Try adjusting filters or search terms." />
    </div>
  ),
};

export const EmptyStatesSizes: Story = {
  render: () => (
    <div className="sb-stack">
      <p className="m-0">Size variants are not exposed; spacing is tokenized.</p>
      <EmptyState title="No servers" description="Add your first VPN node to get started." />
    </div>
  ),
};

export const EmptyStatesStates: Story = {
  render: () => (
    <EmptyState title="No servers" description="Add your first VPN node to get started." />
  ),
};

export const EmptyStatesWithLongText: Story = {
  render: () => (
    <EmptyState
      title="No telemetry for the selected time range and environment"
      description="This environment has not reported telemetry for more than 24 hours. Check connectivity or switch to a shorter time window."
      actions={<Button variant="secondary">Reset filters</Button>}
    />
  ),
};

export const EmptyStatesDarkMode: Story = {
  parameters: { themes: { themeOverride: "dark" } },
  render: () => (
    <EmptyState title="No servers" description="Add your first VPN node to get started." actions={<Button>Add server</Button>} />
  ),
};

export const EmptyStatesAccessibility: Story = {
  render: () => (
    <EmptyState title="No items" description="Screen readers announce the empty state message." />
  ),
};

export const EmptyStatesEdgeCases = WithLongText;
