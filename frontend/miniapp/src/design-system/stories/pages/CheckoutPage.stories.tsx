import type { Meta, StoryObj } from "@storybook/react";
import { Route } from "react-router-dom";
import { CheckoutPage } from "@/pages/Checkout";
import { PageSandbox, readyScenario } from "@/storybook/page-contracts";

const meta: Meta = {
  title: "Pages/Contracts/Checkout",
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: "Checkout flow. Contract tests.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <PageSandbox scenario={readyScenario} initialEntries={["/plan/checkout/pro-monthly"]}>
      <Route path="/plan/checkout/:planId" element={<CheckoutPage />} />
    </PageSandbox>
  ),
};
