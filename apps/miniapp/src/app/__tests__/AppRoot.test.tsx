import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppRoot } from "../AppRoot";
import {
  decrementBlockingOverlayCount,
  incrementBlockingOverlayCount,
} from "@/design-system/utils/overlayStack";

const mockExpand = vi.fn();
const mockIsAvailable = vi.fn(() => false);
const mockIsDesktop = vi.fn(() => false);
const mockRequestFullscreen = vi.fn(() => undefined);
const mockGetWebApp = vi.fn(() => ({
  requestFullscreen: mockRequestFullscreen,
}));

vi.mock("../hooks/useTelegramWebApp", () => ({
  initTelegramRuntime: vi.fn(),
}));

vi.mock("../lib/telegram/telegramCoreClient", () => ({
  telegramClient: {
    expand: () => mockExpand(),
    isAvailable: () => mockIsAvailable(),
    isDesktop: () => mockIsDesktop(),
    getWebApp: () => mockGetWebApp(),
    requestFullscreen: () => mockRequestFullscreen(),
  },
}));

describe("AppRoot", () => {
  beforeEach(() => {
    delete document.body.dataset.overlayActive;
    delete document.documentElement.dataset.overlayActive;
    delete document.documentElement.dataset.modalOpenCount;
  });

  afterEach(() => {
    delete document.body.dataset.overlayActive;
    delete document.documentElement.dataset.overlayActive;
    delete document.documentElement.dataset.modalOpenCount;
  });

  it("marks the shell inert while blocking overlays are open", () => {
    render(
      <AppRoot>
        <div className="miniapp-shell">Shell content</div>
      </AppRoot>,
    );

    const root = screen.getByText("Shell content").closest(".tg-app-root");
    const shell = screen.getByText("Shell content").closest(".miniapp-shell");
    expect(root?.getAttribute("data-overlay-active")).toBe("false");
    expect(shell?.hasAttribute("inert")).toBe(false);

    act(() => {
      incrementBlockingOverlayCount();
    });

    expect(root?.getAttribute("data-overlay-active")).toBe("true");
    expect(shell?.hasAttribute("inert")).toBe(true);
    expect(shell?.getAttribute("aria-hidden")).toBe("true");
    expect(document.body.dataset.overlayActive).toBe("true");
    expect(document.documentElement.dataset.overlayActive).toBe("true");
    expect(document.body.style.overflow).toBe("hidden");
    expect(document.body.style.touchAction).toBe("none");
    expect(document.documentElement.style.overflow).toBe("hidden");
    expect(document.documentElement.style.overscrollBehavior).toBe("none");

    act(() => {
      decrementBlockingOverlayCount();
    });

    expect(root?.getAttribute("data-overlay-active")).toBe("false");
    expect(shell?.hasAttribute("inert")).toBe(false);
    expect(shell?.hasAttribute("aria-hidden")).toBe(false);
    expect(document.body.dataset.overlayActive).toBe("false");
    expect(document.documentElement.dataset.overlayActive).toBe("false");
    expect(document.body.style.overflow).toBe("");
    expect(document.body.style.touchAction).toBe("");
    expect(document.documentElement.style.overflow).toBe("");
    expect(document.documentElement.style.overscrollBehavior).toBe("");
  });
});
