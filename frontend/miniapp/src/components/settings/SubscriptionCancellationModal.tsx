import type { WebAppSubscriptionOffersResponse } from "@vpn-suite/shared";
import { IconAlertTriangle, IconClock, IconPause } from "@/design-system/icons";
import { Button, HelperNote, ListCard, ListRow, Modal } from "@/design-system";
import { useI18n } from "@/hooks";
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
      footer={(
        <>
          <Button type="button" variant="ghost" onClick={onClose} disabled={isCancelling}>
            {t("common.cancel")}
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={onClose}
            disabled={isCancelling}
            status={isCancelling ? "loading" : "idle"}
            statusText={t("settings.cancel_modal_keep")}
          >
            {t("settings.cancel_modal_keep")}
          </Button>
        </>
      )}
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
          <HelperNote>{t("settings.cancel_downgrade_hint")}</HelperNote>
        ) : null}

        <ListCard className="settings-list-card cancel-flow-actions-card">
          {canPauseInstead ? (
            <ListRow
              icon={<IconPause size={15} strokeWidth={2} />}
              iconTone="neutral"
              title={t("settings.cancel_pause_instead")}
              subtitle={t("settings.cancel_offer_pause_body")}
              onClick={() => !(isCancelling || !hasSelectedReason) && onPauseInstead()}
              aria-disabled={isCancelling || !hasSelectedReason}
            />
          ) : null}
          <ListRow
            icon={<IconClock size={15} strokeWidth={2} />}
            iconTone="neutral"
            title={t("settings.cancel_at_period_end")}
            subtitle={t("settings.cancel_plan_description_generic")}
            onClick={() => !(isCancelling || !hasSelectedReason) && onCancelAtPeriodEnd()}
            aria-disabled={isCancelling || !hasSelectedReason}
          />
          <ListRow
            icon={<IconAlertTriangle size={15} strokeWidth={2} />}
            iconVariant="danger"
            title={t("settings.cancel_now")}
            subtitle={t("settings.danger_warning")}
            onClick={() => !(isCancelling || !hasSelectedReason) && onCancelNow()}
            aria-disabled={isCancelling || !hasSelectedReason}
          />
        </ListCard>
      </div>
    </Modal>
  );
}
