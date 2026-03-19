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

const meta: Meta = {
  title: "Pages/Contracts/Home",
  tags: ["autodocs"],
  parameters: {
    ...pageStoryParameters,
    docs: {
      description: {
        component:
          "Home route rendered with the same page component and shell as the miniapp. These stories document the actual route states rather than a Storybook-only playground.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const NoPlan: Story = {
  name: "No active plan",
  render: () => (
    <PageSandbox scenario={noPlanScenario} initialEntries={["/"]}>
      <Route path="/" element={<HomePage />} />
    </PageSandbox>
  ),
  parameters: {
    docs: {
      description: {
        story: "New-user state with the onboarding hero and plan/setup prompts.",
      },
    },
  },
};

export const NoDevices: Story = {
  render: () => (
    <PageSandbox scenario={emptyDevicesScenario} initialEntries={["/"]}>
      <Route path="/" element={<HomePage />} />
    </PageSandbox>
  ),
  parameters: {
    docs: {
      description: {
        story: "Active subscription with no issued devices yet. Shows the no-device callout and subscription row.",
      },
    },
  },
};

export const Active: Story = {
  render: () => (
    <PageSandbox scenario={readyScenario} initialEntries={["/"]}>
      <Route path="/" element={<HomePage />} />
    </PageSandbox>
  ),
};

export const Home: Story = {
  ...Active,
  name: "Home",
};

export const Expiring: Story = {
  render: () => (
    <PageSandbox scenario={trialScenario} initialEntries={["/"]}>
      <Route path="/" element={<HomePage />} />
    </PageSandbox>
  ),
  parameters: {
    docs: {
      description: {
        story: "Trial or renewal-warning state. Toggle `expiringNoDevices` to see the callout-above-banner variant used in the live home screen.",
      },
    },
  },
};

export const ExpiringNoDevices: Story = {
  name: "Expiring with no devices",
  render: () => (
    <PageSandbox scenario={expiringNoDevicesScenario} initialEntries={["/"]}>
      <Route path="/" element={<HomePage />} />
    </PageSandbox>
  ),
};

export const Expired: Story = {
  render: () => (
    <PageSandbox scenario={expiredScenario} initialEntries={["/"]}>
      <Route path="/" element={<HomePage />} />
    </PageSandbox>
  ),
};
export const Loading: Story = {
  name: "Home loading",
  render: () => (
    <PageSandbox scenario={loadingSessionScenario} initialEntries={["/"]}>
      <Route path="/" element={<HomePage />} />
    </PageSandbox>
  ),
};
export const Error: Story = {
  name: "Could not load home",
  render: () => (
    <PageSandbox scenario={accessErrorScenario} initialEntries={["/"]}>
      <Route path="/" element={<HomePage />} />
    </PageSandbox>
  ),
};
