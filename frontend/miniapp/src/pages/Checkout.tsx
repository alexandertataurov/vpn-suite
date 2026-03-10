import { SessionMissing } from "@/components";
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
  ButtonRow,
  StickyBottomBar,
  PageHeaderBadge,
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
        <div className="data-grid">
          <div className="data-cell">
            <div className="dc-key">{t("checkout.grid_key_plan")}</div>
            <div className="dc-val">{model.planDisplayName}</div>
          </div>
          {model.planPriceStars != null ? (
            <div className="data-cell">
              <div className="dc-key">{t("checkout.grid_key_price")}</div>
              <div className="dc-val teal miniapp-tnum">
                {model.promoStatus === "valid" && model.discountedPriceXtr != null ? (
                  <span className="price-summary">
                    <span className="price-original">{model.planPriceStars}</span>
                    <span className="price-discounted">⭐{model.discountedPriceXtr}</span>
                  </span>
                ) : (
                  model.planPriceStars
                )}
              </div>
            </div>
          ) : null}
          {showConfirmation ? (
            <>
              <div className="data-cell">
                <div className="dc-key">{t("checkout.grid_key_duration")}</div>
                <div className="dc-val">
                  {t("checkout.duration_days", { days: model.planDurationDays ?? 0 })}
                </div>
              </div>
              <div className="data-cell">
                <div className="dc-key">{t("checkout.grid_key_devices")}</div>
                <div className="dc-val">
                  {model.planDeviceLimit}{" "}
                  {model.planDeviceLimit !== 1
                    ? t("devices.section_devices_title").toLowerCase()
                    : t("devices.summary_eyebrow").toLowerCase()}
                </div>
              </div>
              <div className="data-cell">
                <div className="dc-key">{t("checkout.grid_key_renewal")}</div>
                <div className="dc-val">{t("plan.renewal_strip_title")}</div>
              </div>
            </>
          ) : (
            <>
              <div className="data-cell">
                <div className="dc-key">{t("checkout.grid_key_mode")}</div>
                <div className="dc-val">
                  {model.isFreePlan
                    ? t("checkout.mode_activation")
                    : t("checkout.mode_stars_payment")}
                </div>
              </div>
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
                placeholder={t("checkout.promo_input_placeholder")}
                value={model.promoCode}
                onChange={(event) => model.setPromoCode(event.target.value)}
              />
              <MissionSecondaryButton type="submit" disabled={!model.selectedPlanId || !model.promoCode.trim() || model.isValidatingPromo}>
                {model.isValidatingPromo ? t("checkout.promo_checking") : t("checkout.promo_apply")}
              </MissionSecondaryButton>
            </form>

            {model.promoStatus === "valid" && model.displayLabel ? (
              <div className="promo-feedback promo-feedback--valid">
                <PageHeaderBadge tone="success" label={model.displayLabel} />
                <MissionSecondaryButton type="button" onClick={model.handlePromoRemove} disabled={model.isValidatingPromo}>
                  {t("checkout.promo_remove")}
                </MissionSecondaryButton>
              </div>
            ) : null}
            {model.promoStatus === "invalid" && model.promoErrorKey ? (
              <>
                <MissionAlert
                  tone="error"
                  title={t("checkout.promo_issue_title")}
                  message={t(model.promoErrorKey)}
                />
                <ButtonRow>
                  <MissionSecondaryButton type="button" onClick={model.handlePromoRecovery} disabled={model.isValidatingPromo}>
                    {model.promoErrorAction === "clear"
                      ? t("checkout.promo_remove_code")
                      : t("checkout.promo_try_again")}
                  </MissionSecondaryButton>
                </ButtonRow>
              </>
            ) : null}

            <ButtonRow>
              <MissionPrimaryButton
                onClick={model.handleContinue}
                disabled={!model.planId || !model.hasToken || !model.isOnline}
              >
                {t("checkout.continue_to_payment")}
              </MissionPrimaryButton>
            </ButtonRow>
          </>
        ) : (
          <>
            {model.promoStatus === "valid" && model.displayLabel ? (
              <div className="promo-feedback promo-feedback--valid">
                <PageHeaderBadge tone="success" label={model.displayLabel} />
                <MissionSecondaryButton type="button" onClick={model.handlePromoRemove} disabled={model.isValidatingPromo}>
                  {t("checkout.promo_remove")}
                </MissionSecondaryButton>
              </div>
            ) : null}
            <MissionAlert
              tone="info"
              title={t("checkout.after_payment_title")}
              message={t("checkout.after_payment_message")}
            />
            <StickyBottomBar>
              <ButtonRow>
                <MissionSecondaryButton onClick={model.handleBack} type="button">
                  {t("checkout.back")}
                </MissionSecondaryButton>
                <MissionPrimaryButton
                  onClick={model.handlePay}
                  disabled={!model.planId || !model.hasToken || !model.isOnline || model.phase === "waiting" || model.phase === "creating_invoice"}
                >
                  {model.isCreatingInvoice
                    ? t("checkout.pay_preparing")
                    : model.isFreePlan
                      ? t("checkout.pay_activate_plan")
                      : t("checkout.pay_with_stars")}
                </MissionPrimaryButton>
              </ButtonRow>
            </StickyBottomBar>
          </>
        )}

        {model.phase === "success" ? (
          <MissionAlert
            tone="success"
            title={t("checkout.payment_success_title")}
            message={t("checkout.payment_success_message")}
          />
        ) : null}
        {model.phase === "waiting" || model.isCreatingInvoice ? (
          <MissionAlert
            tone="info"
            title={t("checkout.payment_waiting_title")}
            message={t("checkout.payment_waiting_message")}
          />
        ) : null}
        {model.phase === "error" || model.phase === "timeout" ? (
          <>
            <MissionAlert
              tone="error"
              title={
                model.phase === "timeout"
                  ? t("checkout.payment_timeout_title")
                  : t("checkout.payment_failed_title")
              }
              message={
                model.phase === "timeout"
                  ? t("checkout.payment_timeout_message")
                  : model.errorMessage || t("checkout.payment_failed_message")
              }
            />
            <ButtonRow>
              <MissionSecondaryButton onClick={model.handleRetry}>
                {t("checkout.retry")}
              </MissionSecondaryButton>
            </ButtonRow>
          </>
        ) : null}
      </PageCardSection>
    </PageFrame>
  );
}
