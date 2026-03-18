import type { Meta, StoryObj } from "@storybook/react";
import { Route } from "react-router-dom";
import { HomePage } from "@/pages/Home";
import {
  emptyDevicesScenario,
  expiredScenario,
  loadingSessionScenario,
  noPlanScenario,
  PageSandbox,
  readyScenario,
  trialScenario,
} from "@/storybook/page-contracts";

const meta: Meta = {
  title: "Pages/Contracts/Home",
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: "Home route. Contract tests with production-faithful scenarios.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <PageSandbox scenario={readyScenario} initialEntries={["/"]}>
      <Route path="/" element={<HomePage />} />
    </PageSandbox>
  ),
};

export const NoDevices: Story = {
  render: () => (
    <PageSandbox scenario={emptyDevicesScenario} initialEntries={["/"]}>
      <Route path="/" element={<HomePage />} />
    </PageSandbox>
  ),
};

export const NoPlan: Story = {
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

export const Expired: Story = {
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
