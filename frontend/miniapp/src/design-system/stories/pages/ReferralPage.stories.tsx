import type { Meta, StoryObj } from "@storybook/react";
import type { WebAppMeResponse } from "@vpn-suite/shared";
import type { PlanItem, PlansResponse } from "@/api";
import { Route } from "react-router-dom";
import { ReferralPage } from "@/future/referral/Referral";
import {
  type MockScenario,
  loggedOutScenario,
  PageSandbox,
  pageStoryParameters,
  readyScenario,
} from "@/storybook/page-contracts";

const DOC_BODY = [
  "**Audience:** design and QA validating **Referral** (`/referral`): share-link card, stats, upsell, loading, and error paths.",
  "**What is mocked:** webapp `me`, `plans`, `referralLink` (`GET /webapp/referral/my-link`), and `referralStats` (`GET /webapp/referral/stats`) plus the default `PageSandbox` interceptors.",
  "**Scenarios:** presets in [`page-contracts.tsx`](../../../storybook/page-contracts.tsx) for `readyScenario` and `loggedOutScenario`, plus story-local loading and HTTP error overrides for `referralLink` / `referralStats` and a local no-upsell plan variant.",
  "Default viewport is **iphone14**; `Viewport · narrow` uses **iphoneSE**. The page is driven by `useReferralPageModel` (empty, loading, error, ready).",
].join("\n\n");

const VIEW_NARROW = { viewport: { defaultViewport: "iphoneSE" as const } };

const baseReadyMe = readyScenario.responses?.me as WebAppMeResponse;
const basePlans = readyScenario.responses?.plans as PlansResponse;

const expiryOnlyPlan: PlanItem = {
  id: "pro-expiry-only",
  name: "Pro (expiry upsell only)",
  duration_days: 30,
  device_limit: 3,
  price_amount: 9,
  price_currency: "XTR",
  style: "normal",
  upsell_methods: ["expiry"],
  display_order: 0,
};

const noReferralUpsellMe: WebAppMeResponse = {
  ...baseReadyMe,
  subscriptions: [
    {
      ...baseReadyMe.subscriptions[0],
      plan_id: expiryOnlyPlan.id,
    },
  ],
};

const noReferralUpsellScenario: MockScenario = {
  ...readyScenario,
  responses: {
    ...readyScenario.responses,
    plans: {
      items: [...basePlans.items, expiryOnlyPlan],
    },
    me: noReferralUpsellMe,
  },
};

const loadingReferralScenario: MockScenario = {
  ...readyScenario,
  loading: ["referralLink"],
};

const referralLinkErrorScenario: MockScenario = {
  ...readyScenario,
  statuses: {
    referralLink: 500,
  },
};

const referralStatsErrorScenario: MockScenario = {
  ...readyScenario,
  statuses: {
    referralStats: 500,
  },
};

const meta = {
  title: "Pages/Contracts/Referral",
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

function renderReferral(scenario: MockScenario) {
  return (
    <PageSandbox scenario={scenario} initialEntries={["/referral"]}>
      <Route path="/referral" element={<ReferralPage />} />
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
    render: () => renderReferral(scenario),
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

export const SessionMissing = scenarioStory(
  "Session missing",
  loggedOutScenario,
  "No JWT — `useReferralPageModel` **empty** state; **SessionMissing** with referral copy.",
);

export const LoadingReferralLink = scenarioStory(
  "Loading · referral link",
  loadingReferralScenario,
  "`loading: [\"referralLink\"]` — mock never resolves my-link; page stays in **loading** until link data exists (`linkFetching` / missing `linkData`).",
);

export const LoadErrorReferralLink = scenarioStory(
  "Could not load · referral link",
  referralLinkErrorScenario,
  "`statuses.referralLink: 500` — model sets **error** (`linkError`); **FallbackScreen** with retry refetching link + stats.",
);

export const LoadErrorReferralStats = scenarioStory(
  "Could not load · referral stats",
  referralStatsErrorScenario,
  "`statuses.referralStats: 500` — model treats **stats** failure like link failure (`statsError`); same **FallbackScreen** + combined retry.",
);

export const ReadyWithUpsell = scenarioStory(
  "Ready · with referral upsell",
  readyScenario,
  "Default `readyScenario`: active plan includes **referral** in `upsell_methods` — **InlineAlert** upgrade strip above stats and share card.",
);

export const ReadyNoReferralUpsell = scenarioStory(
  "Ready · no referral upsell",
  noReferralUpsellScenario,
  "Session `plan_id` points at a plan whose `upsell_methods` is only `[\"expiry\"]` — `showUpsellReferral` is false; stats + share card without upsell banner.",
);

export const ViewportNarrow = scenarioStory(
  "Viewport · narrow",
  readyScenario,
  "320px (**iphoneSE**) — referral layout, stats block, and share card at narrow width.",
  VIEW_NARROW,
);
