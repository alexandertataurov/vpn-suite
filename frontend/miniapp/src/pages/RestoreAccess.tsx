import { SessionMissing } from "@/components";
import {
  PageFrame,
  PageSection,
  MissionPrimaryButton,
  InlineAlert,
  StickyBottomBar,
} from "@/design-system";
import { useRestoreAccessPageModel } from "@/page-models";
import { useI18n } from "@/hooks/useI18n";

export function RestoreAccessPage() {
  const model = useRestoreAccessPageModel();
  const { t } = useI18n();

  if (model.pageState.status === "empty") {
    if (!model.hasGraceOrExpired) {
      return (
        <PageFrame title={model.header.title} className="restore-access-page">
          <PageSection description={model.description}>
            <InlineAlert
              variant="info"
              title={model.pageState.title ?? t("restore.inline_no_expired_title")}
              message={
                model.pageState.message ??
                t("restore.inline_no_expired_message")
              }
            />
          </PageSection>
        </PageFrame>
      );
    }
    return <SessionMissing />;
  }

  if (model.pageState.status === "loading") {
    return (
      <PageFrame title={model.header.title} subtitle={model.header.subtitle} className="restore-access-page">
        <PageSection description={model.description}>
          <p className="type-body-sm muted">{t("restore.loading_status_message")}</p>
        </PageSection>
      </PageFrame>
    );
  }

  if (model.pageState.status === "error") {
    return (
      <PageFrame title={model.header.title} subtitle={model.header.subtitle} className="restore-access-page">
        <PageSection description={model.description}>
          <InlineAlert
            variant="error"
            title={model.pageState.title}
            message={model.pageState.message}
          />
        </PageSection>
        <StickyBottomBar>
          <div className="miniapp-compact-actions">
            <MissionPrimaryButton
              onClick={() => model.restoreAccess()}
              disabled={model.isRestoring}
              className="miniapp-compact-action"
            >
              {model.isRestoring
                ? t("restore.primary_button_loading_label")
                : t("restore.primary_button_label")}
            </MissionPrimaryButton>
          </div>
        </StickyBottomBar>
      </PageFrame>
    );
  }

  return (
    <PageFrame title={model.header.title} subtitle={model.header.subtitle} className="restore-access-page">
      <PageSection description={model.description}>
        <InlineAlert
          variant="info"
          title={t("restore.info_title")}
          message={t("restore.info_message")}
        />
      </PageSection>
      <StickyBottomBar>
        <div className="miniapp-compact-actions">
          <MissionPrimaryButton
            onClick={() => model.restoreAccess()}
            disabled={model.isRestoring}
            className="miniapp-compact-action"
          >
            {model.isRestoring
              ? t("restore.primary_button_loading_label")
              : t("restore.primary_button_label")}
          </MissionPrimaryButton>
        </div>
      </StickyBottomBar>
    </PageFrame>
  );
}
