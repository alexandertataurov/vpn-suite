import { useEffect, useState } from "react";
import { IconCheck, IconUsers } from "@/design-system/icons";
import { useI18n } from "@/hooks";
import { Button } from "../../../components/Button";
import { PageCardSection } from "../shared/PageCardSection";

export interface ReferralShareCardProps {
  botUsername: string;
  shareUrl: string;
  isOnline: boolean;
  onCopy: () => Promise<boolean> | boolean;
  variant?: "default" | "compact";
}

export function ReferralShareCard({
  botUsername,
  shareUrl,
  isOnline,
  onCopy,
  variant = "default",
}: ReferralShareCardProps) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timeoutId = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(timeoutId);
  }, [copied]);

  const handleCopy = async () => {
    if (!shareUrl || !isOnline) return;
    setCopied(false);
    const didCopy = await onCopy();
    if (didCopy) {
      setCopied(true);
    }
  };

  const isCompact = variant === "compact";
  const title = isCompact
    ? t("referral.share_compact_card_title")
    : t("referral.share_link_card_title");
  const description = isCompact
    ? t("referral.share_compact_message")
    : t("referral.read_only_beta_message");

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
            </div>
            <code className="referral-share-card__url" title={shareUrl || undefined}>
              {shareUrl || t("referral.share_url_unavailable_placeholder")}
            </code>
          </div>
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
