import type { Meta, StoryObj } from "@storybook/react";
import { Route } from "react-router-dom";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { SettingsPage } from "@/pages/Settings";
import {
  type MockScenario,
  emptyDevicesScenario,
  expiredScenario,
  expiringSoonScenario,
  failureScenario,
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

const DOC_BODY = [
  "**Settings** (`/settings`): account overview, profile, language, plan, support links, and destructive flows.",
  "Combines the previous **state matrix** and **interactions** files — all variants and plays live here.",
  "URL-driven modal state uses `?modal=profile` like production deep links.",
].join("\n\n");

const VIEW_NARROW = { viewport: { defaultViewport: "iphoneSE" as const } };
const VIEW_WIDE = { viewport: { defaultViewport: "adminDesktop" as const } };

const meta = {
  title: "Pages/Contracts/Settings",
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

function renderSettings(scenario: MockScenario, initialEntry = "/settings") {
  return (
    <PageSandbox scenario={scenario} initialEntries={[initialEntry]}>
      <Route path="/settings" element={<SettingsPage />} />
    </PageSandbox>
  );
}

function scenarioStory(
  name: string,
  scenario: MockScenario,
  storyDescription: string,
  extra?: Story["parameters"],
  initialEntry?: string,
): Story {
  return {
    name,
    render: () => renderSettings(scenario, initialEntry),
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

export const ActiveSubscription = scenarioStory(
  "Active subscription",
  readyScenario,
  "Happy path — profile, devices summary, plan row, and support section populated.",
);

export const Loading = scenarioStory(
  "Settings loading",
  loadingSessionScenario,
  "Skeleton while session hydrates.",
);

export const LoadError = scenarioStory(
  "Could not load settings",
  failureScenario,
  "Fallback with retry when `me` / access fails.",
);

export const SessionMissing = scenarioStory(
  "Session missing",
  loggedOutScenario,
  "No token — reopen-from-bot messaging.",
);

export const NoActivePlan = scenarioStory(
  "No active plan",
  noPlanScenario,
  "Plan CTA surfaces in account + subscription areas.",
);

export const SubscriptionExpired = scenarioStory(
  "Subscription expired",
  expiredScenario,
  "Grace / expired treatment on plan row and hero.",
);

export const ExpiringSoon = scenarioStory(
  "Expiring soon",
  expiringSoonScenario,
  "Renewal urgency — within-threshold messaging.",
);

export const TrialEnding = scenarioStory(
  "Trial ending",
  trialScenario,
  "Trial-specific copy and upgrade hints.",
);

export const NoDevicesYet = scenarioStory(
  "No devices yet",
  emptyDevicesScenario,
  "Plan active but zero devices — setup prompts.",
);

export const DeviceLimitReached = scenarioStory(
  "Device limit reached",
  limitReachedScenario,
  "Highlight limit and manage/revoke paths.",
);

export const LongProfileContent = scenarioStory(
  "Long profile content",
  longNameScenario,
  "Stress-test ellipsis / wrap for long display name and email.",
);

export const DeepLinkProfileModal = scenarioStory(
  "Deep link · profile modal",
  readyScenario,
  "Initial navigation opens profile editor via `?modal=profile`.",
  undefined,
  "/settings?modal=profile",
);

export const ViewportNarrow = scenarioStory(
  "Viewport · narrow",
  readyScenario,
  "320px — rows, menus, and sticky regions.",
  VIEW_NARROW,
);

export const ViewportWide = scenarioStory(
  "Viewport · wide",
  readyScenario,
  "Wide shell — section columns and max width.",
  VIEW_WIDE,
);

export const InteractiveOpenProfileModal: Story = {
  name: "Interactive · open profile modal",
  render: () => renderSettings(readyScenario),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const previewDocument = canvasElement.ownerDocument;
    const editProfileLabel = await canvas.findByText("Edit profile");
    const editProfile = editProfileLabel.closest('[role="button"]');
    if (!editProfile) {
      throw new Error('Could not find button container for "Edit profile".');
    }
    await userEvent.click(editProfile);
    await waitFor(() => {
      expect(previewDocument.querySelector('[role="dialog"]')).not.toBeNull();
    });
  },
  parameters: {
    docs: {
      description: {
        story: "Tap **Edit profile** and assert dialog mount.",
      },
    },
  },
};

export const InteractiveOpenLanguageMenu: Story = {
  name: "Interactive · language menu",
  render: () => renderSettings(readyScenario),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const previewDocument = canvasElement.ownerDocument;
    const languageLabel = await canvas.findByText("Language");
    const languageRow = languageLabel.closest('[role="button"]');
    if (!languageRow) {
      throw new Error('Could not find button container for "Language".');
    }
    await userEvent.click(languageRow);
    await waitFor(() => {
      expect(previewDocument.querySelector('[role="menu"]')).not.toBeNull();
    });
  },
  parameters: {
    docs: {
      description: {
        story: "Tap **Language** and assert menu role appears.",
      },
    },
  },
};

export const InteractiveOpenCancelFlow: Story = {
  name: "Interactive · cancel plan flow",
  render: () => renderSettings(readyScenario),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const previewDocument = canvasElement.ownerDocument;
    const cancelPlanLabel = await canvas.findByText("Cancel plan");
    const cancelPlan = cancelPlanLabel.closest('[role="button"]');
    if (!cancelPlan) {
      throw new Error('Could not find button container for "Cancel plan".');
    }
    await userEvent.click(cancelPlan);
    await waitFor(() => {
      expect(previewDocument.querySelector('[role="dialog"]')).not.toBeNull();
    });
  },
  parameters: {
    docs: {
      description: {
        story: "Tap **Cancel plan** — cancellation modal opens.",
      },
    },
  },
};
