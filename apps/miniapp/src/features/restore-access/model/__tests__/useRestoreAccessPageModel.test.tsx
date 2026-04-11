import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi } from "vitest";
import { useRestoreAccessPageModel } from "../useRestoreAccessPageModel";

const mockNavigate = vi.fn();
const mockPost = vi.fn();
const mockInvalidate = vi.fn();
const mockTrack = vi.fn();

vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock("@/api/client", () => ({
  useWebappToken: () => "token",
  webappApi: {
    post: (...args: unknown[]) => mockPost(...args),
  },
}));

vi.mock("@/hooks/useSession", () => ({
  useSession: () => ({
    data: {
      user: { id: 1 },
      subscriptions: [
        {
          id: "sub-expired",
          plan_id: "plan-basic",
          access_status: "grace",
          subscription_status: "expired",
        },
      ],
    },
    isLoading: false,
  }),
}));

vi.mock("@/hooks/useTelemetry", () => ({
  useTelemetry: () => ({ track: (...args: unknown[]) => mockTrack(...args) }),
}));

vi.mock("@/lib/query-keys/webapp.query-keys", () => ({
  webappQueryKeys: {
    me: () => ["me"],
  },
}));

vi.mock("../helpers", () => ({
  getPrimarySubscription: (session: { subscriptions: Array<{ plan_id: string }> }) =>
    session.subscriptions[0],
}));

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient();
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe("useRestoreAccessPageModel", () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    mockPost.mockReset();
    mockTrack.mockReset();
    mockInvalidate.mockReset();
  });

  it("tracks restore_access_started and success and navigates on success", async () => {
    mockPost.mockResolvedValue({
      status: "ok",
      plan_id: "plan-basic",
      redirect_to: "/plan/checkout/plan-basic",
    });
    const { result } = renderHook(() => useRestoreAccessPageModel(), { wrapper });

    await act(async () => {
      result.current.restoreAccess();
    });

    expect(mockTrack).toHaveBeenCalledWith("restore_access_started", expect.objectContaining({
      screen_name: "restore-access",
      plan_id: "plan-basic",
    }));

    expect(mockTrack).toHaveBeenCalledWith("restore_access_succeeded", expect.objectContaining({
      screen_name: "restore-access",
      plan_id: "plan-basic",
      redirect_to: "/plan/checkout/plan-basic",
    }));
    expect(mockNavigate).toHaveBeenCalledWith("/plan/checkout/plan-basic", { replace: true });
  });

  it("tracks restore_access_failed on error", async () => {
    const error = Object.assign(new Error("boom"), { code: "HTTP_ERROR" });
    mockPost.mockRejectedValue(error);
    const { result } = renderHook(() => useRestoreAccessPageModel(), { wrapper });

    await act(async () => {
      result.current.restoreAccess();
    });

    expect(mockTrack).toHaveBeenCalledWith("restore_access_failed", expect.objectContaining({
      screen_name: "restore-access",
      error_code: "HTTP_ERROR",
      reason: "boom",
    }));
  });
});

