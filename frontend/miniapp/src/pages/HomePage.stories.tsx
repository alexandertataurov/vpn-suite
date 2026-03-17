import type { Meta, StoryObj } from "@storybook/react";
import { Route } from "react-router-dom";
import { HomePage } from "./Home";
import {
  connectedScenario,
  emptyDevicesScenario,
  expiredScenario,
  loadingSessionScenario,
  noPlanScenario,
  PageSandbox,
  readyScenario,
  trialScenario,
} from "@/storybook/page-contracts";

const meta = {
  title: "Pages/Home",
  tags: ["autodocs"],
  parameters: {
    docs: { description: { component: "Home route. Production-faithful scenarios." } },
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

export const AccessReady: Story = {
  render: () => (
    <PageSandbox scenario={connectedScenario} initialEntries={["/"]}>
      <Route path="/" element={<HomePage />} />
    </PageSandbox>
  ),
};

export const NoDevicesYet: Story = {
  render: () => (
    <PageSandbox scenario={emptyDevicesScenario} initialEntries={["/"]}>
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
