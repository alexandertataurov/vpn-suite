import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Popover, Select } from "@/design-system";

function installMobileMatchMedia() {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: query.includes("max-width") ? window.innerWidth <= 429 : false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

function MobilePopoverHarness() {
  const [open, setOpen] = useState(true);

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      panelAriaLabel="Notifications"
      renderTrigger={(props) => (
        <button type="button" {...props}>
          Open
        </button>
      )}
    >
      <div>Latest notification</div>
    </Popover>
  );
}

describe("mobile overlay gestures", () => {
  beforeEach(() => {
    window.innerWidth = 390;
    installMobileMatchMedia();
  });

  afterEach(() => {
    delete document.documentElement.dataset.modalOpenCount;
  });

  it("dismisses a mobile popover sheet on swipe down", async () => {
    render(<MobilePopoverHarness />);

    const dialog = screen.getByRole("dialog", { name: "Notifications" });
    const handle = dialog.querySelector(".miniapp-popover-sheet-handle");
    expect(handle).not.toBeNull();

    fireEvent.touchStart(handle!, {
      touches: [{ clientX: 120, clientY: 100 }],
    });
    fireEvent.touchMove(dialog, {
      touches: [{ clientX: 122, clientY: 188 }],
    });
    fireEvent.touchEnd(dialog, {
      changedTouches: [{ clientX: 122, clientY: 188 }],
    });

    await waitFor(() => {
      expect(screen.queryByRole("dialog", { name: "Notifications" })).toBeNull();
    });
  });

  it("tracks desktop popovers as blocking overlays too", () => {
    window.innerWidth = 960;
    installMobileMatchMedia();

    render(<MobilePopoverHarness />);

    expect(document.documentElement.dataset.modalOpenCount).toBe("1");
    expect(document.body.style.overflow).toBe("hidden");
    expect(document.querySelector(".miniapp-popover-overlay")).not.toBeNull();
  });

  it("dismisses the select sheet on swipe down", () => {
    render(
      <Select
        label="Server"
        value="auto"
        onChange={() => undefined}
        options={[
          { value: "auto", label: "Fastest available" },
          { value: "de", label: "Frankfurt, DE" },
        ]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /server/i }));

    const dialog = screen.getByRole("dialog", { name: "Server" });
    const handle = dialog.querySelector(".select-sheet-handle");
    expect(handle).not.toBeNull();

    fireEvent.touchStart(handle!, {
      touches: [{ clientX: 120, clientY: 100 }],
    });
    fireEvent.touchMove(dialog, {
      touches: [{ clientX: 121, clientY: 184 }],
    });
    fireEvent.touchEnd(dialog, {
      changedTouches: [{ clientX: 121, clientY: 184 }],
    });

    expect(screen.queryByRole("dialog", { name: "Server" })).toBeNull();
  });
});
