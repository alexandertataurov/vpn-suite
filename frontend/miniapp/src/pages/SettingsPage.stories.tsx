import type { Meta, StoryObj } from "@storybook/react";
import { Route } from "react-router-dom";
import { SettingsPage } from "./Settings";
import { loggedOutScenario, PageSandbox, noPlanScenario, readyScenario } from "@/storybook/page-contracts";

const meta = {
  title: "Pages/Contracts/Settings",
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Settings route contract for profile surfaces, reconnect actions, and destructive account controls in the production shell.",
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const ActivePlan: Story = {
  render: () => (
    <PageSandbox scenario={readyScenario} initialEntries={["/settings"]}>
      <Route path="/settings" element={<SettingsPage />} />
    </PageSandbox>
  ),
};

export const NoPlan: Story = {
  render: () => (
    <PageSandbox scenario={noPlanScenario} initialEntries={["/settings"]}>
      <Route path="/settings" element={<SettingsPage />} />
    </PageSandbox>
  ),
};

export const Reconnect: Story = {
  render: () => (
    <PageSandbox scenario={loggedOutScenario} initialEntries={["/settings"]}>
      <Route path="/settings" element={<SettingsPage />} />
    </PageSandbox>
  ),
};
