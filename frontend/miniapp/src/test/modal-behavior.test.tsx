import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ConfirmDanger, ConfirmModal, Modal } from "@/design-system";

describe("modal variants", () => {
  it("keeps the drag handle for plain modals", () => {
    const { container } = render(
      <Modal open onClose={() => undefined} title="Session details">
        <p className="modal-message">Body</p>
      </Modal>,
    );

    expect(container.querySelector(".modal-handle")).not.toBeNull();
  });

  it("prevents backdrop dismiss for confirm modals but allows Escape", () => {
    const onClose = vi.fn();
    const { container } = render(
      <ConfirmModal
        open={true}
        onClose={onClose}
        onConfirm={() => undefined}
        title="Disconnect tunnel?"
        message="Your traffic will be unprotected until you reconnect."
        confirmLabel="Disconnect now"
      />,
    );

    expect(container.querySelector(".modal-handle")).toBeNull();

    const overlay = container.querySelector(".modal-overlay");
    expect(overlay).not.toBeNull();
    fireEvent.click(overlay!);
    expect(onClose).not.toHaveBeenCalled();

    const dialog = container.querySelector('[role="dialog"]');
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

    expect(screen.getByLabelText("Type DELETE to confirm")).toHaveAttribute("placeholder", "Type DELETE to confirm");
    const confirmButton = screen.getByText("Delete config").closest("button");
    expect(confirmButton).not.toBeNull();
    expect(confirmButton).toHaveAttribute("disabled");
    expect(document.querySelector(".danger-warning")).not.toBeNull();
    expect(document.querySelector(".modal-handle")).toBeNull();
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
});
