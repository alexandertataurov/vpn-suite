import { useNavigate } from "react-router-dom";
import { SessionMissing } from "@/components";
import {
  ConnectStatusSummaryCard,
  ConnectStatusVerifyCard,
  FallbackScreen,
  HelperNote,
  PageHeader,
  PageLayout,
  PageScaffold,
  Skeleton,
  Stack,
} from "@/design-system";
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

  if (model.pageState.status === "loading") {
    return (
      <PageScaffold>
        <PageLayout scrollable={false}>
          <PageHeader
            title={model.header.title}
            subtitle={model.header.subtitle}
            onBack={() => navigate(-1)}
            backAriaLabel={t("common.back_aria")}
          />
          <Stack gap="2">
            <Skeleton variant="card" height={140} />
            <Skeleton variant="card" height={180} />
          </Stack>
        </PageLayout>
      </PageScaffold>
    );
  }

  if (model.pageState.status === "error") {
    return (
      <FallbackScreen
        title={model.pageState.title ?? t("common.could_not_load_title")}
        message={model.pageState.message ?? t("common.could_not_load_generic")}
        onRetry={model.pageState.onRetry}
        retryLabel={t("common.retry")}
      />
    );
  }

  return (
    <PageScaffold>
      <PageHeader
        title={model.header.title}
        subtitle={model.header.subtitle}
        onBack={() => navigate(-1)}
        backAriaLabel={t("common.back_aria")}
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
