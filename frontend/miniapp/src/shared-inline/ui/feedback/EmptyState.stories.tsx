import type { Meta, StoryObj } from "@storybook/react";
import { EmptyState } from "./EmptyState";
import { Button } from "../buttons/Button";

const meta: Meta<typeof EmptyState> = {
  title: "Primitives/EmptyState",
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

export const Overview: Story = {
  args: { title: "No items yet" },
};

export const Variants: Story = {
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

export const Sizes: Story = {
  render: () => (
    <div className="sb-stack">
      <p className="m-0">Size variants are not exposed; spacing is tokenized.</p>
      <EmptyState title="No items yet" />
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <EmptyState title="No items yet" />
  ),
};

export const WithLongText: Story = {
  args: {
    title: "No servers in this region",
    description: "There are currently no servers in this region. Try changing filters or create a new server to begin monitoring telemetry and health status.",
  },
};

export const Accessibility: Story = {
  args: { title: "No items yet", description: "Empty state announces status." },
};

export const DarkMode: Story = {
  parameters: { themes: { themeOverride: "dark" } },
  args: { title: "No items yet" },
};

export const EdgeCases = WithLongText;
