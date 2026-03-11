import type { WebAppSubscriptionOffersResponse } from "@vpn-suite/shared";
import { Button, Modal } from "@/design-system";
import { useI18n } from "@/hooks/useI18n";
import type { CancelReasonGroup, CancelReasonSelection } from "@/page-models";

export interface SubscriptionCancellationModalProps {
  open: boolean;
  onClose: () => void;
  cancelReason: CancelReasonSelection;
  offers: WebAppSubscriptionOffersResponse | undefined;
  isCancelling?: boolean;
  onReasonSelect: (reason: CancelReasonGroup) => void;
  onPauseInstead: () => void;
  onCancelAtPeriodEnd: () => void;
  onCancelNow: () => void;
}

const CANCEL_REASON_OPTIONS: CancelReasonGroup[] = [
  "price",
  "not_needed",
  "technical",
  "other",
];

export function SubscriptionCancellationModal({
  open,
  onClose,
  cancelReason,
  offers,
  isCancelling = false,
  onReasonSelect,
  onPauseInstead,
  onCancelAtPeriodEnd,
  onCancelNow,
}: SubscriptionCancellationModalProps) {
  const { t } = useI18n();
  const hasDiscountOffer = Boolean(offers?.offer_discount) || (offers?.discount_percent ?? 0) > 0;
  const canPauseInstead = Boolean(offers?.offer_pause ?? offers?.can_pause);
  const hasSelectedReason = cancelReason !== null;

  const retentionContent = (() => {
    switch (cancelReason) {
      case "price":
        return hasDiscountOffer && (offers?.discount_percent ?? 0) > 0 ? (
          <div className="cancel-retention-card" data-reason="price">
            <div className="cancel-retention-card__eyebrow">{t("settings.cancel_offer_price_eyebrow")}</div>
            <div className="cancel-retention-card__title">
              {t("settings.cancel_offer_price_title", { percent: offers?.discount_percent ?? 0 })}
            </div>
            <p className="cancel-retention-card__body">{t("settings.cancel_offer_price_body")}</p>
            <button
              type="button"
              className="cancel-retention-card__cta"
              onClick={onClose}
              disabled={isCancelling}
            >
              {t("settings.cancel_modal_keep")}
            </button>
          </div>
        ) : null;
      case "not_needed":
        return canPauseInstead ? (
          <div className="cancel-retention-card" data-reason="not_needed">
            <div className="cancel-retention-card__eyebrow">{t("settings.cancel_offer_pause_eyebrow")}</div>
            <div className="cancel-retention-card__title">{t("settings.cancel_offer_pause_title")}</div>
            <p className="cancel-retention-card__body">{t("settings.cancel_offer_pause_body")}</p>
          </div>
        ) : null;
      case "technical":
        return (
          <div className="cancel-retention-card" data-reason="technical">
            <div className="cancel-retention-card__eyebrow">{t("settings.cancel_offer_support_eyebrow")}</div>
            <div className="cancel-retention-card__title">{t("settings.cancel_offer_support_title")}</div>
            <p className="cancel-retention-card__body">{t("settings.cancel_offer_support_body")}</p>
          </div>
        );
      default:
        return null;
    }
  })();

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("settings.cancel_modal_title")}
      description={t("settings.cancel_modal_description")}
      className="subscription-cancellation-modal"
    >
      <div className="cancel-flow-body">
        <div className="field-group">
          <div className="field-label">{t("settings.cancel_reason_label")}</div>
          <div
            className="seg-toggle cancel-reason-selector"
            role="tablist"
            aria-label={t("settings.cancel_reason_label")}
            data-selected={hasSelectedReason ? "true" : undefined}
          >
            {CANCEL_REASON_OPTIONS.map((optionId) => (
              <button
                key={optionId}
                type="button"
                className={`seg-btn cancel-reason-tab ${cancelReason === optionId ? "on" : ""}`}
                onClick={() => onReasonSelect(optionId)}
                role="tab"
                aria-selected={cancelReason === optionId}
              >
                {t(`settings.cancel_reason_${optionId}`)}
              </button>
            ))}
          </div>
        </div>
        {retentionContent}
        {offers?.offer_downgrade && cancelReason === "price" ? (
          <p className="modal-message type-body-sm cancel-flow-hint">{t("settings.cancel_downgrade_hint")}</p>
        ) : null}
        <div className="cancel-flow-actions">
          <Button
            variant="primary"
            fullWidth
            className="cancel-flow-action cancel-flow-action--safe"
            onClick={onClose}
            disabled={isCancelling}
          >
            {t("settings.cancel_modal_keep")}
          </Button>
          {canPauseInstead ? (
            <Button
              variant="outline"
              fullWidth
              className="cancel-flow-action"
              onClick={onPauseInstead}
              disabled={isCancelling}
            >
              {isCancelling ? "…" : t("settings.cancel_pause_instead")}
            </Button>
          ) : null}
          <Button
            variant="ghost"
            fullWidth
            className="cancel-flow-action cancel-flow-action--ghost"
            onClick={onCancelAtPeriodEnd}
            disabled={isCancelling}
          >
            {isCancelling ? "…" : t("settings.cancel_at_period_end")}
          </Button>
          <Button
            variant="link"
            fullWidth
            className="cancel-flow-action cancel-flow-action--danger-link"
            onClick={onCancelNow}
            disabled={isCancelling || !hasSelectedReason}
          >
            {isCancelling ? "…" : t("settings.cancel_now")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
