import { useNavigate } from "react-router-dom";
import { ConnectStatusSummaryCard, ConnectStatusVerifyCard, SessionMissing } from "@/components";
import { HelperNote, PageScaffold, ModernHeader } from "@/design-system";
import { useOpenLink } from "@/hooks";
import { useConnectStatusPageModel } from "@/page-models";
import { useI18n } from "@/hooks";

export function ConnectStatusPage() {
  const navigate = useNavigate();
  const model = useConnectStatusPageModel();
  const { t } = useI18n();
  const { openLink } = useOpenLink();

  if (model.pageState.status === "empty") {
    return <SessionMissing />;
  }

  return (
    <PageScaffold>
      <ModernHeader
        title={model.header.title}
        subtitle={model.header.subtitle}
        showSettings={false}
        onBack={() => navigate(-1)}
      />
      <ConnectStatusSummaryCard
        title={model.summary.title}
        subtitle={model.summary.subtitle}
        edge={model.summary.edge}
        latestDeviceName={model.latestDeviceName}
      />
      <ConnectStatusVerifyCard
        showConfirmAction={model.showConfirmAction}
        isConfirming={model.isConfirming}
        primaryAction={model.primaryAction}
        onConfirm={() => void model.confirmConnected()}
        onOpenApp={(payload) => openLink(payload)}
      />
      <HelperNote title={t("connect_status.reminder_section_title")}>
        {t("connect_status.reminder_body")}
      </HelperNote>
    </PageScaffold>
  );
}
