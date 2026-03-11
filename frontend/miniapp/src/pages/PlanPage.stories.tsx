import type { Meta, StoryObj } from "@storybook/react";
import { Route } from "react-router-dom";
import { PageSandbox, PlanStoryHarness, noPlanScenario, readyScenario } from "@/storybook/page-contracts";

const meta = {
  title: "Pages/Contracts/Plan",
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Plan route contract for subscription lifecycle, upsell, and billing history. The story harness preserves the bootstrap context required by the real page.",
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Active: Story = {
  render: () => (
    <PageSandbox scenario={readyScenario} initialEntries={["/plan"]}>
      <Route path="/plan" element={<PlanStoryHarness />} />
    </PageSandbox>
  ),
};

export const NoPlan: Story = {
  render: () => (
    <PageSandbox scenario={noPlanScenario} initialEntries={["/plan"]}>
      <Route path="/plan" element={<PlanStoryHarness />} />
    </PageSandbox>
  ),
};

export const BillingHistory: Story = {
  render: () => (
    <PageSandbox scenario={readyScenario} initialEntries={["/plan"]}>
      <Route path="/plan" element={<PlanStoryHarness />} />
    </PageSandbox>
  ),
};
