import type { Meta, StoryObj } from "@storybook/react";
import { PageHeader } from "../components/PageHeader";
import { Panel, PanelHeader, PanelBody, Table, PrimitiveBadge, Input, Select, Button } from "@vpn-suite/shared/ui";
import type { Column } from "@vpn-suite/shared/ui";

interface ServerRow {
  id: string;
  name: string;
  status: "online" | "offline" | "degraded";
  region: string;
}

const columns: Column<ServerRow>[] = [
  { key: "name", header: "Name", truncate: true, render: (r) => r.name },
  { key: "status", header: "Status", render: (r) => (
    <PrimitiveBadge variant={r.status === "online" ? "success" : r.status === "offline" ? "danger" : "warning"}>
      {r.status}
    </PrimitiveBadge>
  ) },
  { key: "region", header: "Region", render: (r) => r.region },
];

const data: ServerRow[] = [
  { id: "1", name: "core-01", status: "online", region: "us-east" },
  { id: "2", name: "edge-22", status: "degraded", region: "eu-west" },
  { id: "3", name: "core-07", status: "offline", region: "ap-south" },
];

const meta: Meta = {
  title: "Pages/Servers",
  parameters: {
    docs: {
      description: {
        component: "Reference servers page layout. Static data only.",
      },
    },
  },
};

export default meta;

type Story = StoryObj;

export const Overview: Story = {
  render: () => (
    <div className="sb-stack">
      <PageHeader
        title="Servers"
        description="Filter and inspect node health across regions."
        primaryAction={<Button>Add server</Button>}
      />
      <Panel>
        <PanelHeader
          title="Filters"
          actions={<Button variant="secondary" size="sm">Reset</Button>}
        />
        <PanelBody>
          <div className="sb-row">
            <Input placeholder="Search servers" aria-label="Search servers" />
            <Select
              options={[
                { label: "All statuses", value: "all" },
                { label: "Online", value: "online" },
                { label: "Degraded", value: "degraded" },
                { label: "Offline", value: "offline" },
              ]}
              value="all"
              onChange={() => {}}
            />
            <Select
              options={[
                { label: "All regions", value: "all" },
                { label: "us-east", value: "us-east" },
                { label: "eu-west", value: "eu-west" },
              ]}
              value="all"
              onChange={() => {}}
            />
          </div>
        </PanelBody>
      </Panel>
      <Panel>
        <PanelHeader title="Server list" />
        <PanelBody>
          <Table<ServerRow> columns={columns} data={data} keyExtractor={(r) => r.id} />
        </PanelBody>
      </Panel>
    </div>
  ),
};

export const Variants: Story = {
  render: () => (
    <div className="sb-stack">
      <PageHeader title="Servers" description="Filter and inspect node health across regions." />
      <Panel>
        <PanelHeader title="Server list" />
        <PanelBody>
          <Table<ServerRow> columns={columns} data={data} keyExtractor={(r) => r.id} />
        </PanelBody>
      </Panel>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="sb-stack">
      <p className="m-0">Reference layout only; size variants are not exposed.</p>
      <PageHeader title="Servers" description="Filter and inspect node health across regions." />
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <div className="sb-stack">
      <PageHeader title="Servers" description="Filter and inspect node health across regions." />
      <Panel>
        <PanelHeader title="Server list" />
        <PanelBody>
          <Table<ServerRow> columns={columns} data={data} keyExtractor={(r) => r.id} />
        </PanelBody>
      </Panel>
    </div>
  ),
};

export const WithLongText: Story = {
  render: () => (
    <div className="sb-stack">
      <PageHeader
        title="Servers in the primary and secondary regions with extended filter context"
        description="Filter and inspect node health across regions and environments with long descriptions."
      />
    </div>
  ),
};

export const DarkMode: Story = {
  parameters: { themes: { themeOverride: "dark" } },
  render: () => (
    <div className="sb-stack">
      <PageHeader title="Servers" description="Filter and inspect node health across regions." />
    </div>
  ),
};

export const Accessibility: Story = {
  render: () => (
    <div className="sb-stack">
      <PageHeader title="Servers" description="Filter and inspect node health across regions." />
    </div>
  ),
};

export const EdgeCases = WithLongText;
