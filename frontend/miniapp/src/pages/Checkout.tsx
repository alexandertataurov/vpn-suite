import { useNavigate } from "react-router-dom";
import { CheckoutFlowCard, CheckoutSummaryCard, SessionMissing } from "@/components";
import {
  FallbackScreen,
  HelperNote,
  Skeleton,
  InlineAlert,
  PageScaffold,
  ModernHeader,
  PageSection,
} from "@/design-system";
import { Stack } from "@/design-system/core/primitives";
import { useCheckoutPageModel } from "@/page-models";
import { useI18n } from "@/hooks";

export function CheckoutPage() {
  const navigate = useNavigate();
  const model = useCheckoutPageModel();
  const { t } = useI18n();

  if (model.pageState.status === "empty") {
    return <SessionMissing />;
  }

  if (model.pageState.status === "error") {
    if (model.pageState.title === "Plan not found") {
      return (
        <PageScaffold>
          <ModernHeader title={model.header.title} showSettings={false} />
          <PageSection>
            <InlineAlert
              variant="error"
              title={model.pageState.title}
              body={
                model.pageState.message ??
                t("checkout.plan_not_found_message", { planId: model.selectedPlanId ?? "" })
              }
            />
          </PageSection>
        </PageScaffold>
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
      <PageScaffold>
        <ModernHeader title={model.header.title ?? "Checkout"} showSettings={false} />
        <Stack gap="4">
          <Skeleton variant="card" height={140} />
          <Skeleton variant="card" height={220} />
        </Stack>
      </PageScaffold>
    );
  }

  const showConfirmation = model.confirmationStep;

  return (
    <PageScaffold>
      <ModernHeader
        title={model.header.title}
        subtitle={model.header.subtitle}
        showSettings={false}
        onBack={() => {
          if (model.confirmationStep) {
            model.handleBack();
          } else {
            navigate(-1);
          }
        }}
      />
      <PageSection
        title="Review and pay"
        description={showConfirmation ? "Pay in Telegram to activate access." : "Check the plan details before payment."}
      >
        <CheckoutSummaryCard
          planDisplayName={model.planDisplayName}
          showConfirmation={showConfirmation}
          planDurationDays={model.planDurationDays}
          planDeviceLimit={model.planDeviceLimit}
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
          onPay={model.handlePay}
          onRetry={model.handleRetry}
        />
        <div className="checkout-footer-note">
          <HelperNote>
            Payments and renewals are handled in Telegram. Open Devices after payment to get your config.
          </HelperNote>
        </div>
      </PageSection>
    </PageScaffold>
  );
}
