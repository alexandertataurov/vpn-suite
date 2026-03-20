import type { Meta, StoryObj } from "@storybook/react";
import { Route } from "react-router-dom";
import { PlanPage } from "@/pages/Plan";
import {
  type MockScenario,
  expiredScenario,
  failureScenario,
  loadingCheckoutScenario,
  noPlanScenario,
  PageSandbox,
  pageStoryParameters,
  readyScenario,
  trialScenario,
} from "@/storybook/page-contracts";

const DOC_BODY = [
  "**Plan & billing** route (`/plan`): current plan, renewal actions, plan picker, billing history, and next-step cards.",
  "Rendered through `PageSandbox` with the same providers as the miniapp so components behave like production (including sticky layout and scroll regions).",
  "Pair with **Checkout** stories for the `/plan/checkout/:planId` continuation.",
].join("\n\n");

const VIEW_NARROW = { viewport: { defaultViewport: "iphoneSE" as const } };
const VIEW_WIDE = { viewport: { defaultViewport: "adminDesktop" as const } };

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

export const Loading = scenarioStory(
  "Plan & billing loading",
  loadingCheckoutScenario,
  "Skeletons while plan list and session hydrate.",
);

export const LoadError = scenarioStory(
  "Could not load plan & billing",
  failureScenario,
  "Error surface with retry — matches `FallbackScreen` wiring in the page model.",
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
