import type { Meta, Decorator } from "@storybook/react";
import type { ReactNode } from "react";

export interface CreatePatternMetaConfig {
  title: string;
  component: unknown;
  tags?: string[];
  description: string;
}

const PATTERN_DOCS_DESCRIPTION = `
### What this pattern is
One paragraph explaining what UI problem this pattern solves and where it fits in the product experience.

### When this pattern appears
The specific product moments and user journeys where this pattern is the right solution.

### What it's composed of
A breakdown of which primitives and composites combine to form this pattern, and why each is included.

### Behavior & interactions
How the pattern responds to user actions, state changes, data loading, errors, and edge cases.

### Accessibility
Pattern-level a11y considerations beyond individual components: focus management, landmark regions, live regions, skip links.

### Variants & configurations
The meaningful configurations this pattern supports and when to choose each.

### Do / Don't
Pattern-level usage guidance — not component-level.
`.trim();

/** Standardizes meta for pattern stories: fullscreen layout, correct title prefix, pattern docs structure. */
export function createPatternMeta<P>(config: CreatePatternMetaConfig & { description?: string }): Meta<P> {
  const { title, component, tags = ["autodocs"], description } = config;
  return {
    title,
    component: component as React.ComponentType<P>,
    tags,
    parameters: {
      layout: "fullscreen",
      docs: {
        description: {
          component: config.description ?? PATTERN_DOCS_DESCRIPTION,
        },
      },
    },
  } as Meta<P>;
}

/** Wraps the pattern in a minimal app chrome (sidebar + top bar) so it's shown in context. */
export const withAppShell: Decorator = (Story, context) => {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        gridTemplateColumns: "56px 1fr",
        gridTemplateRows: "48px 1fr",
        background: "var(--color-base)",
      }}
    >
      <div
        style={{
          gridColumn: 1,
          gridRow: "1 / -1",
          background: "var(--color-surface)",
          borderRight: "1px solid var(--color-border-subtle)",
        }}
      />
      <div
        style={{
          gridColumn: 2,
          gridRow: 1,
          borderBottom: "1px solid var(--color-border-subtle)",
          background: "var(--color-elevated)",
        }}
      />
      <div style={{ gridColumn: 2, gridRow: 2, padding: 24, overflow: "auto" }}>
        <Story />
      </div>
    </div>
  );
};

/** Sets a desktop viewport by default for pattern stories. */
export const withRealisticViewport: Decorator = (Story, context) => {
  context.parameters.viewport = context.parameters.viewport ?? { defaultViewport: "desktop" };
  return <Story />;
};

/** Injects the standard pattern documentation structure into parameters. */
export const withPatternDocs: Decorator = (Story, context) => {
  if (!context.parameters.docs) context.parameters.docs = {};
  if (!context.parameters.docs.description) context.parameters.docs.description = {};
  if (!context.parameters.docs.description.component)
    context.parameters.docs.description.component = PATTERN_DOCS_DESCRIPTION;
  return <Story />;
};

export const patternDecorators = [withRealisticViewport, withPatternDocs];

// ——— Pattern seed data (VPN/operator product context) ———

export interface PatternUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "active" | "inactive" | "pending";
  lastActive: string;
  avatar?: string;
}

