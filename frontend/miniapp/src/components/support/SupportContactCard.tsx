import { InlineAlert, MissionPrimaryAnchor, PageCardSection } from "@/design-system";
import { useI18n } from "@/hooks/useI18n";

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
    <PageCardSection
      title={title}
      description={description}
      cardTone={supportHref ? "green" : "amber"}
      className="stagger-1"
      cardClassName="module-card support-contact-card"
    >
      <div className="support-contact-stack">
        <p className="op-desc type-body-sm">{t("support.contact_intro")}</p>
        {supportHref ? (
          <MissionPrimaryAnchor
            aria-label={t("support.contact_button_label")}
            href={supportHref}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t("support.contact_button_label")}
          </MissionPrimaryAnchor>
        ) : (
          <InlineAlert
            variant="warning"
            title={t("support.support_link_unavailable_title")}
            message={t("support.support_link_unavailable_message")}
          />
        )}
      </div>
    </PageCardSection>
  );
}
