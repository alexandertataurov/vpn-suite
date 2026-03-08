import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { TelegramProvider, useTelegram } from "./TelegramContext";

const mockViewportDimensions = vi.fn();
const mockTelegramApp = vi.fn();

vi.mock("@/hooks/useViewportDimensions", () => ({
  useViewportDimensions: () => mockViewportDimensions(),
}));

vi.mock("@/hooks/telegram", () => ({
  useTelegramApp: () => mockTelegramApp(),
}));

function Consumer() {
  const value = useTelegram();
  return (
    <div data-testid="consumer">
      <span data-viewport-height={value.viewportHeight} />
      <span data-fullscreen={String(value.isFullscreen)} />
    </div>
  );
}

describe("TelegramProvider / useTelegram", () => {
  beforeEach(() => {
    mockViewportDimensions.mockReturnValue({
      viewportHeight: 600,
      safeAreaInsets: { top: 10, bottom: 20, left: 0, right: 0 },
    });
    mockTelegramApp.mockReturnValue({ isFullscreen: true, platform: "ios" });
  });

  it("provides value from useViewportDimensions and useTheme", () => {
    render(
      <TelegramProvider>
        <Consumer />
      </TelegramProvider>
    );

    const el = screen.getByTestId("consumer");
    expect(el.querySelector("[data-viewport-height]")).toHaveAttribute(
      "data-viewport-height",
      "600"
    );
    expect(el.querySelector("[data-fullscreen]")).toHaveAttribute(
      "data-fullscreen",
      "true"
    );
  });
});
