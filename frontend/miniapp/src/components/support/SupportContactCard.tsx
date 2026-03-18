import { IconHelpCircle } from "@/design-system/icons";
import { Button, ListCard, StatusChip } from "@/design-system";
import { useI18n } from "@/hooks";

export interface SupportContactCardProps {
  title: string;
  description: string;
  supportHref: string | null;
  /** When provided, CTA uses this instead of plain anchor (for Telegram openLink). */
  onContactClick?: (href: string) => void;
}

export function SupportContactCard({
  title,
  description,
  supportHref,
  onContactClick,
}: SupportContactCardProps) {
  const { t } = useI18n();

  return (
    <ListCard className="home-card-row support-contact-card">
      <div className="support-contact-card__header">
        <div className="support-contact-card__icon">
          <IconHelpCircle size={22} strokeWidth={2} />
        </div>
        <div className="support-contact-card__meta">
          <div className="modern-header-label">{t("support.contact_card_title")}</div>
          <div className="support-contact-card__title">{title}</div>
          <div className="support-contact-card__desc">{description}</div>
        </div>
      </div>

      <div className="support-contact-card__status">
        <StatusChip variant={supportHref ? "active" : "warning"}>
          {supportHref ? t("common.status_online") : t("common.status_offline")}
        </StatusChip>
      </div>

      {supportHref ? (
        onContactClick ? (
          <Button
            variant="primary"
            fullWidth
            size="lg"
            className="support-contact-card__cta"
            onClick={() => onContactClick(supportHref)}
          >
            {t("support.contact_button_label")}
          </Button>
        ) : (
          <Button asChild variant="primary" fullWidth size="lg" className="support-contact-card__cta">
            <a href={supportHref} target="_blank" rel="noopener noreferrer">
              {t("support.contact_button_label")}
            </a>
          </Button>
        )
      ) : (
        <div className="support-contact-card__unavailable">
          <strong>{t("support.support_link_unavailable_title")}</strong>
          <p>{t("support.support_link_unavailable_message")}</p>
        </div>
      )}
    </ListCard>
  );
}
