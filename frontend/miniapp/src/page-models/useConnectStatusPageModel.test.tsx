import { act, renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi } from "vitest";
import { useConnectStatusPageModel } from "./useConnectStatusPageModel";

const mockPost = vi.fn();
const mockTrack = vi.fn();
const mockUseSession = vi.fn();

vi.mock("@/api/client", () => ({
  webappApi: {
    post: (...args: unknown[]) => mockPost(...args),
  },
}));

vi.mock("@/hooks/useSession", () => ({
  useSession: (...args: unknown[]) => mockUseSession(...args),
}));

vi.mock("@/hooks/useTelemetry", () => ({
  useTelemetry: () => ({ track: (...args: unknown[]) => mockTrack(...args) }),
}));

vi.mock("@/lib/query-keys/webapp.query-keys", () => ({
  webappQueryKeys: {
    me: () => ["me"],
  },
}));

function wrapper({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>;
}

describe("useConnectStatusPageModel", () => {
  beforeEach(() => {
    mockPost.mockReset();
    mockTrack.mockReset();
    mockUseSession.mockReset();
  });

  it("guides users without a subscription to choose a plan", () => {
    mockUseSession.mockReturnValue({
      data: {
        user: { id: 1 },
        subscriptions: [],
        devices: [],
      },
    });

    const { result } = renderHook(() => useConnectStatusPageModel(), { wrapper });

    expect(result.current.summary.title).toBe("No active plan");
    expect(result.current.primaryAction).toEqual({ label: "Choose plan", to: "/plan" });
    expect(result.current.showConfirmAction).toBe(false);
  });

  it("offers setup confirmation when a config exists but connection is not confirmed", async () => {
    mockUseSession.mockReturnValue({
      data: {
        user: { id: 1 },
        subscriptions: [{ id: "sub-1", plan_id: "plan-basic", status: "active" }],
        devices: [{ id: "dev-1", device_name: "iPhone", status: "idle" }],
      },
    });
    mockPost.mockResolvedValue({ status: "ok" });

    const { result } = renderHook(() => useConnectStatusPageModel(), { wrapper });

    expect(result.current.summary.title).toBe("Setup pending");
    expect(result.current.showConfirmAction).toBe(true);

    await act(async () => {
      await result.current.confirmConnected();
    });

    expect(mockTrack).toHaveBeenCalledWith("connect_confirmed", { screen_name: "connect-status" });
  });

  it("uses device management as the default action once setup is confirmed", () => {
    mockUseSession.mockReturnValue({
      data: {
        user: { id: 1 },
        subscriptions: [{ id: "sub-1", plan_id: "plan-basic", status: "active" }],
        devices: [{ id: "dev-1", device_name: "iPhone", status: "connected" }],
      },
    });

    const { result } = renderHook(() => useConnectStatusPageModel(), { wrapper });

    expect(result.current.summary.title).toBe("Setup confirmed");
    expect(result.current.primaryAction).toEqual({ label: "Manage devices", to: "/devices" });
    expect(result.current.showConfirmAction).toBe(false);
  });
});
