import { renderHook, act } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { useSupportPageModel } from "./useSupportPageModel";

const { mockUseWebappToken, mockUseSession, mockUseTelemetry, mockUseTrackScreen } = vi.hoisted(() => ({
  mockUseWebappToken: vi.fn(),
  mockUseSession: vi.fn(),
  mockUseTelemetry: vi.fn(),
  mockUseTrackScreen: vi.fn(),
}));

vi.mock("@/api/client", () => ({
  useWebappToken: () => mockUseWebappToken(),
}));

vi.mock("@/hooks/useSession", () => ({
  useSession: (...args: unknown[]) => mockUseSession(...args),
}));

vi.mock("@/hooks/useTelemetry", () => ({
  useTelemetry: (...args: unknown[]) => mockUseTelemetry(...args),
}));

vi.mock("@/hooks/useTrackScreen", () => ({
  useTrackScreen: (...args: unknown[]) => mockUseTrackScreen(...args),
}));

describe("useSupportPageModel", () => {
  beforeEach(() => {
    mockUseWebappToken.mockReturnValue("token");
    mockUseTelemetry.mockReturnValue({ track: vi.fn() });
    mockUseTrackScreen.mockReset();
  });

  it("returns empty state without a token", () => {
    mockUseWebappToken.mockReturnValue(null);
    mockUseSession.mockReturnValue({ data: undefined, isLoading: false, error: null, refetch: vi.fn() });

    const { result } = renderHook(() => useSupportPageModel());

    expect(result.current.pageState).toEqual({ status: "empty", title: "Session missing" });
  });

  it("returns error state and invokes refetch on retry", () => {
    const refetch = vi.fn();
    mockUseSession.mockReturnValue({ data: undefined, isLoading: false, error: new Error("boom"), refetch });

    const { result } = renderHook(() => useSupportPageModel());

    expect(result.current.pageState.status).toBe("error");
    result.current.pageState.onRetry?.();
    expect(refetch).toHaveBeenCalled();
  });

  it("tracks support_opened and advances the troubleshooter flow", () => {
    const track = vi.fn();
    mockUseTelemetry.mockReturnValue({ track });
    mockUseSession.mockReturnValue({
      data: {
        subscriptions: [{ id: "sub-1", plan_id: "plan-pro", status: "active", access_status: "enabled", valid_until: "2030-01-01T00:00:00Z", device_limit: 3 }],
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    const { result } = renderHook(() => useSupportPageModel());

    expect(track).toHaveBeenCalledWith("support_opened", { screen_name: "support" });
    expect(result.current.currentStep.title).toMatch(/Check access status/i);
    expect(result.current.currentStepAltLabel).toBe("No, choose plan");

    act(() => result.current.nextStep());
    expect(result.current.step).toBe(1);
    expect(result.current.previousStep).toBeTypeOf("function");

    act(() => result.current.nextStep());
    act(() => result.current.nextStep());
    act(() => result.current.nextStep());
    expect(result.current.step).toBe(0);
  });
});
