import type { Meta, StoryObj } from "@storybook/react";
import { Route } from "react-router-dom";
import { expect, userEvent, within } from "storybook/test";
import { CheckoutPage } from "@/pages/Checkout";
import {
  loadingCheckoutScenario,
  loggedOutScenario,
  PageSandbox,
  readyScenario,
} from "@/storybook/page-contracts";

const pageStoryParameters = {
  layout: "fullscreen" as const,
  viewport: { defaultViewport: "iphone14" },
  status: { type: "stable" as const },
};

const meta: Meta = {
  title: "Pages/Contracts/Checkout",
  tags: ["autodocs"],
  parameters: {
    ...pageStoryParameters,
    docs: {
      description: {
        component: "Plan checkout route shown after selecting a tier on the Plan page. Covers review, payment confirmation, plan-not-found, loading, and session-missing states.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const ReviewAndPay: Story = {
  name: "Review and pay",
  render: () => (
    <PageSandbox scenario={readyScenario} initialEntries={["/plan/checkout/pro-monthly"]}>
      <Route path="/plan/checkout/:planId" element={<CheckoutPage />} />
    </PageSandbox>
  ),
  parameters: {
    docs: {
      description: {
        story: "Review and pay state for a valid selected plan, with promo input and the primary continue action.",
      },
    },
  },
};

export const Loading: Story = {
  name: "Plan details loading",
  render: () => (
    <PageSandbox scenario={loadingCheckoutScenario} initialEntries={["/plan/checkout/pro-monthly"]}>
      <Route path="/plan/checkout/:planId" element={<CheckoutPage />} />
    </PageSandbox>
  ),
  parameters: {
    docs: {
      description: {
        story: "Loading state while the selected plan details are still resolving.",
      },
    },
  },
};

export const PlanNotFound: Story = {
  render: () => (
    <PageSandbox scenario={readyScenario} initialEntries={["/plan/checkout/missing-plan"]}>
      <Route path="/plan/checkout/:planId" element={<CheckoutPage />} />
    </PageSandbox>
  ),
  parameters: {
    docs: {
      description: {
        story: "Unknown plan id. The route keeps the page shell and shows the inline plan-not-found alert.",
      },
    },
  },
};

export const SessionMissing: Story = {
  name: "Session missing",
  render: () => (
    <PageSandbox scenario={loggedOutScenario} initialEntries={["/plan/checkout/pro-monthly"]}>
      <Route path="/plan/checkout/:planId" element={<CheckoutPage />} />
    </PageSandbox>
  ),
  parameters: {
    docs: {
      description: {
        story: "No active miniapp session. The route falls back to the same session-missing state used in production.",
      },
    },
  },
};

export const ConfirmationStep: Story = {
  name: "Confirmation step",
  render: () => (
    <PageSandbox scenario={readyScenario} initialEntries={["/plan/checkout/pro-monthly"]}>
      <Route path="/plan/checkout/:planId" element={<CheckoutPage />} />
    </PageSandbox>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const continueButton = await canvas.findByRole("button", { name: "Continue" });
    await userEvent.click(continueButton);
    await expect(canvas.getByRole("button", { name: "Pay in Telegram" })).toBeInTheDocument();
  },
  parameters: {
    docs: {
      description: {
        story: "Interactive: tap Continue and verify the route switches into the Pay in Telegram confirmation state.",
      },
    },
  },
};
