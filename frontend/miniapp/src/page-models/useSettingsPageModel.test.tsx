import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import type { WebAppMeResponse } from "@vpn-suite/shared";
import { useSettingsPageModel } from "./useSettingsPageModel";

const mockUseWebappToken = vi.fn();
const mockUseSession = vi.fn();
const mockUseTelegramInitData = vi.fn();
const mockAddToast = vi.fn();
const mockTrack = vi.fn();
const mockWebappGet = vi.fn();
const mockWebappPost = vi.fn();
const mockWebappPatch = vi.fn();
const mockWebappRequest = vi.fn();
const mockSetWebappToken = vi.fn();

vi.mock("@/api/client", () => ({
  useWebappToken: () => mockUseWebappToken(),
  setWebappToken: (...args: unknown[]) => mockSetWebappToken(...args),
  webappApi: {
    get: (...args: unknown[]) => mockWebappGet(...args),
    post: (...args: unknown[]) => mockWebappPost(...args),
    patch: (...args: unknown[]) => mockWebappPatch(...args),
    request: (...args: unknown[]) => mockWebappRequest(...args),
  },
}));

vi.mock("@/hooks/useSession", () => ({
  useSession: () => mockUseSession(),
}));

vi.mock("@/hooks/telegram/useTelegramInitData", () => ({
  useTelegramInitData: () => mockUseTelegramInitData(),
}));

vi.mock("@/hooks/useTelemetry", () => ({
  useTelemetry: () => ({ track: (...args: unknown[]) => mockTrack(...args) }),
}));

vi.mock("@/hooks/useTrackScreen", () => ({
  useTrackScreen: vi.fn(),
}));

vi.mock("@/design-system", async () => {
  const actual = await vi.importActual<typeof import("@/design-system")>("@/design-system");
  return {
    ...actual,
    useToast: () => ({ addToast: mockAddToast }),
  };
});

vi.mock("@/lib/query-keys/webapp.query-keys", () => ({
  webappQueryKeys: {
    me: () => ["me"],
    subscriptionOffers: (reason = "") => ["subscriptionOffers", reason],
    subscriptionOffersRoot: () => ["subscriptionOffers"],
    referralStats: () => ["referralStats"],
  },
}));

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe("useSettingsPageModel", () => {
  const baseSession: WebAppMeResponse = {
    user: {
      id: 1,
      tg_id: 123,
      display_name: "Alex Morgan",
      email: "alex@vpn.example",
      phone: "+1 555 0100",
      locale: "en",
      first_connected_at: "2025-11-03T10:00:00Z",
    },
    subscriptions: [
      {
        id: "sub-1",
        plan_id: "pro-monthly",
        status: "active",
        subscription_status: "active",
        access_status: "enabled",
        valid_until: "2026-03-24T12:00:00Z",
        device_limit: 3,
      },
    ],
    devices: [
      {
        id: "device-1",
        device_name: "MacBook Pro",
        issued_at: "2026-02-10T08:12:00Z",
        revoked_at: null,
        status: "connected",
      },
    ],
    onboarding: {
      completed: true,
      step: 3,
      version: 2,
      updated_at: "2026-03-01T00:00:00Z",
    },
    routing: {
      recommended_route: "/settings",
      reason: "connected_user",
    },
  };

  beforeEach(() => {
    mockUseWebappToken.mockReturnValue("token");
    mockUseSession.mockReturnValue({
      data: baseSession,
      isLoading: false,
      error: null,
    });
    mockUseTelegramInitData.mockReturnValue({
      user: { language_code: "en" },
    });
    mockWebappGet.mockImplementation((url: string) => {
      if (url.includes("/webapp/referral/stats")) {
        return Promise.resolve({
          total_referrals: 3,
          rewards_applied: 0,
          earned_days: 0,
          active_referrals: 1,
          pending_rewards: 0,
          invite_goal: 2,
          invite_progress: 1,
          invite_remaining: 1,
        });
      }
      return Promise.resolve({
        subscription_id: "sub-1",
        can_pause: true,
        can_resume: false,
        offer_discount: false,
        discount_percent: 0,
        offer_pause: false,
        offer_downgrade: false,
        reason_group: "not_needed",
        status: "active",
        valid_until: "2026-03-24T12:00:00Z",
      });
    });
    mockWebappPost.mockResolvedValue({ status: "ok" });
    mockWebappPatch.mockResolvedValue({ user: baseSession.user });
    mockWebappRequest.mockResolvedValue(null);
    mockAddToast.mockReset();
    mockTrack.mockReset();
    mockSetWebappToken.mockReset();
  });

  it("formats member since using the active locale without duplicating the label", () => {
    mockUseSession.mockReturnValue({
      data: {
        ...baseSession,
        user: {
          ...baseSession.user,
          locale: "ru",
        },
      },
      isLoading: false,
      error: null,
    });
    mockUseTelegramInitData.mockReturnValue({
      user: { language_code: "ru" },
    });

    const { result } = renderHook(() => useSettingsPageModel(), { wrapper });

    expect(result.current.accountSummary.memberSince).toBe(
      new Intl.DateTimeFormat("ru-RU", { month: "long", year: "numeric" }).format(
        new Date("2025-11-03T10:00:00Z"),
      ),
    );
  });

  it("exposes renewal, resolved language, and referral summary for the settings surface", async () => {
    const { result } = renderHook(() => useSettingsPageModel(), { wrapper });

    await waitFor(() => {
      expect(result.current.renewalDate).toBe("Mar 24, 2026");
      expect(result.current.languageSummary).toBe("Auto (Telegram) → English");
      expect(result.current.referralSummary).toBe("3 invites sent · 1 active");
    });
  });

  it("exposes no-plan account CTA state when the user has no subscription", () => {
    mockUseSession.mockReturnValue({
      data: {
        ...baseSession,
        subscriptions: [],
      },
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(() => useSettingsPageModel(), { wrapper });

    expect(result.current.hasPlan).toBe(false);
    expect(result.current.planLabel).toBe("No plan");
    expect(result.current.planActionTo).toBe("/plan");
  });

  it("logs out through the webapp endpoint and clears the local token", async () => {
    const { result } = renderHook(() => useSettingsPageModel(), { wrapper });

    await act(async () => {
      result.current.handleLogout();
    });

    await waitFor(() => {
      expect(mockWebappPost).toHaveBeenCalledWith("/webapp/logout", {});
      expect(mockSetWebappToken).toHaveBeenCalledWith(null);
    });
  });

  it("starts the cancellation flow without a preselected reason and tracks explicit reason picks", () => {
    const { result } = renderHook(() => useSettingsPageModel(), { wrapper });

    act(() => {
      result.current.openCancelFlow();
    });

    expect(result.current.cancelOpen).toBe(true);
    expect(result.current.cancelReason).toBeNull();
    expect(mockTrack).toHaveBeenCalledWith("cancel_flow_started", { screen_name: "settings" });

    act(() => {
      result.current.setCancelReasonWithTrack("technical");
    });

    expect(result.current.cancelReason).toBe("technical");
    expect(mockTrack).toHaveBeenCalledWith("cancel_reason_selected", { reason_group: "technical" });
  });
});
