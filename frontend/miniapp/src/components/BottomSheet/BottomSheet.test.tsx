import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BottomSheet } from "./BottomSheet";

describe("BottomSheet", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it("renders nothing when closed", () => {
    const { queryByRole } = render(
      <BottomSheet
        open={false}
        title="Session details"
        primaryLabel="Confirm"
        secondaryLabel="Cancel"
        onPrimary={() => undefined}
        onSecondary={() => undefined}
        onClose={() => undefined}
      />,
    );

    expect(queryByRole("dialog")).toBeNull();
  });

  it("closes on Escape and restores focus to the trigger", () => {
    const onClose = vi.fn();

    const { rerender } = render(
      <>
        <button type="button">Open trigger</button>
        <BottomSheet
          open={false}
          title="Session details"
          primaryLabel="Confirm"
          secondaryLabel="Cancel"
          onPrimary={() => undefined}
          onSecondary={() => undefined}
          onClose={onClose}
        />
      </>,
    );

    const trigger = screen.getByRole("button", { name: "Open trigger" });
    trigger.focus();

    rerender(
      <>
        <button type="button">Open trigger</button>
        <BottomSheet
          open={true}
          title="Session details"
          primaryLabel="Confirm"
          secondaryLabel="Cancel"
          onPrimary={() => undefined}
          onSecondary={() => undefined}
          onClose={onClose}
        />
      </>,
    );

    const dialog = screen.getByRole("dialog");
    fireEvent.keyDown(dialog, { key: "Escape" });
    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(trigger).toHaveFocus();
  });

  it("dismisses on swipe down past the threshold", () => {
    const onClose = vi.fn();

    render(
      <BottomSheet
        open={true}
        title="Session details"
        primaryLabel="Confirm"
        secondaryLabel="Cancel"
        onPrimary={() => undefined}
        onSecondary={() => undefined}
        onClose={onClose}
      />,
    );

    const dialog = screen.getByRole("dialog");
    const handle = dialog.querySelector("[data-bottom-sheet-drag-handle='true']");
    expect(handle).not.toBeNull();

    fireEvent.touchStart(handle!, {
      touches: [{ clientY: 100 }],
    });
    fireEvent.touchMove(dialog, {
      touches: [{ clientY: 210 }],
    });
    fireEvent.touchEnd(dialog, {
      changedTouches: [{ clientY: 210 }],
    });

    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
