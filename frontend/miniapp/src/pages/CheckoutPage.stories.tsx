import type { Meta, StoryObj } from "@storybook/react";
import { Route } from "react-router-dom";
import { CheckoutPage } from "./Checkout";
import { PageSandbox, failureScenario, loadingCheckoutScenario, readyScenario } from "@/storybook/page-contracts";

const meta = {
  title: "Pages/Contracts/Checkout",
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Checkout route contract for plan purchase, promo validation, and payment transitions inside the miniapp shell.",
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Ready: Story = {
  render: () => (
    <PageSandbox scenario={readyScenario} initialEntries={["/plan/checkout/pro-annual"]}>
      <Route path="/plan/checkout/:planId" element={<CheckoutPage />} />
    </PageSandbox>
  ),
};

export const Loading: Story = {
  render: () => (
    <PageSandbox scenario={loadingCheckoutScenario} initialEntries={["/plan/checkout/pro-annual"]}>
      <Route path="/plan/checkout/:planId" element={<CheckoutPage />} />
    </PageSandbox>
  ),
};

export const Failure: Story = {
  render: () => (
    <PageSandbox scenario={failureScenario} initialEntries={["/plan/checkout/pro-annual"]}>
      <Route path="/plan/checkout/:planId" element={<CheckoutPage />} />
    </PageSandbox>
  ),
};
