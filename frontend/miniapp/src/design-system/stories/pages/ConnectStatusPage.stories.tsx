import type { Meta, StoryObj } from "@storybook/react";
import { Route } from "react-router-dom";
import { ConnectStatusPage } from "@/pages/ConnectStatus";
import {
  emptyDevicesScenario,
  failureScenario,
  loggedOutScenario,
  loadingSessionScenario,
  noPlanScenario,
  PageSandbox,
  pageStoryParameters,
  readyScenario,
  type MockScenario,
} from "@/storybook/page-contracts";

const DOC_BODY = [
  "**Connect status** (`/connect-status`): latest device delivery, confirm-connected flow, and reminders.",
  "Uses `useConnectStatusPageModel` — cover **loading**, **error**, empty session, and happy-path device states.",
  "`pendingConfirmationScenario` is story-local to force an unconfirmed latest device without changing shared contracts.",
].join("\n\n");

const VIEW_NARROW = { viewport: { defaultViewport: "iphoneSE" as const } };

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

const meta = {
  title: "Pages/Contracts/Connect Status",
  tags: ["autodocs"],
  parameters: {
    ...pageStoryParameters,
    docs: {
      description: {
        component: DOC_BODY,
      },
    },
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

function renderConnect(scenario: MockScenario) {
  return (
    <PageSandbox scenario={scenario} initialEntries={["/connect-status"]}>
      <Route path="/connect-status" element={<ConnectStatusPage />} />
    </PageSandbox>
  );
}

function scenarioStory(
  name: string,
  scenario: MockScenario,
  storyDescription: string,
  extra?: Story["parameters"],
): Story {
  return {
    name,
    render: () => renderConnect(scenario),
    parameters: {
      ...extra,
      docs: {
        description: {
          story: storyDescription,
        },
      },
    },
  };
}

export const ConnectedConfirmed = scenarioStory(
  "Connected and confirmed",
  readyScenario,
  "Latest device already confirmed — summary + follow-up, confirm CTA hidden.",
);

export const PendingConfirmation = scenarioStory(
  "Pending confirmation",
  pendingConfirmationScenario,
  "Config issued but not confirmed — primary confirmation CTA visible.",
);

export const NoDevicesYet = scenarioStory(
  "No devices yet",
  emptyDevicesScenario,
  "Subscribed without devices — model routes user back toward device setup.",
);

export const NoActivePlan = scenarioStory(
  "No active plan",
  noPlanScenario,
  "No subscription — plan-oriented empty state.",
);

export const SessionMissing = scenarioStory(
  "Session missing",
  loggedOutScenario,
  "Empty token — `SessionMissing` instead of scaffold content.",
);

export const Loading = scenarioStory(
  "Connect status loading",
  loadingSessionScenario,
  "Header + skeleton cards while session and device context load.",
);

export const LoadError = scenarioStory(
  "Could not load connect status",
  failureScenario,
  "`FallbackScreen` with retry when bootstrap or access fails.",
);

export const ViewportNarrow = scenarioStory(
  "Viewport · narrow",
  readyScenario,
  "320px — verify card stacks and primary actions.",
  VIEW_NARROW,
);
