
import { useNavigate, Link } from "react-router-dom";
import { SessionMissing, VpnBoundaryNote } from "@/components";
import { ActionCard, Button, FooterHelp, InlineAlert, PageScaffold, PageLayout, PageHeader, Stack, StickyBottomBar } from "@/design-system";
import { useRestoreAccessPageModel } from "@/page-models";
import { useI18n } from "@/hooks";



export function RestoreAccessPage() {
  const navigate = useNavigate();
  const model = useRestoreAccessPageModel();
  const { t } = useI18n();

  if (model.pageState.status === "empty") {
    if (!model.hasGraceOrExpired) {
      return (
        <PageScaffold className="restore-access-page">
          <PageLayout scrollable={false}>
          <PageHeader
            title={model.header.title}
            subtitle={model.header.subtitle}
            onBack={() => navigate(-1)}
            backAriaLabel={t("common.back_aria")}
          />
          <Stack gap="4">
            <ActionCard
              title={t("restore.inline_no_expired_title")}
              description={model.description}
            >
              <Stack gap="4">
                <InlineAlert
                  variant="info"
                  label={model.pageState.title ?? t("restore.inline_no_expired_title")}
                  message={model.pageState.message ?? t("restore.inline_no_expired_message")}
                  compact
                />
                <VpnBoundaryNote messageKey="common.vpn_boundary_billing_note" />
              </Stack>
            </ActionCard>

            <Stack gap="3">
              <Button asChild fullWidth>
                <Link to="/support">{t("common.contact_support")}</Link>
              </Button>
              <Button variant="secondary" asChild fullWidth>
                <Link to="/devices">{t("restore.manage_devices_action")}</Link>
              </Button>
            </Stack>
          </Stack>
          <FooterHelp
            note={t("footer.having_trouble")}
            linkLabel={t("footer.view_setup_guide")}
            onLinkClick={() => navigate("/support")}
          />
          </PageLayout>
        </PageScaffold>
      );
    }
    return <SessionMissing />;
  }

  if (model.pageState.status === "loading") {
    return (
      <PageScaffold className="restore-access-page">
        <PageLayout scrollable={false}>
        <PageHeader
          title={model.header.title}
          subtitle={model.header.subtitle}
          onBack={() => navigate(-1)}
          backAriaLabel={t("common.back_aria")}
        />
        <Stack gap="4">
          <ActionCard
            title={t("restore.info_title")}
            description={t("restore.loading_status_message")}
          />
        </Stack>
        </PageLayout>
      </PageScaffold>
    );
  }

  if (model.pageState.status === "error") {
    return (
      <PageScaffold className="restore-access-page">
        <PageLayout scrollable={false}>
        <PageHeader
          title={model.header.title}
          subtitle={model.header.subtitle}
          onBack={() => navigate(-1)}
          backAriaLabel={t("common.back_aria")}
        />
        <Stack gap="4">
          <InlineAlert
            variant="warning"
            label={model.pageState.title ?? model.header.title}
            message={model.pageState.message ?? model.description}
            compact
          />

          <div>
            <Button
              onClick={() => model.restoreAccess()}
              disabled={model.isRestoring}
              status={model.isRestoring ? "loading" : "idle"}
              statusText={t("restore.primary_button_loading_label")}
              fullWidth
            >
              {t("restore.primary_button_label")}
            </Button>
          </div>
        </Stack>
        </PageLayout>
      </PageScaffold>
    );
  }

  return (
    <PageScaffold className="restore-access-page">
      <PageLayout scrollable={false}>
      <PageHeader
        title={model.header.title}
        subtitle={model.header.subtitle}
        onBack={() => navigate(-1)}
        backAriaLabel={t("common.back_aria")}
      />
      <Stack gap="4">
        <ActionCard
          title={t("restore.info_title")}
          description={model.description}
        >
          <VpnBoundaryNote messageKey="common.vpn_boundary_billing_note" />
        </ActionCard>
      </Stack>
      <StickyBottomBar>
        <Button
            onClick={() => model.restoreAccess()}
            disabled={model.isRestoring}
            status={model.isRestoring ? "loading" : "idle"}
            statusText={t("restore.primary_button_loading_label")}
            fullWidth
          >
            {t("restore.primary_button_label")}
          </Button>
      </StickyBottomBar>
      <FooterHelp
        note={t("footer.having_trouble")}
        linkLabel={t("footer.view_setup_guide")}
        onLinkClick={() => navigate("/support")}
      />
      </PageLayout>
    </PageScaffold>
  );
}
