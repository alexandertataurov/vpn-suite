import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCheckoutPageModel } from "./useCheckoutPageModel";
import { webappApi } from "@/api/client";
import { createWrapper } from "@/test/utils/render";

vi.mock("@/api/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/client")>();
  return {
    ...actual,
    useWebappToken: () => "fake-token",
    webappApi: {
      post: vi.fn(),
      get: vi.fn().mockResolvedValue({
        items: [{ id: "plan-basic", name: "Basic", price_amount: 5, duration_days: 30, device_limit: 1 }],
      }),
    },
  };
});
vi.mock("@/api", () => ({
  getMe: vi.fn().mockResolvedValue({ routing: { recommended_route: "/plan" } }),
  getPlans: vi.fn().mockResolvedValue({
    items: [{ id: "plan-basic", name: "Basic", price_amount: 5, duration_days: 30, device_limit: 1 }],
  }),
}));
vi.mock("@/hooks/useOnlineStatus", () => ({ useOnlineStatus: () => true }));
vi.mock("@/hooks/useHideKeyboard", () => ({ useHideKeyboard: () => ({ hide: vi.fn() }) }));
vi.mock("@/hooks/useTelegramMainButton", () => ({ useTelegramMainButton: () => {} }));
vi.mock("@/hooks/useTelegramHaptics", () => ({
  useTelegramHaptics: () => ({ impact: vi.fn(), notify: vi.fn() }),
}));
vi.mock("@/hooks/useTelemetry", () => ({ useTelemetry: () => ({ track: vi.fn() }) }));
vi.mock("@/hooks/useTrackScreen", () => ({ useTrackScreen: () => {} }));
vi.mock("@/hooks/features/usePayments", () => ({
  usePayments: () => ({ openInvoice: vi.fn() }),
}));

const mockPost = vi.mocked(webappApi.post);

describe("useCheckoutPageModel promo flow", () => {
  beforeEach(() => {
    mockPost.mockReset();
  });

  it("exposes promo state and handlers", () => {
    const { result } = renderHook(() => useCheckoutPageModel(), {
      wrapper: createWrapper({ initialEntries: ["/plan/checkout/plan-basic"] }),
    });

    expect(result.current).toHaveProperty("promoCode", "");
    expect(result.current).toHaveProperty("promoStatus");
    expect(result.current).toHaveProperty("promoErrorKey", "");
    expect(result.current).toHaveProperty("discountXtr", null);
    expect(result.current).toHaveProperty("discountedPriceXtr", null);
    expect(result.current).toHaveProperty("displayLabel", null);
    expect(typeof result.current.setPromoCode).toBe("function");
    expect(typeof result.current.applyPromo).toBe("function");
    expect(typeof result.current.handlePromoRemove).toBe("function");
  });

  it("handlePromoRemove clears promo state", () => {
    const { result } = renderHook(() => useCheckoutPageModel(), {
      wrapper: createWrapper({ initialEntries: ["/plan/checkout/plan-basic"] }),
    });

    act(() => {
      result.current.setPromoCode("1freestar");
    });
    expect(result.current.promoCode).toBe("1freestar");

    act(() => {
      result.current.handlePromoRemove();
    });

    expect(result.current.promoCode).toBe("");
    expect(result.current.promoStatus).toBe("idle");
    expect(result.current.discountXtr).toBe(null);
    expect(result.current.discountedPriceXtr).toBe(null);
    expect(result.current.displayLabel).toBe(null);
  });
});
