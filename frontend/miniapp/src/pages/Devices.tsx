import { DevicesSummaryCard, SessionMissing } from "@/components";
import { useCallback, useState } from "react";
import {
  Skeleton,
  Button,
  ConfirmModal,
  IconSmartphone,
  IconPlus,
  InlineAlert,
  Modal,
  PageFrame,
  PageSection,
  PageHeaderBadge,
  ListCard,
  MissionAlert,
  PageCardSection,
  MissionPrimaryLink,
  FallbackScreen,
  EmptyStateBlock,
  Input,
} from "@/design-system";
import { useTelegramMainButton } from "@/hooks/useTelegramMainButton";
import { useDevicesPageModel } from "@/page-models";
import { useI18n } from "@/hooks/useI18n";
import { Link } from "react-router-dom";
import { SetupCardContent, ConfigCardContent, DeviceRow } from "./devices";

const DEVICE_NAME_MAX_LENGTH = 128;

export function DevicesPage() {
  const model = useDevicesPageModel();
  const { activeDevices, handleRenameDevice } = model;
  const { t } = useI18n();
  const [renameDeviceId, setRenameDeviceId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const renameDevice = renameDeviceId
    ? activeDevices.find((d) => d.id === renameDeviceId)
    : null;
  const openRename = useCallback(
    (deviceId: string) => {
      const d = activeDevices.find((x) => x.id === deviceId);
      setRenameDeviceId(deviceId);
      setRenameValue((d?.device_name ?? "").trim() || "");
    },
    [activeDevices]
  );
  const closeRename = useCallback(() => {
    setRenameDeviceId(null);
    setRenameValue("");
  }, []);
  const handleRenameSubmit = useCallback(() => {
    if (!renameDeviceId) return;
    const name = renameValue.trim().slice(0, DEVICE_NAME_MAX_LENGTH) || "";
    handleRenameDevice(renameDeviceId, name);
    closeRename();
  }, [renameDeviceId, renameValue, handleRenameDevice, closeRename]);
  const summaryTitle =
    model.summaryHero.title === model.header.title ? undefined : model.summaryHero.title;
  const summaryBadge =
    model.hasSubscription && model.summaryHero.eyebrow !== model.header.title
      ? <PageHeaderBadge tone="info" label={model.summaryHero.eyebrow} />
      : undefined;

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
      <PageFrame title={model.header.title} className="page-shell--default page-shell--sectioned page-shell--devices">
        <Skeleton className="skeleton-h-hero" />
        <Skeleton className="skeleton-h-lg" />
        <Skeleton className="skeleton-h-lg" />
      </PageFrame>
    );
  }

  return (
    <PageFrame
      title={model.header.title}
      subtitle={model.header.subtitle}
      className="page-shell--default page-shell--sectioned page-shell--devices"
    >
      {model.planRequiredAlert ? (
        <InlineAlert
          variant="warning"
          title={model.planRequiredAlert.title}
          body={model.planRequiredAlert.body}
          className="devices-plan-required-alert stagger-1"
          actions={(
            <Link className="inline-alert-action-link devices-plan-required-link" to={model.planRequiredAlert.to}>
              {model.planRequiredAlert.ctaLabel}
            </Link>
          )}
        />
      ) : null}

      <DevicesSummaryCard
        title={model.hasSubscription ? summaryTitle : undefined}
        description={model.hasSubscription ? model.summaryHero.subtitle : undefined}
        action={summaryBadge}
        className={model.planRequiredAlert ? "stagger-2 devices-summary-section" : "stagger-1 devices-summary-section"}
        metrics={model.summaryHero.metrics}
      />

      <PageSection
        id="devices-section"
        className="stagger-3"
        title={t("devices.section_devices_title")}
        action={
          model.canAddDevice ? (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={model.handleIssueDevice}
              disabled={model.isAddPending}
              aria-label={t("devices.add_new_device")}
              startIcon={<IconPlus size={16} strokeWidth={2} aria-hidden />}
            >
              {model.isAddPending ? "…" : t("devices.add_new_device")}
            </Button>
          ) : undefined
        }
      >
        {(model.isDeviceLimitError || model.showUpgradeCta) ? (
          <MissionAlert
            tone="warning"
            title={model.deviceLimitUpsellCopy?.title ?? t("devices.limit_reached_default_title")}
            message={model.deviceLimitUpsellCopy?.body ?? t("devices.limit_reached_default_message")}
            actions={
              <MissionPrimaryLink to={model.upgradeTargetTo} onClick={model.handleUpgradePlanClick}>
                {model.deviceLimitUpsellCopy?.ctaLabel ?? t("devices.limit_reached_default_cta")}
              </MissionPrimaryLink>
            }
          />
        ) : model.issueErrorMessage ? (
          <MissionAlert
            tone="error"
            title={t("devices.issue_error_title")}
            message={model.issueErrorMessage}
          />
        ) : null}

        <ListCard className="devices-list-card">
          {model.activeDevices.length === 0 ? (
            <EmptyStateBlock
              title={t("devices.empty_title")}
              message={
                model.hasSubscription
                  ? t("devices.empty_message_has_sub")
                  : t("devices.empty_message_no_sub")
              }
              icon={<IconSmartphone size={48} strokeWidth={1.55} aria-hidden />}
            />
          ) : (
            model.activeDevices.map((device) => (
              <DeviceRow
                key={device.id}
                device={device}
                formatIssuedAt={model.formatIssuedAt}
                onConfirm={model.handleConfirmConnected}
                onReplace={model.handleReplaceDevice}
                onRevoke={model.setRevokeId}
                onRename={openRename}
                isConfirmingId={model.isConfirmingId}
                isReplacingId={model.isReplacingId}
              />
            ))
          )}
        </ListCard>
      </PageSection>

      {model.showSetupCard ? (
        <PageCardSection
          id="setup-section"
          title={t("devices.section_setup_title")}
          className="stagger-3"
          cardTone={model.setupCardTone}
          cardClassName="module-card devices-utility-card"
        >
          <SetupCardContent
            step={model.setupStep}
            onIssueDevice={model.handleIssueDevice}
            canAddDevice={model.canAddDevice}
            isAddPending={model.isAddPending}
            issueActionLabel={model.issueActionLabel}
          />
        </PageCardSection>
      ) : null}

      {model.issuedConfig ? (
        <div ref={model.configSectionRef}>
          <PageCardSection
            id="config-section"
            title={t("devices.section_config_title")}
            className="stagger-4"
            cardTone="amber"
            cardClassName="module-card devices-utility-card"
          >
            <ConfigCardContent
              configText={model.configText}
              routeReason={model.routeReason}
              peerCreated={model.issuedConfig.peer_created}
              onCopy={model.handleCopyConfig}
              onDownload={model.handleDownloadConfig}
            />
          </PageCardSection>
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

      <Modal
        open={renameDeviceId !== null}
        onClose={closeRename}
        title={t("devices.rename_modal_title")}
        variant="plain"
        footer={
          <>
            <Button type="button" variant="secondary" size="sm" onClick={closeRename}>
              {t("devices.revoke_modal_cancel")}
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleRenameSubmit}
              disabled={model.isRenamePending}
            >
              {model.isRenamePending ? "…" : t("devices.menu_rename_device")}
            </Button>
          </>
        }
      >
        <Input
          type="text"
          label={t("devices.rename_modal_placeholder")}
          value={renameValue}
          onChange={(e) => setRenameValue(e.target.value.slice(0, DEVICE_NAME_MAX_LENGTH))}
          maxLength={DEVICE_NAME_MAX_LENGTH}
          placeholder={renameDevice ? `Device #${renameDevice.id.slice(-6)}` : ""}
          aria-label={t("devices.rename_modal_placeholder")}
        />
      </Modal>
    </PageFrame>
  );
}
