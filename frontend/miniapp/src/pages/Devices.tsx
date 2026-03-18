import { DevicesSummaryCard, SessionMissing } from "@/components";
import { useCallback, useEffect, useState } from "react";
import { IconPlus } from "@/design-system/icons";
import {
  FallbackScreen,
  FooterHelp,
  Skeleton,
  SkeletonList,
  Button,
  ConfirmModal,
  InlineAlert,
  Modal,
  ModernHeader,
  PageScaffold,
  PageSection,
  ListCard,
  EmptyStateBlock,
  HelperNote,
  Input,
  usePrefersReducedMotion,
} from "@/design-system";
import { Stack } from "@/design-system/core/primitives";
import { getMotionDurationMs } from "@/design-system/core/tokens";
import { useTelegramMainButton } from "@/hooks";
import { useDevicesPageModel } from "@/page-models";
import { useI18n } from "@/hooks";
import { AMNEZIA_VPN_ANDROID_URL, AMNEZIA_VPN_IOS_URL } from "@/lib";
import { Link, useNavigate } from "react-router-dom";
import { SetupCardContent, ConfigCardContent, DeviceRow } from "./devices";

const DEVICE_NAME_MAX_LENGTH = 128;
type AddDeviceWizardStep = "name" | "install";
type AnimatedDeviceEntry = {
  device: ReturnType<typeof useDevicesPageModel>["activeDevices"][number];
  phase: "entering" | "idle" | "exiting";
};

