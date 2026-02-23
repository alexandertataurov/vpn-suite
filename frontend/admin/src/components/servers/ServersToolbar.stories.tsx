import type { Meta, StoryObj } from "@storybook/react";
import { ServersToolbar } from "./ServersToolbar";
import { FilterBar } from "../FilterBar";

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "online", label: "Online" },
  { value: "offline", label: "Offline" },
];
const SORT_OPTIONS = [
  { value: "created_at_desc", label: "Newest first" },
  { value: "name_asc", label: "Name A–Z" },
];
const LAST_SEEN_OPTIONS = [
  { value: "all", label: "All servers" },
  { value: "24", label: "Seen in 24h" },
];

const meta: Meta<typeof ServersToolbar> = {
  title: "Components/FilterBar/ServersToolbar",
  component: ServersToolbar,
};

export default meta;

type Story = StoryObj<typeof ServersToolbar>;

export const Overview: Story = {
  args: {
    dataUpdatedAt: Date.now() - 13_000,
    isFetching: false,
    onSync: () => {},
    connectionState: "live",
    liveIntervalSeconds: 30,
  },
};

export const Variants: Story = {
  render: () => (
    <div className="sb-stack">
      <ServersToolbar
        dataUpdatedAt={Date.now() - 13_000}
        isFetching={false}
        onSync={() => {}}
        connectionState="live"
        liveIntervalSeconds={30}
      />
      <ServersToolbar
        dataUpdatedAt={Date.now() - 13_000}
        isFetching
        onSync={() => {}}
        connectionState="live"
        liveIntervalSeconds={30}
      />
      <ServersToolbar
        dataUpdatedAt={Date.now() - 60_000}
        isFetching={false}
        onSync={() => {}}
        connectionState="degraded"
        liveIntervalSeconds={30}
      />
      <ServersToolbar
        dataUpdatedAt={undefined}
        isFetching={false}
        onSync={() => {}}
        connectionState="offline"
        liveIntervalSeconds={30}
      />
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="sb-stack">
      <p className="m-0">Size variants are not exposed; toolbar height is tokenized.</p>
      <ServersToolbar
        dataUpdatedAt={Date.now() - 13_000}
        isFetching={false}
        onSync={() => {}}
        connectionState="live"
        liveIntervalSeconds={30}
      />
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <ServersToolbar
      dataUpdatedAt={Date.now() - 13_000}
      isFetching={false}
      onSync={() => {}}
      connectionState="live"
      liveIntervalSeconds={30}
    />
  ),
};

export const WithLongText: Story = {
  args: {
    dataUpdatedAt: Date.now() - 13_000,
    isFetching: false,
    onSync: () => {},
    connectionState: "live",
    liveIntervalSeconds: 120,
    children: (
      <FilterBar
        search="Very long search query that should wrap"
        onSearch={() => {}}
        statusOptions={STATUS_OPTIONS}
        statusValue="all"
        onStatusChange={() => {}}
        sortOptions={SORT_OPTIONS}
        sortValue="created_at_desc"
        onSortChange={() => {}}
        lastSeenOptions={LAST_SEEN_OPTIONS}
        lastSeenValue="all"
        onLastSeenChange={() => {}}
        density="normal"
        onDensityChange={() => {}}
      />
    ),
  },
};

export const DarkMode: Story = {
  parameters: { themes: { themeOverride: "dark" } },
  args: {
    dataUpdatedAt: Date.now() - 13_000,
    isFetching: false,
    onSync: () => {},
    connectionState: "live",
    liveIntervalSeconds: 30,
  },
};

export const Accessibility: Story = {
  args: {
    dataUpdatedAt: Date.now() - 13_000,
    isFetching: false,
    onSync: () => {},
    connectionState: "live",
    liveIntervalSeconds: 30,
  },
};

export const EdgeCases = WithLongText;
