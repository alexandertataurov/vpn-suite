
import { useNavigate, Link } from "react-router-dom";
import { SessionMissing, VpnBoundaryNote } from "@/components";
import { ActionCard, Button, InlineAlert, PageScaffold, ModernHeader, StickyBottomBar } from "@/design-system";
import { Stack } from "@/design-system/core/primitives";
import { useRestoreAccessPageModel } from "@/page-models";
import { useI18n } from "@/hooks";



export function RestoreAccessPage() {
  const navigate = useNavigate();
  const model = useRestoreAccessPageModel();
  const { t } = useI18n();

  if (model.pageState.status === "empty") {
    if (!model.hasGraceOrExpired) {
      return (
        <PageScaffold>
          <ModernHeader
            title={model.header.title}
            subtitle={model.header.subtitle}
            showSettings={false}
            onBack={() => navigate(-1)}
          />
          <Stack gap="4">
            <ActionCard
              title={t("restore.inline_no_expired_title")}
              description={model.description}
            >
              <Stack gap="4">
                <InlineAlert
                  variant="info"
                  title={model.pageState.title ?? t("restore.inline_no_expired_title")}
                  body={model.pageState.message ?? t("restore.inline_no_expired_message")}
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
        </PageScaffold>
      );
    }
    return <SessionMissing />;
  }

  if (model.pageState.status === "loading") {
    return (
      <PageScaffold>
        <ModernHeader
          title={model.header.title}
          subtitle={model.header.subtitle}
          showSettings={false}
          onBack={() => navigate(-1)}
        />
        <Stack gap="4">
          <ActionCard
            title={t("restore.info_title")}
            description={t("restore.loading_status_message")}
          />
        </Stack>
      </PageScaffold>
    );
  }

  if (model.pageState.status === "error") {
    return (
      <PageScaffold>
        <ModernHeader
          title={model.header.title}
          subtitle={model.header.subtitle}
          showSettings={false}
          onBack={() => navigate(-1)}
        />
        <Stack gap="4">
          <InlineAlert
            variant="warning"
            title={model.pageState.title ?? model.header.title}
            body={model.pageState.message ?? model.description}
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
      </PageScaffold>
    );
  }

  return (
    <PageScaffold>
      <ModernHeader
        title={model.header.title}
        subtitle={model.header.subtitle}
        showSettings={false}
        onBack={() => navigate(-1)}
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
    </PageScaffold>
  );
}
