import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "@/design-system";

describe("button status contract", () => {
  it("renders loading status text instead of the idle label when status is loading", () => {
    render(
      <Button status="loading" statusText="Adding device…">
        Add device
      </Button>,
    );

    const button = screen.getByRole("button", { name: "Adding device…" });
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button).toHaveAttribute("data-status", "loading");
    expect(screen.getByText("Adding device…")).toBeInTheDocument();
    expect(screen.queryByText("Add device")).not.toBeInTheDocument();
  });

  it("uses success and error labels for accessible names when status changes", () => {
    const { rerender } = render(
      <Button status="success" successText="Copied">
        Copy
      </Button>,
    );

    expect(screen.getByRole("button", { name: "Copied" })).toHaveAttribute("data-status", "success");

    rerender(
      <Button status="error" errorText="Try again">
        Copy
      </Button>,
    );

    expect(screen.getByRole("button", { name: "Try again" })).toHaveAttribute("data-status", "error");
  });
});
