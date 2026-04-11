import type { Meta, StoryObj } from "@storybook/react";
import { Route } from "react-router-dom";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { RestoreAccessPage } from "@/features/restore-access/RestoreAccessPage";
import {
  type MockScenario,
  loadingSessionScenario,
  loggedOutScenario,
  PageSandbox,
  pageStoryParameters,
  readyScenario,
  restoreScenario,
} from "@/storybook/page-contracts";

const DOC_BODY = [
  "**Restore access** (`/restore-access`): grace/expired subscription recovery, support links, and sticky primary actions.",
  "**Scenario matrix** (from `useRestoreAccessPageModel` + page guards):",
  "| Initial state | Mock / trigger | UI branch |",
  "| --- | --- | --- |",
  "| No token | `loggedOutScenario` | `SessionMissing` |",
  "| Session loading | `loadingSessionScenario` | Header + loading `ActionCard` |",
  "| Logged-in, no grace/expired sub | `readyScenario` | Inline “no expired” + support / devices |",
  "| Grace or expired sub | `restoreScenario` | Renew hero + sticky **Restore access** |",
  "| Restore in flight | *(user clicks Restore)* | `pageState.loading` card |",
  "| Restore API error | *(failed POST after click)* | `pageState.error` + retry |",
  "`restoreScenario` aliases `expiredScenario` from contracts — keep in sync when backend shapes change.",
].join("\n\n");

const VIEW_NARROW = { viewport: { defaultViewport: "mobile390" as const } };
const VIEW_WIDE = { viewport: { defaultViewport: "desktop" as const } };

const meta = {
  title: "Pages/Contracts/RestoreAccess",
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

function renderRestore(scenario: MockScenario) {
  return (
    <PageSandbox scenario={scenario} initialEntries={["/restore-access"]}>
      <Route path="/restore-access" element={<RestoreAccessPage />} />
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
    render: () => renderRestore(scenario),
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

export const RestorableSubscription = scenarioStory(
  "Restore access (grace / expired)",
  restoreScenario,
  "Eligible renewal: hero, benefits recap, and sticky **Restore** CTA.",
);

export const NotRestorableActiveUser = scenarioStory(
  "No expired subscription",
  readyScenario,
  "`hasGraceOrExpired` false. Empty branch with info `InlineAlert`, Support/Devices links, and no sticky renew bar.",
);

export const SessionLoading = scenarioStory(
  "Session loading",
  loadingSessionScenario,
  "Shell visible while eligibility and profile are still resolving.",
);

export const SessionMissing = scenarioStory(
  "Session missing",
  loggedOutScenario,
  "Token absent. Uses the shared session-missing treatment.",
);

const restoreLoadingScenario: MockScenario = {
  ...restoreScenario,
  loading: ["subscriptionOffers"],
};

const restoreErrorScenario: MockScenario = {
  ...restoreScenario,
  statuses: {
    subscriptionOffers: 500,
  },
};

export const RestoreInFlight: Story = {
  name: "Restore in flight",
  render: () => renderRestore(restoreLoadingScenario),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const restoreButton = await canvas.findByRole("button", { name: "Restore access" });
    await userEvent.click(restoreButton);
    await waitFor(() => {
      expect(canvas.getByText("Restoring…")).toBeInTheDocument();
      expect(
        canvas.queryByRole("button", { name: "Restore access" }),
      ).not.toBeInTheDocument();
    });
  },
  parameters: {
    docs: {
      description: {
        story:
          "Click **Restore access** and keep the mutation pending so the page flips to the loading `ActionCard` branch.",
      },
    },
  },
};

export const RestoreError: Story = {
  name: "Restore error",
  render: () => renderRestore(restoreErrorScenario),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const restoreButton = await canvas.findByRole("button", { name: "Restore access" });
    await userEvent.click(restoreButton);
    await waitFor(() => {
      expect(canvas.getByText("Could not load")).toBeInTheDocument();
      expect(canvas.getByText("Mocked error")).toBeInTheDocument();
    });
  },
  parameters: {
    docs: {
      description: {
        story:
          "Click **Restore access** with a mocked `subscriptionOffers` 500 response so the page enters the error branch with retry.",
      },
    },
  },
};

export const ViewportNarrow = scenarioStory(
  "Viewport · narrow",
  restoreScenario,
  "320px sticky bar and typography checks.",
  VIEW_NARROW,
);

export const ViewportWide = scenarioStory(
  "Viewport · wide",
  restoreScenario,
  "Wide frame with two-column content and bottom bar width.",
  VIEW_WIDE,
);

export const ViewportNarrowNotRestorable = scenarioStory(
  "Viewport · narrow (active user)",
  readyScenario,
  "320px non-restorable empty state with stacked buttons and footer help.",
  VIEW_NARROW,
);
