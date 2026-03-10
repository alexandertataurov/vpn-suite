import { SummaryHero, LimitStrip, SessionMissing } from "@/components";
import {
  IconAlertTriangle,
  Skeleton,
  ConfirmModal,
  PageFrame,
  PageSection,
  MissionAlert,
  MissionCard,
  MissionPrimaryLink,
  FallbackScreen,
  EmptyStateBlock,
} from "@/design-system";
import { useTelegramMainButton } from "@/hooks/useTelegramMainButton";
import { useDevicesPageModel } from "@/page-models";
import { useI18n } from "@/hooks/useI18n";
import { SetupCardContent, ConfigCardContent, DeviceRow } from "./devices";

export function DevicesPage() {
  const model = useDevicesPageModel();
  const { t } = useI18n();

  useTelegramMainButton(null);

  if (model.pageState.status === "empty") {
    return <SessionMissing />;
  }

  if (model.pageState.status === "error") {
    return (
      <FallbackScreen
        title={model.pageState.title ?? t("common.could_not_load_title")}
        message={model.pageState.message ?? t("common.could_not_load_devices")}
        onRetry={model.pageState.onRetry}
      />
    );
  }

  if (model.pageState.status === "loading") {
    return (
      <PageFrame title={model.header.title} className="devices-page">
        <Skeleton className="skeleton-h-hero" />
        <Skeleton className="skeleton-h-lg" />
        <Skeleton className="skeleton-h-lg" />
      </PageFrame>
    );
  }

  return (
    <PageFrame title={model.header.title} subtitle={model.header.subtitle} className="devices-page home-page">
      <SummaryHero {...model.summaryHero} metricStaticFill={false} className="stagger-1" />

      <PageSection
        id="devices-section"
        title={t("devices.section_devices_title")}
        className="stagger-3"
      >
        {(model.isDeviceLimitError || model.showUpgradeCta) ? (
          <LimitStrip
            variant="compact"
            title={
              model.deviceLimitUpsellCopy?.title ??
              t("devices.limit_reached_default_title")
            }
            message={
              model.deviceLimitUpsellCopy?.body ??
              t("devices.limit_reached_default_message")
            }
            action={(
              <MissionPrimaryLink to={model.upgradeTargetTo} onClick={model.handleUpgradePlanClick}>
                {model.deviceLimitUpsellCopy?.ctaLabel ?? t("devices.limit_reached_default_cta")}
              </MissionPrimaryLink>
            )}
            icon={<IconAlertTriangle size={20} strokeWidth={1.8} />}
          />
        ) : model.issueErrorMessage ? (
          <MissionAlert
            tone="error"
            title={t("devices.issue_error_title")}
            message={model.issueErrorMessage}
          />
        ) : null}

        <div className="ops">
          {model.activeDevices.map((device) => (
            <DeviceRow
              key={device.id}
              device={device}
              formatIssuedAt={model.formatIssuedAt}
              onConfirm={model.handleConfirmConnected}
              onReplace={model.handleReplaceDevice}
              onRevoke={model.setRevokeId}
              isConfirmingId={model.isConfirmingId}
              isReplacingId={model.isReplacingId}
            />
          ))}
          {model.activeDevices.length === 0 ? (
            <EmptyStateBlock
              title={t("devices.empty_title")}
              message={
                model.hasSubscription
                  ? t("devices.empty_message_has_sub")
                  : t("devices.empty_message_no_sub")
              }
            />
          ) : null}
        </div>
      </PageSection>

      {model.showSetupCard ? (
        <PageSection
          id="setup-section"
          title={t("devices.section_setup_title")}
          className="stagger-3"
        >
          <MissionCard tone={model.setupCardTone} className="module-card devices-utility-card">
            <SetupCardContent
              step={model.setupStep}
              onIssueDevice={model.handleIssueDevice}
              canAddDevice={model.canAddDevice}
              isAddPending={model.isAddPending}
              issueActionLabel={model.issueActionLabel}
            />
          </MissionCard>
        </PageSection>
      ) : null}

      {model.issuedConfig ? (
        <div ref={model.configSectionRef}>
          <PageSection
            id="config-section"
            title={t("devices.section_config_title")}
            className="stagger-4"
          >
            <MissionCard tone="amber" className="module-card devices-utility-card">
              <ConfigCardContent
                configText={model.configText}
                routeReason={model.routeReason}
                peerCreated={model.issuedConfig.peer_created}
                onCopy={model.handleCopyConfig}
                onDownload={model.handleDownloadConfig}
              />
            </MissionCard>
          </PageSection>
        </div>
      ) : null}

      <ConfirmModal
        open={model.revokeId !== null}
        onClose={() => !model.isRevoking && model.setRevokeId(null)}
        onConfirm={model.handleConfirmRevoke}
        title={t("devices.revoke_modal_title")}
        message={t("devices.revoke_modal_message")}
        confirmLabel={t("devices.revoke_modal_confirm")}
        cancelLabel={t("devices.revoke_modal_cancel")}
        variant="danger"
        loading={model.isRevoking}
      />
    </PageFrame>
  );
}
