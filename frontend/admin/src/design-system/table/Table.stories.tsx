import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Table, TableSkeleton, VirtualTable } from "./index";
import { Badge as PrimitiveBadge } from "@/design-system";
import type { Column } from "./Table";

interface SampleRow {
  id: string;
  name: string;
  status: string;
  count: number;
}

const sampleData: SampleRow[] = [
  { id: "1", name: "Alpha", status: "active", count: 42 },
  { id: "2", name: "Beta", status: "inactive", count: 0 },
  { id: "3", name: "Gamma with very long text that should truncate when space is limited", status: "active", count: 128 },
];

const columns: Column<SampleRow>[] = [
  { key: "name", header: "Name", truncate: true, titleTooltip: (r) => r.name, render: (r) => r.name },
  { key: "status", header: "Status", render: (r) => <PrimitiveBadge variant={r.status === "active" ? "success" : "neutral"}>{r.status}</PrimitiveBadge> },
  { key: "count", header: "Count", numeric: true, render: (r) => r.count },
  { key: "actions", header: "Actions", actions: true, render: () => <div className="table-actions"><button type="button">View</button></div> },
];

const meta: Meta<typeof Table> = {
  title: "Components/DataTable",
  component: Table,
  parameters: {
    docs: {
      description: {
        component: `Data table with columns, sorting, density. VirtualTable for large lists.

**Purpose:** Tabular data. Don't use for layout.

**States:** Default, loading (TableSkeleton), empty. Supports sort, pagination, selection.

**Accessibility:** Semantic table; sortable headers. **Do:** Use keyExtractor. **Don't:** Raw table markup.`,
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof Table>;

export const Overview: Story = {
  render: () => (
    <Table<SampleRow>
      columns={columns}
      data={sampleData}
      keyExtractor={(r) => r.id}
      emptyMessage="No data"
    />
  ),
};

export const Variants: Story = {
  render: () => (
    <div className="sb-stack">
      <Table<SampleRow>
        columns={columns}
        data={sampleData}
        keyExtractor={(r) => r.id}
        emptyMessage="No data"
      />
      <Table<SampleRow>
        columns={columns}
        data={[]}
        keyExtractor={(r) => r.id}
        emptyMessage="No items found"
      />
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="sb-stack">
      <Table<SampleRow>
        columns={columns}
        data={sampleData}
        keyExtractor={(r) => r.id}
        density="compact"
      />
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <Table<SampleRow>
      columns={columns}
      data={sampleData}
      keyExtractor={(r) => r.id}
    />
  ),
};

export const Empty: Story = {
  render: () => (
    <Table<SampleRow>
      columns={columns}
      data={[]}
      keyExtractor={(r) => r.id}
      emptyMessage="No items found"
    />
  ),
};

export const WithSort: Story = {
  render: function WithSortStory() {
    const [sortKey, setSortKey] = useState("name");
    const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
    const sorted = [...sampleData].sort((a, b) => {
      const mult = sortDir === "asc" ? 1 : -1;
      if (sortKey === "name") return a.name.localeCompare(b.name) * mult;
      if (sortKey === "count") return (a.count - b.count) * mult;
      return 0;
    });
    return (
      <Table<SampleRow>
        columns={[
          { key: "name", header: "Name", sortKey: "name", truncate: true, titleTooltip: (r) => r.name, render: (r) => r.name },
          { key: "status", header: "Status", render: (r) => <PrimitiveBadge variant={r.status === "active" ? "success" : "neutral"}>{r.status}</PrimitiveBadge> },
          { key: "count", header: "Count", sortKey: "count", numeric: true, render: (r) => r.count },
        ]}
        data={sorted}
        keyExtractor={(r) => r.id}
        sortKey={sortKey}
        sortDir={sortDir}
        onSort={(k) => {
          setSortDir(sortKey === k && sortDir === "asc" ? "desc" : "asc");
          setSortKey(k);
        }}
      />
    );
  },
};

export const Loading: Story = {
  render: () => <TableSkeleton rows={4} columns={5} density="comfortable" />,
};

export const WithLongText: Story = {
  render: () => (
    <Table<SampleRow>
      columns={columns}
      data={[
        { id: "1", name: "Very long server name that should truncate in the table cell", status: "active", count: 42 },
      ]}
      keyExtractor={(r) => r.id}
    />
  ),
};

export const Virtualized: Story = {
  render: () => {
    const data: SampleRow[] = Array.from({ length: 200 }, (_, i) => ({
      id: String(i + 1),
      name: `Item ${i + 1}`,
      status: i % 3 === 0 ? "inactive" : "active",
      count: i * 3,
    }));
    return (
      <VirtualTable<SampleRow>
        columns={columns}
        data={data}
        keyExtractor={(r) => r.id}
        height="var(--table-virtual-height)"
      />
    );
  },
};

export const DarkMode: Story = {
  parameters: { themes: { themeOverride: "dark" } },
  render: () => (
    <Table<SampleRow>
      columns={columns}
      data={sampleData}
      keyExtractor={(r) => r.id}
      emptyMessage="No data"
    />
  ),
};

export const Accessibility: Story = {
  render: () => (
    <Table<SampleRow>
      columns={columns}
      data={sampleData}
      keyExtractor={(r) => r.id}
      emptyMessage="No data"
    />
  ),
};

export const EdgeCases = WithLongText;
