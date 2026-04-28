import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { ActionMenu } from "@/design-system/primitives";
import { renderWithProviders } from "@/test/utils/render-with-providers";

describe("ActionMenu", () => {
  it("opens, selects an item, and closes", () => {
    const onSelect = vi.fn();
    renderWithProviders(
      <ActionMenu
        label="Row actions"
        items={[
          { id: "inspect", label: "Inspect", onSelect },
          { id: "delete", label: "Delete", danger: true, onSelect: vi.fn() },
        ]}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Row actions" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Inspect" }));

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Row actions" })).toHaveAttribute("aria-expanded", "false");
  });

  it("supports keyboard open and escape close", () => {
    renderWithProviders(
      <ActionMenu
        label="Keyboard actions"
        items={[{ id: "inspect", label: "Inspect", onSelect: vi.fn() }]}
      />
    );

    const trigger = screen.getByRole("button", { name: "Keyboard actions" });
    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    expect(screen.getByRole("menuitem", { name: "Inspect" })).toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });
});
