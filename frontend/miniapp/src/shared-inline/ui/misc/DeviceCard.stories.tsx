import type { Meta, StoryObj } from "@storybook/react";
import { DeviceCard } from "./DeviceCard";
import { Button } from "../buttons/Button";

const meta: Meta<typeof DeviceCard> = {
  title: "Shared/Components/DeviceCard",
  component: DeviceCard,
  parameters: {
    docs: {
      description: {
        component: "Device list item. Name, status, last seen.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof DeviceCard>;

export const DeviceCardOverview: Story = {
  args: {
    id: "device-1",
    name: "My Phone",
    status: "active",
    issuedAt: "2024-01-15",
    shortId: "abc123",
  },
};

export const DeviceCardVariants: Story = {
  render: () => (
    <div className="sb-stack">
      <DeviceCard id="device-1" name="My Phone" status="active" issuedAt="2024-01-15" shortId="abc123" />
      <DeviceCard id="device-2" status="revoked" issuedAt="2023-06-01" />
    </div>
  ),
};

export const DeviceCardSizes: Story = {
  render: () => (
    <div className="sb-stack">
      <p className="m-0">Size variants are not exposed; uses card tokens.</p>
      <DeviceCard id="device-1" name="My Phone" status="active" issuedAt="2024-01-15" />
    </div>
  ),
};

export const DeviceCardStates: Story = {
  render: () => (
    <DeviceCard
      id="device-1"
      name="My Phone"
      status="active"
      issuedAt="2024-01-15"
      primaryAction={<Button variant="secondary" size="sm">Revoke</Button>}
    />
  ),
};

export const DeviceCardWithLongText: Story = {
  args: {
    id: "device-1",
    name: "Device name with a very long label that should wrap gracefully",
    status: "active",
    issuedAt: "2024-01-15",
    shortId: "abc123",
  },
};

export const DeviceCardDarkMode: Story = {
  parameters: { themes: { themeOverride: "dark" } },
  args: {
    id: "device-1",
    name: "My Phone",
    status: "active",
    issuedAt: "2024-01-15",
    shortId: "abc123",
  },
};

export const DeviceCardAccessibility: Story = {
  args: {
    id: "device-1",
    name: "My Phone",
    status: "active",
    issuedAt: "2024-01-15",
  },
};

export const DeviceCardEdgeCases = WithLongText;
