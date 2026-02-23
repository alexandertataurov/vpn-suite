import { Panel, HealthBadge, ProfileCard, Skeleton, ButtonLink } from "@vpn-suite/shared/ui";
import { useSession } from "../hooks/useSession";

export function HomePage() {
  const { data, isLoading } = useSession(true);
  const activeSub = data?.subscriptions?.find((s) => s.status === "active");
  const activeDevices = data?.devices?.filter((d) => !d.revoked_at) ?? [];
  const status = activeSub ? "healthy" : "warning";
  const statusLabel = activeSub ? "Subscription active" : "No subscription";

  if (isLoading) {
    return (
      <div className="page-content">
        <Skeleton height={32} />
        <Skeleton variant="card" />
      </div>
    );
  }

  return (
    <div className="page-content">
      <div className="miniapp-page-header">
        <div>
          <h1 className="miniapp-page-title">Overview</h1>
          <p className="miniapp-page-subtitle">Account status</p>
        </div>
      </div>
      <div className="mb-lg">
        <HealthBadge status={status} label={statusLabel} />
      </div>
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
