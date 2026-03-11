import type { Meta, StoryObj } from "@storybook/react";
import { Route } from "react-router-dom";
import { DevicesPage } from "./Devices";
import { PageSandbox, emptyDevicesScenario, limitReachedScenario, readyScenario } from "@/storybook/page-contracts";

const meta = {
  title: "Pages/Contracts/Devices",
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Devices route contract covering inventory, issuance posture, and limit handling in the production shell.",
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const HasDevices: Story = {
  render: () => (
    <PageSandbox scenario={readyScenario} initialEntries={["/devices"]}>
      <Route path="/devices" element={<DevicesPage />} />
    </PageSandbox>
  ),
};

export const Empty: Story = {
  render: () => (
    <PageSandbox scenario={emptyDevicesScenario} initialEntries={["/devices"]}>
      <Route path="/devices" element={<DevicesPage />} />
    </PageSandbox>
  ),
};

export const LimitReached: Story = {
  render: () => (
    <PageSandbox scenario={limitReachedScenario} initialEntries={["/devices"]}>
      <Route path="/devices" element={<DevicesPage />} />
    </PageSandbox>
  ),
};

export const ConfigPending: Story = {
  render: () => (
    <PageSandbox scenario={readyScenario} initialEntries={["/devices"]}>
      <Route path="/devices" element={<DevicesPage />} />
    </PageSandbox>
  ),
};
