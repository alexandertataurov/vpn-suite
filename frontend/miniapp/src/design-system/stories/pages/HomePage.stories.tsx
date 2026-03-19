import type { Meta, StoryObj } from "@storybook/react";
import { Route } from "react-router-dom";
import { HomePage } from "@/pages/Home";
import {
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

const scenarios = {
  noPlan: noPlanScenario,
  noDevices: emptyDevicesScenario,
  active: readyScenario,
  expiring: trialScenario,
  expired: expiredScenario,
  loading: loadingSessionScenario,
  error: accessErrorScenario,
} as const;

const expiringNoDevicesScenarios = {
  ...scenarios,
  expiring: expiringNoDevicesScenario,
};

const meta: Meta<{
  state: keyof typeof scenarios;
  expiringNoDevices: boolean;
}> = {
  title: "Pages/Contracts/Home",
  tags: ["autodocs"],
  argTypes: {
    state: {
      control: "select",
      options: ["noPlan", "noDevices", "active", "expiring", "expired", "loading", "error"],
      description: "Actual Home route state",
    },
    expiringNoDevices: {
      control: "boolean",
      description: "For the expiring state, render the no-device variant shown above the renewal banner",
    },
  },
  args: {
    state: "active",
    expiringNoDevices: false,
  },
  parameters: {
    ...pageStoryParameters,
    docs: {
      description: {
        component:
          "Home route rendered with the same page component and shell as the miniapp. Use the state control to inspect the actual no-plan, no-device, active, expiring, expired, loading, and error states.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

function getScenario(
  state: keyof typeof scenarios,
  expiringNoDevices: boolean
) {
  const map = expiringNoDevices ? expiringNoDevicesScenarios : scenarios;
  return map[state];
}

export const Home: Story = {
  args: { state: "active" },
  render: ({ state, expiringNoDevices }) => {
    const scenario = getScenario(state, expiringNoDevices);
    return (
      <PageSandbox scenario={scenario} initialEntries={["/"]}>
        <Route path="/" element={<HomePage />} />
      </PageSandbox>
    );
  },
};

export const NoPlan: Story = {
  name: "No active plan",
  args: { state: "noPlan" },
  parameters: {
    docs: {
      description: {
        story: "New-user state with the onboarding hero and plan/setup prompts.",
      },
    },
  },
};

export const NoDevices: Story = {
  args: { state: "noDevices" },
  parameters: {
    docs: {
      description: {
        story: "Active subscription with no issued devices yet. Shows the no-device callout and subscription row.",
      },
    },
  },
};

export const Active: Story = {
  args: { state: "active" },
};

export const Expiring: Story = {
  args: { state: "expiring" },
  parameters: {
    docs: {
      description: {
        story: "Trial or renewal-warning state. Toggle `expiringNoDevices` to see the callout-above-banner variant used in the live home screen.",
      },
    },
  },
};

export const Expired: Story = { args: { state: "expired" } };
export const Loading: Story = { name: "Home loading", args: { state: "loading" } };
export const Error: Story = { name: "Could not load home", args: { state: "error" } };
