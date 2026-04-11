import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { TelegramProvider } from "../TelegramContext";

const mockViewportDimensions = vi.fn();
const mockTelegramApp = vi.fn();

vi.mock("@/hooks/useViewportDimensions", () => ({
  useViewportDimensions: () => mockViewportDimensions(),
}));

vi.mock("@/hooks/telegram", () => ({
  useTelegramApp: () => mockTelegramApp(),
}));

describe("TelegramProvider", () => {
  beforeEach(() => {
    mockViewportDimensions.mockReturnValue({
      viewportHeight: 600,
      safeAreaInsets: { top: 10, bottom: 20, left: 0, right: 0 },
    });
    mockTelegramApp.mockReturnValue({ isFullscreen: true, platform: "ios" });
  });

  it("sets data-tg* attributes on document root", () => {
    render(
      <TelegramProvider>
        <div />
      </TelegramProvider>
    );

    expect(document.documentElement.dataset.tgFullscreen).toBe("true");
    expect(document.documentElement.dataset.tgPlatform).toBe("ios");
    expect(document.documentElement.dataset.tgDesktop).toBe("false");
  });

  it("removes data-tg* attributes on unmount", () => {
    const { unmount } = render(
      <TelegramProvider>
        <div />
      </TelegramProvider>
    );

    expect(document.documentElement.dataset.tgPlatform).toBe("ios");
    unmount();
    expect(document.documentElement.dataset.tgPlatform).toBeUndefined();
    expect(document.documentElement.dataset.tgFullscreen).toBeUndefined();
  });
});
