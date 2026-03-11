import type { Meta, StoryObj } from "@storybook/react";
import { Route } from "react-router-dom";
import { HomePage } from "./Home";
import {
  PageSandbox,
  expiredScenario,
  loadingSessionScenario,
  noPlanScenario,
  readyScenario,
  trialScenario,
} from "@/storybook/page-contracts";

const meta = {
  title: "Pages/Contracts/Home",
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Home route contract for the Telegram miniapp dashboard. These stories are production-faithful route scenarios, not abstract hero demos.",
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const ActiveSubscription: Story = {
  render: () => (
    <PageSandbox scenario={readyScenario} initialEntries={["/"]}>
      <Route path="/" element={<HomePage />} />
    </PageSandbox>
  ),
};

export const NoActivePlan: Story = {
  render: () => (
    <PageSandbox scenario={noPlanScenario} initialEntries={["/"]}>
      <Route path="/" element={<HomePage />} />
    </PageSandbox>
  ),
};

export const TrialEnding: Story = {
  render: () => (
    <PageSandbox scenario={trialScenario} initialEntries={["/"]}>
      <Route path="/" element={<HomePage />} />
    </PageSandbox>
  ),
};

export const ExpiredPlan: Story = {
  render: () => (
    <PageSandbox scenario={expiredScenario} initialEntries={["/"]}>
      <Route path="/" element={<HomePage />} />
    </PageSandbox>
  ),
};

export const Loading: Story = {
  render: () => (
    <PageSandbox scenario={loadingSessionScenario} initialEntries={["/"]}>
      <Route path="/" element={<HomePage />} />
    </PageSandbox>
  ),
};
