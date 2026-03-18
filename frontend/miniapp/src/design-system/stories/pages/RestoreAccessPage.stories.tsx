import type { Meta, StoryObj } from "@storybook/react";
import { Route } from "react-router-dom";
import { RestoreAccessPage } from "@/pages/RestoreAccess";
import { PageSandbox, restoreScenario } from "@/storybook/page-contracts";

const meta: Meta = {
  title: "Pages/Contracts/RestoreAccess",
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: "Restore access flow. Contract tests.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <PageSandbox scenario={restoreScenario} initialEntries={["/restore-access"]}>
      <Route path="/restore-access" element={<RestoreAccessPage />} />
    </PageSandbox>
  ),
};
