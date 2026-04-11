import { useId } from "react";
import type { WebAppSubscriptionOffersResponse } from "@vpn-suite/shared";
import { Button } from "@/design-system/components/Button";
import { Modal } from "@/design-system/components/feedback/Modal";
import { IconAlertTriangle, IconClock, IconPause } from "@/design-system/icons";
import { ListCard, ListRow } from "../../patterns/cards/ListCard";
import { HelperNote } from "../../patterns/blocks/HelperNote";
import { useI18n } from "@/hooks/useI18n";
import type { CancelReasonGroup, CancelReasonSelection } from "@/features/settings/model/useSettingsPageModel";

export interface SubscriptionCancellationModalProps {
  isOpen: boolean;
  onClose: () => void;
  cancelReason: CancelReasonSelection;
  offers: WebAppSubscriptionOffersResponse | undefined;
  isCancelling?: boolean;
  onReasonSelect: (reason: CancelReasonGroup) => void;
  onPauseInstead: () => void;
  onCancelAtPeriodEnd: () => void;
  onCancelNow: () => void;
  cancelFreeText?: string;
  onCancelFreeTextChange?: (value: string) => void;
}

const CANCEL_REASON_OPTIONS: CancelReasonGroup[] = [
  "price",
  "not_needed",
  "technical",
  "other",
];

export function SubscriptionCancellationModal({
  isOpen: open,
  onClose,
  cancelReason,
  offers,
  isCancelling = false,
  onReasonSelect,
  onPauseInstead,
  onCancelAtPeriodEnd,
  onCancelNow,
  cancelFreeText = "",
  onCancelFreeTextChange,
}: SubscriptionCancellationModalProps) {
  const { t } = useI18n();
  const cancelReasonLabelId = useId();
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
      isOpen={open}
      onClose={onClose}
      title={t("settings.cancel_modal_title")}
      subtitle={t("settings.cancel_modal_description")}
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
          <div className="field-label" id={cancelReasonLabelId}>
            {t("settings.cancel_reason_label")}
          </div>
          <div
            className="seg-toggle cancel-reason-selector"
            role="radiogroup"
            aria-labelledby={cancelReasonLabelId}
            data-selected={hasSelectedReason ? "true" : undefined}
          >
            {CANCEL_REASON_OPTIONS.map((optionId) => (
              <button
                key={optionId}
                type="button"
                className={`seg-btn cancel-reason-tab ${cancelReason === optionId ? "on" : ""}`}
                disabled={isCancelling}
                onClick={() => onReasonSelect(optionId)}
                role="radio"
                aria-checked={cancelReason === optionId}
              >
                {t(`settings.cancel_reason_${optionId}`)}
              </button>
            ))}
          </div>
        </div>

        {retentionContent}

        <HelperNote tone="warning">{t("settings.danger_warning")}</HelperNote>

        {offers?.offer_downgrade && cancelReason === "price" ? (
          <HelperNote>{t("settings.cancel_downgrade_hint")}</HelperNote>
        ) : null}

        {hasSelectedReason && cancelReason === "other" ? (
          <div className="field-group cancel-free-text-field">
            <label className="field-label" htmlFor="cancel-free-text">
              {t("settings.cancel_other_details_label")}
            </label>
            <textarea
              id="cancel-free-text"
              className="cancel-free-text-input"
              rows={3}
              value={cancelFreeText}
              disabled={isCancelling}
              autoComplete="off"
              placeholder={t("settings.cancel_other_placeholder")}
              onChange={(e) => onCancelFreeTextChange?.(e.target.value)}
            />
          </div>
        ) : null}

        <ListCard className="settings-list-card cancel-flow-actions-card">
          {canPauseInstead ? (
            <ListRow
              icon={<IconPause size={15} strokeWidth={2} />}
              iconTone="neutral"
              title={t("settings.cancel_pause_instead")}
              subtitle={t("settings.cancel_offer_pause_body")}
              showChevron={false}
              onClick={() => !(isCancelling || !hasSelectedReason) && onPauseInstead()}
              aria-disabled={isCancelling || !hasSelectedReason}
            />
          ) : null}
          <ListRow
            icon={<IconClock size={15} strokeWidth={2} />}
            iconTone="neutral"
            title={t("settings.cancel_at_period_end")}
            subtitle={t("settings.cancel_plan_description_generic")}
            showChevron={false}
            onClick={() => !(isCancelling || !hasSelectedReason) && onCancelAtPeriodEnd()}
            aria-disabled={isCancelling || !hasSelectedReason}
          />
          <ListRow
            icon={<IconAlertTriangle size={15} strokeWidth={2} />}
            iconVariant="danger"
            title={t("settings.cancel_now")}
            subtitle={t("settings.danger_warning")}
            showChevron={false}
            onClick={() => !(isCancelling || !hasSelectedReason) && onCancelNow()}
            aria-disabled={isCancelling || !hasSelectedReason}
          />
        </ListCard>
      </div>
    </Modal>
  );
}
