import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SubscriptionCancellationModal } from "@/design-system";

vi.mock("@/hooks/useI18n", () => ({
  useI18n: () => ({
    t: (key: string, vars?: Record<string, unknown>) => {
      if (key === "settings.cancel_offer_price_title") {
        return `Keep your plan and save ${vars?.percent}% on your next renewal`;
      }

      const copy: Record<string, string> = {
        "settings.cancel_modal_title": "Cancel subscription?",
        "settings.cancel_modal_description":
          "Choose a reason first. Your access continues until the current period ends.",
        "settings.cancel_modal_keep": "Keep subscription",
        "settings.cancel_reason_label": "Reason",
        "settings.cancel_reason_price": "Too expensive",
        "settings.cancel_reason_not_needed": "Not using",
        "settings.cancel_reason_technical": "Technical issues",
        "settings.cancel_reason_other": "Other",
        "settings.cancel_pause_instead": "Pause instead",
        "settings.cancel_at_period_end": "Cancel at period end",
        "settings.cancel_now": "Cancel now",
        "settings.cancel_offer_price_eyebrow": "Stay and save",
        "settings.cancel_offer_price_body":
          "Your next renewal will be discounted if you keep your subscription active.",
        "settings.cancel_downgrade_hint": "Switch to a cheaper plan",
        "settings.cancel_other_details_label": "Tell us more",
        "settings.cancel_other_placeholder": "Details",
      };

      return copy[key] ?? key;
    },
  }),
}));

describe("SubscriptionCancellationModal", () => {
  it("disables destructive cancellation until a reason is selected", () => {
    render(
      <SubscriptionCancellationModal
        isOpen={true}
        onClose={() => undefined}
        cancelReason={null}
        offers={{
          subscription_id: "sub_123",
          status: "active",
          valid_until: "2026-03-22T00:00:00.000Z",
          discount_percent: 20,
          can_pause: true,
          can_resume: false,
          offer_pause: true,
          offer_discount: true,
          offer_downgrade: true,
          reason_group: "price",
        }}
        isCancelling={false}
        onReasonSelect={() => undefined}
        onPauseInstead={() => undefined}
        onCancelAtPeriodEnd={() => undefined}
        onCancelNow={() => undefined}
      />,
    );

    const cancelNow = screen.getByText("Cancel now").closest('[role="button"]');
    expect(cancelNow).not.toBeNull();
    expect(cancelNow).toHaveAttribute("aria-disabled", "true");
  });

  it("shows the price retention card only for the price reason", () => {
    const onReasonSelect = vi.fn();

    const { rerender } = render(
      <SubscriptionCancellationModal
        isOpen={true}
        onClose={() => undefined}
        cancelReason="price"
        offers={{
          subscription_id: "sub_123",
          status: "active",
          valid_until: "2026-03-22T00:00:00.000Z",
          discount_percent: 20,
          can_pause: true,
          can_resume: false,
          offer_pause: true,
          offer_discount: true,
          offer_downgrade: true,
          reason_group: "price",
        }}
        isCancelling={false}
        onReasonSelect={onReasonSelect}
        onPauseInstead={() => undefined}
        onCancelAtPeriodEnd={() => undefined}
        onCancelNow={() => undefined}
      />,
    );

    expect(screen.getByText(/save 20%/i)).not.toBeNull();
    fireEvent.click(screen.getByText("Technical issues"));
    expect(onReasonSelect).toHaveBeenCalledWith("technical");

    rerender(
      <SubscriptionCancellationModal
        isOpen={true}
        onClose={() => undefined}
        cancelReason="technical"
        offers={{
          subscription_id: "sub_123",
          status: "active",
          valid_until: "2026-03-22T00:00:00.000Z",
          discount_percent: 20,
          can_pause: true,
          can_resume: false,
          offer_pause: true,
          offer_discount: true,
          offer_downgrade: true,
          reason_group: "technical",
        }}
        isCancelling={false}
        onReasonSelect={onReasonSelect}
        onPauseInstead={() => undefined}
        onCancelAtPeriodEnd={() => undefined}
        onCancelNow={() => undefined}
      />,
    );

    expect(screen.queryByText(/save 20%/i)).toBeNull();
  });

  it("shows optional details when Other is selected", () => {
    const onFree = vi.fn();

    render(
      <SubscriptionCancellationModal
        isOpen={true}
        onClose={() => undefined}
        cancelReason="other"
        offers={undefined}
        isCancelling={false}
        onReasonSelect={() => undefined}
        onPauseInstead={() => undefined}
        onCancelAtPeriodEnd={() => undefined}
        onCancelNow={() => undefined}
        cancelFreeText=""
        onCancelFreeTextChange={onFree}
      />,
    );

    const field = screen.getByPlaceholderText("Details");
    fireEvent.change(field, { target: { value: "Too slow in my region" } });
    expect(onFree).toHaveBeenCalledWith("Too slow in my region");
  });
});
