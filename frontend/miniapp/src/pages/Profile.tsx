import { Link } from "react-router-dom";
import { Panel, Button, ProfileCard, Skeleton, InlineAlert } from "@vpn-suite/shared/ui";
import { useSession } from "../hooks/useSession";
import { getWebappToken } from "../api/client";

export function ProfilePage() {
  const hasToken = !!getWebappToken();
  const { data, isLoading, error } = useSession(hasToken);
  const activeSub = data?.subscriptions?.find((s) => s.status === "active");
  const activeDevices = data?.devices?.filter((d) => !d.revoked_at) ?? [];
  const deviceLimit = activeSub?.device_limit ?? null;

  if (isLoading) {
    return (
      <div className="page-content">
        <Skeleton variant="card" />
      </div>
    );
  }
  if (!hasToken) {
    return (
      <div className="page-content">
        <h1 className="miniapp-page-title">Profile</h1>
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
        <h1 className="miniapp-page-title">Profile</h1>
        <InlineAlert
          variant="error"
          title="Could not load profile"
          message="We could not load your profile. Please try again or reopen from Telegram."
        />
      </div>
    );
  }

  return (
    <div className="page-content">
      <div className="miniapp-page-header">
        <div>
          <h1 className="miniapp-page-title">Profile</h1>
          <p className="miniapp-page-subtitle">Subscription and referrals</p>
        </div>
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
      {deviceLimit != null && (
        <p className="fs-sm text-muted mt-sm">
          Devices: <strong>{activeDevices.length}</strong> / <strong>{deviceLimit}</strong>
        </p>
      )}
      <Panel className="mt-lg">
        <h2 className="card-title">Invite friend</h2>
        <p className="empty-state-description">Share your referral link and get rewards.</p>
        <Link to="/referral">
          <Button variant="secondary">Get referral link</Button>
        </Link>
      </Panel>
      <div className="nav-links mt-xl">
        <Link to="/plans">Plans</Link>
        <Link to="/devices">My devices</Link>
      </div>
    </div>
  );
}
