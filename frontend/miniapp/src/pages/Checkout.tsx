import {
  FallbackScreen,
  Input,
  PageCardSection,
  PageFrame,
  Skeleton,
  MissionAlert,
  MissionChip,
  MissionPrimaryButton,
  MissionSecondaryButton,
  MissionSecondaryLink,
  SessionMissing,
} from "@/design-system";
import { useCheckoutPageModel } from "@/page-models";

export function CheckoutPage() {
  const model = useCheckoutPageModel();

  if (model.pageState.status === "empty") {
    return <SessionMissing />;
  }

  if (model.pageState.status === "error") {
    if (model.pageState.title === "Plan not found") {
      return (
        <PageFrame title={model.header.title} className="checkout-page">
          <PageCardSection>
            <MissionAlert
              tone="error"
              title={model.pageState.title}
              message={model.pageState.message ?? `Plan "${model.selectedPlanId}" is not available. Please choose a plan from the list.`}
            />
            <div className="btn-row">
              <MissionSecondaryLink to="/plan">Back to plan</MissionSecondaryLink>
            </div>
          </PageCardSection>
        </PageFrame>
      );
    }

    return (
      <FallbackScreen
        title={model.pageState.title ?? "Could not load plan"}
        message={model.pageState.message ?? "We could not load plan details. Please try again or go back to choose a plan."}
        onRetry={model.pageState.onRetry}
      />
    );
  }

  if (model.pageState.status === "loading") {
    return (
      <PageFrame title={model.header.title} className="checkout-page">
        <div className="module-card">
          <Skeleton className="skeleton-h-md" />
          <Skeleton className="skeleton-h-2xl" />
        </div>
      </PageFrame>
    );
  }

  const showConfirmation = model.confirmationStep;

  return (
    <PageFrame title={model.header.title} className="checkout-page">
      <PageCardSection
        title={showConfirmation ? "Confirm payment" : "Payment"}
        description={showConfirmation ? "Review and pay in Telegram." : "Activate your subscription in Telegram."}
        action={<MissionChip tone={model.paymentBadge.tone} className="section-meta-chip">{model.paymentBadge.label}</MissionChip>}
      >
        <div className="data-grid">
          <div className="data-cell">
            <div className="dc-key">Plan</div>
            <div className="dc-val">{model.planDisplayName}</div>
          </div>
          {model.planPriceStars != null ? (
            <div className="data-cell">
              <div className="dc-key">Price</div>
              <div className="dc-val teal miniapp-tnum">{model.planPriceStars}</div>
            </div>
          ) : null}
          {showConfirmation ? (
            <>
              <div className="data-cell">
                <div className="dc-key">Duration</div>
                <div className="dc-val">{model.planDurationDays} days</div>
              </div>
              <div className="data-cell">
                <div className="dc-key">Devices</div>
                <div className="dc-val">{model.planDeviceLimit} device{model.planDeviceLimit !== 1 ? "s" : ""}</div>
              </div>
              <div className="data-cell">
                <div className="dc-key">Renewal</div>
                <div className="dc-val">Auto-renew on</div>
              </div>
            </>
          ) : (
            <>
              <div className="data-cell">
                <div className="dc-key">Mode</div>
                <div className="dc-val">{model.isFreePlan ? "Activation" : "Stars payment"}</div>
              </div>
              {model.planId ? (
                <div className="data-cell">
                  <div className="dc-key">Plan ID</div>
                  <div className="dc-val dc-val--muted miniapp-tnum">{model.planId}</div>
                </div>
              ) : null}
            </>
          )}
        </div>

        {!showConfirmation ? (
          <>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                model.applyPromo();
              }}
              className="form-row"
            >
              <Input
                placeholder="Promo code"
                value={model.promoCode}
                onChange={(event) => model.setPromoCode(event.target.value)}
              />
              <MissionSecondaryButton type="submit" disabled={!model.selectedPlanId || !model.promoCode.trim() || model.isValidatingPromo}>
                {model.isValidatingPromo ? "Checking…" : "Apply"}
              </MissionSecondaryButton>
            </form>

            {model.promoPreview ? (
              <MissionAlert tone="info" title="Promo applied" message={model.promoPreview.description} />
            ) : null}
            {model.promoError ? (
              <>
                <MissionAlert tone="error" title="Promo code issue" message={model.promoError} />
                <div className="btn-row">
                  <MissionSecondaryButton type="button" onClick={model.handlePromoRecovery} disabled={model.isValidatingPromo}>
                    {model.promoErrorAction === "clear" ? "Remove code" : "Try again"}
                  </MissionSecondaryButton>
                </div>
              </>
            ) : null}

            <div className="btn-row">
              <MissionPrimaryButton
                onClick={model.handleContinue}
                disabled={!model.planId || !model.hasToken || !model.isOnline}
              >
                Continue
              </MissionPrimaryButton>
            </div>
          </>
        ) : (
          <>
            {model.promoPreview ? (
              <MissionAlert tone="info" title="Promo applied" message={model.promoPreview.description} />
            ) : null}
            <MissionAlert
              tone="info"
              title="After payment"
              message="Your first device will be issued and you'll set up the connection."
            />
            <div className="btn-row">
              <MissionSecondaryButton onClick={model.handleBack} type="button">
                Back
              </MissionSecondaryButton>
              <MissionPrimaryButton
                onClick={model.handlePay}
                disabled={!model.planId || !model.hasToken || !model.isOnline || model.phase === "waiting" || model.phase === "creating_invoice"}
              >
                {model.isCreatingInvoice ? "Preparing…" : model.isFreePlan ? "Activate plan" : "Pay with Telegram Stars"}
              </MissionPrimaryButton>
            </div>
          </>
        )}

        {model.phase === "success" ? (
          <MissionAlert tone="success" title="Payment successful" message="Your plan is active. You can return to Home or Plan." />
        ) : null}
        {model.phase === "waiting" || model.isCreatingInvoice ? (
          <MissionAlert tone="info" title="Waiting for payment" message="Complete the Stars payment in the Telegram sheet to activate your subscription." />
        ) : null}
        {model.phase === "error" || model.phase === "timeout" ? (
          <>
            <MissionAlert
              tone="error"
              title={model.phase === "timeout" ? "Payment timed out" : "Payment failed"}
              message={model.phase === "timeout"
                ? "Payment did not complete in time. Try again."
                : model.errorMessage || "We could not complete the payment. Please try again or contact support."}
            />
            <div className="btn-row">
              <MissionSecondaryButton onClick={model.handleRetry}>Try again</MissionSecondaryButton>
            </div>
          </>
        ) : null}
      </PageCardSection>
    </PageFrame>
  );
}
