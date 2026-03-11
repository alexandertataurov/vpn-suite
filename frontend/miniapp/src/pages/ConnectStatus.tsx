import { ConnectStatusSummaryCard, ConnectStatusVerifyCard, SessionMissing } from "@/components";
import {
  PageFrame,
  PageSection,
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
      <ConnectStatusSummaryCard
        title={model.summary.title}
        subtitle={model.summary.subtitle}
        eyebrow={model.summary.eyebrow}
        edge={model.summary.edge}
        latestDeviceName={model.latestDeviceName}
      />
      <ConnectStatusVerifyCard
        showConfirmAction={model.showConfirmAction}
        isConfirming={model.isConfirming}
        primaryAction={model.primaryAction}
        onConfirm={() => void model.confirmConnected()}
      />
      <PageSection
        title={t("connect_status.reminder_section_title")}
        description={t("connect_status.reminder_section_description")}
      >
        <p className="type-body-sm muted">{t("connect_status.reminder_body")}</p>
      </PageSection>
    </PageFrame>
  );
}
