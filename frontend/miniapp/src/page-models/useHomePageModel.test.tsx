import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useHomePageModel } from "./useHomePageModel";

const {
  mockUseWebappToken,
  mockUseSession,
  mockUseTrackScreen,
  mockUseI18n,
  mockUseQuery,
  mockWebappGet,
} = vi.hoisted(() => ({
  mockUseWebappToken: vi.fn(),
  mockUseSession: vi.fn(),
  mockUseTrackScreen: vi.fn(),
  mockUseI18n: vi.fn(),
  mockUseQuery: vi.fn(),
  mockWebappGet: vi.fn(),
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
}));

vi.mock("@/api", () => ({
  getPlans: vi.fn(),
}));

vi.mock("@/api/client", () => ({
  useWebappToken: () => mockUseWebappToken(),
  webappApi: { get: (...args: unknown[]) => mockWebappGet(...args) },
}));

vi.mock("@/hooks/useSession", () => ({
  useSession: (...args: unknown[]) => mockUseSession(...args),
}));

vi.mock("@/hooks/useTrackScreen", () => ({
  useTrackScreen: (...args: unknown[]) => mockUseTrackScreen(...args),
}));

vi.mock("@/hooks/useI18n", () => ({
  useI18n: () => mockUseI18n(),
}));

describe("useHomePageModel", () => {
  beforeEach(() => {
    mockUseWebappToken.mockReturnValue("token");
    mockUseSession.mockReturnValue({
      data: {},
      isLoading: false,
      error: null,
      isFetching: false,
      refetch: vi.fn(),
    });
    mockUseTrackScreen.mockReset();
    mockUseI18n.mockReturnValue({
      t: (key: string, params?: Record<string, string | number>) => {
        if (key === "home.header_title") return "VPN access";
        if (key === "home.header_no_plan_subtitle") return "No active plan.";
        if (key === "home.header_connected_subtitle") return "Devices set up. Connect in app.";
        if (key === "home.header_default_subtitle") return "Manage your secure access.";
        if (key === "home.status_inactive_title") return "No active plan";
        if (key === "home.status_inactive_hint") return "Choose a plan to activate your tunnel.";
        if (key === "home.primary_choose_plan") return "Choose plan";
        if (key === "home.primary_contact_support") return "Need help?";
        if (key === "home.quick_access_badge_start_here") return "Start here";
        if (key === "home.quick_access_description_no_plan") return "Pick a plan to begin.";
        if (key === "home.quick_access_badge_devices") return `${params?.used}/${params?.limit} devices`;
        if (key === "home.quick_access_badge_devices_unbounded") return `${params?.used} devices`;
        return key;
      },
    });
    mockUseQuery.mockReturnValue({ data: undefined });
    mockWebappGet.mockResolvedValue({ items: [] });
  });

  it("derives a disconnected hero with muted empty-state metrics when there is no active subscription", () => {
    const { result } = renderHook(() => useHomePageModel());

    expect(result.current.homeHero.variant).toBe("disconnected");
    expect(result.current.homeHero.showServerRow).toBe(false);
    expect(result.current.homeHero.statusText).toBe("No active plan");
    expect(result.current.homeHero.latencyLabel).toBe("Offline");
    expect(result.current.homeHero.latencyTone).toBe("mut");
    expect(result.current.homeHero.bandwidthLabel).toBe("--");
    expect(result.current.homeHero.bandwidthTone).toBe("mut");
    expect(result.current.homeHero.timeLeftLabel).toBe("Not started");
    expect(result.current.homeHero.timeLeftTone).toBe("mut");
  });
});
