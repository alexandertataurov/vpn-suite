import type { Meta, StoryObj } from "@storybook/react";
import { Route } from "react-router-dom";
import { HomePage } from "@/pages/Home";
import {
  type MockScenario,
  accessErrorScenario,
  emptyDevicesScenario,
  expiredScenario,
  expiringNoDevicesScenario,
  loadingSessionScenario,
  noPlanScenario,
  PageSandbox,
  pageStoryParameters,
  readyScenario,
  trialScenario,
} from "@/storybook/page-contracts";

const DOC_BODY = [
  "Production **Home** route (`/`) inside `PageSandbox`: React Query, bootstrap context, and MSW-style mock responses match the miniapp shell.",
  "Use these stories for visual regression, copy review, and accessibility checks across subscription and device states.",
  "Scenarios are defined in `@/storybook/page-contracts` so API shapes stay aligned with shared `webapp` types.",
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
  "Fallback when session bootstrap fails; exercise retry and error copy.",
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
