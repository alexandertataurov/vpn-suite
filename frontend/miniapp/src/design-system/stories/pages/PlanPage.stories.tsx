import type { Meta, StoryObj } from "@storybook/react";
import { Route } from "react-router-dom";
import { PlanPage } from "@/pages/Plan";
import { loadingCheckoutScenario, PageSandbox, readyScenario } from "@/storybook/page-contracts";

const meta = {
  title: "Pages/Contracts/Plan",
  tags: ["autodocs"],
  parameters: {
    docs: { description: { component: "Plan selection and checkout." } },
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <PageSandbox scenario={readyScenario} initialEntries={["/plan"]}>
      <Route path="/plan" element={<PlanPage />} />
    </PageSandbox>
  ),
};

export const Loading: Story = {
  render: () => (
    <PageSandbox scenario={loadingCheckoutScenario} initialEntries={["/plan"]}>
      <Route path="/plan" element={<PlanPage />} />
    </PageSandbox>
  ),
};
