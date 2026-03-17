import { act, renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi } from "vitest";
import { useConnectStatusPageModel } from "./useConnectStatusPageModel";

const mockPost = vi.fn();
const mockTrack = vi.fn();
const mockUseSession = vi.fn();

vi.mock("@/api/client", () => ({
  useWebappToken: () => "token",
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
    expect(result.current.header.title).toBe("Connect in AmneziaVPN");
    expect(result.current.primaryAction).toEqual({ kind: "route", label: "Choose plan", to: "/plan" });
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

    expect(result.current.summary.title).toBe("Finish setup");
    expect(result.current.showConfirmAction).toBe(true);

    await act(async () => {
      await result.current.confirmConnected();
    });

    expect(mockTrack).toHaveBeenCalledWith("connect_confirmed", { screen_name: "connect-status" });
  });

  it("uses device management as the default action once setup is confirmed", () => {
    mockUseSession.mockReturnValue({
      data: {
        user: { id: 1, last_connection_confirmed_at: "2026-03-10T00:00:00Z" },
        subscriptions: [{ id: "sub-1", plan_id: "plan-basic", status: "active" }],
        devices: [{ id: "dev-1", device_name: "iPhone", status: "connected" }],
        latest_device_delivery: { amnezia_vpn_key: "vpn://payload" },
      },
    });

    const { result } = renderHook(() => useConnectStatusPageModel(), { wrapper });

    expect(result.current.summary.title).toBe("Access ready");
    expect(result.current.primaryAction).toEqual({ kind: "open_app", label: "Open AmneziaVPN", payload: "vpn://payload" });
    expect(result.current.showConfirmAction).toBe(false);
  });

  it("shows a live connection state when backend handshake telemetry says the tunnel is active", () => {
    mockUseSession.mockReturnValue({
      data: {
        user: { id: 1 },
        subscriptions: [{ id: "sub-1", plan_id: "plan-basic", status: "active" }],
        devices: [{ id: "dev-1", device_name: "iPhone", status: "idle" }],
        latest_device_delivery: { amnezia_vpn_key: "vpn://payload" },
        live_connection: {
          status: "connected",
          source: "server_handshake",
          device_id: "dev-1",
          device_name: "iPhone",
          last_handshake_at: "2026-03-10T00:00:00Z",
          handshake_age_sec: 30,
          telemetry_updated_at: "2026-03-10T00:00:20Z",
        },
      },
    });

    const { result } = renderHook(() => useConnectStatusPageModel(), { wrapper });

    expect(result.current.summary.title).toBe("Connected now");
    expect(result.current.primaryAction).toEqual({ kind: "open_app", label: "Open AmneziaVPN", payload: "vpn://payload" });
    expect(result.current.showConfirmAction).toBe(true);
  });
});
