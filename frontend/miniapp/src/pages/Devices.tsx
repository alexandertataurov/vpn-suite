import { SessionMissing } from "@/components";
import { useCallback, useEffect, useRef, useState } from "react";
import { IconPlus } from "@/design-system/icons";
import {
  AddDeviceWizardContent,
  CardRow,
  ConfigCardContent,
  DeviceRow,
  DeviceHeroCard,
  FallbackScreen,
  FooterHelp,
  Skeleton,
  SkeletonList,
  Button,
  ConfirmModal,
  InlineAlert,
  Modal,
  PageHeader,
  PageScaffold,
  PageLayout,
  PageSection,
  Input,
  SectionLabel,
  usePrefersReducedMotion,
  Stack,
  SetupCardContent,
  getMotionDurationMs,
} from "@/design-system";
import { useTelegramMainButton } from "@/hooks";
import { useDevicesPageModel } from "@/page-models";
import { useI18n } from "@/hooks";
import { AMNEZIA_VPN_ANDROID_URL, AMNEZIA_VPN_IOS_URL } from "@/lib";
import { useLocation, useNavigate } from "react-router-dom";

const DEVICE_NAME_MAX_LENGTH = 128;
type AddDeviceWizardStep = "name" | "install";
type AnimatedDeviceEntry = {
  device: ReturnType<typeof useDevicesPageModel>["activeDevices"][number];
  phase: "entering" | "idle" | "exiting";
};

export function DevicesPage() {
  const model = useDevicesPageModel();
  const navigate = useNavigate();
  const location = useLocation();
  const { activeDevices, handleRenameDevice } = model;
  const { t } = useI18n();
  const prefersReducedMotion = usePrefersReducedMotion();
  const listMotionMs = getMotionDurationMs("panel", prefersReducedMotion);
  const [renameDeviceId, setRenameDeviceId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [isAddWizardOpen, setIsAddWizardOpen] = useState(false);
  const [addWizardStep, setAddWizardStep] = useState<AddDeviceWizardStep>("name");
  const [newDeviceName, setNewDeviceName] = useState("");
  const hasAutoOpenedFromIssuePath = useRef(false);
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
  useEffect(() => {
    if (
      location.pathname === "/devices/issue" &&
      model.canAddDevice &&
      !model.isAddPending &&
      !hasAutoOpenedFromIssuePath.current
    ) {
      hasAutoOpenedFromIssuePath.current = true;
      setIsAddWizardOpen(true);
      setAddWizardStep("name");
      setNewDeviceName("");
    }
    if (location.pathname !== "/devices/issue") {
      hasAutoOpenedFromIssuePath.current = false;
    }
  }, [location.pathname, model.canAddDevice, model.isAddPending]);

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
        <PageLayout scrollable={false}>
          <PageHeader
            title={model.header.title}
            subtitle={model.header.subtitle}
            onBack={() => navigate(-1)}
            backAriaLabel={t("common.back_aria")}
          />
          <Stack gap="4">
            <Skeleton variant="card" height={160} />
            <Skeleton variant="line" height={44} />
            <Skeleton variant="line" width="40%" />
            <SkeletonList lines={3} />
          </Stack>
        </PageLayout>
      </PageScaffold>
    );
  }

  return (
    <PageScaffold>
      <PageLayout scrollable={false}>
      <PageHeader
        title={model.header.title}
        subtitle={model.header.subtitle}
        onBack={() => navigate(-1)}
        backAriaLabel={t("common.back_aria")}
      />
      {model.planRequiredAlert ? (
        <InlineAlert
          variant="warning"
          label={model.planRequiredAlert.title}
          message={model.planRequiredAlert.body}
          className="devices-plan-required-alert"
          action={{
            label: model.planRequiredAlert.ctaLabel,
            onClick: () => navigate(model.planRequiredAlert!.to),
          }}
        />
      ) : null}

      <DeviceHeroCard
        devicesUsed={model.activeDevices.length}
        devicesTotal={model.deviceLimit}
        setupPending={model.pendingConnectionCount}
        trafficUsed={model.trafficUsedLabel}
      />

      <Button
        type="button"
        variant="primary"
        fullWidth
        status={model.isAddPending ? "loading" : "idle"}
        statusText={t("devices.wizard_creating")}
        onClick={openAddWizard}
        disabled={!model.canAddDevice || model.isAddPending}
        aria-label={t("devices.add_new_device")}
        startIcon={<IconPlus size={16} strokeWidth={2} aria-hidden />}
      >
        {t("devices.add_new_device")}
      </Button>

      <SectionLabel label={t("devices.section_devices_title")} />
      <div id="devices-section">
        {(model.isDeviceLimitError || model.showUpgradeCta) ? (
          <InlineAlert
            variant="warning"
            label={model.deviceLimitUpsellCopy?.title ?? t("devices.limit_reached_default_title")}
            message={model.deviceLimitUpsellCopy?.body ?? t("devices.limit_reached_default_message")}
            action={{
              label: model.deviceLimitUpsellCopy?.ctaLabel ?? t("devices.limit_reached_default_cta"),
              onClick: () => {
                navigate(model.upgradeTargetTo);
                model.handleUpgradePlanClick();
              },
            }}
          />
        ) : model.issueErrorMessage ? (
          <InlineAlert
            variant="error"
            label={t("devices.issue_error_title")}
            message={model.issueErrorMessage}
          />
        ) : null}

        <CardRow className="devices-list-card">
          {model.activeDevices.length === 0 ? (
            <div className="card-row-empty devices-empty-card">
              {t("devices.empty_title")}
            </div>
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
        </CardRow>
      </div>

      {model.hasSubscription && model.showSetupCard ? (
        <div id="setup-section">
          <SetupCardContent
            step={model.setupStep}
            onIssueDevice={openAddWizard}
            canAddDevice={model.canAddDevice}
            isAddPending={model.isAddPending}
            issueActionLabel={model.issueActionLabel}
          />
        </div>
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
        isOpen={model.revokeId !== null}
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
        isOpen={isAddWizardOpen}
        onClose={closeAddWizard}
        title={addWizardStep === "name" ? t("devices.wizard_title_name") : t("devices.wizard_title_install")}
        subtitle={addWizardStep === "name" ? t("devices.wizard_description_name") : t("devices.wizard_description_install")}
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
        <AddDeviceWizardContent
          step={addWizardStep}
          nameSlot={
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
          }
          installKicker={t("devices.wizard_install_kicker")}
          installMessage={t("devices.wizard_install_body")}
          installSteps={[
            t("devices.wizard_install_step_download_app"),
            t("devices.wizard_install_step_create_config"),
            t("devices.wizard_install_step_import_config"),
            t("devices.wizard_install_step_connect"),
          ]}
          storeLinks={
            <>
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
            </>
          }
        />
      </Modal>

      <Modal
        isOpen={renameDeviceId !== null}
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
        note={t("footer.having_trouble")}
        linkLabel={t("footer.view_setup_guide")}
        onLinkClick={() => navigate("/support")}
      />
      </PageLayout>
    </PageScaffold>
  );
}
