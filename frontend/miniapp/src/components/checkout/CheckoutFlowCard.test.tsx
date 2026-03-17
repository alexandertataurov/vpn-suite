import type { ComponentProps } from "react";
import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CheckoutFlowCard } from "./CheckoutFlowCard";
import { renderWithProviders } from "@/test/utils/render";

function renderCard(overrides: Partial<ComponentProps<typeof CheckoutFlowCard>> = {}) {
  return renderWithProviders(
    <CheckoutFlowCard
      showConfirmation={false}
      selectedPlanId="plan-basic"
      promoCode=""
      promoStatus="idle"
      promoErrorKey=""
      promoErrorAction="retry"
      displayLabel={null}
      isValidatingPromo={false}
      isCreatingInvoice={false}
      isFreePlan={false}
      hasToken
      isOnline
      planId="plan-basic"
      phase="idle"
      errorMessage=""
      onPromoCodeChange={vi.fn()}
      onApplyPromo={vi.fn()}
      onPromoRemove={vi.fn()}
      onPromoRecovery={vi.fn()}
      onContinue={vi.fn()}
      onBack={vi.fn()}
      onPay={vi.fn()}
      onRetry={vi.fn()}
      {...overrides}
    />,
  );
}

describe("CheckoutFlowCard", () => {
  it("keeps promo apply disabled until the user enters a code", () => {
    renderCard();

    expect(screen.getByLabelText("Promo code")).toBeInTheDocument();
    expect(screen.getAllByText("Apply code")[0]?.closest("button")).toBeDisabled();
  });

  it("shows the confirm-step CTA hierarchy", () => {
    renderCard({ showConfirmation: true });

    expect(screen.getByText("Pay in Telegram")).toBeInTheDocument();
  });
});
