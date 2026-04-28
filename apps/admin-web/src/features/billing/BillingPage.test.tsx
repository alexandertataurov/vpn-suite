import { describe, expect, it } from "vitest";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { useLocation } from "react-router-dom";
import { http, HttpResponse } from "msw";
import { BillingPage } from "@/features/billing/BillingPage";
import { server } from "@/test/mocks/server";
import { renderWithProviders } from "@/test/utils/render-with-providers";

const now = new Date().toISOString();

function setupBillingHandlers(options?: {
  observedPayments?: Array<Record<string, string>>;
  emptyPayments?: boolean;
}) {
  server.use(
    http.get("*/plans", () =>
      HttpResponse.json({
        items: [
          {
            id: "plan-pro",
            name: "[popular] Pro monthly",
            duration_days: 30,
            device_limit: 5,
            price_amount: "100",
            price_currency: "XTR",
            is_archived: false,
            subscription_count: 4,
            display_order: 1,
            upsell_methods: ["device_limit"],
            created_at: now,
          },
          {
            id: "plan-free",
            name: "[normal] Free trial",
            duration_days: 1,
            device_limit: 1,
            price_amount: "0",
            price_currency: "XTR",
            is_archived: true,
            subscription_count: 0,
            display_order: 2,
            upsell_methods: [],
            created_at: now,
          },
        ],
        total: 2,
        limit: 50,
        offset: 0,
      })
    ),
    http.get("*/subscriptions", () =>
      HttpResponse.json({
        items: [
          {
            id: "sub-1",
            user_id: 11,
            plan_id: "plan-pro",
            status: "active",
            effective_status: "active",
            subscription_status: "active",
            access_status: "enabled",
            billing_status: "paid",
            renewal_status: "renewing",
            valid_from: now,
            valid_until: now,
            device_limit: 5,
            cancel_at_period_end: false,
            created_at: now,
          },
        ],
        total: 1,
        limit: 50,
        offset: 0,
      })
    ),
    http.get("*/payments", ({ request }) => {
      const url = new URL(request.url);
      options?.observedPayments?.push(Object.fromEntries(url.searchParams.entries()));
      return HttpResponse.json({
        items: options?.emptyPayments
          ? []
          : [
              {
                id: "pay-1",
                user_id: 11,
                subscription_id: "sub-1",
                provider: "telegram_stars",
                status: "completed",
                amount: "100",
                currency: "XTR",
                external_id: "ext-1",
                created_at: now,
              },
            ],
        total: options?.emptyPayments ? 0 : 1,
        limit: 50,
        offset: 0,
      });
    }),
    http.get("*/admin/entitlement-events", () =>
      HttpResponse.json([
        {
          id: "evt-1",
          user_id: 11,
          subscription_id: "sub-1",
          event_type: "subscription_activated",
          payload: { source: "test" },
          created_at: now,
        },
      ])
    ),
    http.get("*/admin/churn-surveys", () => HttpResponse.json([]))
  );
}

function LocationProbe() {
  const location = useLocation();
  return <output aria-label="Current location">{`${location.pathname}${location.search}`}</output>;
}

function renderBilling(route = "/billing") {
  return renderWithProviders(
    <>
      <BillingPage />
      <LocationProbe />
    </>,
    { route }
  );
}

describe("BillingPage", () => {
  it("renders the billing cockpit, shared tabs, and plan summary", async () => {
    setupBillingHandlers();
    renderBilling();

    const cockpit = await screen.findByLabelText("Billing cockpit");
    expect(within(cockpit).getByText("Plans")).toBeInTheDocument();
    expect(await within(cockpit).findByText("1 visible")).toBeInTheDocument();
    expect(within(cockpit).getByText("1 hidden · 2 total")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Payments" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add plan" })).toBeInTheDocument();
  });

  it("preserves tab selection in the query string", async () => {
    setupBillingHandlers();
    renderBilling("/billing?tab=plans");

    fireEvent.click(await screen.findByRole("tab", { name: "Payments" }));

    await waitFor(() => {
      expect(screen.getByLabelText("Current location")).toHaveTextContent("/billing?tab=payments");
    });
    expect(await screen.findByText("Payment history (Telegram Stars, etc.).")).toBeInTheDocument();
  });

  it("opens the plan form and keeps delete confirmation guarded", async () => {
    setupBillingHandlers();
    renderBilling();

    fireEvent.click(await screen.findByRole("button", { name: "Add plan" }));
    expect(await screen.findByRole("dialog", { name: "Add plan" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Close" }));

    fireEvent.click(await screen.findByRole("button", { name: "Actions for plan plan-free" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Delete" }));
    const dialog = await screen.findByRole("dialog", { name: "Delete plan" });
    expect(within(dialog).getByText("Permanent destructive action")).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Delete plan" })).toBeDisabled();
    fireEvent.change(within(dialog).getByLabelText("Type plan name to confirm deletion"), {
      target: { value: "Free trial" },
    });
    expect(within(dialog).getByRole("button", { name: "Delete plan" })).toBeEnabled();
  });

  it("updates payment request params from filters and reset", async () => {
    const observedPayments: Array<Record<string, string>> = [];
    setupBillingHandlers({ observedPayments });
    renderBilling("/billing?tab=payments");

    await screen.findByText("Payment history (Telegram Stars, etc.).");
    fireEvent.change(screen.getByPlaceholderText("Filter by user_id"), { target: { value: "11" } });
    fireEvent.change(screen.getByLabelText("Status"), { target: { value: "completed" } });
    fireEvent.change(screen.getByPlaceholderText("e.g. telegram_stars"), { target: { value: "telegram_stars" } });

    await waitFor(() => {
      const latest = observedPayments.at(-1);
      expect(latest?.user_id).toBe("11");
      expect(latest?.status).toBe("completed");
      expect(latest?.provider).toBe("telegram_stars");
    });

    fireEvent.click(screen.getByRole("button", { name: "Reset filters" }));
    fireEvent.click(screen.getByRole("button", { name: "Load payments" }));
    await waitFor(() => {
      const latest = observedPayments.at(-1);
      expect(latest?.user_id).toBeUndefined();
      expect(latest?.status).toBeUndefined();
      expect(latest?.provider).toBeUndefined();
    });
  });

  it("keeps subscription grace modal reachable", async () => {
    setupBillingHandlers();
    renderBilling("/billing?tab=subscription-records");

    fireEvent.click(await screen.findByRole("button", { name: "Actions for subscription sub-1" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Set grace" }));

    expect(await screen.findByRole("dialog", { name: "Set grace period" })).toBeInTheDocument();
  });

  it("renders clean empty state for empty payments", async () => {
    setupBillingHandlers({ emptyPayments: true });
    renderBilling("/billing?tab=payments");

    expect(await screen.findByText("No payments match the filters.")).toBeInTheDocument();
  });
});
