import { SessionMissing } from "@/components";
import {
  ButtonRow,
  MissionPrimaryLink,
  MissionSecondaryLink,
  PageFrame,
  PageStateScreen,
  MissionPrimaryButton,
  InlineAlert,
  StickyBottomBar,
  PageCardSection,
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
          <PageCardSection
            description={model.description}
          >
            <InlineAlert
              variant="info"
              title={model.pageState.title ?? t("restore.inline_no_expired_title")}
              message={
                model.pageState.message ??
                t("restore.inline_no_expired_message")
              }
            />
            <ButtonRow>
              <MissionPrimaryLink to="/support">
                {t("common.contact_support")}
              </MissionPrimaryLink>
              <MissionSecondaryLink to="/devices">
                {t("restore.manage_devices_action")}
              </MissionSecondaryLink>
            </ButtonRow>
          </PageCardSection>
        </PageFrame>
      );
    }
    return <SessionMissing />;
  }

  if (model.pageState.status === "loading") {
    return (
      <PageFrame title={model.header.title} subtitle={model.header.subtitle} className="restore-access-page">
        <PageCardSection description={model.description}>
          <p className="type-body-sm muted">{t("restore.loading_status_message")}</p>
        </PageCardSection>
      </PageFrame>
    );
  }

  if (model.pageState.status === "error") {
    return (
      <PageStateScreen
        variant="attention"
        mode="replace"
        label={t("restore.header_title")}
        chipText={t("common.attention")}
        alertTitle={model.pageState.title ?? model.header.title}
        alertMessage={model.pageState.message ?? model.description}
        actions={
          <MissionPrimaryButton
            onClick={() => model.restoreAccess()}
            disabled={model.isRestoring}
          >
            {model.isRestoring
              ? t("restore.primary_button_loading_label")
              : t("restore.primary_button_label")}
          </MissionPrimaryButton>
        }
      />
    );
  }

  return (
    <PageFrame title={model.header.title} subtitle={model.header.subtitle} className="restore-access-page">
      <PageCardSection
        description={model.description}
      >
        <InlineAlert
          variant="info"
          title={t("restore.info_title")}
          message={t("restore.info_message")}
        />
      </PageCardSection>
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
