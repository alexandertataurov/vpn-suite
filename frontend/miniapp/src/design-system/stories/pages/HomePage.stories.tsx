import type { Meta, StoryObj } from "@storybook/react";
import { Route } from "react-router-dom";
import { HomePage } from "@/pages/Home";
import {
  type MockScenario,
  accessErrorScenario,
  emptyDevicesScenario,
  expiredScenario,
  expiringNoDevicesScenario,
  expiringSoonScenario,
  limitReachedScenario,
  loadingSessionScenario,
  loggedOutScenario,
  longNameScenario,
  noPlanScenario,
  PageSandbox,
  pageStoryParameters,
  readyScenario,
  trialScenario,
} from "@/storybook/page-contracts";

/** Access payload aligned with `limitReachedScenario` me session (3/3 devices). */
const accessDeviceLimitFull: Record<string, unknown> = {
  status: "device_limit",
  has_plan: true,
  devices_used: 3,
  device_limit: 3,
  config_ready: true,
  config_id: "dev-1",
  expires_at: "2026-03-24T12:00:00Z",
  amnezia_vpn_key: "vpn://storybook-amnezia-key",
};

const deviceLimitHomeScenario: MockScenario = {
  ...limitReachedScenario,
  responses: {
    ...limitReachedScenario.responses,
    access: accessDeviceLimitFull,
  },
};

const DOC_BODY = [
  "**Audience:** design and QA reviewing the production **Home** route (`/`) in isolation.",
  "**What is mocked:** `window.fetch` for webapp endpoints (`me`, `access`, `plans`, …), JWT via `setWebappToken`, plus `PageSandbox` providers matching the miniapp shell.",
  "**Scenarios:** named presets in [`page-contracts.tsx`](../../storybook/page-contracts.tsx) (`readyScenario`, `trialScenario`, `noPlanScenario`, `emptyDevicesScenario`, `expiringNoDevicesScenario`, `expiredScenario`, `loadingSessionScenario`, `accessErrorScenario`, `loggedOutScenario`, `expiringSoonScenario`, `longNameScenario`, `limitReachedScenario` + local `deviceLimitHomeScenario` for coherent `access`).",
  "Default viewport is **iphone14** via `pageStoryParameters`; stories prefixed **Viewport ·** override to narrow (`iphoneSE`) or wide (`adminDesktop`).",
].join("\n\n");

const VIEW_NARROW = { viewport: { defaultViewport: "iphoneSE" as const } };
const VIEW_WIDE = { viewport: { defaultViewport: "adminDesktop" as const } };

const meta = {
  title: "Pages/Contracts/Home",
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

function renderHome(scenario: MockScenario) {
  return (
    <PageSandbox scenario={scenario} initialEntries={["/"]}>
      <Route path="/" element={<HomePage />} />
    </PageSandbox>
  );
}

function scenarioStory(
  name: string,
  scenario: MockScenario,
  storyDescription: string,
  extraParameters?: Story["parameters"],
): Story {
  return {
    name,
    render: () => renderHome(scenario),
    parameters: {
      ...extraParameters,
      docs: {
        description: {
          story: storyDescription,
        },
      },
    },
  };
}

/** Matrix: core session / routing states. */
export const NoPlan = scenarioStory(
  "No active plan",
  noPlanScenario,
  "New user: hero, plan CTAs, and routing toward `/plan` when there is no subscription.",
);

export const NoDevices = scenarioStory(
  "No devices yet",
  emptyDevicesScenario,
  "Subscribed but zero issued devices — no-device callout and subscription summary.",
);

export const ActiveSubscription = scenarioStory(
  "Active subscription",
  readyScenario,
  "Default happy path: devices list, renewal context, and connected summary when applicable.",
);

export const Home = {
  ...ActiveSubscription,
  name: "Home",
} satisfies Story;

export const ExpiringSoon = scenarioStory(
  "Expiring soon",
  trialScenario,
  "Trial or renewal-warning window — banners and urgency copy.",
);

export const ExpiringNoDevices = scenarioStory(
  "Expiring with no devices",
  expiringNoDevicesScenario,
  "Callout-above-banner layout when subscription is ending and user has not added hardware yet.",
);

export const Expired = scenarioStory(
  "Subscription expired",
  expiredScenario,
  "Expired / grace routing guidance and restore-oriented messaging.",
);

export const Loading = scenarioStory(
  "Home loading",
  loadingSessionScenario,
  "Skeleton state while `me` / access payloads resolve.",
);

export const LoadError = scenarioStory(
  "Could not load home",
  accessErrorScenario,
  "Fallback when the **access** request fails; exercise retry and error copy.",
);

export const SessionMissing = scenarioStory(
  "Session missing",
  loggedOutScenario,
  "No webapp token — same **SessionMissing** branch as production.",
);

export const RenewalWindowNonTrial = scenarioStory(
  "Renewal window (non-trial)",
  expiringSoonScenario,
  "Active (non-trial) subscription with **valid_until** inside the renewal-warning window — pill, banner, and subscription row copy.",
);

export const LongDisplayName = scenarioStory(
  "Long display name",
  longNameScenario,
  "**ModernHeader** avatar and name truncation with an exaggerated `display_name` / email from `me`.",
);

export const DeviceSlotLimit = scenarioStory(
  "Device slot limit",
  deviceLimitHomeScenario,
  "**access.status** `device_limit` with `me` at max devices — full badge, device-limit copy, and manage-devices CTA.",
);

/** Responsive: primary happy path at key widths. */
export const ViewportNarrowActive = scenarioStory(
  "Viewport · narrow phone (active)",
  readyScenario,
  "320px — dense header, banners, and device rows remain usable (see `.storybook/preview` → iphoneSE).",
  VIEW_NARROW,
);

export const ViewportWideActive = scenarioStory(
  "Viewport · wide (active)",
  readyScenario,
  "Desktop-sized frame — section spacing and sticky regions at admin width.",
  VIEW_WIDE,
);
