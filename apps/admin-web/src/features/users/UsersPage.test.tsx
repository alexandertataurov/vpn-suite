import { describe, expect, it } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { UsersPage } from "@/features/users/UsersPage";
import { server } from "@/test/mocks/server";
import { renderWithProviders } from "@/test/utils/render-with-providers";

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
  };
}

describe("UsersPage", () => {
  it("applies and resets filters", async () => {
    const observed: Array<Record<string, string>> = [];

    server.use(
      http.get("*/users", ({ request }) => {
        const url = new URL(request.url);
        observed.push(Object.fromEntries(url.searchParams.entries()));
        return HttpResponse.json(usersResponse());
      })
    );

    renderWithProviders(<UsersPage />);

    await screen.findByText("Filters");
    fireEvent.change(screen.getByLabelText("TG ID"), { target: { value: "777" } });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "mail" } });
    fireEvent.change(screen.getByLabelText("Phone"), { target: { value: "+1" } });
    fireEvent.change(screen.getByLabelText("Status"), { target: { value: "true" } });
    fireEvent.click(screen.getByRole("button", { name: "Apply" }));

    await waitFor(() => {
      const latest = observed.at(-1);
      expect(latest?.tg_id).toBe("777");
      expect(latest?.email).toBe("mail");
      expect(latest?.phone).toBe("+1");
      expect(latest?.is_banned).toBe("true");
    });

    fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    expect(screen.getByLabelText("TG ID")).toHaveValue("");
    expect(screen.getByLabelText("Email")).toHaveValue("");
    expect(screen.getByLabelText("Phone")).toHaveValue("");
    expect(screen.getByLabelText("Status")).toHaveValue("all");
  });

  it("shows status badge and modal sections; validates missing subscription on issue", async () => {
    server.use(
      http.get("*/users", () => HttpResponse.json(usersResponse())),
      http.get("*/users/11", () =>
        HttpResponse.json({
          ...usersResponse().items[0],
          subscriptions: [],
        })
      ),
      http.get("*/users/11/devices", () => HttpResponse.json({ items: [], total: 0 })),
      http.get("*/servers", () => HttpResponse.json({ items: [], total: 0 }))
    );

    renderWithProviders(<UsersPage />);

    await screen.findByRole("button", { name: "Open profile" });
    fireEvent.click(screen.getByRole("button", { name: "Open profile" }));

    await screen.findByText("Identity + status snapshot");
    expect(screen.getByText("Operational context")).toBeInTheDocument();
    expect(screen.getByText("Profile edit")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Issue device" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Issue device" }));
    await screen.findByText("Subscription id is required to issue a device");
  });
});
