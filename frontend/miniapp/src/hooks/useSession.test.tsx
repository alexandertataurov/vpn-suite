import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useSession } from "./useSession";
import { webappApi } from "@/api/client";

vi.mock("@/api/client", () => ({
  webappApi: { get: vi.fn() },
}));

const mockGet = vi.mocked(webappApi.get);

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

describe("useSession", () => {
  beforeEach(() => {
    mockGet.mockReset();
  });

  it("does not run query when enabled is false", async () => {
    const { result } = renderHook(() => useSession(false), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
    expect(mockGet).not.toHaveBeenCalled();
  });

  it("returns data when enabled and request succeeds", async () => {
    const mockData = {
      user: { id: 1, tg_id: 100 },
      subscriptions: [],
      devices: [],
      onboarding: { completed: true, step: 1, version: 1, updated_at: null },
    };
    mockGet.mockResolvedValue(mockData);

    const { result } = renderHook(() => useSession(true), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockData);
    expect(mockGet).toHaveBeenCalledWith("/webapp/me");
  });
});
