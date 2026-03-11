import { CheckoutFlowCard, CheckoutSummaryCard, SessionMissing } from "@/components";
import {
  FallbackScreen,
  PageCardSection,
  PageFrame,
  Skeleton,
  MissionAlert,
  MissionChip,
} from "@/design-system";
import { useCheckoutPageModel } from "@/page-models";
import { useI18n } from "@/hooks/useI18n";

export function CheckoutPage() {
  const model = useCheckoutPageModel();
  const { t } = useI18n();

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
              message={
                model.pageState.message ??
                t("checkout.plan_not_found_message", { planId: model.selectedPlanId ?? "" })
              }
            />
          </PageCardSection>
        </PageFrame>
      );
    }

    return (
      <FallbackScreen
        title={model.pageState.title ?? t("common.could_not_load_plan")}
        message={model.pageState.message ?? t("checkout.could_not_load_plan_message")}
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
    <PageFrame title={model.header.title} subtitle={model.header.subtitle} className="checkout-page">
      <PageCardSection
        title={
          showConfirmation ? t("checkout.section_title_confirm") : t("checkout.section_title_review")
        }
        description={
          showConfirmation ? t("checkout.section_desc_confirm") : t("checkout.section_desc_review")
        }
        action={<MissionChip tone={model.paymentBadge.tone} className="section-meta-chip">{model.paymentBadge.label}</MissionChip>}
      >
        <CheckoutSummaryCard
          planDisplayName={model.planDisplayName}
          planPriceStars={model.planPriceStars}
          promoStatus={model.promoStatus}
          discountedPriceXtr={model.discountedPriceXtr}
          showConfirmation={showConfirmation}
          planDurationDays={model.planDurationDays}
          planDeviceLimit={model.planDeviceLimit}
          isFreePlan={model.isFreePlan}
        />

        <CheckoutFlowCard
          showConfirmation={showConfirmation}
          selectedPlanId={model.selectedPlanId}
          promoCode={model.promoCode}
          promoStatus={model.promoStatus}
          promoErrorKey={model.promoErrorKey}
          promoErrorAction={model.promoErrorAction}
          displayLabel={model.displayLabel}
          isValidatingPromo={model.isValidatingPromo}
          isCreatingInvoice={model.isCreatingInvoice}
          isFreePlan={model.isFreePlan}
          hasToken={model.hasToken}
          isOnline={model.isOnline}
          planId={model.planId}
          phase={model.phase}
          errorMessage={model.errorMessage}
          onPromoCodeChange={model.setPromoCode}
          onApplyPromo={model.applyPromo}
          onPromoRemove={model.handlePromoRemove}
          onPromoRecovery={model.handlePromoRecovery}
          onContinue={model.handleContinue}
          onBack={model.handleBack}
          onPay={model.handlePay}
          onRetry={model.handleRetry}
        />
      </PageCardSection>
    </PageFrame>
  );
}
