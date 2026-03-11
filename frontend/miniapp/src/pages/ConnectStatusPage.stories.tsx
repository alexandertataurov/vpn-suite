import type { Meta, StoryObj } from "@storybook/react";
import { Route } from "react-router-dom";
import { ConnectStatusPage } from "./ConnectStatus";
import { PageSandbox, connectedScenario, readyScenario } from "@/storybook/page-contracts";

const meta = {
  title: "Pages/Contracts/Connect Status",
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Connect-status route contract for waiting, confirmation, and follow-up guidance after VPN setup.",
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const WaitingForAction: Story = {
  render: () => (
    <PageSandbox scenario={readyScenario} initialEntries={["/connect-status"]}>
      <Route path="/connect-status" element={<ConnectStatusPage />} />
    </PageSandbox>
  ),
};

export const ConnectedGuidance: Story = {
  render: () => (
    <PageSandbox scenario={connectedScenario} initialEntries={["/connect-status"]}>
      <Route path="/connect-status" element={<ConnectStatusPage />} />
    </PageSandbox>
  ),
};
