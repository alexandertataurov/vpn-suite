import type { Meta, StoryObj } from "@storybook/react";
import { Route } from "react-router-dom";
import { ServerSelectionPage } from "./ServerSelection";
import { PageSandbox, manualServerScenario, readyScenario } from "@/storybook/page-contracts";

const meta = {
  title: "Pages/Contracts/Server Selection",
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Server-selection route contract for recommended routing and manual override behavior.",
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Recommended: Story = {
  render: () => (
    <PageSandbox scenario={readyScenario} initialEntries={["/servers"]}>
      <Route path="/servers" element={<ServerSelectionPage />} />
    </PageSandbox>
  ),
};

export const ManualSelection: Story = {
  render: () => (
    <PageSandbox scenario={manualServerScenario} initialEntries={["/servers"]}>
      <Route path="/servers" element={<ServerSelectionPage />} />
    </PageSandbox>
  ),
};
