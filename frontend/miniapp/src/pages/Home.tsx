import { Panel, HealthBadge, ProfileCard, Skeleton, ButtonLink, InlineAlert } from "@vpn-suite/shared/ui";
import { useSession } from "../hooks/useSession";
import { getWebappToken } from "../api/client";
import { useApiHealth } from "../hooks/useApiHealth";

export function HomePage() {
  const hasToken = !!getWebappToken();
  const { data, isLoading, error } = useSession(hasToken);
  const { error: healthError } = useApiHealth();
  const activeSub = data?.subscriptions?.find((s) => s.status === "active");
  const activeDevices = data?.devices?.filter((d) => !d.revoked_at) ?? [];
  const status = activeSub ? "healthy" : "warning";
  const statusLabel = activeSub ? "VPN protection active" : "VPN not active";

  const deviceLimit = activeSub?.device_limit ?? null;
  const usedDevices = activeDevices.length;
  const remainingDevices =
    deviceLimit != null ? Math.max(deviceLimit - usedDevices, 0) : null;

  const expiryDate = activeSub ? new Date(activeSub.valid_until) : null;
  let expiryLabel = "";
  if (expiryDate) {
    const now = new Date();
    const diffMs = expiryDate.getTime() - now.getTime();
    const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (days <= 0) {
      expiryLabel = "Expired";
    } else if (days === 1) {
      expiryLabel = "Renews in 1 day";
    } else if (days <= 7) {
      expiryLabel = `Renews in ${days} days`;
    } else {
      expiryLabel = `Renews in ${days} days`;
    }
  }

  if (isLoading) {
    return (
      <div className="page-content">
        <Skeleton height={32} />
        <Skeleton variant="card" />
      </div>
    );
  }

  if (!hasToken) {
    return (
      <div className="page-content">
        <InlineAlert
          variant="warning"
          title="Session missing"
          message="Your Telegram session is not active. Close and reopen the mini app from the bot."
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-content">
        <InlineAlert
          variant="error"
          title="Could not load account status"
          message="We could not load your VPN status. Please try again or reopen from Telegram."
        />
      </div>
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
      <div className="miniapp-page-header">
        <div>
          <h1 className="miniapp-page-title">
            {activeSub ? "VPN protection: Active" : "VPN protection: Not active"}
          </h1>
          <p className="miniapp-page-subtitle">
            {activeSub
              ? "Your subscription is active and devices with configs can connect."
              : "You need an active subscription and device config to use the VPN."}
          </p>
        </div>
      </div>
      <div className="mb-lg">
        <HealthBadge status={status} label={statusLabel} />
      </div>
      {activeSub && (
        <Panel className="card">
          <div className="flex justify-between items-center mb-md">
            <div>
              <p className="text-muted fs-sm mb-0">Subscription</p>
              <p className="mt-0">
                Plan <span className="text-primary">{activeSub.plan_id}</span>
              </p>
            </div>
            {expiryLabel && (
              <p className="text-warning mb-0 fs-sm">{expiryLabel}</p>
            )}
          </div>
          {deviceLimit != null && (
            <p className="mb-0 fs-sm">
              Devices: <strong>{usedDevices}</strong>
              {"/"}
              <strong>{deviceLimit}</strong>{" "}
              {remainingDevices != null && remainingDevices === 0
                ? "(limit reached)"
                : ""}
            </p>
          )}
        </Panel>
      )}
      {activeSub ? (
        <ProfileCard
          planId={activeSub.plan_id}
          validUntil={activeSub.valid_until}
          status="active"
        />
      ) : (
        <Panel>
          <p>No active subscription.</p>
        </Panel>
      )}
      <div className="miniapp-cta mt-xl">
        {!activeSub ? (
          <ButtonLink to="/plans" kind="connect">Choose plan</ButtonLink>
        ) : activeDevices.length === 0 ? (
          <ButtonLink to="/devices" kind="connect">Add device</ButtonLink>
        ) : (
          <ButtonLink to="/devices" kind="connect">My devices</ButtonLink>
        )}
      </div>
    </div>
  );
}
