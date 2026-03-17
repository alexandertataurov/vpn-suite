import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { WebAppMeResponse } from "@vpn-suite/shared";
import { buildHomeFlowContext, useBetaHomePageModel } from "./useBetaHomePageModel";

const mockUseWebappToken = vi.fn();
const mockWebappGet = vi.fn();
const mockWebappPost = vi.fn();
const mockWebappPatch = vi.fn();
const mockInvalidateQueries = vi.fn();
const mockNavigate = vi.fn();
const mockAddToast = vi.fn();
const mockImpact = vi.fn();
const mockNotify = vi.fn();
const mockTrack = vi.fn();
const mockSetOnboardingStep = vi.fn();
const mockCompleteOnboarding = vi.fn();
let mockSessionData: WebAppMeResponse;

vi.mock("@/api/client", () => ({
  useWebappToken: () => mockUseWebappToken(),
  webappApi: {
    get: (...args: unknown[]) => mockWebappGet(...args),
    post: (...args: unknown[]) => mockWebappPost(...args),
    patch: (...args: unknown[]) => mockWebappPatch(...args),
  },
}));

vi.mock("@/api", () => ({
  getPlans: vi.fn().mockResolvedValue({
    items: [
      {
        id: "plan-basic",
        name: "Basic",
        duration_days: 30,
        price_amount: 100,
        display_order: 1,
        device_limit: 3,
      },
    ],
  }),
}));

vi.mock("@/hooks/useOnlineStatus", () => ({
  useOnlineStatus: () => true,
}));

vi.mock("@/hooks/useSession", () => ({
  useSession: () => ({
    data: mockSessionData,
    isLoading: false,
    error: null,
  }),
}));

vi.mock("@/hooks/useTelegramHaptics", () => ({
  useTelegramHaptics: () => ({ impact: mockImpact, notify: mockNotify }),
}));

vi.mock("@/hooks/useTelemetry", () => ({
  useTelemetry: () => ({ track: mockTrack }),
}));

vi.mock("@/hooks/useTrackScreen", () => ({
  useTrackScreen: () => undefined,
}));

vi.mock("@/design-system", () => ({
  useToast: () => ({ addToast: mockAddToast }),
}));

