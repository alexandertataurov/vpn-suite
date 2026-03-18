import { Button, Input, InlineAlert, StickyBottomBar } from "@/design-system";
import { Stack } from "@/design-system/core/primitives";
import { useI18n } from "@/hooks";

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
    <div className="promo-feedback promo-feedback--valid" data-state="valid">
      <span className="promo-feedback__label">{displayLabel}</span>
      <Button variant="secondary" size="sm" type="button" onClick={onPromoRemove} disabled={isValidatingPromo}>
        {t("checkout.promo_remove")}
      </Button>
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
  onPay,
  onRetry,
}: CheckoutFlowCardProps) {
  const { t } = useI18n();

  return (
    <Stack gap="4">
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
              label={t("checkout.promo_label")}
              description={t("checkout.promo_optional")}
              placeholder={t("checkout.promo_input_placeholder")}
              value={promoCode}
              success={promoStatus === "valid" && displayLabel ? displayLabel : undefined}
              error={promoStatus === "invalid" && promoErrorKey ? t(promoErrorKey) : undefined}
              onChange={(event) => onPromoCodeChange(event.target.value)}
            />
            <Button
              variant="secondary"
              type="submit"
              disabled={!selectedPlanId || !promoCode.trim() || isValidatingPromo}
            >
              {isValidatingPromo ? t("checkout.promo_checking") : t("checkout.promo_apply")}
            </Button>
          </form>

          {promoStatus === "valid" && displayLabel ? (
            <PromoFeedback
              displayLabel={displayLabel}
              isValidatingPromo={isValidatingPromo}
              onPromoRemove={onPromoRemove}
            />
          ) : null}
          {promoStatus === "invalid" && promoErrorKey ? (
            <Stack gap="2">
              <InlineAlert
                variant="error"
                title={t("checkout.promo_issue_title")}
                body={t(promoErrorKey)}
              />
              <Button variant="secondary" type="button" onClick={onPromoRecovery} disabled={isValidatingPromo} fullWidth>
                {promoErrorAction === "clear"
                  ? t("checkout.promo_remove_code")
                  : t("checkout.promo_try_again")}
              </Button>
            </Stack>
          ) : null}

          <Button
            onClick={onContinue}
            disabled={!planId || !hasToken || !isOnline}
            fullWidth
          >
            {t("checkout.continue_to_payment")}
          </Button>
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
          <InlineAlert
            variant="info"
            title={t("checkout.after_payment_title")}
            body={t("checkout.after_payment_message")}
          />
          <StickyBottomBar>
            <Button
                onClick={onPay}
                disabled={!planId || !hasToken || !isOnline || phase === "waiting" || phase === "creating_invoice"}
                fullWidth
              >
                {isCreatingInvoice
                  ? t("checkout.pay_preparing")
                  : isFreePlan
                  ? t("checkout.pay_activate_plan")
                  : t("checkout.pay_in_telegram")}
              </Button>
          </StickyBottomBar>
        </>
      )}

      {phase === "success" ? (
        <InlineAlert
          variant="success"
          title={t("checkout.payment_success_title")}
          body={t("checkout.payment_success_message")}
        />
      ) : null}
      {phase === "waiting" || isCreatingInvoice ? (
        <InlineAlert
          variant="info"
          title={t("checkout.payment_waiting_title")}
          body={t("checkout.payment_waiting_message")}
        />
      ) : null}
      {phase === "error" || phase === "timeout" ? (
        <Stack gap="2">
          <InlineAlert
            variant="error"
            title={
              phase === "timeout"
                ? t("checkout.payment_timeout_title")
                : t("checkout.payment_failed_title")
            }
            body={
              phase === "timeout"
                ? t("checkout.payment_timeout_message")
                : errorMessage || t("checkout.payment_failed_message")
            }
          />
          <Button variant="secondary" onClick={onRetry} fullWidth>
            {t("checkout.retry")}
          </Button>
        </Stack>
      ) : null}
    </Stack>
  );
}
