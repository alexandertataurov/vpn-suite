import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ConfirmDanger, ConfirmModal, FallbackScreen, Modal } from "@/design-system";
import { renderWithProviders } from "@/test/utils/render";

vi.mock("@/hooks/useTelegramHaptics", () => ({
  useTelegramHaptics: () => ({
    impact: vi.fn(),
    notify: vi.fn(),
    selectionChanged: vi.fn(),
  }),
}));

describe("modal variants", () => {
  it("does not show drag handle (removed from Modal, belongs in BottomSheet)", () => {
    render(
      <Modal open onClose={() => undefined} title="Session details">
        <p className="modal-message">Body</p>
      </Modal>,
    );

    expect(document.querySelector(".modal-handle")).toBeNull();
  });

  it("prevents backdrop dismiss for confirm modals but allows Escape", () => {
    const onClose = vi.fn();
    render(
      <ConfirmModal
        open={true}
        onClose={onClose}
        onConfirm={() => undefined}
        title="Disconnect tunnel?"
        message="Your traffic will be unprotected until you reconnect."
        confirmLabel="Disconnect now"
      />,
    );

    const overlay = document.querySelector(".modal-overlay");
    expect(overlay).not.toBeNull();
    fireEvent.click(overlay!);
    expect(onClose).not.toHaveBeenCalled();

    const dialog = document.querySelector('[role="dialog"]');
    expect(dialog).not.toBeNull();
    fireEvent.keyDown(dialog!, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("uses an instructional placeholder and disabled destructive CTA in danger modals", () => {
    render(
      <ConfirmDanger
        open={true}
        onClose={() => undefined}
        onConfirm={() => undefined}
        title="Delete configuration?"
        message="This will revoke access for all linked devices."
        confirmTokenRequired
        confirmTokenLabel="Type DELETE to confirm"
        expectedConfirmValue="DELETE"
        confirmLabel="Delete config"
      />,
    );

    const confirmInput = screen.getByLabelText("Type DELETE to confirm");
    expect(confirmInput.getAttribute("placeholder")).toBe("Type DELETE to confirm");
    const confirmButton = screen.getByText("Delete config").closest("button");
    expect(confirmButton).not.toBeNull();
    expect(confirmButton?.hasAttribute("disabled")).toBe(true);
    expect(document.querySelector(".danger-warning")).not.toBeNull();
  });

  it("shows the confirm label as the loading label in confirm modals", () => {
    render(
      <ConfirmModal
        open={true}
        onClose={() => undefined}
        onConfirm={() => undefined}
        title="Disconnect tunnel?"
        message="Your traffic will be unprotected until you reconnect."
        confirmLabel="Disconnect now"
        loading
      />,
    );

    const dialog = document.querySelector('[role="dialog"]');
    expect(dialog).not.toBeNull();
    const confirmButton = dialog!.querySelector('.modal-footer .btn--primary, .modal-footer .btn-primary, .modal-footer [data-status="loading"]');
    expect(confirmButton).not.toBeNull();
    expect(confirmButton).toHaveAttribute("aria-busy", "true");
    expect(confirmButton).toHaveAttribute("data-status", "loading");
    expect(screen.getByText("Disconnect now")).toBeInTheDocument();
  });

  it("normalizes confirm-token input to uppercase for typed confirmation flows", () => {
    render(
      <ConfirmDanger
        open={true}
        onClose={() => undefined}
        onConfirm={() => undefined}
        title="Delete configuration?"
        message="This will revoke access for all linked devices."
        confirmTokenRequired
        confirmTokenLabel="Type DELETE to confirm"
        expectedConfirmValue="DELETE"
        confirmLabel="Delete config"
      />,
    );

    const input = screen.getByLabelText("Type DELETE to confirm") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "delete" } });
    expect(input.value).toBe("DELETE");
  });

  it("uses status text for retry actions in fallback screens", () => {
    renderWithProviders(
      <FallbackScreen
        title="Could not load devices"
        message="Please try again."
        onRetry={() => undefined}
        isRetrying
      />,
    );

    const retryButton = screen.getByRole("button", { name: "Retry request" });
    expect(retryButton).toHaveAttribute("aria-busy", "true");
    expect(retryButton).toHaveAttribute("data-status", "loading");
    expect(screen.getByText("Retrying…")).toBeInTheDocument();
  });
});
