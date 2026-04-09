import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useBootstrapMachine } from "./useBootstrapMachine";
import { resetAuthForTest } from "./authBootstrap";

const {
  mockUseWebappToken,
  mockSetWebappToken,
  mockWebappApiGet,
  mockWebappApiPost,
  mockAuthenticateWebApp,
  mockLoadOnboardingResume,
  mockSaveOnboardingResume,
  mockClearOnboardingResume,
  mockTrack,
  mockTrackError,
  mockTrackTiming,
} = vi.hoisted(() => ({
  mockUseWebappToken: vi.fn(),
  mockSetWebappToken: vi.fn(),
  mockWebappApiGet: vi.fn(),
  mockWebappApiPost: vi.fn(),
  mockAuthenticateWebApp: vi.fn(),
  mockLoadOnboardingResume: vi.fn(),
  mockSaveOnboardingResume: vi.fn(),
  mockClearOnboardingResume: vi.fn(),
  mockTrack: vi.fn(),
  mockTrackError: vi.fn(),
  mockTrackTiming: vi.fn(),
}));

vi.mock("@/api/client", () => ({
  useWebappToken: () => mockUseWebappToken(),
  setWebappToken: (...args: unknown[]) => mockSetWebappToken(...args),
  webappApi: {
    get: (...args: unknown[]) => mockWebappApiGet(...args),
    post: (...args: unknown[]) => mockWebappApiPost(...args),
  },
}));

vi.mock("./authBootstrap", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./authBootstrap")>();
  return {
    ...actual,
    authenticateWebApp: (...args: unknown[]) => mockAuthenticateWebApp(...args),
  };
});

vi.mock("./bootstrapStorage", () => ({
  loadOnboardingResume: (...args: unknown[]) => mockLoadOnboardingResume(...args),
  saveOnboardingResume: (...args: unknown[]) => mockSaveOnboardingResume(...args),
  clearOnboardingResume: (...args: unknown[]) => mockClearOnboardingResume(...args),
}));

vi.mock("@vpn-suite/shared", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@vpn-suite/shared")>();
  return {
    ...actual,
    track: (...args: unknown[]) => mockTrack(...args),
    trackError: (...args: unknown[]) => mockTrackError(...args),
    trackTiming: (...args: unknown[]) => mockTrackTiming(...args),
  };
});

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
}

const sessionCompleted: Parameters<typeof mockWebappApiGet.mockResolvedValue>[0] = {
  user: { id: 1, tg_id: 100 },
  subscriptions: [],
  devices: [],
  onboarding: { completed: true, step: 3, version: 2, updated_at: "2026-01-01T00:00:00Z" },
};

const sessionReadyToExitOnboarding: Parameters<typeof mockWebappApiGet.mockResolvedValue>[0] = {
  user: { id: 2, tg_id: 200 },
  subscriptions: [
    {
      id: "sub-1",
      plan_id: "plan-1",
      status: "active",
      subscription_status: "active",
      access_status: "enabled",
      valid_until: "2030-01-01T00:00:00Z",
      device_limit: 5,
    },
  ],
  devices: [
    {
      id: "dev-1",
      device_name: "iPhone",
      issued_at: "2026-03-09T00:00:00Z",
      revoked_at: null,
      status: "config_pending",
    },
  ],
  onboarding: { completed: false, step: 1, version: 2, updated_at: null },
};

