import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { useSupportPageModel } from "./useSupportPageModel";

const { mockUseWebappToken, mockUseSession, mockUseTelemetry, mockUseTrackScreen, mockWebappGet } = vi.hoisted(
  () => ({
    mockUseWebappToken: vi.fn(),
    mockUseSession: vi.fn(),
    mockUseTelemetry: vi.fn(),
    mockUseTrackScreen: vi.fn(),
    mockWebappGet: vi.fn(),
  }),
);

vi.mock("@/api/client", () => ({
  useWebappToken: () => mockUseWebappToken(),
  webappApi: {
    get: (...args: unknown[]) => mockWebappGet(...args),
  },
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

function createWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

describe("useSupportPageModel", () => {
  beforeEach(() => {
    mockUseWebappToken.mockReturnValue("token");
    mockUseTelemetry.mockReturnValue({ track: vi.fn() });
    mockUseTrackScreen.mockReset();
    mockWebappGet.mockReset();
    mockWebappGet.mockResolvedValue({ items: [] });
  });

  it("returns empty state without a token", () => {
    mockUseWebappToken.mockReturnValue(null);
    mockUseSession.mockReturnValue({ data: undefined, isLoading: false, error: null, refetch: vi.fn() });

    const { result } = renderHook(() => useSupportPageModel(), { wrapper: createWrapper() });

    expect(result.current.pageState).toEqual({ status: "empty", title: "Session missing" });
  });

  it("returns error state and invokes refetch on retry", async () => {
    const refetch = vi.fn();
    mockUseSession.mockReturnValue({ data: undefined, isLoading: false, error: new Error("boom"), refetch });

    const { result } = renderHook(() => useSupportPageModel(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.pageState.status).toBe("error"));
    result.current.pageState.onRetry?.();
    expect(refetch).toHaveBeenCalled();
    expect(mockWebappGet).toHaveBeenCalled();
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

    const { result } = renderHook(() => useSupportPageModel(), { wrapper: createWrapper() });

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
