import type { Meta, StoryObj } from "@storybook/react";
import { Route } from "react-router-dom";
import { PlanPage } from "@/features/plan/PlanPage";
import {
  type MockScenario,
  expiredScenario,
  failureScenario,
  limitReachedScenario,
  loadingCheckoutScenario,
  loadingSessionScenario,
  loggedOutScenario,
  noPlanScenario,
  PageSandbox,
  pageStoryParameters,
  readyScenario,
  trialScenario,
} from "@/storybook/page-contracts";

const DOC_BODY = [
  "**Audience:** design and QA validating **Plan & billing** (`/plan`) as the production contract for pricing, renewal, and billing-history UI.",
  "**What is mocked:** webapp `me`, `plans`, and `billingHistory` inside `PageSandbox`, with defaults for the remaining intercepted endpoints.",
  "**Scenarios:** [`page-contracts`](../../../storybook/page-contracts/) presets for `readyScenario`, `noPlanScenario`, `trialScenario`, `expiredScenario`, `loadingCheckoutScenario`, `loadingSessionScenario`, `failureScenario`, `loggedOutScenario`, and `limitReachedScenario` when the user is at the device cap.",
  "Default viewport is **iphone14**; `Viewport ·` stories stress `iphoneSE` versus `adminDesktop`. Continuation flow: **Pages/Contracts/Checkout**.",
].join("\n\n");

const VIEW_NARROW = { viewport: { defaultViewport: "mobile390" as const } };
const VIEW_WIDE = { viewport: { defaultViewport: "desktop" as const } };

const meta = {
  title: "Pages/Contracts/Plan",
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

function renderPlan(scenario: MockScenario) {
  return (
    <PageSandbox scenario={scenario} initialEntries={["/plan"]}>
      <Route path="/plan" element={<PlanPage />} />
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
    render: () => renderPlan(scenario),
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
  "Full plan surface: summary, history, and upgrade/downgrade affordances.",
);

export const NoActiveSubscription = scenarioStory(
  "No active subscription",
  noPlanScenario,
  "Lead with empty-plan note and catalog of available tiers.",
);

export const TrialEnding = scenarioStory(
  "Trial ending",
  trialScenario,
  "Trial window: renewal CTAs and next-step copy tuned for conversion.",
);

export const SubscriptionExpired = scenarioStory(
  "Subscription expired",
  expiredScenario,
  "Expired state: messaging aimed at reactivation or restore flows.",
);

export const LoadingPlans = scenarioStory(
  "Loading · plans",
  loadingCheckoutScenario,
  "Plans query hangs — skeleton while the catalog is still resolving (`loading: [\"plans\"]`).",
);

export const LoadingSession = scenarioStory(
  "Loading · session",
  loadingSessionScenario,
  "`me` (and `access`) pending — full-page loading until session endpoints resolve.",
);

export const LoadError = scenarioStory(
  "Could not load plan & billing",
  failureScenario,
  "Session (`me`) error — `FallbackScreen` with retry (invalidates me, plans, billing history).",
);

export const SessionMissing = scenarioStory(
  "Session missing",
  loggedOutScenario,
  "No token — **SessionMissing**; no plan chrome.",
);

export const DeviceLimit = scenarioStory(
  "Device limit",
  limitReachedScenario,
  "Active sub with **devices.length** at plan limit — hero devices label and upgrade-oriented CTAs where the model applies.",
);

export const ViewportNarrow = scenarioStory(
  "Viewport · narrow",
  readyScenario,
  "320px width — plan cards and billing table legibility.",
  VIEW_NARROW,
);

export const ViewportWide = scenarioStory(
  "Viewport · wide",
  readyScenario,
  "Wider canvas — multi-column layout and section gutters.",
  VIEW_WIDE,
);
