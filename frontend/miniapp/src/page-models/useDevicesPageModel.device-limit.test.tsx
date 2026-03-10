import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi } from "vitest";
import type { WebAppMeResponse } from "@vpn-suite/shared";
import { useDevicesPageModel } from "./useDevicesPageModel";

const mockUseWebappToken = vi.fn();
const mockUseOnlineStatus = vi.fn();
const mockWebappPost = vi.fn();
const mockGetPlans = vi.fn();
const mockUseSession = vi.fn();
const mockAddToast = vi.fn();
const mockTrack = vi.fn();

vi.mock("@/api/client", () => ({
  useWebappToken: () => mockUseWebappToken(),
  webappApi: {
    post: (...args: unknown[]) => mockWebappPost(...args),
  },
}));

vi.mock("@/api", () => ({
  getPlans: (...args: unknown[]) => mockGetPlans(...args),
}));

vi.mock("@/hooks/useOnlineStatus", () => ({
  useOnlineStatus: () => mockUseOnlineStatus(),
}));

vi.mock("@/hooks/useSession", () => ({
  useSession: () => mockUseSession(),
}));

vi.mock("@/hooks/useTelegramHaptics", () => ({
  useTelegramHaptics: () => ({ impact: vi.fn(), notify: vi.fn() }),
}));

vi.mock("@/hooks/useTelemetry", () => ({
  useTelemetry: () => ({ track: (...args: unknown[]) => mockTrack(...args) }),
}));

vi.mock("@/design-system", () => ({
  useToast: () => ({ addToast: mockAddToast }),
}));

vi.mock("@/lib/query-keys/webapp.query-keys", () => ({
  webappQueryKeys: {
    me: () => ["me"],
    plans: () => ["plans"],
  },
}));

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient();
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe("useDevicesPageModel device limit telemetry", () => {
  beforeEach(() => {
    mockUseWebappToken.mockReturnValue("token");
    mockUseOnlineStatus.mockReturnValue(true);
    mockWebappPost.mockReset();
    mockGetPlans.mockResolvedValue({ items: [] });
    mockAddToast.mockReset();
    mockTrack.mockReset();
    const session: WebAppMeResponse = {
      user: { id: 1, tg_id: 1 } as WebAppMeResponse["user"],
      subscriptions: [
        {
          id: "sub-1",
          plan_id: "plan-basic",
          device_limit: 1,
          access_status: "active",
        } as WebAppMeResponse["subscriptions"][number],
      ],
      devices: [
        {
          id: "dev-1",
          status: "idle",
        } as WebAppMeResponse["devices"][number],
      ],
    };
    mockUseSession.mockReturnValue({
      data: session,
      isLoading: false,
      error: null,
    });
  });

  it("emits device_limit_reached when issueMutation fails with device limit error", async () => {
    const error = Object.assign(new Error("device limit reached"), { code: "DEVICE_LIMIT" });
    mockWebappPost.mockRejectedValue(error);

    const { result } = renderHook(() => useDevicesPageModel(), { wrapper });

    await act(async () => {
      result.current.handleIssueDevice();
    });

    const deviceLimitEvent = mockTrack.mock.calls.find(
      (call) => call[0] === "device_limit_reached",
    );
    expect(deviceLimitEvent).toBeDefined();
    expect(deviceLimitEvent?.[1]).toEqual(
      expect.objectContaining({
        screen_name: "devices",
        devices_used: 1,
      }),
    );
  });
});

