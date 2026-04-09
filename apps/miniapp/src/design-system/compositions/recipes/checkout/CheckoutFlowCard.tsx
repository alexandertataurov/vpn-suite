import { Button, InlineAlert, Input, StickyBottomBar } from "@/design-system";
import { Stack } from "@/design-system/core/primitives";
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
  const payBusy =
    isCreatingInvoice || phase === "waiting" || phase === "creating_invoice";

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
                label={t("checkout.promo_issue_title")}
                message={t(promoErrorKey)}
              />
              <Button variant="secondary" type="button" onClick={onPromoRecovery} disabled={isValidatingPromo} fullWidth>
                {promoErrorAction === "clear"
                  ? t("checkout.promo_remove_code")
                  : t("checkout.promo_try_again")}
              </Button>
            </Stack>
          ) : null}

          {!isOnline ? (
            <InlineAlert variant="warning" label={t("common.status_offline")} message={t("checkout.offline_continue_hint")} />
          ) : null}
          <Button onClick={onContinue} disabled={!planId || !hasToken || !isOnline} fullWidth>
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
            label={t("checkout.after_payment_title")}
            message={t("checkout.after_payment_message")}
          />
          {!isOnline ? (
            <InlineAlert variant="warning" label={t("common.status_offline")} message={t("checkout.offline_payment_hint")} />
          ) : null}
          <StickyBottomBar>
            <Button
              onClick={onPay}
              disabled={!planId || !hasToken || !isOnline || payBusy}
              loading={payBusy}
              loadingText={t("checkout.pay_preparing")}
              fullWidth
            >
              {isFreePlan ? t("checkout.pay_activate_plan") : t("checkout.pay_in_telegram")}
            </Button>
          </StickyBottomBar>
        </>
      )}

      {phase === "success" ? (
        <InlineAlert
          variant="success"
          label={t("checkout.payment_success_title")}
          message={t("checkout.payment_success_message")}
        />
      ) : null}
      {phase === "waiting" || isCreatingInvoice ? (
        <InlineAlert
          variant="info"
          label={t("checkout.payment_waiting_title")}
          message={t("checkout.payment_waiting_message")}
        />
      ) : null}
      {phase === "error" || phase === "timeout" ? (
        <Stack gap="2">
          <InlineAlert
            variant="error"
            label={phase === "timeout" ? t("checkout.payment_timeout_title") : t("checkout.payment_failed_title")}
            message={phase === "timeout" ? t("checkout.payment_timeout_message") : errorMessage || t("checkout.payment_failed_message")}
          />
          <Button variant="secondary" onClick={onRetry} fullWidth>
            {t("checkout.retry")}
          </Button>
        </Stack>
      ) : null}
    </Stack>
  );
}
