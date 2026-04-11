import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useReferralAttach } from "../features/referral";

const { mockPost, mockUseWebappToken, mockAddToast } = vi.hoisted(() => ({
  mockPost: vi.fn(),
  mockUseWebappToken: vi.fn(),
  mockAddToast: vi.fn(),
}));

vi.mock("@/api/client", () => ({
  webappApi: { post: mockPost },
  useWebappToken: () => mockUseWebappToken(),
}));

vi.mock("@/hooks/telegram/useTelegramInitData", () => ({
  useTelegramInitData: () => ({ startParam: "" }),
}));

vi.mock("@/design-system", () => ({
  useToast: () => ({ addToast: mockAddToast }),
}));

describe("useReferralAttach", () => {
  beforeEach(() => {
    mockPost.mockReset();
    mockUseWebappToken.mockReturnValue(null);
    mockAddToast.mockClear();
    sessionStorage.clear();
  });

  it("does not call attach when token is null", async () => {
    mockUseWebappToken.mockReturnValue(null);
    sessionStorage.setItem("pending_referral_code", "123");

    renderHook(() => useReferralAttach());

    await waitFor(
      () => expect(mockPost).not.toHaveBeenCalled(),
      { timeout: 300 },
    );
  });

  it("calls attach once when token and pending ref exist, clears on success", async () => {
    mockUseWebappToken.mockReturnValue("token123");
    sessionStorage.setItem("pending_referral_code", "123");
    sessionStorage.setItem("pending_referral_source", "query");

    mockPost.mockResolvedValue({ status: "attached", referrer_user_id: 1 });

    renderHook(() => useReferralAttach());

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledTimes(1);
    });
    expect(mockPost).toHaveBeenCalledWith("/webapp/referral/attach", { ref: "123" });
    await waitFor(() => {
      expect(sessionStorage.getItem("pending_referral_code")).toBeNull();
    });
  });

  it("shows toast on 4xx error", async () => {
    const { ApiError } = await import("@vpn-suite/shared");
    mockUseWebappToken.mockReturnValue("token");
    sessionStorage.setItem("pending_referral_code", "123");
    sessionStorage.setItem("pending_referral_source", "query");
    mockPost.mockRejectedValue(new ApiError("HTTP_ERROR", "Bad request", 400));

    renderHook(() => useReferralAttach());

    await waitFor(() => {
      expect(mockAddToast).toHaveBeenCalledWith(
        expect.stringContaining("Referral link could not be applied"),
        "error",
      );
    });
  });

  it("retries once on 5xx then shows toast on second failure", async () => {
    const { ApiError } = await import("@vpn-suite/shared");
    mockUseWebappToken.mockReturnValue("token");
    sessionStorage.setItem("pending_referral_code", "123");
    sessionStorage.setItem("pending_referral_source", "query");
    mockPost
      .mockRejectedValueOnce(new ApiError("HTTP_ERROR", "Server error", 500))
      .mockRejectedValueOnce(new ApiError("HTTP_ERROR", "Server error", 502));

    renderHook(() => useReferralAttach());

    await waitFor(() => expect(mockPost).toHaveBeenCalledTimes(1));

    await new Promise((r) => setTimeout(r, 1600));

    await waitFor(
      () => {
        expect(mockPost).toHaveBeenCalledTimes(2);
        expect(mockAddToast).toHaveBeenCalledWith(
          expect.stringContaining("Referral link could not be applied"),
          "error",
        );
      },
      { timeout: 3000 },
    );
  });
});
