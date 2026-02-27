import { Panel, Skeleton, ButtonLink, InlineAlert } from "@vpn-suite/shared/ui";
import { ConnectionStatusCard } from "../components/ConnectionStatusCard";
import { SubscriptionSummaryCard } from "../components/SubscriptionSummaryCard";
import { ExpiringSoonBanner } from "../components/ExpiringSoonBanner";
import { DeviceLimitNudge } from "../components/DeviceLimitNudge";
import { FallbackScreen } from "../components/FallbackScreen";
import { SessionMissing } from "../components/SessionMissing";
import { useSession } from "../hooks/useSession";
import { getWebappToken } from "../api/client";
import { useApiHealth } from "../hooks/useApiHealth";
import { useTrackScreen } from "../hooks/useTrackScreen";
import { useTelemetry } from "../hooks/useTelemetry";
import { useTelegramHaptics } from "../hooks/useTelegramHaptics";
export function HomePage() {
  const hasToken = !!getWebappToken();
  const { data, isLoading, error, refetch, isFetching } = useSession(hasToken);
  const { error: healthError } = useApiHealth();
  const activeSub = data?.subscriptions?.find((s) => s.status === "active");
  const activeDevices = data?.devices?.filter((d) => !d.revoked_at) ?? [];
  const { track } = useTelemetry(activeSub?.plan_id ?? null);
  const { impact } = useTelegramHaptics();

  useTrackScreen("home", activeSub?.plan_id ?? null);

  const connected = !!(activeSub && activeDevices.length > 0);
  const locationLabel = "Auto"; // Backend could add current_region to /me later
  const primaryActionLabel = activeSub ? "Manage Connection" : "Connect Now";
  const primaryActionTo = activeSub ? "/devices" : "/plan";

  const deviceLimit = activeSub?.device_limit ?? null;
  const usedDevices = activeDevices.length;
  let daysLeft = 0;
  let subStatus: "active" | "expired" | "none" = "none";
  if (activeSub) {
    subStatus = "active";
    const expiryDate = new Date(activeSub.valid_until);
    const now = new Date();
    daysLeft = Math.max(0, Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    if (daysLeft <= 0) subStatus = "expired";
  }

  const handlePrimaryCta = () => {
    impact("medium");
    track("cta_click", { cta_name: primaryActionLabel.replace(/\s+/g, "_").toLowerCase(), screen_name: "home" });
  };

  if (isLoading || (error && isFetching)) {
    return (
      <div className="page-content">
        <Skeleton height={32} />
        <Skeleton variant="card" />
      </div>
    );
  }

  if (!hasToken) {
    return <SessionMissing />;
  }

  if (error) {
    return (
      <FallbackScreen
        title="Could not load account status"
        message="We could not load your VPN status. Tap Try again to reload, or reopen the app from the Telegram bot if it keeps failing."
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="page-content">
      {healthError && (
        <InlineAlert
          variant="warning"
          title="Service may be degraded"
          message="We detected a backend issue. VPN service may be temporarily degraded."
          className="mb-md"
        />
      )}
      {activeSub && daysLeft <= 7 && <ExpiringSoonBanner daysLeft={daysLeft} />}
      {activeSub && deviceLimit != null && usedDevices >= deviceLimit - 1 && (
        <DeviceLimitNudge used={usedDevices} limit={deviceLimit} />
      )}
      <ConnectionStatusCard
        connected={connected}
        locationLabel={locationLabel}
        primaryActionLabel={primaryActionLabel}
        primaryActionTo={primaryActionTo}
        onPrimaryClick={handlePrimaryCta}
      />
      <div className="miniapp-stats-row">
        <span className="miniapp-stat"><strong>99.9%</strong> Uptime</span>
        <span className="miniapp-stat"><strong>90+</strong> Servers</span>
        <span className="miniapp-stat"><strong>No</strong> Logs</span>
      </div>
      <SubscriptionSummaryCard
        planId={activeSub?.plan_id ?? "—"}
        daysLeft={daysLeft}
        status={subStatus}
        deviceCount={usedDevices}
        deviceLimit={deviceLimit ?? undefined}
      />
      <h2 className="miniapp-section-heading">Why VPN?</h2>
      <div className="miniapp-feature-grid">
        <Panel className="card miniapp-feature-card">
          <span className="miniapp-feature-icon" aria-hidden>🔒</span>
          <h3 className="miniapp-feature-title">AES-256 Encryption</h3>
          <p className="miniapp-feature-desc">Military-grade encryption for your traffic.</p>
        </Panel>
        <Panel className="card miniapp-feature-card">
          <span className="miniapp-feature-icon" aria-hidden>📡</span>
          <h3 className="miniapp-feature-title">Kill Switch</h3>
          <p className="miniapp-feature-desc">Block traffic if the VPN drops.</p>
        </Panel>
        <Panel className="card miniapp-feature-card">
          <span className="miniapp-feature-icon" aria-hidden>👁</span>
          <h3 className="miniapp-feature-title">No Logs</h3>
          <p className="miniapp-feature-desc">We don’t store your activity.</p>
        </Panel>
        <Panel className="card miniapp-feature-card">
          <span className="miniapp-feature-icon" aria-hidden>📱</span>
          <h3 className="miniapp-feature-title">Multi-device</h3>
          <p className="miniapp-feature-desc">Use on several devices per plan.</p>
        </Panel>
      </div>
      <div className="miniapp-quick-actions">
        {activeSub && (
          <>
            <ButtonLink to="/devices" variant="secondary">
              {activeDevices.length === 0 ? "Add device" : "Get config"}
            </ButtonLink>
            <ButtonLink to="/servers" variant="secondary">
              Change location
            </ButtonLink>
          </>
        )}
        {!activeSub && (
          <ButtonLink to="/plan" variant="secondary">
            Choose a plan
          </ButtonLink>
        )}
        <ButtonLink to="/referral" variant="secondary">
          Invite friends
        </ButtonLink>
        <ButtonLink to="/support" variant="secondary">
          Contact support
        </ButtonLink>
      </div>
    </div>
  );
}
