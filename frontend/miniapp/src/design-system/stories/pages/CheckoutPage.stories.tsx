import type { Meta, StoryObj } from "@storybook/react";
import { Route } from "react-router-dom";
import { expect, userEvent, within } from "storybook/test";
import { CheckoutPage } from "@/pages/Checkout";
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
  "**Audience:** design and QA for **Checkout** (`/plan/checkout/:planId`): review step, confirmation step, promos, and error branches.",
  "**What is mocked:** token + `plans` (and default handlers for promo/invoice paths); `PageSandbox` mirrors miniapp routing and layout.",
  "**Scenarios:** [`page-contracts.tsx`](../../../storybook/page-contracts.tsx) — `readyScenario`, `loadingCheckoutScenario`, `loggedOutScenario`; plus invalid `planId` route and a local **plans** 500 preset for load failure.",
  "Default **iphone14**; **Viewport ·** stories add `iphoneSE` / `adminDesktop` where layout density matters.",
].join("\n\n");

const VIEW_NARROW = { viewport: { defaultViewport: "iphoneSE" as const } };
const VIEW_WIDE = { viewport: { defaultViewport: "adminDesktop" as const } };

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
