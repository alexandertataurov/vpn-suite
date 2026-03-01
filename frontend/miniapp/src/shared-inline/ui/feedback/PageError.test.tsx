import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PageError } from "./PageError";

describe("PageError", () => {
  it("renders endpoint/request/correlation context and debug copy control", () => {
    render(
      <PageError
        message="Failed to load"
        endpoint="GET /servers"
        statusCode={503}
        requestId="req-1"
        correlationId="corr-1"
      />
    );
    expect(screen.getByText("Status 503 · GET /servers")).toBeTruthy();
    expect(screen.getByText("req-1")).toBeTruthy();
    expect(screen.getByText("corr-1")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Copy debug packet" })).toBeTruthy();
  });

  it("copies debug packet to clipboard", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(global.navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });

    render(
      <PageError
        message="Failed to load"
        endpoint="GET /servers"
        statusCode={500}
        requestId="req-2"
        correlationId="corr-2"
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Copy debug packet" }));
    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    expect(writeText.mock.calls[0]?.[0]).toContain("\"endpoint\": \"GET /servers\"");
    expect(writeText.mock.calls[0]?.[0]).toContain("\"request_id\": \"req-2\"");
    expect(writeText.mock.calls[0]?.[0]).toContain("\"correlation_id\": \"corr-2\"");
  });
});