vi.mock("@/bootstrap/context", () => ({
  useBootstrapContext: () => ({
    phase: "app_ready",
    onboardingStep: 3,
    setOnboardingStep: mockSetOnboardingStep,
    completeOnboarding: mockCompleteOnboarding,
  }),
}));

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return (
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={["/"]}>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

describe("useBetaHomePageModel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSessionData = {
      user: { id: 1, tg_id: 1, display_name: "Test User" },
      subscriptions: [
        {
          id: "sub-1",
          plan_id: "plan-basic",
          subscription_status: "active",
          status: "active",
          access_status: "enabled",
          valid_until: "2030-01-01T00:00:00Z",
          device_limit: 3,
        },
      ],
      devices: [],
      latest_device_delivery: null,
      onboarding: { completed: true, step: 3, version: 2, updated_at: "2026-01-01T00:00:00Z" },
      routing: { reason: "no_device" },
    } satisfies WebAppMeResponse;
    mockUseWebappToken.mockReturnValue("token");
    mockWebappGet.mockResolvedValue({ payload: "ref", bot_username: "vpn_bot" });
    mockInvalidateQueries.mockReset();
    mockWebappPost.mockReset();
    mockWebappPatch.mockReset();
  });

  it("keeps device issuance successful even if post-issue rename fails", async () => {
    mockWebappPost.mockResolvedValue({
      device_id: "dev-1",
      config_awg: "[Interface]\nPrivateKey = test",
      peer_created: true,
    });
    mockWebappPatch.mockRejectedValue(new Error("rename failed"));

    const { result } = renderHook(() => useBetaHomePageModel(), { wrapper });

    await act(async () => {
      result.current.handleIssueDevice("My iPhone");
    });

    await waitFor(() => {
      expect(result.current.issuedConfig?.device_id).toBe("dev-1");
    });

    expect(mockWebappPost).toHaveBeenCalledWith("/webapp/devices/issue", {});
    expect(mockWebappPatch).toHaveBeenCalledWith("/webapp/devices/dev-1", { device_name: "My iPhone" });
    expect(mockAddToast).toHaveBeenCalledWith("Device added. Your config is ready to import.", "success");
    expect(mockAddToast).toHaveBeenCalledWith("Device added, but the name could not be saved", "info");
  });

  it("remembers confirmed setup from session and switches home state to ready", async () => {
    mockSessionData = {
      ...mockSessionData,
      user: { ...mockSessionData.user, last_connection_confirmed_at: "2026-03-10T00:00:00Z" },
      latest_device_delivery: {
        device_id: "dev-1",
        device_name: "My iPhone",
        issued_at: "2026-03-09T00:00:00Z",
        amnezia_vpn_key: "vpn://test-payload",
      },
      devices: [
        {
          id: "dev-1",
          device_name: "My iPhone",
          status: "idle",
          revoked_at: null,
          last_connection_confirmed_at: "2026-03-10T00:00:00Z",
        },
      ],
      routing: { reason: "connected_user" },
    } satisfies WebAppMeResponse;

    const { result } = renderHook(() => useBetaHomePageModel(), { wrapper });

    await waitFor(() => {
      expect(result.current.connectionConfirmed).toBe(true);
      expect(result.current.state).toBe("ready");
      expect(result.current.latestDeviceName).toBe("My iPhone");
      expect(result.current.flowContext.primaryAction?.kind).toBe("open_vpn_app");
      expect(result.current.amneziaVpnKey).toBe("vpn://test-payload");
    });
  });

  it("builds a step-two flow context for users who still need a first device", () => {
    const context = buildHomeFlowContext({
      state: "device_setup",
      routeReason: "no_device",
      hasConfig: false,
      activeDevicesCount: 0,
      hasVpnAppPayload: false,
    });

    expect(context.heroBadge.label).toBe("Step 2");
    expect(context.heroTitle).toBe("Add your first device");
    expect(context.primaryAction.label).toBe("Open Devices");
    expect(context.devicesSectionTitle).toBe("Add your first device");
  });

  it("builds a setup-confirmation context when config is already issued", () => {
    const context = buildHomeFlowContext({
      state: "import_guide",
      routeReason: "connection_not_confirmed",
      hasConfig: true,
      activeDevicesCount: 1,
      hasVpnAppPayload: false,
    });

    expect(context.heroBadge.label).toBe("Step 3");
    expect(context.heroTitle).toBe("Connect in AmneziaVPN");
    expect(context.primaryAction.kind).toBe("view_devices");
    expect(context.secondaryAction?.kind).toBe("confirm_import");
  });

  it("surfaces renewal-off context for connected users with cancellation scheduled", () => {
    const context = buildHomeFlowContext({
      state: "ready",
      routeReason: "cancelled_at_period_end",
      hasConfig: false,
      activeDevicesCount: 2,
      hasVpnAppPayload: false,
    });

    expect(context.heroBadge.label).toBe("Renewal off");
    expect(context.heroTitle).toBe("Access stays active until period end");
    expect(context.primaryAction?.kind).toBe("open_settings");
    expect(context.secondaryAction).toBeUndefined();
  });

  it("routes paused access users to settings instead of restore", () => {
    const context = buildHomeFlowContext({
      state: "expired_or_paused",
      routeReason: "paused_access",
      hasConfig: false,
      activeDevicesCount: 1,
      hasVpnAppPayload: false,
    });

    expect(context.primaryAction.kind).toBe("open_settings");
    expect(context.primaryAction.label).toBe("Open settings");
    expect(context.secondaryAction?.kind).toBe("view_plans");
  });

  it("uses the app-open action for connected users when a launch payload exists", () => {
    const context = buildHomeFlowContext({
      state: "ready",
      routeReason: "connected_user",
      hasConfig: false,
      activeDevicesCount: 2,
      hasVpnAppPayload: true,
    });

    expect(context.primaryAction?.kind).toBe("open_vpn_app");
    expect(context.primaryAction?.label).toBe("Open AmneziaVPN");
    expect(context.secondaryAction).toBeUndefined();
  });

  it("falls back to reviewing devices when no app-open payload exists", () => {
    const context = buildHomeFlowContext({
      state: "ready",
      routeReason: "connected_user",
      hasConfig: false,
      activeDevicesCount: 2,
      hasVpnAppPayload: false,
    });

    expect(context.primaryAction?.kind).toBe("view_devices");
    expect(context.primaryAction?.label).toBe("Open Devices");
    expect(context.secondaryAction).toBeUndefined();
  });
});
