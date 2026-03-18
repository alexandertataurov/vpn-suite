import type { Meta, StoryObj } from "@storybook/react";
import { Route } from "react-router-dom";
import { ServerSelectionPage } from "@/future/servers/ServerSelection";
import { manualServerScenario, PageSandbox, readyScenario } from "@/storybook/page-contracts";

const meta = {
  title: "Pages/Contracts/ServerSelection",
  tags: ["autodocs"],
  parameters: {
    docs: { description: { component: "Server selection." } },
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <PageSandbox scenario={readyScenario} initialEntries={["/servers"]}>
      <Route path="/servers" element={<ServerSelectionPage />} />
    </PageSandbox>
  ),
};

export const ManualSelect: Story = {
  render: () => (
    <PageSandbox scenario={manualServerScenario} initialEntries={["/servers"]}>
      <Route path="/servers" element={<ServerSelectionPage />} />
    </PageSandbox>
  ),
};
