import { SessionMissing, SummaryHero } from "@/components";
import {
  PageFrame,
  PageCardSection,
  PageSection,
  MissionPrimaryButton,
  MissionPrimaryLink,
} from "@/design-system";
import { useConnectStatusPageModel } from "@/page-models";
import { useI18n } from "@/hooks/useI18n";

export function ConnectStatusPage() {
  const model = useConnectStatusPageModel();
  const { t } = useI18n();

  if (model.pageState.status === "empty") {
    return <SessionMissing />;
  }

  return (
    <PageFrame title={model.header.title} subtitle={model.header.subtitle} className="connect-status-page">
      <SummaryHero
        eyebrow={model.summary.eyebrow}
        title={model.summary.title}
        subtitle={model.summary.subtitle}
        edge={model.summary.edge}
        glow={model.summary.glow}
      />
      <PageCardSection
        title={t("connect_status.verify_section_title")}
        description={undefined}
      >
        <p className="type-body-sm muted">
          {t("connect_status.device_label", { name: model.latestDeviceName })}
        </p>
        <div className="miniapp-compact-actions">
          {model.showConfirmAction ? (
            <MissionPrimaryButton
              onClick={() => void model.confirmConnected()}
              disabled={model.isConfirming}
              className="miniapp-compact-action"
            >
              {model.isConfirming
                ? t("connect_status.confirm_button_loading")
                : t("connect_status.confirm_button_label")}
            </MissionPrimaryButton>
          ) : model.primaryAction ? (
            <MissionPrimaryLink to={model.primaryAction.to} className="miniapp-compact-action">
              {model.primaryAction.label}
            </MissionPrimaryLink>
          ) : null}
        </div>
      </PageCardSection>
      <PageSection>
        <p className="type-body-sm muted">{t("connect_status.reminder_body")}</p>
      </PageSection>
    </PageFrame>
  );
}
