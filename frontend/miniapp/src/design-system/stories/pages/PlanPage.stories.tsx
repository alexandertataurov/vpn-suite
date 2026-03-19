import type { Meta, StoryObj } from "@storybook/react";
import { Route } from "react-router-dom";
import { PlanPage } from "@/pages/Plan";
import {
  expiredScenario,
  failureScenario,
  loadingCheckoutScenario,
  noPlanScenario,
  PageSandbox,
  readyScenario,
  trialScenario,
} from "@/storybook/page-contracts";

const pageStoryParameters = {
  layout: "fullscreen" as const,
  viewport: { defaultViewport: "iphone14" },
  status: { type: "stable" as const },
};

const meta: Meta = {
  title: "Pages/Contracts/Plan",
  tags: ["autodocs"],
  parameters: {
    ...pageStoryParameters,
    docs: {
      description: {
        component: "Plan & Billing route with the current-plan summary, renewal actions, plan choices, billing history, and next-step guidance.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Active: Story = {
  name: "Active subscription",
  render: () => (
    <PageSandbox scenario={readyScenario} initialEntries={["/plan"]}>
      <Route path="/plan" element={<PlanPage />} />
    </PageSandbox>
  ),
  parameters: {
    docs: {
      description: {
        story: "Subscribed state with the current plan card, device count, billing history, and available plan changes.",
      },
    },
  },
};

export const NoPlan: Story = {
  name: "No active subscription",
  render: () => (
    <PageSandbox scenario={noPlanScenario} initialEntries={["/plan"]}>
      <Route path="/plan" element={<PlanPage />} />
    </PageSandbox>
  ),
  parameters: {
    docs: {
      description: {
        story: "No active subscription. The page leads with the no-subscription note and available plans.",
      },
    },
  },
};

export const ExpiringTrial: Story = {
  name: "Trial ending",
  render: () => (
    <PageSandbox scenario={trialScenario} initialEntries={["/plan"]}>
      <Route path="/plan" element={<PlanPage />} />
    </PageSandbox>
  ),
  parameters: {
    docs: {
      description: {
        story: "Trial-ending state with upgrade or renewal guidance and next-step messaging.",
      },
    },
  },
};

export const Expired: Story = {
  name: "Subscription expired",
  render: () => (
    <PageSandbox scenario={expiredScenario} initialEntries={["/plan"]}>
      <Route path="/plan" element={<PlanPage />} />
    </PageSandbox>
  ),
  parameters: {
    docs: {
      description: {
        story: "Expired subscription state with restore or renew-oriented plan messaging.",
      },
    },
  },
};

export const Loading: Story = {
  name: "Plan & billing loading",
  render: () => (
    <PageSandbox scenario={loadingCheckoutScenario} initialEntries={["/plan"]}>
      <Route path="/plan" element={<PlanPage />} />
    </PageSandbox>
  ),
  parameters: {
    docs: {
      description: {
        story: "Loading state for the Plan & Billing route while session and plan data settle.",
      },
    },
  },
};

export const Error: Story = {
  name: "Could not load plan & billing",
  render: () => (
    <PageSandbox scenario={failureScenario} initialEntries={["/plan"]}>
      <Route path="/plan" element={<PlanPage />} />
    </PageSandbox>
  ),
  parameters: {
    docs: {
      description: {
        story: "Fallback error state when the route cannot load plan data.",
      },
    },
  },
};
