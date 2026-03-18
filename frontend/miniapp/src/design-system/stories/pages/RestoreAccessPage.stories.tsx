import type { Meta, StoryObj } from "@storybook/react";
import { Route } from "react-router-dom";
import { RestoreAccessPage } from "@/pages/RestoreAccess";
import { PageSandbox, restoreScenario } from "@/storybook/page-contracts";

const meta = {
  title: "Pages/RestoreAccess",
  tags: ["autodocs"],
  parameters: {
    docs: { description: { component: "Restore access flow." } },
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <PageSandbox scenario={restoreScenario} initialEntries={["/restore-access"]}>
      <Route path="/restore-access" element={<RestoreAccessPage />} />
    </PageSandbox>
  ),
};
