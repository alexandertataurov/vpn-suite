import { describe, expect, it } from "vitest";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { CustomerOpsPage } from "@/features/customer-ops/CustomerOpsPage";
import { server } from "@/test/mocks/server";
import { renderWithProviders } from "@/test/utils/render-with-providers";

const now = new Date().toISOString();

function usersPayload() {
  return {
    items: [
      {
        id: 11,
        tg_id: 9911,
        email: "user11@example.com",
        phone: "+10000001",
        meta: { tg: { username: "user11" } },
        is_banned: false,
        created_at: now,
        updated_at: now,
      },
    ],
    total: 1,
    limit: 100,
    offset: 0,
  };
}

function setupHandlers(observedUsers?: Array<Record<string, string>>) {
  server.use(
    http.get("*/users", ({ request }) => {
      const url = new URL(request.url);
      observedUsers?.push(Object.fromEntries(url.searchParams.entries()));
      return HttpResponse.json(usersPayload());
    }),
    http.get("*/users/11", () =>
      HttpResponse.json({
        ...usersPayload().items[0],
        subscriptions: [
          {
            id: "sub-1",
            user_id: 11,
            plan_id: "plan-pro",
            status: "active",
            effective_status: "active",
            access_status: "enabled",
            billing_status: "paid",
            renewal_status: "renewing",
            valid_from: now,
            valid_until: new Date(Date.now() + 86400000).toISOString(),
            device_limit: 3,
            created_at: now,
          },
        ],
      })
    ),
    http.get("*/devices", () =>
      HttpResponse.json({
        items: [
          {
            id: "dev-1",
            user_id: 11,
            subscription_id: "sub-1",
            server_id: "node-1",
            delivery_mode: "awg_native",
            device_name: "iphone",
            public_key: "pub",
            allowed_ips: "10.0.0.2/32",
            issued_at: now,
            revoked_at: null,
            suspended_at: null,
            created_at: now,
            apply_status: "APPLIED",
            protocol_version: "awg",
          },
        ],
        total: 1,
        limit: 100,
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
            access_status: "enabled",
            billing_status: "paid",
            renewal_status: "renewing",
            valid_from: now,
            valid_until: new Date(Date.now() + 86400000).toISOString(),
            device_limit: 3,
            created_at: now,
          },
        ],
        total: 1,
      })
    ),
    http.get("*/payments", () =>
      HttpResponse.json({
        items: [
          {
            id: "pay-1",
            user_id: 11,
            subscription_id: "sub-1",
            provider: "telegram_stars",
            status: "completed",
            amount: 100,
            currency: "XTR",
            external_id: "ext-1",
            created_at: now,
          },
        ],
        total: 1,
      })
    ),
    http.get("*/plans", () =>
      HttpResponse.json({
        items: [
          {
            id: "plan-pro",
            name: "Pro",
            duration_days: 30,
            price_amount: 100,
            price_currency: "XTR",
            created_at: now,
          },
        ],
        total: 1,
      })
    ),
    http.get("*/servers", () =>
      HttpResponse.json({
        items: [
          {
            id: "node-1",
            name: "Node 1",
            region: "eu-west",
            api_endpoint: "https://node-1.example.com",
            is_active: true,
            status: "online",
            created_at: now,
          },
        ],
        total: 1,
        limit: 200,
        offset: 0,
      })
    )
  );
}

describe("CustomerOpsPage", () => {
  it("renders a unified customer cockpit across users, devices, and billing", async () => {
    setupHandlers();
    renderWithProviders(<CustomerOpsPage />, { route: "/customer-360?user=11" });

    const cockpit = await screen.findByLabelText("Customer operations cockpit");
    expect(within(cockpit).getByText("Customer cockpit")).toBeInTheDocument();
    expect(within(cockpit).getByText("Users in scope")).toBeInTheDocument();
    expect(within(cockpit).getAllByText("1 new in 7d")).toHaveLength(2);
    expect(within(cockpit).getByText("Paid users")).toBeInTheDocument();
    expect(within(cockpit).getByText("100 XTR")).toBeInTheDocument();
    expect(within(cockpit).getByText("Active devices")).toBeInTheDocument();
    expect(within(cockpit).getByText("Open Billing")).toHaveAttribute("href", "/billing");
  });

  it("applies cross-domain filters to user query params", async () => {
    const observedUsers: Array<Record<string, string>> = [];
    setupHandlers(observedUsers);

    renderWithProviders(<CustomerOpsPage />, { route: "/customer-360" });

    await screen.findByLabelText("Customer search");
    fireEvent.change(screen.getByLabelText("Customer search"), { target: { value: "9911" } });
    fireEvent.change(screen.getByLabelText("User status"), { target: { value: "false" } });
    fireEvent.change(screen.getByLabelText("Plan"), { target: { value: "plan-pro" } });
    fireEvent.change(screen.getByLabelText("Region"), { target: { value: "eu-west" } });
    fireEvent.click(screen.getByRole("button", { name: /Apply/i }));

    await waitFor(() => {
      const latest = observedUsers.at(-1);
      expect(latest?.tg_id).toBe("9911");
      expect(latest?.is_banned).toBe("false");
      expect(latest?.plan_id).toBe("plan-pro");
      expect(latest?.region).toBe("eu-west");
    });
  });

  it("drills into devices and opens the device inspector", async () => {
    setupHandlers();
    renderWithProviders(<CustomerOpsPage />, { route: "/customer-360?user=11" });

    await screen.findByTestId("customer-ops-page");
    fireEvent.click(screen.getByRole("tab", { name: "Devices" }));
    await screen.findByText("iphone");
    fireEvent.click(screen.getByRole("button", { name: "Open" }));

    await screen.findByRole("dialog", { name: /Device iphone/i });
    expect(screen.getByText("10.0.0.2/32")).toBeInTheDocument();
  });

  it("opens payment and subscription detail modals", async () => {
    setupHandlers();
    renderWithProviders(<CustomerOpsPage />, { route: "/customer-360?user=11" });

    await screen.findByTestId("customer-ops-page");
    fireEvent.click(screen.getByRole("tab", { name: "Payments" }));
    await screen.findByText("telegram_stars");
    fireEvent.click(screen.getByRole("button", { name: "Open" }));
    await screen.findByRole("heading", { name: "Payment detail" });
    fireEvent.click(screen.getByRole("button", { name: "Back" }));

    fireEvent.click(screen.getByRole("tab", { name: "Billing" }));
    await waitFor(() => expect(screen.getAllByText("plan-pro").length).toBeGreaterThan(0));
    fireEvent.click(screen.getAllByRole("button", { name: "Open" })[0]!);
    await screen.findByRole("heading", { name: "Subscription detail" });
  });
});
