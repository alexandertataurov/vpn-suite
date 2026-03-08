import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useReferralAttach } from "./useReferralAttach";

const { mockPost, mockUseWebappToken } = vi.hoisted(() => ({
  mockPost: vi.fn(),
  mockUseWebappToken: vi.fn(),
}));

vi.mock("@/api/client", () => ({
  webappApi: { post: mockPost },
  useWebappToken: () => mockUseWebappToken(),
}));

vi.mock("@/hooks/telegram/useTelegramInitData", () => ({
  useTelegramInitData: () => ({ startParam: "" }),
}));

vi.mock("@/design-system", () => ({
  useToast: () => ({ addToast: vi.fn() }),
}));

describe("useReferralAttach", () => {
  beforeEach(() => {
    mockPost.mockReset();
    mockUseWebappToken.mockReturnValue(null);
    sessionStorage.clear();
  });

  it("does not call attach when token is null", async () => {
    mockUseWebappToken.mockReturnValue(null);
    sessionStorage.setItem("pending_referral_code", "123");

    renderHook(() => useReferralAttach());

    await waitFor(() => {}, { timeout: 200 });
    expect(mockPost).not.toHaveBeenCalled();
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
});
