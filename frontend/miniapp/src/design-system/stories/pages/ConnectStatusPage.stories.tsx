import type { Meta, StoryObj } from "@storybook/react";
import { Route } from "react-router-dom";
import { ConnectStatusPage } from "@/pages/ConnectStatus";
import {
  emptyDevicesScenario,
  loggedOutScenario,
  noPlanScenario,
  PageSandbox,
  pageStoryParameters,
  readyScenario,
  type MockScenario,
} from "@/storybook/page-contracts";

const pendingConfirmationScenario: MockScenario = {
  ...readyScenario,
  responses: {
    ...readyScenario.responses,
    me: {
      ...readyScenario.responses?.me,
      user: {
        ...(readyScenario.responses?.me as { user: Record<string, unknown> }).user,
        last_connection_confirmed_at: null,
      },
      public_ip: null,
      devices: [
        {
          id: "dev-pending-phone",
          device_name: "iPhone 15 Pro",
          issued_at: "2026-03-06T09:42:00Z",
          last_seen_handshake_at: null,
          confirmed_connected_at: null,
          last_connection_confirmed_at: null,
          status: "config_pending",
          revoked_at: null,
        },
      ],
      latest_device_delivery: {
        device_id: "dev-pending-phone",
        device_name: "iPhone 15 Pro",
        issued_at: "2026-03-06T09:42:00Z",
        amnezia_vpn_key: "vpn://storybook-amnezia-key",
      },
    },
  },
};

const meta: Meta = {
  title: "Pages/Contracts/Connect Status",
  tags: ["autodocs"],
  parameters: {
    ...pageStoryParameters,
    docs: {
      description: {
        component: "Connection status route showing the latest setup state, confirm action, and next-step guidance for the active device.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Confirmed: Story = {
  name: "Connected and confirmed",
  render: () => (
    <PageSandbox scenario={readyScenario} initialEntries={["/connect-status"]}>
      <Route path="/connect-status" element={<ConnectStatusPage />} />
    </PageSandbox>
  ),
  parameters: {
    docs: {
      description: {
        story: "Latest device is already confirmed, so the route shows the confirmed summary and a follow-up action instead of the confirm CTA.",
      },
    },
  },
};

export const PendingConfirmation: Story = {
  name: "Pending confirmation",
  render: () => (
    <PageSandbox scenario={pendingConfirmationScenario} initialEntries={["/connect-status"]}>
      <Route path="/connect-status" element={<ConnectStatusPage />} />
    </PageSandbox>
  ),
  parameters: {
    docs: {
      description: {
        story: "Latest device has not been confirmed yet, so the route keeps the confirmation CTA visible.",
      },
    },
  },
};

export const NoDevice: Story = {
  name: "No devices yet",
  render: () => (
    <PageSandbox scenario={emptyDevicesScenario} initialEntries={["/connect-status"]}>
      <Route path="/connect-status" element={<ConnectStatusPage />} />
    </PageSandbox>
  ),
  parameters: {
    docs: {
      description: {
        story: "Subscribed user without issued devices. The route redirects the user back toward Devices setup.",
      },
    },
  },
};

export const NoPlan: Story = {
  name: "No active plan",
  render: () => (
    <PageSandbox scenario={noPlanScenario} initialEntries={["/connect-status"]}>
      <Route path="/connect-status" element={<ConnectStatusPage />} />
    </PageSandbox>
  ),
  parameters: {
    docs: {
      description: {
        story: "No active subscription. The route shows the no-plan summary and points back to plan selection.",
      },
    },
  },
};

export const SessionMissing: Story = {
  name: "Session missing",
  render: () => (
    <PageSandbox scenario={loggedOutScenario} initialEntries={["/connect-status"]}>
      <Route path="/connect-status" element={<ConnectStatusPage />} />
    </PageSandbox>
  ),
  parameters: {
    docs: {
      description: {
        story: "No active miniapp session. The route resolves to the session-missing state.",
      },
    },
  },
};
