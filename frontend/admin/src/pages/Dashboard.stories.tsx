import type { Meta, StoryObj } from "@storybook/react";
import { PageHeader } from "../components/PageHeader";
import { MetricTile } from "../components/MetricTile";
import { Panel, PanelHeader, PanelBody, Table, PrimitiveBadge, Button } from "@vpn-suite/shared/ui";
import type { Column } from "@vpn-suite/shared/ui";
import { Activity, ShieldCheck, TriangleAlert } from "lucide-react";

interface ActivityRow {
  id: string;
  action: string;
  status: "ok" | "degraded" | "down";
  owner: string;
}

const columns: Column<ActivityRow>[] = [
  { key: "action", header: "Action", truncate: true, render: (r) => r.action },
  { key: "status", header: "Status", render: (r) => (
    <PrimitiveBadge variant={r.status === "ok" ? "success" : r.status === "down" ? "danger" : "warning"}>
      {r.status}
    </PrimitiveBadge>
  ) },
  { key: "owner", header: "Owner", render: (r) => r.owner },
];

const data: ActivityRow[] = [
  { id: "1", action: "Patch rollout", status: "ok", owner: "ops" },
  { id: "2", action: "Edge drain", status: "degraded", owner: "sre" },
  { id: "3", action: "Key rotation", status: "ok", owner: "sec" },
];

const meta: Meta = {
  title: "Pages/Dashboard",
  parameters: {
    docs: {
      description: {
        component: "Reference dashboard layout. Static data only.",
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
        title="Dashboard"
        description="Operator overview of system health and activity."
        primaryAction={<Button>Add report</Button>}
      />
      <div className="sb-grid" data-columns="3">
        <MetricTile label="Active sessions" value={1823} trend={{ value: 3.2, direction: "up" }} icon={Activity} />
        <MetricTile label="Compliance" value={"99.9"} unit="%" state="success" icon={ShieldCheck} />
        <MetricTile label="Incidents" value={2} state="warning" icon={TriangleAlert} />
      </div>
      <Panel>
        <PanelHeader title="Recent activity" actions={<Button variant="secondary" size="sm">View all</Button>} />
        <PanelBody>
          <Table<ActivityRow> columns={columns} data={data} keyExtractor={(r) => r.id} />
        </PanelBody>
      </Panel>
    </div>
  ),
};

export const Variants: Story = {
  render: () => (
    <div className="sb-stack">
      <PageHeader
        title="Dashboard"
        description="Operator overview of system health and activity."
        primaryAction={<Button>Add report</Button>}
      />
      <div className="sb-grid" data-columns="2">
        <MetricTile label="Active sessions" value={1823} />
        <MetricTile label="Compliance" value={"99.9"} unit="%" />
      </div>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="sb-stack">
      <p className="m-0">Reference layout only; size variants are not exposed.</p>
      <PageHeader title="Dashboard" description="Operator overview." />
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <div className="sb-stack">
      <PageHeader title="Dashboard" description="Operator overview." />
      <Panel>
        <PanelHeader title="Recent activity" />
        <PanelBody>
          <Table<ActivityRow> columns={columns} data={data} keyExtractor={(r) => r.id} />
        </PanelBody>
      </Panel>
    </div>
  ),
};

export const WithLongText: Story = {
  render: () => (
    <div className="sb-stack">
      <PageHeader
        title="Dashboard for the primary and secondary regions with extended context"
        description="Operator overview of system health and activity across multiple regions and environments."
      />
    </div>
  ),
};

export const DarkMode: Story = {
  parameters: { themes: { themeOverride: "dark" } },
  render: () => (
    <div className="sb-stack">
      <PageHeader title="Dashboard" description="Operator overview." />
    </div>
  ),
};

export const Accessibility: Story = {
  render: () => (
    <div className="sb-stack">
      <PageHeader title="Dashboard" description="Operator overview." />
    </div>
  ),
};

export const EdgeCases = WithLongText;
