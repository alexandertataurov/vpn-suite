import { ButtonRow, Input, MissionAlert, MissionPrimaryButton, MissionSecondaryButton, PageHeaderBadge, StickyBottomBar } from "@/design-system";
import { useI18n } from "@/hooks/useI18n";

export interface CheckoutFlowCardProps {
  showConfirmation: boolean;
  selectedPlanId: string;
  promoCode: string;
  promoStatus: "idle" | "validating" | "valid" | "invalid";
  promoErrorKey: string;
  promoErrorAction: "clear" | "retry";
  displayLabel: string | null;
  isValidatingPromo: boolean;
  isCreatingInvoice: boolean;
  isFreePlan: boolean;
  hasToken: boolean;
  isOnline: boolean;
  planId?: string;
  phase: "idle" | "creating_invoice" | "waiting" | "success" | "error" | "timeout";
  errorMessage: string;
  onPromoCodeChange: (value: string) => void;
  onApplyPromo: () => void;
  onPromoRemove: () => void;
  onPromoRecovery: () => void;
  onContinue: () => void;
  onBack: () => void;
  onPay: () => void;
  onRetry: () => void;
}

function PromoFeedback({
  displayLabel,
  isValidatingPromo,
  onPromoRemove,
}: {
  displayLabel: string;
  isValidatingPromo: boolean;
  onPromoRemove: () => void;
}) {
  const { t } = useI18n();

  return (
    <div className="promo-feedback promo-feedback--valid">
      <PageHeaderBadge tone="success" label={displayLabel} />
      <MissionSecondaryButton type="button" onClick={onPromoRemove} disabled={isValidatingPromo}>
        {t("checkout.promo_remove")}
      </MissionSecondaryButton>
    </div>
  );
}

export function CheckoutFlowCard({
  showConfirmation,
  selectedPlanId,
  promoCode,
  promoStatus,
  promoErrorKey,
  promoErrorAction,
  displayLabel,
  isValidatingPromo,
  isCreatingInvoice,
  isFreePlan,
  hasToken,
  isOnline,
  planId,
  phase,
  errorMessage,
  onPromoCodeChange,
  onApplyPromo,
  onPromoRemove,
  onPromoRecovery,
  onContinue,
  onBack,
  onPay,
  onRetry,
}: CheckoutFlowCardProps) {
  const { t } = useI18n();

  return (
    <>
      {!showConfirmation ? (
        <>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              onApplyPromo();
            }}
            className="form-row"
          >
            <Input
              placeholder={t("checkout.promo_input_placeholder")}
              value={promoCode}
              onChange={(event) => onPromoCodeChange(event.target.value)}
            />
            <MissionSecondaryButton
              type="submit"
              disabled={!selectedPlanId || !promoCode.trim() || isValidatingPromo}
            >
              {isValidatingPromo ? t("checkout.promo_checking") : t("checkout.promo_apply")}
            </MissionSecondaryButton>
          </form>

          {promoStatus === "valid" && displayLabel ? (
            <PromoFeedback
              displayLabel={displayLabel}
              isValidatingPromo={isValidatingPromo}
              onPromoRemove={onPromoRemove}
            />
          ) : null}
          {promoStatus === "invalid" && promoErrorKey ? (
            <>
              <MissionAlert
                tone="error"
                title={t("checkout.promo_issue_title")}
                message={t(promoErrorKey)}
              />
              <ButtonRow>
                <MissionSecondaryButton type="button" onClick={onPromoRecovery} disabled={isValidatingPromo}>
                  {promoErrorAction === "clear"
                    ? t("checkout.promo_remove_code")
                    : t("checkout.promo_try_again")}
                </MissionSecondaryButton>
              </ButtonRow>
            </>
          ) : null}

          <ButtonRow>
            <MissionPrimaryButton
              onClick={onContinue}
              disabled={!planId || !hasToken || !isOnline}
            >
              {t("checkout.continue_to_payment")}
            </MissionPrimaryButton>
          </ButtonRow>
        </>
      ) : (
        <>
          {promoStatus === "valid" && displayLabel ? (
            <PromoFeedback
              displayLabel={displayLabel}
              isValidatingPromo={isValidatingPromo}
              onPromoRemove={onPromoRemove}
            />
          ) : null}
          <MissionAlert
            tone="info"
            title={t("checkout.after_payment_title")}
            message={t("checkout.after_payment_message")}
          />
          <StickyBottomBar>
            <ButtonRow>
              <MissionSecondaryButton onClick={onBack} type="button">
                {t("checkout.back")}
              </MissionSecondaryButton>
              <MissionPrimaryButton
                onClick={onPay}
                disabled={!planId || !hasToken || !isOnline || phase === "waiting" || phase === "creating_invoice"}
              >
                {isCreatingInvoice
                  ? t("checkout.pay_preparing")
                  : isFreePlan
                    ? t("checkout.pay_activate_plan")
                    : t("checkout.pay_with_stars")}
              </MissionPrimaryButton>
            </ButtonRow>
          </StickyBottomBar>
        </>
      )}

      {phase === "success" ? (
        <MissionAlert
          tone="success"
          title={t("checkout.payment_success_title")}
          message={t("checkout.payment_success_message")}
        />
      ) : null}
      {phase === "waiting" || isCreatingInvoice ? (
        <MissionAlert
          tone="info"
          title={t("checkout.payment_waiting_title")}
          message={t("checkout.payment_waiting_message")}
        />
      ) : null}
      {phase === "error" || phase === "timeout" ? (
        <>
          <MissionAlert
            tone="error"
            title={
              phase === "timeout"
                ? t("checkout.payment_timeout_title")
                : t("checkout.payment_failed_title")
            }
            message={
              phase === "timeout"
                ? t("checkout.payment_timeout_message")
                : errorMessage || t("checkout.payment_failed_message")
            }
          />
          <ButtonRow>
            <MissionSecondaryButton onClick={onRetry}>
              {t("checkout.retry")}
            </MissionSecondaryButton>
          </ButtonRow>
        </>
      ) : null}
    </>
  );
}
