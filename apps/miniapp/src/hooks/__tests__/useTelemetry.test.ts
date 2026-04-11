import { describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { track } from "@vpn-suite/shared";
import { useTelemetry } from "../useTelemetry";

vi.mock("@vpn-suite/shared", () => ({
  track: vi.fn(),
  identify: vi.fn(),
  reset: vi.fn(),
  setContext: vi.fn(),
  setBackendSink: vi.fn(),
  trackError: vi.fn(),
  trackTiming: vi.fn(),
  getAppName: vi.fn(() => "vpn-suite-miniapp"),
  initPostHog: vi.fn(),
  initFaro: vi.fn(),
}));

describe("useTelemetry", () => {
  it("forwards canonical event and payload with user_plan", () => {
    const trackMock = vi.mocked(track);
    const { result } = renderHook(() => useTelemetry("plan-1"));

    result.current.track("cta_click", {
      cta_name: "test_cta",
      screen_name: "plan",
    });

    expect(trackMock).toHaveBeenCalledWith(
      "miniapp.cta_clicked",
      expect.objectContaining({
        cta_name: "test_cta",
        screen_name: "plan",
        user_plan: "plan-1",
      }),
    );
  });

  it("allows optional payload", () => {
    const trackMock = vi.mocked(track);
    const { result } = renderHook(() => useTelemetry(null));

    result.current.track("app_open");

    expect(trackMock).toHaveBeenCalledWith(
      "miniapp.opened",
      expect.objectContaining({
        user_plan: undefined,
      }),
    );
  });

  it("maps server_switched to the canonical selection event", () => {
    const trackMock = vi.mocked(track);
    const { result } = renderHook(() => useTelemetry("plan-1"));

    result.current.track("server_switched", {
      screen_name: "servers",
      server_id: "server-1",
    } as never);

    expect(trackMock).toHaveBeenCalledWith(
      "miniapp.server_selected",
      expect.objectContaining({
        screen_name: "servers",
        server_id: "server-1",
        user_plan: "plan-1",
      }),
    );
  });
});
