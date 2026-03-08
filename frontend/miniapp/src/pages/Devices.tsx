import { useLocation } from "react-router-dom";
import {
  IconAlertTriangle,
  Skeleton,
  ConfirmModal,
  PageFrame,
  PageSection,
  SummaryHero,
  MissionAlert,
  MissionCard,
  MissionChip,
  MissionPrimaryButton,
  MissionPrimaryLink,
  MissionSecondaryLink,
  ButtonRow,
  LimitStrip,
  SessionMissing,
  FallbackScreen,
} from "@/design-system";
import { useTelegramMainButton } from "@/hooks/useTelegramMainButton";
import { useDevicesPageModel } from "@/page-models";
import { SetupCardContent, ConfigCardContent, DeviceRow } from "./devices";

export function DevicesPage() {
  const location = useLocation();
  const model = useDevicesPageModel();
  const fromOnboarding = (location.state as { fromOnboarding?: boolean } | null)?.fromOnboarding === true;

  useTelegramMainButton(null);

  if (model.pageState.status === "empty") {
    return <SessionMissing />;
  }

  if (model.pageState.status === "error") {
    return (
      <FallbackScreen
        title={model.pageState.title ?? "Could not load devices"}
        message={model.pageState.message ?? "We could not load your devices. Please try again or contact support."}
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
    <PageFrame title={model.header.title} className="devices-page home-page">
      {fromOnboarding && (
        <PageSection className="onboarding-return-banner">
          <MissionSecondaryLink to="/onboarding" state={{ fromOnboarding: true }}>
            ← Back to setup
          </MissionSecondaryLink>
        </PageSection>
      )}
      <SummaryHero
        {...model.summaryHero}
        className="stagger-1"
        pendingLabel={model.pendingConnectionCount > 0 ? "Pending confirmation" : null}
      />

      {model.showSetupCard ? (
        <PageSection
          title="Setup"
          action={<MissionChip tone={model.setupChip.tone} className="section-meta-chip">{model.setupChip.label}</MissionChip>}
          className="stagger-2"
        >
          <MissionCard tone={model.setupCardTone} className="module-card">
            <SetupCardContent
              step={model.setupStep}
              onIssueDevice={model.handleIssueDevice}
              canAddDevice={model.canAddDevice}
              isAddPending={model.isAddPending}
              issueActionLabel={model.issueActionLabel}
              recommendedRoute={model.recommendedRoute}
            />
          </MissionCard>
        </PageSection>
      ) : null}

      {model.issuedConfig ? (
        <div ref={model.configSectionRef}>
          <PageSection
            title="Your config"
            action={<MissionChip tone={model.configBadge.tone} className="section-meta-chip">{model.configBadge.label}</MissionChip>}
            className="stagger-2"
          >
          <MissionCard tone="amber" className="module-card">
            <ConfigCardContent
              configText={model.configText}
              routeReason={model.routeReason}
              peerCreated={model.issuedConfig.peer_created}
              onCopy={model.handleCopyConfig}
              onDownload={model.handleDownloadConfig}
              recommendedRoute={model.recommendedRoute}
            />
          </MissionCard>
        </PageSection>
        </div>
      ) : null}

      <PageSection
        title="Active Devices"
        action={<MissionChip tone={model.activeBadge.tone} className="section-meta-chip miniapp-tnum">{model.activeBadge.label}</MissionChip>}
        className="stagger-3"
      >
        {(model.isDeviceLimitError || model.showUpgradeCta) ? (
          <LimitStrip
            title="Device limit reached"
            message="No free slots. Upgrade or revoke an old device."
            action={(
              <MissionPrimaryLink to={model.upgradeTargetTo} onClick={model.handleUpgradePlanClick}>
                Upgrade
              </MissionPrimaryLink>
            )}
            icon={<IconAlertTriangle size={20} strokeWidth={1.8} />}
          />
        ) : model.issueErrorMessage ? (
          <MissionAlert
            tone="error"
            title="Could not issue device"
            message={model.issueErrorMessage}
          />
        ) : null}
        {model.hasSubscription && model.canAddDevice && model.activeDevices.length > 0 ? (
          <ButtonRow>
            <MissionPrimaryButton
              onClick={model.handleIssueDevice}
              disabled={model.isAddPending}
              aria-label="Add device"
            >
              {model.isAddPending ? "Issuing…" : model.issueActionLabel}
            </MissionPrimaryButton>
            <MissionSecondaryLink to="/servers">Routing</MissionSecondaryLink>
          </ButtonRow>
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
            <MissionAlert
              tone="info"
              title="No devices yet"
              message={model.hasSubscription
                ? "Issue your first device to receive a VPN config for AmneziaVPN."
                : "Activate a plan first, then come back here to issue your first config."}
            />
          ) : null}
        </div>
      </PageSection>

      <ConfirmModal
        open={model.revokeId !== null}
        onClose={() => !model.isRevoking && model.setRevokeId(null)}
        onConfirm={model.handleConfirmRevoke}
        title="Revoke device?"
        message="Revoking a device stops its VPN config from working. You can issue a new one later."
        confirmLabel="Revoke device"
        cancelLabel="Cancel"
        variant="danger"
        loading={model.isRevoking}
      />
    </PageFrame>
  );
}
