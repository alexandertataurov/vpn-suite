import type { Meta, StoryObj } from "@storybook/react";
import { RowActionsMenu } from "./RowActionsMenu";
import type { ServerOut } from "@vpn-suite/shared/types";

const mockServer: ServerOut = {
  id: "svr-1",
  name: "Node alpha",
  region: "us-east-1",
  status: "online",
  is_active: true,
  is_draining: false,
  api_endpoint: "https://api.example.com",
  last_seen_at: new Date().toISOString(),
  last_snapshot_at: new Date().toISOString(),
  created_at: new Date().toISOString(),
};

const meta: Meta<typeof RowActionsMenu> = {
  title: "Patterns/RowActionsMenu",
  component: RowActionsMenu,
};

export default meta;

type Story = StoryObj<typeof RowActionsMenu>;

export const Overview: Story = {
  args: {
    server: mockServer,
    syncing: false,
    onSync: () => {},
    onConfigure: () => {},
    onRestart: () => {},
    onDrainUndrain: () => {},
    onReconcile: () => {},
    onIssueConfig: () => {},
  },
};

export const Variants: Story = {
  render: () => (
    <div className="sb-stack">
      <RowActionsMenu
        server={mockServer}
        syncing={false}
        onSync={() => {}}
        onConfigure={() => {}}
        onRestart={() => {}}
        onDrainUndrain={() => {}}
        onReconcile={() => {}}
        onIssueConfig={() => {}}
      />
      <RowActionsMenu
        server={{ ...mockServer, is_draining: true }}
        syncing={false}
        onSync={() => {}}
        onConfigure={() => {}}
        onRestart={() => {}}
        onDrainUndrain={() => {}}
        onReconcile={() => {}}
        onIssueConfig={() => {}}
      />
      <RowActionsMenu
        server={mockServer}
        syncing={false}
        onSync={() => {}}
        onConfigure={() => {}}
        onRestart={() => {}}
        onDrainUndrain={() => {}}
        onReconcile={() => {}}
        onIssueConfig={() => {}}
        onDelete={() => {}}
      />
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="sb-stack">
      <p className="m-0">Size variants are not exposed; uses menu tokens.</p>
      <RowActionsMenu
        server={mockServer}
        syncing={false}
        onSync={() => {}}
        onConfigure={() => {}}
        onRestart={() => {}}
        onDrainUndrain={() => {}}
        onReconcile={() => {}}
        onIssueConfig={() => {}}
      />
    </div>
  ),
};

export const States: Story = {
  args: { ...Overview.args },
};

export const WithLongText: Story = {
  args: {
    ...Overview.args,
    server: { ...mockServer, name: "Node alpha with a very long server name that should wrap" },
  },
};

export const DarkMode: Story = {
  parameters: { themes: { themeOverride: "dark" } },
  args: { ...Overview.args },
};

export const Accessibility: Story = {
  args: { ...Overview.args },
};

export const EdgeCases = WithLongText;
