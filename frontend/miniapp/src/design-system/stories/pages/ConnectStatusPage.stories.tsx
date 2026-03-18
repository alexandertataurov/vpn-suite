import type { Meta, StoryObj } from "@storybook/react";
import { Route } from "react-router-dom";
import { ConnectStatusPage } from "@/future/connect-status/ConnectStatus";
import { PageSandbox, connectedScenario } from "@/storybook/page-contracts";

const meta = {
  title: "Pages/Contracts/ConnectStatus",
  tags: ["autodocs"],
  parameters: {
    docs: { description: { component: "Connection status." } },
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <PageSandbox scenario={connectedScenario} initialEntries={["/connect-status"]}>
      <Route path="/connect-status" element={<ConnectStatusPage />} />
    </PageSandbox>
  ),
};