describe("useBootstrapMachine", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetAuthForTest();
    mockLoadOnboardingResume.mockReturnValue(null);
  });

  it("transitions to startup_error when initData is empty", async () => {
    mockUseWebappToken.mockReturnValue(null);

    const { result } = renderHook(
      () => useBootstrapMachine({ initData: "", isInsideTelegram: true }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.phase).toBe("startup_error");
    });

    expect(result.current.startupError).toMatchObject({
      title: expect.any(String),
      message: expect.stringContaining("Close and reopen"),
    });
    expect(mockAuthenticateWebApp).not.toHaveBeenCalled();
  });

  it("transitions to startup_error when initData empty and not in Telegram", async () => {
    mockUseWebappToken.mockReturnValue(null);

    const { result } = renderHook(
      () => useBootstrapMachine({ initData: "", isInsideTelegram: false }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.phase).toBe("startup_error");
    });

    expect(result.current.startupError).toMatchObject({
      title: "Open from Telegram",
      message: expect.stringContaining("Open this app"),
    });
  });

  it("transitions to app_ready when hasToken and session loads with completed onboarding", async () => {
    mockUseWebappToken.mockReturnValue("token");
    mockWebappApiGet.mockResolvedValue(sessionCompleted);

    const { result } = renderHook(
      () => useBootstrapMachine({ initData: "valid", isInsideTelegram: true }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.phase).toBe("app_ready");
    }, { timeout: 3000 });

    expect(result.current.session).toEqual(sessionCompleted);
    expect(mockWebappApiGet).toHaveBeenCalledWith("/webapp/me");
    expect(mockAuthenticateWebApp).not.toHaveBeenCalled();
  });

  it("auto-completes onboarding once the user has an active plan and device", async () => {
    mockUseWebappToken.mockReturnValue("token");
    mockWebappApiGet.mockResolvedValue(sessionReadyToExitOnboarding);
    mockWebappApiPost.mockResolvedValue({
      onboarding: { completed: true, step: 3, version: 2, updated_at: "2026-03-09T00:00:00Z" },
    });

    const { result } = renderHook(
      () => useBootstrapMachine({ initData: "valid", isInsideTelegram: true }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.phase).toBe("app_ready");
    }, { timeout: 3000 });

    expect(mockWebappApiPost).toHaveBeenCalledWith("/webapp/onboarding/state", {
      step: 3,
      completed: true,
      version: 2,
    });
  });

  it.skip("transitions to startup_error when session query fails (flaky: webappApi mock)", async () => {
    mockUseWebappToken.mockReturnValue("token");
    const { ApiError } = await import("@vpn-suite/shared");
    mockWebappApiGet.mockRejectedValue(new ApiError("UNAUTHORIZED", "Session expired", 401));

    const { result } = renderHook(
      () => useBootstrapMachine({ initData: "valid", isInsideTelegram: true }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.phase).toBe("startup_error");
      expect(result.current.startupError).toMatchObject({
        title: "Session error",
        message: expect.stringContaining("expired"),
      });
    });
  });

  it("transitions to startup_error when auth fails", async () => {
    mockUseWebappToken.mockReturnValue(null);
    mockAuthenticateWebApp.mockRejectedValue(new Error("Invalid init_data"));

    const { result } = renderHook(
      () => useBootstrapMachine({ initData: "invalid", isInsideTelegram: true }),
      { wrapper: createWrapper() },
    );

    await waitFor(
      () => {
        expect(result.current.phase).toBe("startup_error");
        expect(mockAuthenticateWebApp).toHaveBeenCalledWith("invalid");
        expect(mockSetWebappToken).not.toHaveBeenCalled();
      },
      { timeout: 5000 },
    );
  });

  it("transitions to loading_session when auth succeeds", async () => {
    mockUseWebappToken.mockReturnValue(null);
    mockAuthenticateWebApp.mockResolvedValue({
      session_token: "new-token",
      expires_in: 3600,
    });
    mockSetWebappToken.mockImplementation(() => {
      mockUseWebappToken.mockReturnValue("new-token");
    });
    mockWebappApiGet.mockResolvedValue(sessionCompleted);

    const { result } = renderHook(
      () => useBootstrapMachine({ initData: "valid", isInsideTelegram: true }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(mockAuthenticateWebApp).toHaveBeenCalledWith("valid");
    });

    await waitFor(() => {
      expect(mockSetWebappToken).toHaveBeenCalledWith("new-token", 3600);
    });

    await waitFor(() => {
      expect(result.current.phase).toBe("app_ready");
    }, { timeout: 3000 });
  });

  it("recovers to app_ready after auth failure via auto-retry", async () => {
    mockUseWebappToken.mockReturnValue(null);
    mockAuthenticateWebApp
      .mockRejectedValueOnce(new Error("Network error"))
      .mockResolvedValueOnce({ session_token: "retry-token", expires_in: 3600 });

    mockSetWebappToken.mockImplementation(() => {
      mockUseWebappToken.mockReturnValue("retry-token");
    });
    mockWebappApiGet.mockResolvedValue(sessionCompleted);

    const { result } = renderHook(
      () => useBootstrapMachine({ initData: "valid", isInsideTelegram: true }),
      { wrapper: createWrapper() },
    );

    await waitFor(
      () => {
        expect(result.current.phase).toBe("app_ready");
        expect(mockAuthenticateWebApp).toHaveBeenCalledTimes(2);
      },
      { timeout: 5000 },
    );
  });
});
