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

function renderConnectStatusPage(scenario: MockScenario) {
  return (
    <PageSandbox scenario={scenario} initialEntries={["/connect-status"]}>
      <Route path="/connect-status" element={<ConnectStatusPage />} />
    </PageSandbox>
  );
}

function createConnectStatusStory(
  name: string,
  scenario: MockScenario,
  description: string,
): Story {
  return {
    name,
    render: () => renderConnectStatusPage(scenario),
    parameters: {
      docs: {
        description: {
          story: description,
        },
      },
    },
  };
}

export const Confirmed = createConnectStatusStory(
  "Connected and confirmed",
  readyScenario,
  "Latest device is already confirmed, so the route shows the confirmed summary and a follow-up action instead of the confirm CTA.",
);

export const PendingConfirmation = createConnectStatusStory(
  "Pending confirmation",
  pendingConfirmationScenario,
  "Latest device has not been confirmed yet, so the route keeps the confirmation CTA visible.",
);

export const NoDevice = createConnectStatusStory(
  "No devices yet",
  emptyDevicesScenario,
  "Subscribed user without issued devices. The route redirects the user back toward Devices setup.",
);

export const NoPlan = createConnectStatusStory(
  "No active plan",
  noPlanScenario,
  "No active subscription. The route shows the no-plan summary and points back to plan selection.",
);

export const SessionMissing = createConnectStatusStory(
  "Session missing",
  loggedOutScenario,
  "No active miniapp session. The route resolves to the session-missing state.",
);
