import type { Meta, StoryObj } from "@storybook/react";
import { EmptyState } from "./EmptyState";
import { Button } from "../buttons/Button";

const meta: Meta<typeof EmptyState> = {
  title: "Shared/Primitives/EmptyState",
  component: EmptyState,
  parameters: {
    docs: {
      description: {
        component: "Placeholder when no data. Use title, optional description, optional action. Pattern: tables, lists, dashboards.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof EmptyState>;

export const EmptyStateOverview: Story = {
  args: { title: "No items yet" },
};

export const EmptyStateVariants: Story = {
  render: () => (
    <div className="sb-stack">
      <EmptyState title="No servers" description="Add your first server to get started." />
      <EmptyState
        title="No servers"
        description="Add your first server."
        actions={<Button>Add server</Button>}
      />
    </div>
  ),
};

export const EmptyStateSizes: Story = {
  render: () => (
    <div className="sb-stack">
      <p className="m-0">Size variants are not exposed; spacing is tokenized.</p>
      <EmptyState title="No items yet" />
    </div>
  ),
};

export const EmptyStateStates: Story = {
  render: () => (
    <EmptyState title="No items yet" />
  ),
};

export const EmptyStateWithLongText: Story = {
  args: {
    title: "No servers in this region",
    description: "There are currently no servers in this region. Try changing filters or create a new server to begin monitoring telemetry and health status.",
  },
};

export const EmptyStateAccessibility: Story = {
  args: { title: "No items yet", description: "Empty state announces status." },
};

export const EmptyStateDarkMode: Story = {
  parameters: { themes: { themeOverride: "dark" } },
  args: { title: "No items yet" },
};

export const EmptyStateEdgeCases = WithLongText;
