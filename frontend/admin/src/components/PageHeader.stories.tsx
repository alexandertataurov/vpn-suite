import type { Meta, StoryObj } from "@storybook/react";
import { PageHeader } from "./PageHeader";
import { Button } from "@vpn-suite/shared/ui";
import { Server } from "lucide-react";

const meta: Meta<typeof PageHeader> = {
  title: "Patterns/OperatorHeader",
  component: PageHeader,
  parameters: {
    docs: {
      description: {
        component: "Operator header pattern: PageHeader with breadcrumbs, optional icon, and primary action.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof PageHeader>;

export const Overview: Story = {
  args: {
    title: "Servers",
    description: "Manage VPN nodes, patches, and maintenance windows.",
    primaryAction: <Button>Add server</Button>,
  },
};

export const Variants: Story = {
  render: () => (
    <div className="sb-stack">
      <PageHeader title="Servers" description="Manage VPN nodes." primaryAction={<Button>Add server</Button>} />
      <PageHeader title="Server details" breadcrumbItems={[{ label: "Home", to: "/" }, { label: "Servers", to: "/servers" }, { label: "core-01" }]} primaryAction={<Button variant="secondary">Restart</Button>} />
      <PageHeader title="Servers" icon={Server} primaryAction={<Button>Add server</Button>} />
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="sb-stack">
      <p className="m-0">Size variants are not exposed; typography is tokenized.</p>
      <PageHeader title="Servers" description="Manage VPN nodes." primaryAction={<Button>Add server</Button>} />
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <PageHeader title="Servers" description="Manage VPN nodes." primaryAction={<Button>Add server</Button>} />
  ),
};

export const WithBreadcrumbs: Story = {
  args: {
    title: "Server details",
    breadcrumbItems: [
      { label: "Home", to: "/" },
      { label: "Servers", to: "/servers" },
      { label: "core-01" },
    ],
    primaryAction: <Button variant="secondary">Restart</Button>,
  },
};

export const WithLongText: Story = {
  args: {
    title: "Server details for core-edge-primary-02-us-east-1 (degraded)",
    description: "Long descriptions should wrap without pushing actions off-screen.",
    primaryAction: <Button>Add server</Button>,
  },
};

export const WithIcon: Story = {
  args: { title: "Servers", icon: Server, primaryAction: <Button>Add server</Button> },
};

export const DarkMode: Story = {
  parameters: { themes: { themeOverride: "dark" } },
  args: { title: "Servers", description: "Manage VPN nodes.", primaryAction: <Button>Add server</Button> },
};

export const Accessibility: Story = {
  args: {
    title: "Accessible header",
    description: "Heading is semantic and actions are keyboard reachable.",
    primaryAction: <Button>Add server</Button>,
  },
};

export const EdgeCases = WithLongText;
