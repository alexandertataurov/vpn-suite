import { describe, expect, it } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { AuditPage } from "@/features/audit/AuditPage";
import { server } from "@/test/mocks/server";
import { renderWithProviders } from "@/test/utils/render-with-providers";

function buildAuditItems(count: number, offset = 0) {
  return Array.from({ length: count }, (_, idx) => ({
    id: offset + idx + 1,
    admin_id: "admin-1",
    action: "PATCH /servers/s1",
    resource_type: "server",
    resource_id: `s-${offset + idx + 1}`,
    old_new: { old: { status: "old" }, new: { status: "new" } },
    request_id: `req-${offset + idx + 1}`,
    created_at: new Date().toISOString(),
  }));
}

describe("AuditPage", () => {
  it("applies filters and paginates through API params", async () => {
    const observed: Array<Record<string, string>> = [];

    server.use(
      http.get("*/audit", ({ request }) => {
        const url = new URL(request.url);
        observed.push(Object.fromEntries(url.searchParams.entries()));

        const offset = Number(url.searchParams.get("offset") ?? "0");
        return HttpResponse.json({
          items: buildAuditItems(20, offset),
          total: 45,
        });
      })
    );

    renderWithProviders(<AuditPage />);

    await screen.findByText("Filters");

    fireEvent.change(screen.getByLabelText("Resource type"), { target: { value: "device" } });
    fireEvent.change(screen.getByLabelText("Resource ID"), { target: { value: "dev-42" } });
    fireEvent.change(screen.getByLabelText("Request ID"), { target: { value: "req-xyz" } });
    fireEvent.click(screen.getByRole("button", { name: "Apply" }));

    await waitFor(() => {
      const latest = observed.at(-1);
      expect(latest?.resource_type).toBe("device");
      expect(latest?.resource_id).toBe("dev-42");
      expect(latest?.request_id).toBe("req-xyz");
      expect(latest?.offset).toBe("0");
    });

    fireEvent.click(screen.getByRole("button", { name: "2" }));

    await waitFor(() => {
      const latest = observed.at(-1);
      expect(latest?.offset).toBe("20");
      expect(latest?.limit).toBe("20");
    });
  });

  it("shows error state and retries", async () => {
    let failCount = 0;

    server.use(
      http.get("*/audit", () => {
        if (failCount < 2) {
          failCount += 1;
          return HttpResponse.json({ detail: "backend unavailable" }, { status: 500 });
        }
        return HttpResponse.json({ items: buildAuditItems(3), total: 3 });
      })
    );

    renderWithProviders(<AuditPage />);

    await screen.findByRole("button", { name: "Retry" }, { timeout: 5000 });
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));

    await screen.findByText("Filters");
    expect(screen.getByText("3 shown · 3 total")).toBeInTheDocument();
  });
});
