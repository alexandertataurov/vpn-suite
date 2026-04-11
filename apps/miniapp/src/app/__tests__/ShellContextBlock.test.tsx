import { useRef } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ShellContextBlock } from "@/design-system/layouts";

const mockImpact = vi.fn();
const mockGetPlatform = vi.fn(() => "ios");

vi.mock("@/hooks/useTelegramHaptics", () => ({
  useTelegramHaptics: () => ({
    impact: mockImpact,
    selectionChanged: vi.fn(),
  }),
}));

vi.mock("@/lib/telegram/telegramCoreClient", () => ({
  telegramClient: {
    getPlatform: () => mockGetPlatform(),
    getInitDataUnsafe: () => null,
  },
}));

function StackScreen() {
  const gestureRef = useRef<HTMLElement | null>(null);

  return (
    <>
      <main ref={gestureRef} data-testid="gesture-zone">
        <div>Settings page</div>
      </main>
      <ShellContextBlock stackFlow gestureRef={gestureRef} />
    </>
  );
}

function renderShell(initialEntries: string[] = ["/", "/settings"]) {
  return render(
    <MemoryRouter initialEntries={initialEntries} initialIndex={initialEntries.length - 1}>
      <Routes>
        <Route path="/" element={<div>Home page</div>} />
        <Route path="/settings" element={<StackScreen />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("ShellContextBlock", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetPlatform.mockReturnValue("ios");
    delete document.documentElement.dataset.modalOpenCount;
  });

  it("navigates back when the user swipes in from the left edge on mobile", async () => {
    renderShell();

    const gestureZone = screen.getByTestId("gesture-zone");

    fireEvent.touchStart(gestureZone, {
      touches: [{ clientX: 12, clientY: 120 }],
    });
    fireEvent.touchMove(gestureZone, {
      touches: [{ clientX: 160, clientY: 128 }],
    });
    fireEvent.touchEnd(gestureZone, {
      changedTouches: [{ clientX: 160, clientY: 128 }],
    });

    expect(await screen.findByText("Home page")).toBeTruthy();
    expect(mockImpact).toHaveBeenCalledWith("light");
  });

  it("ignores touches that do not start from the gesture edge", () => {
    renderShell(["/settings"]);

    const gestureZone = screen.getByTestId("gesture-zone");

    fireEvent.touchStart(gestureZone, {
      touches: [{ clientX: 80, clientY: 120 }],
    });
    fireEvent.touchMove(gestureZone, {
      touches: [{ clientX: 220, clientY: 126 }],
    });
    fireEvent.touchEnd(gestureZone, {
      changedTouches: [{ clientX: 220, clientY: 126 }],
    });

    expect(screen.getByText("Settings page")).toBeTruthy();
    expect(mockImpact).not.toHaveBeenCalled();
  });

  it("blocks stack swipe-back while a modal overlay is open", () => {
    document.documentElement.dataset.modalOpenCount = "1";
    renderShell();

    const gestureZone = screen.getByTestId("gesture-zone");

    fireEvent.touchStart(gestureZone, {
      touches: [{ clientX: 12, clientY: 120 }],
    });
    fireEvent.touchMove(gestureZone, {
      touches: [{ clientX: 160, clientY: 128 }],
    });
    fireEvent.touchEnd(gestureZone, {
      changedTouches: [{ clientX: 160, clientY: 128 }],
    });

    expect(screen.getByText("Settings page")).toBeTruthy();
    expect(mockImpact).not.toHaveBeenCalled();
  });
});
