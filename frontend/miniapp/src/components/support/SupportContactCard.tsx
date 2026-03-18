import { IconHelpCircle } from "@/design-system/icons";
import { Button, StatusChip } from "@/design-system";
import { useI18n } from "@/hooks";

export interface SupportContactCardProps {
  title: string;
  description: string;
  supportHref: string | null;
}

export function SupportContactCard({
  title,
  description,
  supportHref,
}: SupportContactCardProps) {
  const { t } = useI18n();

  return (
    <div className="modern-contact-card">
      <div className="modern-contact-card__header">
        <div className="modern-contact-card__icon">
          <IconHelpCircle size={22} strokeWidth={2} />
        </div>
        <div className="modern-contact-card__meta">
          <div className="modern-header-label">{t("support.contact_card_title")}</div>
          <div className="modern-contact-card__title">{title}</div>
          <div className="modern-contact-card__desc">{description}</div>
        </div>
      </div>

      <div className="modern-contact-card__status">
        <StatusChip variant={supportHref ? "active" : "warning"}>
          {supportHref ? t("common.status_online") : t("common.status_offline")}
        </StatusChip>
      </div>

      {supportHref ? (
        <Button asChild variant="primary" fullWidth size="lg" className="modern-contact-card__cta btn-accent">
          <a href={supportHref} target="_blank" rel="noopener noreferrer">
            {t("support.contact_button_label")}
          </a>
        </Button>
      ) : (
        <div className="modern-contact-card__unavailable">
          <strong>{t("support.support_link_unavailable_title")}</strong>
          <p>{t("support.support_link_unavailable_message")}</p>
        </div>
      )}
    </div>
  );
}
