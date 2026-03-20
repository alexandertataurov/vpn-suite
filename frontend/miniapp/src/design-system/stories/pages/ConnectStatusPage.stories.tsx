import type { Meta, StoryObj } from "@storybook/react";
import type { WebAppMeResponse } from "@vpn-suite/shared";
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
  "Uses `useConnectStatusPageModel` — page states: **empty** (no token / no user), **loading**, **error**, **ready** with summary variants from subscription, devices, `live_connection`, and `last_connection_confirmed_at` / per-device milestones (`helpers.hasConfirmedConnection`).",
  "Shared `readyScenario.me` omits confirmation milestones → **pending** summary; use story-local mocks for **confirmed** vs **live tunnel** vs **pendingConfirmationScenario** (forced delivery + unconfirmed device).",
].join("\n\n");

const VIEW_NARROW = { viewport: { defaultViewport: "iphoneSE" as const } };

const baseReadyMe = readyScenario.responses?.me as WebAppMeResponse;

const confirmedAccessReadySession: WebAppMeResponse = {
  ...baseReadyMe,
  user: baseReadyMe.user
    ? { ...baseReadyMe.user, last_connection_confirmed_at: "2026-03-10T10:15:00Z" }
    : baseReadyMe.user,
};

const confirmedAccessReadyScenario: MockScenario = {
  ...readyScenario,
  responses: {
    ...readyScenario.responses,
    me: confirmedAccessReadySession,
  },
};

const liveTunnelSession: WebAppMeResponse = {
  ...baseReadyMe,
  live_connection: {
    status: "connected",
    source: "server_handshake",
    device_id: "dev-mac-active",
    device_name: "MacBook Pro",
    last_handshake_at: "2026-03-10T10:10:00Z",
    handshake_age_sec: 45,
    telemetry_updated_at: "2026-03-10T10:10:05Z",
  },
};

const liveTunnelScenario: MockScenario = {
  ...readyScenario,
  responses: {
    ...readyScenario.responses,
    me: liveTunnelSession,
  },
};

const pendingConfirmationMe: WebAppMeResponse = {
  ...baseReadyMe,
  user: baseReadyMe.user
    ? { ...baseReadyMe.user, last_connection_confirmed_at: null }
    : baseReadyMe.user,
  public_ip: null,
  devices: [
    {
      id: "dev-pending-phone",
      device_name: "iPhone 15 Pro",
      issued_at: "2026-03-06T09:42:00Z",
      last_seen_handshake_at: null,
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
};

const pendingConfirmationScenario: MockScenario = {
  ...readyScenario,
  responses: {
    ...readyScenario.responses,
    me: pendingConfirmationMe,
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
  confirmedAccessReadyScenario,
  "`user.last_connection_confirmed_at` set — **Access ready** / green summary, `showConfirmAction` false.",
);

export const PendingSummaryDefaultContract = scenarioStory(
  "Pending setup (default contract me)",
  readyScenario,
  "Shared `readyScenario.me` has no `last_connection_confirmed_at` or `live_connection` — **Finish setup** / amber pending (distinct from story-local `PendingConfirmation`).",
);

export const LiveTunnelHandshake = scenarioStory(
  "Live tunnel (handshake telemetry)",
  liveTunnelScenario,
  "`live_connection.status === \"connected\"` — **Connected now** summary; confirm CTA may still show until a durable confirmation milestone exists.",
);

export const PendingConfirmation = scenarioStory(
  "Pending confirmation",
  pendingConfirmationScenario,
  "Story-local: single unconfirmed device + `latest_device_delivery` — primary confirmation CTA visible.",
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
