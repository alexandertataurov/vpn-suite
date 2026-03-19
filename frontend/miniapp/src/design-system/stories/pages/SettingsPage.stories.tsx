import type { Meta, StoryObj } from "@storybook/react";
import { Route } from "react-router-dom";
import { SettingsPage } from "@/pages/Settings";
import {
  type MockScenario,
  PageSandbox,
  pageStoryParameters,
  readyScenario,
  trialScenario,
  expiredScenario,
  noPlanScenario,
  emptyDevicesScenario,
  limitReachedScenario,
  loadingSessionScenario,
  loggedOutScenario,
  failureScenario,
  longNameScenario,
  expiringSoonScenario,
} from "@/storybook/page-contracts";

const meta: Meta = {
  title: "Pages/Contracts/Settings",
  tags: ["autodocs"],
  parameters: {
    ...pageStoryParameters,
    docs: {
      description: {
        component:
          "Account and settings page. Full page-level stories with providers, router, and mocked API. Use for design review, QA, accessibility, and interaction testing.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

function renderSettingsPage(scenario: MockScenario) {
  return (
    <PageSandbox scenario={scenario} initialEntries={["/settings"]}>
      <Route path="/settings" element={<SettingsPage />} />
    </PageSandbox>
  );
}

function createSettingsStory(name: string, scenario: MockScenario, description: string): Story {
  return {
    name,
    render: () => renderSettingsPage(scenario),
    parameters: {
      docs: {
        description: {
          story: description,
        },
      },
    },
  };
}

export const ActiveSubscription = createSettingsStory(
  "Active subscription",
  readyScenario,
  "Happy path. User with active subscription, devices, and full profile.",
);

export const Loading = createSettingsStory(
  "Settings loading",
  loadingSessionScenario,
  "Skeleton state while session and access data load.",
);

export const Error = createSettingsStory(
  "Could not load settings",
  failureScenario,
  "API error. Fallback screen with retry.",
);

export const SessionMissing = createSettingsStory(
  "Session missing",
  loggedOutScenario,
  "No token. Session missing / reopen from bot.",
);

export const NoPlan = createSettingsStory(
  "No active plan",
  noPlanScenario,
  "User without subscription. CTA to choose plan.",
);

export const Expired = createSettingsStory(
  "Subscription expired",
  expiredScenario,
  "Subscription expired. Grace period or restore flow.",
);

export const ExpiringSoon = createSettingsStory(
  "Expiring soon",
  expiringSoonScenario,
  "Subscription expiring within a week. Renewal banner.",
);

export const TrialEnding = createSettingsStory(
  "Trial ending",
  trialScenario,
  "Trial ending soon. Upgrade prompts.",
);

export const EmptyDevices = createSettingsStory(
  "No devices yet",
  emptyDevicesScenario,
  "Active plan but no devices. Setup guide CTA.",
);

export const DeviceLimitReached = createSettingsStory(
  "Device limit reached",
  limitReachedScenario,
  "All device slots used. Upgrade or revoke to add more.",
);

export const LongContent = createSettingsStory(
  "Long content",
  longNameScenario,
  "Edge case: very long display name and email. Layout stress test.",
);
