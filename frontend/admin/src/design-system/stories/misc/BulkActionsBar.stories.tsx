import type { Meta, StoryObj } from "@storybook/react";
import { BulkActionsBar } from "@/design-system";
import { Button } from "@/design-system";

const meta: Meta<typeof BulkActionsBar> = {
  title: "Patterns/BulkActionsBar",
  component: BulkActionsBar,
  parameters: {
    docs: {
      description: {
        component: "Bar shown when table rows selected. selectedCount, onClear, actions.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof BulkActionsBar>;

export const Overview: Story = {
  args: {
    selectedCount: 3,
    onClear: () => {},
    actions: <Button variant="danger" size="sm">Delete</Button>,
  },
};

export const Variants: Story = {
  render: () => (
    <div className="sb-stack">
      <BulkActionsBar
        selectedCount={3}
        onClear={() => {}}
        actions={<Button variant="danger" size="sm">Delete</Button>}
      />
      <BulkActionsBar
        selectedCount={12}
        onClear={() => {}}
        actions={<Button variant="secondary" size="sm">Export</Button>}
      />
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="sb-stack">
      <p className="m-0">Size variants are not exposed; spacing is tokenized.</p>
      <BulkActionsBar
        selectedCount={3}
        onClear={() => {}}
        actions={<Button variant="danger" size="sm">Delete</Button>}
      />
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <BulkActionsBar
      selectedCount={3}
      onClear={() => {}}
      actions={<Button variant="danger" size="sm">Delete</Button>}
    />
  ),
};

export const WithLongText: Story = {
  args: {
    selectedCount: 128,
    onClear: () => {},
    actions: <Button variant="secondary" size="sm">Export selected items from multiple regions</Button>,
  },
};

export const DarkMode: Story = {
  parameters: { themes: { themeOverride: "dark" } },
  args: {
    selectedCount: 3,
    onClear: () => {},
    actions: <Button variant="danger" size="sm">Delete</Button>,
  },
};

export const Accessibility: Story = {
  args: {
    selectedCount: 3,
    onClear: () => {},
    actions: <Button variant="danger" size="sm">Delete</Button>,
  },
};

export const EdgeCases = WithLongText;