export function DevicesPage() {
  const model = useDevicesPageModel();
  const navigate = useNavigate();
  const { activeDevices, handleRenameDevice } = model;
  const { t } = useI18n();
  const prefersReducedMotion = usePrefersReducedMotion();
  const listMotionMs = getMotionDurationMs("panel", prefersReducedMotion);
  const [renameDeviceId, setRenameDeviceId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [isAddWizardOpen, setIsAddWizardOpen] = useState(false);
  const [addWizardStep, setAddWizardStep] = useState<AddDeviceWizardStep>("name");
  const [newDeviceName, setNewDeviceName] = useState("");
  const [animatedDevices, setAnimatedDevices] = useState<AnimatedDeviceEntry[]>(() =>
    activeDevices.map((device) => ({ device, phase: "idle" })),
  );
  const renameDevice = renameDeviceId
    ? activeDevices.find((d) => d.id === renameDeviceId)
    : null;
  const openRename = useCallback(
    (deviceId: string) => {
      const device = activeDevices.find((item) => item.id === deviceId);
      setRenameDeviceId(deviceId);
      setRenameValue((device?.device_name ?? "").trim() || "");
    },
    [activeDevices],
  );
  const closeRename = useCallback(() => {
    setRenameDeviceId(null);
    setRenameValue("");
  }, []);
  const openAddWizard = useCallback(() => {
    setIsAddWizardOpen(true);
    setAddWizardStep("name");
    setNewDeviceName("");
  }, []);
  const closeAddWizard = useCallback(() => {
    if (model.isAddPending) return;
    setIsAddWizardOpen(false);
    setAddWizardStep("name");
    setNewDeviceName("");
  }, [model.isAddPending]);
  const handleAddWizardNext = useCallback(() => {
    setAddWizardStep("install");
  }, []);
  const handleAddWizardConfirm = useCallback(() => {
    model.handleIssueDevice(newDeviceName.trim().slice(0, DEVICE_NAME_MAX_LENGTH));
    setIsAddWizardOpen(false);
    setAddWizardStep("name");
    setNewDeviceName("");
  }, [model, newDeviceName]);
  const handleRenameSubmit = useCallback(() => {
    if (!renameDeviceId) return;
    const name = renameValue.trim().slice(0, DEVICE_NAME_MAX_LENGTH) || "";
    handleRenameDevice(renameDeviceId, name);
    closeRename();
  }, [renameDeviceId, renameValue, handleRenameDevice, closeRename]);
  const summaryTitle = model.summaryHero.title === model.header.title ? undefined : model.summaryHero.title;

  useEffect(() => {
    setAnimatedDevices((current) => {
      const nextIds = new Set(activeDevices.map((device) => device.id));
      const currentById = new Map(current.map((entry) => [entry.device.id, entry]));
      const orderedEntries = activeDevices.map((device) => {
        const existing = currentById.get(device.id);
        if (!existing) {
          return { device, phase: "entering" as const };
        }
        return {
          device,
          phase: existing.phase === "exiting" ? "idle" : existing.phase,
        };
      });
      const exitingEntries = current
        .filter((entry) => !nextIds.has(entry.device.id))
        .map((entry) => ({ ...entry, phase: "exiting" as const }));
      return [...orderedEntries, ...exitingEntries];
    });
  }, [activeDevices]);

  useEffect(() => {
    if (!animatedDevices.some((entry) => entry.phase !== "idle")) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setAnimatedDevices((current) =>
        current
          .filter((entry) => entry.phase !== "exiting")
          .map((entry) => (entry.phase === "entering" ? { ...entry, phase: "idle" } : entry)),
      );
    }, listMotionMs);

    return () => window.clearTimeout(timeoutId);
  }, [animatedDevices, listMotionMs]);

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
      <PageScaffold>
        <ModernHeader title={model.header.title} showSettings={false} />
        <Stack gap="4">
          <Skeleton variant="card" height={160} />
          <Skeleton variant="line" width="40%" />
          <SkeletonList lines={3} />
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
      {model.planRequiredAlert ? (
        <InlineAlert
          variant="warning"
          title={model.planRequiredAlert.title}
          body={model.planRequiredAlert.body}
          className="devices-plan-required-alert"
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
        className="devices-summary-section"
        metrics={model.summaryHero.metrics}
        action={
          model.canAddDevice ? (
            <Button
              type="button"
              variant="primary"
              size="sm"
              status={model.isAddPending ? "loading" : "idle"}
              statusText={t("devices.wizard_creating")}
              onClick={openAddWizard}
              disabled={model.isAddPending}
              aria-label={t("devices.add_new_device")}
              startIcon={<IconPlus size={16} strokeWidth={2} aria-hidden />}
            >
              {t("devices.add_new_device")}
            </Button>
          ) : undefined
        }
      />

      <HelperNote>{t("common.vpn_boundary_devices_note")}</HelperNote>

      <PageSection id="devices-section" title={t("devices.section_devices_title")}>
        {(model.isDeviceLimitError || model.showUpgradeCta) ? (
          <InlineAlert
            variant="warning"
            title={model.deviceLimitUpsellCopy?.title ?? t("devices.limit_reached_default_title")}
            body={model.deviceLimitUpsellCopy?.body ?? t("devices.limit_reached_default_message")}
            actions={
              <Button size="sm" asChild>
                <Link to={model.upgradeTargetTo} onClick={model.handleUpgradePlanClick}>
                  {model.deviceLimitUpsellCopy?.ctaLabel ?? t("devices.limit_reached_default_cta")}
                </Link>
              </Button>
            }
          />
        ) : model.issueErrorMessage ? (
          <InlineAlert
            variant="error"
            title={t("devices.issue_error_title")}
            body={model.issueErrorMessage}
          />
        ) : null}

        <ListCard className="devices-list-card">
          {model.activeDevices.length === 0 ? (
            <EmptyStateBlock
              title={t("devices.empty_title")}
              message={model.hasSubscription ? t("devices.empty_message_has_sub") : t("devices.empty_message_no_sub")}
            />
          ) : (
            animatedDevices.map(({ device, phase }) => (
              <div key={device.id} className="device-row-motion" data-phase={phase}>
                <DeviceRow
                  device={device}
                  formatIssuedAt={model.formatIssuedAt}
                  onConfirm={model.handleConfirmConnected}
                  onReplace={model.handleReplaceDevice}
                  onRevoke={model.setRevokeId}
                  onRename={openRename}
                  isConfirmingId={model.isConfirmingId}
                  isReplacingId={model.isReplacingId}
                />
              </div>
            ))
          )}
        </ListCard>
      </PageSection>

      {model.showSetupCard ? (
        <PageSection id="setup-section">
          <SetupCardContent
            step={model.setupStep}
            onIssueDevice={openAddWizard}
            canAddDevice={model.canAddDevice}
            isAddPending={model.isAddPending}
            issueActionLabel={model.issueActionLabel}
          />
        </PageSection>
      ) : null}

      {model.issuedConfig ? (
        <div ref={model.configSectionRef}>
          <PageSection id="config-section">
            <ConfigCardContent
              configText={model.configText}
              routeReason={model.routeReason}
              peerCreated={model.issuedConfig.peer_created}
              onCopy={model.handleCopyConfig}
              onDownload={model.handleDownloadConfig}
            />
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

      <Modal
        open={isAddWizardOpen}
        onClose={closeAddWizard}
        title={addWizardStep === "name" ? t("devices.wizard_title_name") : t("devices.wizard_title_install")}
        description={addWizardStep === "name" ? t("devices.wizard_description_name") : t("devices.wizard_description_install")}
        variant="plain"
        disableDismiss={model.isAddPending}
        footer={
          <>
            <Button type="button" variant="secondary" size="sm" onClick={closeAddWizard} disabled={model.isAddPending}>
              {t("devices.revoke_modal_cancel")}
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={addWizardStep === "name" ? handleAddWizardNext : handleAddWizardConfirm}
              status={model.isAddPending ? "loading" : "idle"}
              statusText={t("devices.wizard_creating")}
            >
              {addWizardStep === "name" ? t("devices.wizard_continue") : t("devices.wizard_create")}
            </Button>
          </>
        }
      >
        {addWizardStep === "name" ? (
          <div className="devices-add-wizard">
            <div className="devices-add-wizard-stepper" aria-hidden="true">
              <span className="devices-add-wizard-step devices-add-wizard-step--active" />
              <span className="devices-add-wizard-step" />
            </div>
            <Input
              type="text"
              label={t("devices.wizard_name_label")}
              description={t("devices.wizard_name_hint")}
              value={newDeviceName}
              onChange={(e) => setNewDeviceName(e.target.value.slice(0, DEVICE_NAME_MAX_LENGTH))}
              maxLength={DEVICE_NAME_MAX_LENGTH}
              placeholder={t("devices.wizard_name_placeholder")}
              aria-label={t("devices.wizard_name_label")}
            />
          </div>
        ) : (
          <div className="devices-add-wizard">
            <div className="devices-add-wizard-stepper" aria-hidden="true">
              <span className="devices-add-wizard-step devices-add-wizard-step--complete" />
              <span className="devices-add-wizard-step devices-add-wizard-step--active" />
            </div>
            <div className="devices-add-wizard-card">
              <p className="devices-add-wizard-kicker">{t("devices.wizard_install_kicker")}</p>
              <p className="devices-add-wizard-message">{t("devices.wizard_install_body")}</p>
              <ol className="devices-add-wizard-list">
                <li>{t("devices.wizard_install_step_download_app")}</li>
                <li>{t("devices.wizard_install_step_create_config")}</li>
                <li>{t("devices.wizard_install_step_import_config")}</li>
                <li>{t("devices.wizard_install_step_connect")}</li>
              </ol>
              <div className="devices-add-wizard-links">
                <Button variant="outline" size="sm" asChild>
                  <a href={AMNEZIA_VPN_IOS_URL} target="_blank" rel="noreferrer">
                    {t("devices.wizard_install_ios")}
                  </a>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a href={AMNEZIA_VPN_ANDROID_URL} target="_blank" rel="noreferrer">
                    {t("devices.wizard_install_android")}
                  </a>
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

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
              status={model.isRenamePending ? "loading" : "idle"}
              statusText={t("devices.menu_rename_device")}
              disabled={model.isRenamePending}
            >
              {t("devices.menu_rename_device")}
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

      <FooterHelp
        note="Having trouble?"
        linkLabel="View setup guide"
        onLinkClick={() => navigate("/support")}
      />
    </PageScaffold>
  );
}
