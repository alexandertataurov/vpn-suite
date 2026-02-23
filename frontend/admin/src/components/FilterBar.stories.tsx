import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { FilterBar } from "./FilterBar";

const meta: Meta<typeof FilterBar> = {
  title: "Components/FilterBar",
  component: FilterBar,
};

export default meta;

type Story = StoryObj<typeof FilterBar>;

const statusOptions = [
  { value: "all", label: "All" },
  { value: "online", label: "Online" },
  { value: "offline", label: "Offline" },
  { value: "degraded", label: "Degraded" },
];

const sortOptions = [
  { value: "name", label: "Name" },
  { value: "region", label: "Region" },
  { value: "health", label: "Health" },
];

const lastSeenOptions = [
  { value: "all", label: "All" },
  { value: "5m", label: "5 minutes" },
  { value: "1h", label: "1 hour" },
];

const regionOptions = [
  { value: "all", label: "All regions" },
  { value: "us-east-1", label: "us-east-1" },
  { value: "eu-west-1", label: "eu-west-1" },
];

function FilterBarDemo({ withOptional }: { withOptional?: boolean }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("name");
  const [lastSeen, setLastSeen] = useState("all");
  const [region, setRegion] = useState("all");
  const [density, setDensity] = useState<"compact" | "normal">("normal");

  return (
    <FilterBar
      search={search}
      onSearch={setSearch}
      statusOptions={statusOptions}
      statusValue={status}
      onStatusChange={setStatus}
      sortOptions={sortOptions}
      sortValue={sort}
      onSortChange={setSort}
      lastSeenOptions={withOptional ? lastSeenOptions : undefined}
      lastSeenValue={withOptional ? lastSeen : undefined}
      onLastSeenChange={withOptional ? setLastSeen : undefined}
      regionOptions={withOptional ? regionOptions : undefined}
      regionValue={withOptional ? region : undefined}
      onRegionChange={withOptional ? setRegion : undefined}
      density={withOptional ? density : undefined}
      onDensityChange={withOptional ? () => setDensity(density === "compact" ? "normal" : "compact") : undefined}
    />
  );
}

export const Overview: Story = {
  render: () => <FilterBarDemo withOptional />,
};

export const Variants: Story = {
  render: () => (
    <div className="sb-stack">
      <FilterBarDemo />
      <FilterBarDemo withOptional />
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="sb-stack">
      <p className="m-0">FilterBar sizes are controlled by tokens only.</p>
      <FilterBarDemo withOptional />
    </div>
  ),
};

export const States: Story = {
  render: () => <FilterBarDemo withOptional />,
};

export const WithLongText: Story = {
  render: () => (
    <div className="sb-stack">
      <FilterBar
        search="core-edge-primary-02-us-east-1"
        onSearch={() => {}}
        statusOptions={statusOptions}
        statusValue="all"
        onStatusChange={() => {}}
        sortOptions={sortOptions}
        sortValue="name"
        onSortChange={() => {}}
        searchPlaceholder="Search by name, region, or ID"
      />
      <div className="max-w-200">
        <FilterBarDemo withOptional />
      </div>
    </div>
  ),
};

export const EdgeCases = WithLongText;

export const DarkMode: Story = {
  parameters: { themes: { themeOverride: "dark" } },
  render: () => <FilterBarDemo withOptional />,
};

export const Accessibility: Story = {
  render: () => <FilterBarDemo withOptional />,
};
