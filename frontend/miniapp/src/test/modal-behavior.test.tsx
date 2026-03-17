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
  it("keeps the drag handle for plain modals", () => {
    render(
      <Modal open onClose={() => undefined} title="Session details">
        <p className="modal-message">Body</p>
      </Modal>,
    );

    expect(document.querySelector(".modal-handle")).not.toBeNull();
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

    expect(document.querySelector(".modal-handle")).toBeNull();

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
    expect(document.querySelector(".modal-handle")).toBeNull();
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

    const confirmButton = document.querySelector(".modal-footer .btn-primary");
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

  it("dismisses plain modals on downward swipe", () => {
    const onClose = vi.fn();
    render(
      <Modal open onClose={onClose} title="Session details">
        <p className="modal-message">Body</p>
      </Modal>,
    );

    const handle = document.querySelector(".modal-handle");
    expect(handle).not.toBeNull();

    fireEvent.touchStart(handle!, {
      touches: [{ clientX: 120, clientY: 80 }],
    });
    fireEvent.touchMove(handle!, {
      touches: [{ clientX: 122, clientY: 160 }],
    });
    fireEvent.touchEnd(handle!, {
      changedTouches: [{ clientX: 122, clientY: 160 }],
    });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not dismiss when the gesture starts inside scrolled modal content", () => {
    const onClose = vi.fn();
    render(
      <Modal open onClose={onClose} title="Session details">
        <>
          {Array.from({ length: 20 }, (_, index) => (
            <p key={index} data-testid={index === 0 ? "modal-scroll-target" : undefined}>
              Scrollable body row {index + 1}
            </p>
          ))}
        </>
      </Modal>,
    );

    const overlay = document.querySelector(".modal-overlay");
    const body = document.querySelector(".modal-body") as HTMLDivElement | null;
    const target = screen.getByTestId("modal-scroll-target");
    expect(overlay).not.toBeNull();
    expect(body).not.toBeNull();
    if (body) {
      body.scrollTop = 64;
    }

    fireEvent.touchStart(target, {
      touches: [{ clientX: 120, clientY: 120 }],
    });
    fireEvent.touchMove(overlay!, {
      touches: [{ clientX: 121, clientY: 220 }],
    });
    fireEvent.touchEnd(overlay!, {
      changedTouches: [{ clientX: 121, clientY: 220 }],
    });

    expect(onClose).not.toHaveBeenCalled();
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
