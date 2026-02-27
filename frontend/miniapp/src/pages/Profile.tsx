import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Panel,
  Button,
  ProfileCard,
  Skeleton,
  InlineAlert,
  ConfirmModal,
  useToast,
} from "@vpn-suite/shared/ui";
import type { WebAppSubscriptionOffersResponse } from "@vpn-suite/shared/types";
import { useSession } from "../hooks/useSession";
import { getWebappToken, webappApi } from "../api/client";

export function ProfilePage() {
  const hasToken = !!getWebappToken();
  const { data, isLoading, error } = useSession(hasToken);
  const activeSub = data?.subscriptions?.find((s) => s.status === "active");
  const activeDevices = data?.devices?.filter((d) => !d.revoked_at) ?? [];
  const deviceLimit = activeSub?.device_limit ?? null;
   const { addToast } = useToast();
  const [cancelOpen, setCancelOpen] = useState(false);

  const { data: offers } = useQuery<WebAppSubscriptionOffersResponse>({
    queryKey: ["webapp", "subscription", "offers"],
    queryFn: () => webappApi.get<WebAppSubscriptionOffersResponse>("/webapp/subscription/offers"),
    enabled: hasToken,
  });

  const pauseMutation = useMutation({
    mutationFn: () =>
      webappApi.post("/webapp/subscription/pause", {
        subscription_id: offers?.subscription_id,
      }),
    onSuccess: () => {
      addToast("Subscription paused", "success");
    },
    onError: () => {
      addToast("Could not pause subscription", "error");
    },
  });

  const resumeMutation = useMutation({
    mutationFn: () =>
      webappApi.post("/webapp/subscription/resume", {
        subscription_id: offers?.subscription_id,
      }),
    onSuccess: () => {
      addToast("Subscription resumed", "success");
    },
    onError: () => {
      addToast("Could not resume subscription", "error");
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () =>
      webappApi.post("/webapp/subscription/cancel", {
        subscription_id: offers?.subscription_id,
        reason_code: "user_request",
        discount_accepted: offers?.discount_percent ? true : false,
      }),
    onSuccess: () => {
      addToast("Subscription cancellation requested", "success");
    },
    onError: () => {
      addToast("Could not cancel subscription", "error");
    },
  });

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
      {offers && (
        <Panel className="mt-lg">
          <h2 className="card-title">Manage subscription</h2>
          <p className="empty-state-description">
            Pause instead of cancel, or keep your tunnel active with a retention discount of{" "}
            {offers.discount_percent}%.
          </p>
          <div className="flex gap-sm mt-sm">
            <Button
              variant="secondary"
              size="sm"
              disabled={!offers.can_pause || pauseMutation.isPending}
              loading={pauseMutation.isPending}
              onClick={() => pauseMutation.mutate()}
            >
              Pause for now
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={!offers.can_resume || resumeMutation.isPending}
              loading={resumeMutation.isPending}
              onClick={() => resumeMutation.mutate()}
            >
              Resume
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => setCancelOpen(true)}
              disabled={cancelMutation.isPending}
            >
              Cancel
            </Button>
          </div>
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
      <ConfirmModal
        open={cancelOpen}
        onClose={() => !cancelMutation.isPending && setCancelOpen(false)}
        onConfirm={() => cancelMutation.mutate()}
        title="Cancel subscription?"
        message="Instead of cancelling, you can pause your VPN for a while or renew later with a loyalty discount. Are you sure you want to stop your secure tunnel now?"
        confirmLabel="Confirm cancel"
        cancelLabel="Keep subscription"
        variant="danger"
        loading={cancelMutation.isPending}
      />
    </div>
  );
}
