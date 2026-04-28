import { describe, expect, it } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { NewsPage } from "@/features/news/NewsPage";
import { server } from "@/test/mocks/server";
import { renderWithProviders } from "@/test/utils/render-with-providers";

const now = new Date().toISOString();

function setupNewsHandlers(captures: Record<string, unknown>[] = []) {
  server.use(
    http.get("*/admin/news/broadcasts", () => HttpResponse.json([])),
    http.get("*/plans", () =>
      HttpResponse.json({
        items: [
          {
            id: "trial-plan",
            name: "Trial",
            duration_days: 3,
            device_limit: 1,
            price_amount: 0,
            price_currency: "XTR",
            created_at: now,
          },
        ],
        total: 1,
      })
    ),
    http.get("*/users", () =>
      HttpResponse.json({
        items: [
          {
            id: 11,
            tg_id: 90011,
            email: "user@example.com",
            phone: "+995111",
            meta: null,
            is_banned: false,
            created_at: now,
            updated_at: now,
          },
        ],
        total: 1,
        limit: 10,
        offset: 0,
      })
    ),
    http.get("*/users/11", () =>
      HttpResponse.json({
        id: 11,
        tg_id: 90011,
        email: "user@example.com",
        phone: "+995111",
        meta: null,
        is_banned: false,
        created_at: now,
        updated_at: now,
        subscriptions: [
          {
            id: "sub-11",
            user_id: 11,
            plan_id: "trial-plan",
            status: "active",
            valid_from: now,
            valid_until: now,
            device_limit: 1,
            created_at: now,
          },
        ],
      })
    ),
    http.post("*/admin/news/broadcast", async ({ request }) => {
      captures.push({ endpoint: "broadcast", body: await request.json() });
      return HttpResponse.json({ broadcast_id: "bc-1", status: "queued" });
    }),
    http.post("*/admin/news/direct", async ({ request }) => {
      captures.push({ endpoint: "direct", body: await request.json() });
      return HttpResponse.json({ user_id: 11, tg_id: 90011, status: "sent" });
    }),
    http.post("*/admin/grants/trial", async ({ request }) => {
      captures.push({ endpoint: "trial", body: await request.json() });
      return HttpResponse.json({ status: "granted", user_id: 11, event_id: "evt-1", notified: false });
    })
  );
}

describe("NewsPage", () => {
  it("validates campaign composer and posts filtered campaign target", async () => {
    const captures: Record<string, unknown>[] = [];
    setupNewsHandlers(captures);
    renderWithProviders(<NewsPage />);

    expect(screen.getByRole("button", { name: "Queue campaign" })).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Campaign message body"), {
      target: { value: "<b>Service update</b>" },
    });
    fireEvent.change(screen.getByLabelText("Target"), { target: { value: "filters" } });
    fireEvent.change(screen.getByLabelText("Filter search"), { target: { value: "user@example.com" } });
    fireEvent.click(screen.getByLabelText("I confirm this send can reach multiple users"));
    fireEvent.click(screen.getByRole("button", { name: "Queue campaign" }));

    await waitFor(() => {
      expect(captures.some((entry) => entry.endpoint === "broadcast")).toBe(true);
    });
    const payload = captures.find((entry) => entry.endpoint === "broadcast")?.body as {
      text: string;
      target: { kind: string; filters: { search: string } };
    };
    expect(payload.text).toContain("Service update");
    expect(payload.target.kind).toBe("filters");
    expect(payload.target.filters.search).toBe("user@example.com");
  });

  it("sends a direct personal message to a selected user", async () => {
    const captures: Record<string, unknown>[] = [];
    setupNewsHandlers(captures);
    renderWithProviders(<NewsPage />);

    fireEvent.click(screen.getByRole("tab", { name: "Personal message" }));
    fireEvent.change(screen.getByLabelText("Personal user search"), {
      target: { value: "user@example.com" },
    });
    fireEvent.click(await screen.findByRole("button", { name: "Select" }));
    fireEvent.change(screen.getByLabelText("Personal message body"), { target: { value: "Hello" } });
    fireEvent.click(screen.getByRole("button", { name: "Send personal message" }));

    await waitFor(() => {
      expect(captures.some((entry) => entry.endpoint === "direct")).toBe(true);
    });
    const payload = captures.find((entry) => entry.endpoint === "direct")?.body as {
      user_id: number;
      text: string;
    };
    expect(payload).toMatchObject({ user_id: 11, text: "Hello" });
  });

  it("grants a trial to the selected user", async () => {
    const captures: Record<string, unknown>[] = [];
    setupNewsHandlers(captures);
    renderWithProviders(<NewsPage />);

    fireEvent.click(screen.getByRole("tab", { name: "Grants" }));
    fireEvent.change(screen.getByLabelText("Grants user search"), {
      target: { value: "user@example.com" },
    });
    fireEvent.click(await screen.findByRole("button", { name: "Select" }));
    fireEvent.click(screen.getByRole("button", { name: "Apply grant" }));

    await waitFor(() => {
      expect(captures.some((entry) => entry.endpoint === "trial")).toBe(true);
    });
    const payload = captures.find((entry) => entry.endpoint === "trial")?.body as {
      user_id: number;
      plan_id: string;
      duration_hours: number;
    };
    expect(payload).toMatchObject({ user_id: 11, plan_id: "trial-plan", duration_hours: 72 });
  });
});
