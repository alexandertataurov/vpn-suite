import { Link } from "react-router-dom";
import { Panel, Button, ProfileCard, Skeleton } from "@vpn-suite/shared/ui";
import { useSession } from "../hooks/useSession";

export function ProfilePage() {
  const { data, isLoading } = useSession(true);
  const activeSub = data?.subscriptions?.find((s) => s.status === "active");

  if (isLoading) {
    return (
      <div className="page-content">
        <Skeleton variant="card" />
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
