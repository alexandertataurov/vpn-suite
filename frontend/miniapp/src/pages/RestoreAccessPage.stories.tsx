import type { Meta, StoryObj } from "@storybook/react";
import { Route } from "react-router-dom";
import { RestoreAccessPage } from "./RestoreAccess";
import { PageSandbox, expiredScenario, restoreScenario } from "@/storybook/page-contracts";

const meta = {
  title: "Pages/Contracts/Restore Access",
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Restore-access route contract for grace-period recovery and expired subscription fallback messaging.",
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const GraceState: Story = {
  render: () => (
    <PageSandbox scenario={restoreScenario} initialEntries={["/restore-access"]}>
      <Route path="/restore-access" element={<RestoreAccessPage />} />
    </PageSandbox>
  ),
};

export const Expired: Story = {
  render: () => (
    <PageSandbox scenario={expiredScenario} initialEntries={["/restore-access"]}>
      <Route path="/restore-access" element={<RestoreAccessPage />} />
    </PageSandbox>
  ),
};
