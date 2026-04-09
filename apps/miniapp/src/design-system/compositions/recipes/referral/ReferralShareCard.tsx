import { useEffect, useState } from "react";
import { IconCheck, IconUsers } from "@/design-system/icons";
import { Button, InlineAlert, StatusChip } from "@/design-system";
import { useI18n } from "@/hooks/useI18n";
import { PageCardSection } from "../shared/PageCardSection";

export interface ReferralShareCardProps {
  botUsername: string;
  shareUrl: string;
  isOnline: boolean;
  onCopy: () => Promise<boolean> | boolean;
  /** Native share (Web Share API); shown when provided and the browser supports `navigator.share`. */
  onNativeShare?: () => void | Promise<void>;
  nativeShareLabel?: string;
  variant?: "default" | "compact";
}

export function ReferralShareCard({
  botUsername,
  shareUrl,
  isOnline,
  onCopy,
  onNativeShare,
  nativeShareLabel,
  variant = "default",
}: ReferralShareCardProps) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timeoutId = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(timeoutId);
  }, [copied]);

  useEffect(() => {
    if (!copyFailed) return;
    const timeoutId = window.setTimeout(() => setCopyFailed(false), 4000);
    return () => window.clearTimeout(timeoutId);
  }, [copyFailed]);

  const handleCopy = async () => {
    if (!shareUrl || !isOnline) return;
    setCopied(false);
    setCopyFailed(false);
    const didCopy = await onCopy();
    if (didCopy) {
      setCopied(true);
    } else {
      setCopyFailed(true);
    }
  };

  const canNativeShare =
    typeof navigator !== "undefined" && typeof navigator.share === "function";
  const isAvailable = Boolean(shareUrl && isOnline);

  const isCompact = variant === "compact";
  const title = isCompact
    ? t("referral.share_compact_card_title")
    : t("referral.share_link_card_title");
  const description = isCompact
    ? t("referral.share_compact_message")
    : t("referral.read_only_beta_message");
  const availabilityLabel = isAvailable
    ? t("referral.share_link_ready_label")
    : t("referral.share_link_unavailable_label");

  return (
    <PageCardSection
      title={title}
      cardTone={isCompact ? "blue" : "green"}
      cardClassName={isCompact ? "module-card referral-share-card-panel referral-share-card-panel--compact" : "module-card referral-share-card-panel"}
    >
      <div className={`referral-share-card referral-share-card--${variant}`}>
        <p className="referral-share-card__description">
          {description}
        </p>
        <div
          className="referral-share-card__surface"
          data-copied={copied ? "true" : "false"}
          data-disabled={!shareUrl || !isOnline ? "true" : "false"}
        >
          <div className="referral-share-card__icon" aria-hidden>
            {copied ? <IconCheck size={18} strokeWidth={2} /> : <IconUsers size={18} strokeWidth={1.8} />}
          </div>
          <div className="referral-share-card__body">
            <div className="referral-share-card__label-row">
              <span className="referral-share-card__label">
                {t("referral.share_link_surface_label")}
              </span>
              {botUsername ? (
                <span className="referral-share-card__handle">@{botUsername}</span>
              ) : null}
              <StatusChip variant={isAvailable ? "active" : "offline"} label={availabilityLabel} />
            </div>
            <code className="referral-share-card__url" title={shareUrl || undefined}>
              {shareUrl || t("referral.share_url_unavailable_placeholder")}
            </code>
          </div>
          <div className="referral-share-card__actions">
            {onNativeShare && canNativeShare ? (
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => void onNativeShare()}
                disabled={!shareUrl || !isOnline}
                aria-label={nativeShareLabel ?? t("referral.share_native_button")}
                className="referral-share-card__share-button"
              >
                {nativeShareLabel ?? t("referral.share_native_button")}
              </Button>
            ) : null}
            <Button
              variant="secondary"
              size="sm"
              status={copied ? "success" : "idle"}
              statusText={t("referral.copy_link_copied_button")}
              onClick={() => void handleCopy()}
              disabled={!shareUrl || !isOnline}
              aria-label={t("referral.copy_link_button")}
              className="referral-share-card__copy-button"
            >
              {t("referral.copy_link_compact_button")}
            </Button>
          </div>
        </div>
        {copyFailed ? (
          <InlineAlert variant="error" label={t("referral.copy_failed_message")} />
        ) : null}
        {!botUsername ? (
          <div className="referral-share-card__notice" role="status" aria-live="polite">
            <p className="referral-share-card__notice-title">
              {t("referral.share_link_unavailable_alert_title")}
            </p>
            <p className="referral-share-card__notice-message">
              {t("referral.share_link_unavailable_alert_message")}
            </p>
          </div>
        ) : null}
      </div>
    </PageCardSection>
  );
}
