import type { Meta, StoryObj } from "@storybook/react";
import { VirtualTable } from "./index";
import { Badge as PrimitiveBadge } from "../primitives/Badge";
import type { Column } from "./Table";

interface SampleRow {
  id: string;
  name: string;
  status: string;
  count: number;
}

const columns: Column<SampleRow>[] = [
  { key: "name", header: "Name", truncate: true, titleTooltip: (r) => r.name, render: (r) => r.name },
  { key: "status", header: "Status", render: (r) => <PrimitiveBadge variant={r.status === "active" ? "success" : "neutral"}>{r.status}</PrimitiveBadge> },
  { key: "count", header: "Count", numeric: true, render: (r) => r.count },
];

const manyRows: SampleRow[] = Array.from({ length: 200 }, (_, i) => ({
  id: String(i + 1),
  name: `Row ${i + 1}`,
  status: i % 3 === 0 ? "inactive" : "active",
  count: i * 2,
}));

const meta: Meta<typeof VirtualTable> = {
  title: "Components/DataTable/Virtual",
  component: VirtualTable,
  parameters: {
    docs: {
      description: {
        component:
          "Virtualized table for large datasets. Uses @tanstack/react-virtual. Purpose: 50+ rows. Don't use for small lists. States: Default, empty, loading. Props: height, rowHeight, density.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof VirtualTable>;

export const Overview: Story = {
  render: () => (
    <VirtualTable<SampleRow>
      columns={columns}
      data={manyRows}
      keyExtractor={(r) => r.id}
      height="var(--table-virtual-height)"
    />
  ),
};

export const Variants: Story = {
  render: () => (
    <div className="sb-stack">
      <VirtualTable<SampleRow>
        columns={columns}
        data={manyRows}
        keyExtractor={(r) => r.id}
        height="var(--table-virtual-height)"
      />
      <VirtualTable<SampleRow>
        columns={columns}
        data={[]}
        keyExtractor={(r) => r.id}
        height="var(--table-virtual-height)"
        emptyMessage="No items"
      />
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <VirtualTable<SampleRow>
      columns={columns}
      data={manyRows}
      keyExtractor={(r) => r.id}
      height="var(--table-virtual-height)"
      density="compact"
    />
  ),
};

export const States: Story = {
  render: () => (
    <VirtualTable<SampleRow>
      columns={columns}
      data={manyRows}
      keyExtractor={(r) => r.id}
      height="var(--table-virtual-height)"
    />
  ),
};

export const WithLongText: Story = {
  render: () => (
    <VirtualTable<SampleRow>
      columns={columns}
      data={[
        { id: "1", name: "Very long server name that should truncate in the table cell", status: "active", count: 42 },
      ]}
      keyExtractor={(r) => r.id}
      height="var(--table-virtual-height)"
    />
  ),
};

export const DarkMode: Story = {
  parameters: { themes: { themeOverride: "dark" } },
  render: () => (
    <VirtualTable<SampleRow>
      columns={columns}
      data={manyRows}
      keyExtractor={(r) => r.id}
      height="var(--table-virtual-height)"
    />
  ),
};

export const Accessibility: Story = {
  render: () => (
    <VirtualTable<SampleRow>
      columns={columns}
      data={manyRows}
      keyExtractor={(r) => r.id}
      height="var(--table-virtual-height)"
    />
  ),
};

export const EdgeCases = WithLongText;