export const users: PatternUser[] = [
  { id: "1", name: "Jordan Chen", email: "jordan.chen@acme.io", role: "Admin", status: "active", lastActive: "2024-02-15T14:32:00Z" },
  { id: "2", name: "Sam Rivera", email: "sam.rivera@acme.io", role: "Operator", status: "active", lastActive: "2024-02-15T13:18:00Z" },
  { id: "3", name: "Alex Kim", email: "alex.kim@acme.io", role: "Viewer", status: "inactive", lastActive: "2024-02-10T09:00:00Z" },
  { id: "4", name: "Morgan Taylor", email: "morgan.taylor@acme.io", role: "Operator", status: "active", lastActive: "2024-02-15T12:05:00Z" },
  { id: "5", name: "Riley Foster", email: "riley.foster@acme.io", role: "Admin", status: "pending", lastActive: "2024-02-14T16:45:00Z" },
  { id: "6", name: "Casey Brooks", email: "casey.brooks@acme.io", role: "Operator", status: "active", lastActive: "2024-02-15T11:22:00Z" },
  { id: "7", name: "Quinn Davis", email: "quinn.davis@acme.io", role: "Viewer", status: "active", lastActive: "2024-02-15T10:00:00Z" },
  { id: "8", name: "Reese Martinez", email: "reese.martinez@acme.io", role: "Operator", status: "inactive", lastActive: "2024-02-08T17:30:00Z" },
  { id: "9", name: "Parker Lee", email: "parker.lee@acme.io", role: "Admin", status: "active", lastActive: "2024-02-15T14:00:00Z" },
  { id: "10", name: "Blake Wilson", email: "blake.wilson@acme.io", role: "Operator", status: "active", lastActive: "2024-02-15T13:45:00Z" },
  { id: "11", name: "Skyler Hayes", email: "skyler.hayes@acme.io", role: "Viewer", status: "active", lastActive: "2024-02-15T09:15:00Z" },
  { id: "12", name: "Drew Morgan", email: "drew.morgan@acme.io", role: "Operator", status: "active", lastActive: "2024-02-15T12:30:00Z" },
  { id: "13", name: "Jamie Bell", email: "jamie.bell@acme.io", role: "Admin", status: "active", lastActive: "2024-02-15T14:28:00Z" },
  { id: "14", name: "Cameron Reed", email: "cameron.reed@acme.io", role: "Operator", status: "inactive", lastActive: "2024-02-01T11:00:00Z" },
  { id: "15", name: "Avery Cooper", email: "avery.cooper@acme.io", role: "Viewer", status: "pending", lastActive: "2024-02-14T08:00:00Z" },
  { id: "16", name: "Sage Bennett", email: "sage.bennett@acme.io", role: "Operator", status: "active", lastActive: "2024-02-15T13:00:00Z" },
  { id: "17", name: "Finley Gray", email: "finley.gray@acme.io", role: "Admin", status: "active", lastActive: "2024-02-15T14:15:00Z" },
  { id: "18", name: "Emery Wright", email: "emery.wright@acme.io", role: "Operator", status: "active", lastActive: "2024-02-15T11:45:00Z" },
  { id: "19", name: "Harper Clark", email: "harper.clark@acme.io", role: "Viewer", status: "active", lastActive: "2024-02-15T10:30:00Z" },
  { id: "20", name: "Rowan Scott", email: "rowan.scott@acme.io", role: "Operator", status: "active", lastActive: "2024-02-15T14:20:00Z" },
];

export interface PatternProject {
  id: string;
  name: string;
  region: string;
  nodes: number;
  status: "healthy" | "degraded" | "down";
  lastDeploy: string;
}

export const projects: PatternProject[] = [
  { id: "p1", name: "Production VPN", region: "us-east-1", nodes: 12, status: "healthy", lastDeploy: "2024-02-15T10:00:00Z" },
  { id: "p2", name: "Staging Core", region: "eu-west-1", nodes: 4, status: "healthy", lastDeploy: "2024-02-14T16:30:00Z" },
  { id: "p3", name: "Dev Edge", region: "us-west-2", nodes: 3, status: "degraded", lastDeploy: "2024-02-13T09:15:00Z" },
  { id: "p4", name: "Customer Alpha", region: "us-east-1", nodes: 8, status: "healthy", lastDeploy: "2024-02-15T08:00:00Z" },
  { id: "p5", name: "Customer Beta", region: "eu-central-1", nodes: 6, status: "down", lastDeploy: "2024-02-10T14:00:00Z" },
  { id: "p6", name: "Internal Tools", region: "us-east-1", nodes: 2, status: "healthy", lastDeploy: "2024-02-15T12:00:00Z" },
  { id: "p7", name: "DR Failover", region: "ap-southeast-1", nodes: 5, status: "healthy", lastDeploy: "2024-02-14T20:00:00Z" },
  { id: "p8", name: "Lab Environment", region: "us-west-2", nodes: 1, status: "degraded", lastDeploy: "2024-02-11T11:00:00Z" },
  { id: "p9", name: "Demo Fleet", region: "eu-west-1", nodes: 10, status: "healthy", lastDeploy: "2024-02-15T07:30:00Z" },
  { id: "p10", name: "QA VPN", region: "us-east-2", nodes: 4, status: "healthy", lastDeploy: "2024-02-15T09:45:00Z" },
];

export interface PatternNotification {
  id: string;
  type: "info" | "warning" | "error" | "success";
  title: string;
  body: string;
  time: string;
  read: boolean;
}

