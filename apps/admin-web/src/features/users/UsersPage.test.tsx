import { describe, expect, it, beforeEach, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { UsersPage } from "@/features/users/UsersPage";
import { server } from "@/test/mocks/server";
import { renderWithProviders } from "@/test/utils/render-with-providers";

function mockMatchMedia(matches: boolean) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

function usersResponse() {
  return {
    items: [
      {
        id: 11,
        tg_id: 9911,
        email: "user11@example.com",
        phone: "+10000001",
        meta: { tg: { username: "user11" } },
        is_banned: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
    total: 1,
    limit: 50,
    offset: 0,
  };
}

function setupDefaultHandlers() {
  server.use(
    http.get("*/users", () => HttpResponse.json(usersResponse())),
    http.get("*/users/11", () =>
      HttpResponse.json({
        ...usersResponse().items[0],
        subscriptions: [
          {
            id: "sub-1",
            user_id: 11,
            plan_id: "plan-pro",
            status: "active",
            effective_status: "active",
            valid_from: new Date().toISOString(),
            valid_until: new Date(Date.now() + 86400000).toISOString(),
            device_limit: 3,
            created_at: new Date().toISOString(),
          },
        ],
      })
    ),
    http.get("*/users/11/devices", () => HttpResponse.json({ items: [], total: 0 })),
    http.get("*/plans", () =>
      HttpResponse.json({
        items: [{ id: "plan-pro", name: "Pro", duration_days: 30, price_amount: 100, price_currency: "USD", created_at: new Date().toISOString() }],
        total: 1,
      })
    ),
    http.get("*/servers", ({ request }) => {
      const url = new URL(request.url);
      if (url.searchParams.get("is_active") === "true") {
        return HttpResponse.json({
          items: [{ id: "node-1", is_active: true, region: "eu-west", kind: "awg_node" }],
          total: 1,
        });
      }
      return HttpResponse.json({
        items: [
          {
            id: "node-1",
            name: "Node 1",
            region: "eu-west",
            api_endpoint: "https://node-1.example.com",
            is_active: true,
            status: "online",
            created_at: new Date().toISOString(),
          },
        ],
        total: 1,
        limit: 200,
        offset: 0,
      });
    })
  );
}

describe("UsersPage", () => {
  beforeEach(() => {
    mockMatchMedia(true);
    setupDefaultHandlers();
  });

  it("applies and resets filters with plan and region", async () => {
    const observed: Array<Record<string, string>> = [];

    server.use(
      http.get("*/users", ({ request }) => {
        const url = new URL(request.url);
        observed.push(Object.fromEntries(url.searchParams.entries()));
        return HttpResponse.json(usersResponse());
      })
    );

    renderWithProviders(<UsersPage />, { route: "/users" });

    await screen.findByLabelText("User search");
    fireEvent.change(screen.getByLabelText("User search"), { target: { value: "777" } });
    fireEvent.change(screen.getByLabelText("Status"), { target: { value: "true" } });
    fireEvent.change(screen.getByLabelText("Plan"), { target: { value: "plan-pro" } });
    fireEvent.change(screen.getByLabelText("Region"), { target: { value: "eu-west" } });
    fireEvent.click(screen.getByRole("button", { name: "Apply" }));

    await waitFor(() => {
      const latest = observed.at(-1);
      expect(latest?.tg_id).toBe("777");
      expect(latest?.is_banned).toBe("true");
      expect(latest?.plan_id).toBe("plan-pro");
      expect(latest?.region).toBe("eu-west");
    });

    fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    expect(screen.getByLabelText("User search")).toHaveValue("");
    expect(screen.getByLabelText("Status")).toHaveValue("all");
    expect(screen.getByLabelText("Plan")).toHaveValue("");
    expect(screen.getByLabelText("Region")).toHaveValue("");
  });

  it("default-selects the first user and renders the detail tabs", async () => {
    renderWithProviders(<UsersPage />, { route: "/users" });

    await screen.findByText("user11@example.com");
    await screen.findByTestId("user-detail-workspace");
    expect(await screen.findByRole("tab", { name: "Overview" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Subscriptions" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Devices" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Actions" })).toBeInTheDocument();
  });

  it("restores selected user from the URL and validates issue device requirements", async () => {
    server.use(
      http.get("*/users/11", () =>
        HttpResponse.json({
          ...usersResponse().items[0],
          subscriptions: [],
        })
      )
    );

    renderWithProviders(<UsersPage />, { route: "/users?user=11" });

    await screen.findByTestId("user-detail-workspace");
    fireEvent.click(screen.getByRole("tab", { name: "Actions" }));
    fireEvent.click(screen.getByRole("button", { name: "Issue device" }));

    await screen.findByText("Subscription id is required to issue a device");
  });

  it("uses a drawer on narrow screens and opens ban confirmation", async () => {
    mockMatchMedia(false);
    renderWithProviders(<UsersPage />, { route: "/users?user=11" });

    await screen.findByTestId("users-detail-drawer");
    fireEvent.click(screen.getByRole("tab", { name: "Actions" }));
    fireEvent.click(screen.getByRole("button", { name: "Ban user" }));

    await screen.findByRole("heading", { name: "Ban user" });
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    await waitFor(() => {
      expect(screen.queryByRole("heading", { name: "Ban user" })).not.toBeInTheDocument();
    });
  });
});
