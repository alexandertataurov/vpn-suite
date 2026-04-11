import type { Meta, StoryObj } from "@storybook/react";
import { Route } from "react-router-dom";
import { expect, userEvent, within } from "storybook/test";
import { CheckoutPage } from "@/features/checkout/CheckoutPage";
import {
  type MockScenario,
  loadingCheckoutScenario,
  loggedOutScenario,
  PageSandbox,
  pageStoryParameters,
  readyScenario,
} from "@/storybook/page-contracts";

const CHECKOUT_PATH = "/plan/checkout/pro-monthly";

/** Plans fetch failure — matches checkout model `plansError` branch (not exported as a named contract). */
const plansLoadErrorScenario = {
  ...readyScenario,
  statuses: { plans: 500 },
} satisfies MockScenario;

const DOC_BODY = [
  "**Audience:** design and QA for **Checkout** (`/plan/checkout/:planId`) covering review, confirmation, promos, and failure states.",
  "**What is mocked:** token plus `plans`, promo, and invoice paths inside `PageSandbox`, which keeps routing and layout aligned with the app.",
  "**Scenarios:** [`page-contracts`](../../../storybook/page-contracts/) presets for `readyScenario`, `loadingCheckoutScenario`, and `loggedOutScenario`, plus an invalid `planId` route and a local `plans` 500 failure preset.",
  "Default viewport is **iphone14**; `Viewport ·` stories add `iphoneSE` and `adminDesktop` when density matters.",
].join("\n\n");

const VIEW_NARROW = { viewport: { defaultViewport: "mobile390" as const } };
const VIEW_WIDE = { viewport: { defaultViewport: "desktop" as const } };

const meta = {
  title: "Pages/Contracts/Checkout",
  tags: ["autodocs"],
  parameters: {
    ...pageStoryParameters,
    docs: {
      description: {
        component: DOC_BODY,
      },
    },
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

function renderCheckout(initialEntry: string, scenario: MockScenario) {
  return (
    <PageSandbox scenario={scenario} initialEntries={[initialEntry]}>
      <Route path="/plan/checkout/:planId" element={<CheckoutPage />} />
    </PageSandbox>
  );
}

export const ReviewAndPay: Story = {
  name: "Review and pay",
  render: () => renderCheckout(CHECKOUT_PATH, readyScenario),
  parameters: {
    docs: {
      description: {
        story: "Initial step: price summary, promo field, and primary **Continue** action.",
      },
    },
  },
};

export const ConfirmationStep: Story = {
  name: "Interactive · confirmation step",
  render: () => renderCheckout(CHECKOUT_PATH, readyScenario),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const continueButton = await canvas.findByRole("button", { name: "Continue" });
    await userEvent.click(continueButton);
    expect(
      await canvas.findByRole("button", { name: "Pay in Telegram" }),
    ).toBeInTheDocument();
  },
  parameters: {
    docs: {
      description: {
        story: "After **Continue**, the pay-in-Telegram confirmation affordance appears.",
      },
    },
  },
};

export const PlanDetailsLoading: Story = {
  name: "Plan details loading",
  render: () => renderCheckout(CHECKOUT_PATH, loadingCheckoutScenario),
  parameters: {
    docs: {
      description: {
        story: "Deferred plan payload — loading placeholders in the checkout shell.",
      },
    },
  },
};

export const PlanNotFound: Story = {
  name: "Plan not found",
  render: () => renderCheckout("/plan/checkout/missing-plan", readyScenario),
  parameters: {
    docs: {
      description: {
        story: "Unknown id: inline alert instead of pay CTA; shell stays mounted.",
      },
    },
  },
};

export const SessionMissing: Story = {
  name: "Session missing",
  render: () => renderCheckout(CHECKOUT_PATH, loggedOutScenario),
  parameters: {
    docs: {
      description: {
        story: "No `setWebappToken` context — same `SessionMissing` branch as production.",
      },
    },
  },
};

export const PlansLoadError: Story = {
  name: "Could not load plans",
  render: () => renderCheckout(CHECKOUT_PATH, plansLoadErrorScenario),
  parameters: {
    docs: {
      description: {
        story: "**plans** returns 5xx — `FallbackScreen` with retry wired to `refetchPlans` (distinct from unknown plan id).",
      },
    },
  },
};

export const ViewportNarrow: Story = {
  name: "Viewport · narrow",
  render: () => renderCheckout(CHECKOUT_PATH, readyScenario),
  parameters: {
    ...VIEW_NARROW,
    docs: {
      description: {
        story: "320px (`iphoneSE`) — stacked summary, promo, and primary actions.",
      },
    },
  },
};

export const ViewportWide: Story = {
  name: "Viewport · wide",
  render: () => renderCheckout(CHECKOUT_PATH, readyScenario),
  parameters: {
    ...VIEW_WIDE,
    docs: {
      description: {
        story: "Desktop-width frame — section width, header, and card gutters at `adminDesktop`.",
      },
    },
  },
};