export const notifications: PatternNotification[] = [
  { id: "n1", type: "warning", title: "Telemetry delay", body: "Metrics from core-edge-02 are delayed by ~2 minutes.", time: "2024-02-15T14:25:00Z", read: false },
  { id: "n2", type: "success", title: "Deployment complete", body: "Production VPN updated to v2.4.1.", time: "2024-02-15T14:00:00Z", read: true },
  { id: "n3", type: "error", title: "Node offline", body: "core-edge-07 lost connectivity. Check network.", time: "2024-02-15T13:45:00Z", read: false },
  { id: "n4", type: "info", title: "Scheduled maintenance", body: "us-east-1 maintenance window starts in 24h.", time: "2024-02-15T12:00:00Z", read: true },
  { id: "n5", type: "success", title: "Config saved", body: "Server core-edge-01 configuration applied.", time: "2024-02-15T11:30:00Z", read: true },
  { id: "n6", type: "warning", title: "High error rate", body: "Error rate on eu-west-1 cluster above 2%.", time: "2024-02-15T11:00:00Z", read: false },
  { id: "n7", type: "info", title: "New feature", body: "Live metrics streaming is now available.", time: "2024-02-15T10:00:00Z", read: true },
  { id: "n8", type: "error", title: "API rate limit", body: "Admin API approached rate limit. Consider batching.", time: "2024-02-15T09:45:00Z", read: true },
  { id: "n9", type: "success", title: "Backup completed", body: "Configuration backup to S3 succeeded.", time: "2024-02-15T08:00:00Z", read: true },
  { id: "n10", type: "warning", title: "Certificate expiry", body: "TLS cert for api.vpn.acme.io expires in 14 days.", time: "2024-02-14T18:00:00Z", read: false },
  { id: "n11", type: "info", title: "Team update", body: "Sam Rivera joined the Operators team.", time: "2024-02-14T14:00:00Z", read: true },
  { id: "n12", type: "success", title: "Device linked", body: "New device linked to user jordan.chen@acme.io.", time: "2024-02-14T11:00:00Z", read: true },
  { id: "n13", type: "error", title: "Prometheus down", body: "Prometheus scrape failed for 3 targets.", time: "2024-02-14T09:30:00Z", read: true },
  { id: "n14", type: "warning", title: "Disk usage", body: "core-edge-03 disk usage above 85%.", time: "2024-02-13T16:00:00Z", read: true },
  { id: "n15", type: "info", title: "Dashboard updated", body: "Operator dashboard now shows session counts.", time: "2024-02-13T10:00:00Z", read: true },
];

export interface NavItem {
  id: string;
  label: string;
  href: string;
  badge?: number;
  children?: { id: string; label: string; href: string }[];
}

export const navItems: NavItem[] = [
  { id: "dashboard", label: "Dashboard", href: "/dashboard" },
  { id: "servers", label: "Servers", href: "/servers", badge: 2 },
  { id: "devices", label: "Devices", href: "/devices" },
  { id: "users", label: "Users", href: "/users" },
  {
    id: "reports",
    label: "Reports",
    href: "/reports",
    children: [
      { id: "reports-audit", label: "Audit log", href: "/reports/audit" },
      { id: "reports-billing", label: "Billing", href: "/reports/billing" },
    ],
  },
  { id: "control-plane", label: "Control plane", href: "/control-plane" },
  { id: "settings", label: "Settings", href: "/settings" },
];

export interface TableColumnDef {
  key: string;
  label: string;
  align?: "left" | "right" | "center";
  width?: string;
}

export const tableColumns: TableColumnDef[] = [
  { key: "name", label: "Name", align: "left" },
  { key: "email", label: "Email", align: "left" },
  { key: "role", label: "Role", align: "left" },
  { key: "status", label: "Status", align: "left" },
  { key: "lastActive", label: "Last active", align: "right" },
  { key: "actions", label: "Actions", align: "right", width: "100px" },
];

export interface FormFieldConfig {
  name: string;
  label: string;
  type: "text" | "email" | "password" | "select" | "checkbox";
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
}

export const formFields: FormFieldConfig[] = [
  { name: "email", label: "Email", type: "email", placeholder: "you@acme.io", required: true },
  { name: "password", label: "Password", type: "password", placeholder: "••••••••", required: true },
  { name: "role", label: "Role", type: "select", required: true, options: [
    { value: "admin", label: "Admin" },
    { value: "operator", label: "Operator" },
    { value: "viewer", label: "Viewer" },
  ]},
  { name: "notifications", label: "Email notifications", type: "checkbox" },
];
