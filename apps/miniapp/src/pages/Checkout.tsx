import { useNavigate } from "react-router-dom";
import { SessionMissing } from "@/components";
import {
  CheckoutFlowCard,
  CheckoutSummaryCard,
  HelperNote,
  InlineAlert,
  PageHeader,
  PageLayout,
  PageScaffold,
  PageSection,
  Skeleton,
  Stack,
} from "@/design-system";
import { FallbackScreen } from "@/design-system/patterns/FallbackScreen";
import { useCheckoutPageModel } from "@/page-models";
import { useI18n } from "@/hooks/useI18n";

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
          <PageLayout scrollable={false}>
            <PageHeader
              title={model.header.title}
              subtitle={model.header.subtitle}
              onBack={() => navigate(-1)}
              backAriaLabel={t("common.back_aria")}
            />
            <PageSection>
              <InlineAlert
                variant="error"
                label={model.pageState.title}
                message={
                  model.pageState.message ??
                  t("checkout.plan_not_found_message", { planId: model.selectedPlanId ?? "" })
                }
              />
            </PageSection>
          </PageLayout>
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
        <PageLayout scrollable={false}>
          <PageHeader
            title={model.header.title ?? t("checkout.loading_title")}
            subtitle={model.header.subtitle}
            onBack={() => navigate(-1)}
            backAriaLabel={t("common.back_aria")}
          />
          <Stack gap="4">
            <Skeleton variant="card" height={140} />
            <Skeleton variant="card" height={220} />
          </Stack>
        </PageLayout>
      </PageScaffold>
    );
  }

  const showConfirmation = model.confirmationStep;

  return (
    <PageScaffold>
      <PageLayout scrollable={false}>
        <PageHeader
          title={model.header.title}
          subtitle={model.header.subtitle}
          backAriaLabel={t("common.back_aria")}
          onBack={() => {
            if (model.confirmationStep) {
              model.handleBack();
            } else {
              navigate(-1);
            }
          }}
        />
        <PageSection
          title={t("checkout.section_title_review_pay")}
          description={
            showConfirmation
              ? t("checkout.section_desc_pay_telegram")
              : t("checkout.section_desc_before_payment")
          }
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
            <HelperNote>{t("checkout.footer_note")}</HelperNote>
          </div>
        </PageSection>
      </PageLayout>
    </PageScaffold>
  );
}
