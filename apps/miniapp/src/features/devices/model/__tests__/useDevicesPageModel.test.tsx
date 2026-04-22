import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { ToastContainer } from "@/design-system";
import { webappMeActive } from "@/test/fixtures/session";
import { useDevicesPageModel } from "../useDevicesPageModel";

const {
  mockTrack,
  mockUseOnlineStatus,
  mockUseSession,
  mockUseTelemetry,
  mockUseTrackScreen,
  mockUseTelegramHaptics,
  mockUseWebappToken,
  mockGetPlans,
  mockWebappGet,
  mockWebappPost,
} = vi.hoisted(() => ({
  mockTrack: vi.fn(),
  mockUseOnlineStatus: vi.fn(),
  mockUseSession: vi.fn(),
  mockUseTelemetry: vi.fn(),
  mockUseTrackScreen: vi.fn(),
  mockUseTelegramHaptics: vi.fn(),
  mockUseWebappToken: vi.fn(),
  mockGetPlans: vi.fn(),
  mockWebappGet: vi.fn(),
  mockWebappPost: vi.fn(),
}));

vi.mock("@/api", () => ({
  getPlans: (...args: unknown[]) => mockGetPlans(...args),
}));

vi.mock("@/api/client", () => ({
  useWebappToken: () => mockUseWebappToken(),
  webappApi: {
    get: (...args: unknown[]) => mockWebappGet(...args),
    post: (...args: unknown[]) => mockWebappPost(...args),
    patch: vi.fn(),
  },
}));

vi.mock("@/hooks", () => ({
  useOnlineStatus: () => mockUseOnlineStatus(),
  useSession: (...args: unknown[]) => mockUseSession(...args),
  useTelegramHaptics: () => mockUseTelegramHaptics(),
  useTelemetry: (...args: unknown[]) => mockUseTelemetry(...args),
  useTrackScreen: (...args: unknown[]) => mockUseTrackScreen(...args),
}));

vi.mock("@/hooks/useI18n", () => ({
  useI18n: () => ({
    t: (key: string, params?: Record<string, unknown>) =>
      params ? `${key} ${JSON.stringify(params)}` : key,
    locale: "en",
  }),
}));

vi.mock("@/lib/telegram/telegramCoreClient", () => ({
  telegramClient: {
    getPlatform: () => "ios",
  },
}));

function createWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <MemoryRouter initialEntries={["/devices"]}>
        <QueryClientProvider client={client}>
          <ToastContainer>{children}</ToastContainer>
        </QueryClientProvider>
      </MemoryRouter>
    );
  };
}

describe("useDevicesPageModel", () => {
  beforeEach(() => {
    sessionStorage.clear();
    mockTrack.mockReset();
    mockUseOnlineStatus.mockReturnValue(true);
    mockUseWebappToken.mockReturnValue("token");
    mockUseTelemetry.mockReturnValue({ track: mockTrack });
    mockUseTrackScreen.mockReset();
    mockUseTelegramHaptics.mockReturnValue({ impact: vi.fn(), notify: vi.fn() });
    mockGetPlans.mockResolvedValue({ items: [] });
    mockWebappGet.mockResolvedValue({ points: [] });
    mockWebappPost.mockReset();
    mockWebappPost.mockResolvedValue({
      device_id: "device-1",
      peer_created: true,
      config_awg: "config",
      config: "config",
      config_wg_obf: null,
      config_wg: null,
    });
    mockUseSession.mockReturnValue({
      data: webappMeActive,
      isLoading: false,
      error: null,
    });
  });

  it("adds the guidance snapshot to device setup telemetry", async () => {
    const { result } = renderHook(() => useDevicesPageModel(), { wrapper: createWrapper() });

    result.current.handleIssueDevice("Travel laptop");

    expect(mockTrack).toHaveBeenCalledWith(
      "device_issue_started",
      expect.objectContaining({
        guidance_context_id: expect.any(String),
        flow_stage: "device_setup",
        step_index: 0,
        step_id: "add_device",
        current_route: "/devices",
        last_action: "device_issue_started",
      }),
    );

    await waitFor(() =>
      expect(mockTrack).toHaveBeenCalledWith(
        "config_download",
        expect.objectContaining({
          guidance_context_id: expect.any(String),
          flow_stage: "device_setup",
          step_index: 1,
          step_id: "deliver_config",
          current_route: "/devices",
          last_action: "config_download",
        }),
      ),
    );
  });

  it("annotates device limit failures with the guidance snapshot", async () => {
    mockWebappPost.mockRejectedValueOnce(new Error("device limit reached"));

    const { result } = renderHook(() => useDevicesPageModel(), { wrapper: createWrapper() });

    result.current.handleIssueDevice("Travel laptop");

    await waitFor(() =>
      expect(mockTrack).toHaveBeenCalledWith(
        "device_limit_reached",
        expect.objectContaining({
          guidance_context_id: expect.any(String),
          flow_stage: "device_limit",
          step_index: 0,
          step_id: "device_limit",
          current_route: "/devices",
          last_action: "device_limit_reached",
          device_limit: 3,
        }),
      ),
    );
  });

  it("adds the guidance snapshot to device replacement, confirm, and revoke events", async () => {
    const { result } = renderHook(() => useDevicesPageModel(), { wrapper: createWrapper() });

    result.current.handleReplaceDevice("device-1");
    await waitFor(() =>
      expect(mockTrack).toHaveBeenCalledWith(
        "device_issue_success",
        expect.objectContaining({
          guidance_context_id: expect.any(String),
          flow_stage: "device_setup",
          step_index: 2,
          step_id: "config_ready",
          current_route: "/devices",
          last_action: "device_issue_success",
        }),
      ),
    );

    result.current.handleConfirmConnected("device-1");
    await waitFor(() =>
      expect(mockTrack).toHaveBeenCalledWith(
        "connect_confirmed",
        expect.objectContaining({
          guidance_context_id: expect.any(String),
          flow_stage: "device_setup",
          step_index: 3,
          step_id: "connect_confirmed",
          current_route: "/devices",
          last_action: "connect_confirmed",
        }),
      ),
    );

    act(() => result.current.setRevokeId("device-1"));
    result.current.handleConfirmRevoke();
    await waitFor(() =>
      expect(mockTrack).toHaveBeenCalledWith(
        "device_revoked",
        expect.objectContaining({
          guidance_context_id: expect.any(String),
          flow_stage: "device_management",
          step_index: 0,
          step_id: "revoke_device",
          current_route: "/devices",
          last_action: "device_revoked",
        }),
      ),
    );
  });
});
