import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useSession } from "./useSession";
import { webappApi } from "@/api/client";
import { createWrapper } from "@/test/utils/render";
import { webappMeCompleted } from "@/test/fixtures/session";

vi.mock("@/api/client", () => ({
  webappApi: { get: vi.fn() },
}));

const mockGet = vi.mocked(webappApi.get);

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

  it("returns error when enabled and request fails", async () => {
    mockGet.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useSession(true), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.data).toBeUndefined();
  });

  it("returns data when enabled and request succeeds", async () => {
    mockGet.mockResolvedValue(webappMeCompleted);

    const { result } = renderHook(() => useSession(true), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(webappMeCompleted);
    expect(mockGet).toHaveBeenCalledWith("/webapp/me");
  });
});
