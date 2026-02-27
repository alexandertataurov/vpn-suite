import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Panel,
  Button,
  Skeleton,
  InlineAlert,
  ConfirmModal,
  useToast,
} from "@vpn-suite/shared/ui";
import type { WebAppSubscriptionOffersResponse } from "@vpn-suite/shared/types";
import { useSession } from "../hooks/useSession";
import { getWebappToken, webappApi } from "../api/client";
import { DangerZone } from "../components/DangerZone";
import { FallbackScreen } from "../components/FallbackScreen";
import { SessionMissing } from "../components/SessionMissing";
import { useTrackScreen } from "../hooks/useTrackScreen";

export function SettingsPage() {
  const hasToken = !!getWebappToken();
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useSession(hasToken);
  const { addToast } = useToast();
  const [cancelOpen, setCancelOpen] = useState(false);
  const activeSub = data?.subscriptions?.find((s) => s.status === "active");
  useTrackScreen("settings", activeSub?.plan_id ?? null);

  const { data: offers } = useQuery<WebAppSubscriptionOffersResponse>({
    queryKey: ["webapp", "subscription", "offers"],
    queryFn: () => webappApi.get<WebAppSubscriptionOffersResponse>("/webapp/subscription/offers"),
    enabled: hasToken,
  });

  const pauseMutation = useMutation({
    mutationFn: () =>
      webappApi.post("/webapp/subscription/pause", { subscription_id: offers?.subscription_id }),
    onSuccess: () => {
      addToast("Subscription paused", "success");
      queryClient.invalidateQueries({ queryKey: ["webapp", "me"] });
    },
    onError: () => addToast("Could not pause subscription", "error"),
  });

  const resumeMutation = useMutation({
    mutationFn: () =>
      webappApi.post("/webapp/subscription/resume", { subscription_id: offers?.subscription_id }),
    onSuccess: () => {
      addToast("Subscription resumed", "success");
      queryClient.invalidateQueries({ queryKey: ["webapp", "me"] });
    },
    onError: () => addToast("Could not resume subscription", "error"),
  });

  const cancelMutation = useMutation({
    mutationFn: () =>
      webappApi.post("/webapp/subscription/cancel", {
        subscription_id: offers?.subscription_id,
        reason_code: "user_request",
        discount_accepted: !!offers?.discount_percent,
      }),
    onSuccess: () => {
      addToast("Subscription cancellation requested", "success");
      queryClient.invalidateQueries({ queryKey: ["webapp", "me"] });
      setCancelOpen(false);
    },
    onError: () => addToast("Could not cancel subscription", "error"),
  });

  const revokeAllMutation = useMutation({
    mutationFn: async () => {
      const devices = data?.devices?.filter((d) => !d.revoked_at) ?? [];
      for (const d of devices) {
        await webappApi.post(`/webapp/devices/${d.id}/revoke`);
      }
    },
    onSuccess: () => {
      addToast("All configs revoked", "success");
      queryClient.invalidateQueries({ queryKey: ["webapp", "me"] });
    },
    onError: () => addToast("Failed to revoke configs", "error"),
  });

  if (!hasToken) {
    return <SessionMissing />;
  }
  if (error) {
    return (
      <FallbackScreen
        title="Could not load"
        message="We could not load settings. Please try again or contact support."
        onRetry={() => queryClient.invalidateQueries({ queryKey: ["webapp", "me"] })}
      />
    );
  }
  if (isLoading) {
    return (
      <div className="page-content">
        <h1 className="miniapp-page-title">Settings</h1>
        <Skeleton variant="card" />
      </div>
    );
  }

  const activeDevices = data?.devices?.filter((d) => !d.revoked_at) ?? [];

  return (
    <div className="page-content">
      <div className="miniapp-page-header">
        <div>
          <h1 className="miniapp-page-title">Settings</h1>
          <p className="miniapp-page-subtitle">Preferences and account</p>
        </div>
      </div>

      <Panel className="card mb-md">
        <h2 className="card-title">Language</h2>
        <p className="fs-sm text-muted mb-0">System default</p>
      </Panel>

      <Panel className="card mb-md">
        <h2 className="card-title">Notifications</h2>
        <p className="fs-sm text-muted mb-0">Expiry reminders via bot</p>
      </Panel>

      <Panel className="card mb-md">
        <h2 className="card-title">Security</h2>
        <p className="fs-sm mb-sm">Revoke device configs from the Devices tab if a config is compromised.</p>
        <Link to="/devices">
          <Button variant="secondary" size="sm">Manage devices</Button>
        </Link>
      </Panel>

      <Panel className="card mb-md">
        <h2 className="card-title">Invite friends</h2>
        <p className="fs-sm mb-sm">Share your referral link and get rewards.</p>
        <Link to="/referral">
          <Button variant="secondary" size="sm">Get referral link</Button>
        </Link>
      </Panel>

      {offers && (offers.can_pause || offers.can_resume) && (
        <Panel className="card mb-md">
          <h2 className="card-title">Manage subscription</h2>
          <p className="fs-sm mb-sm">Pause or resume. Loyalty discount: {offers.discount_percent}%.</p>
          <div className="flex gap-sm flex-wrap">
            <Button variant="secondary" size="sm" disabled={!offers.can_pause || pauseMutation.isPending} loading={pauseMutation.isPending} onClick={() => pauseMutation.mutate()}>
              Pause
            </Button>
            <Button variant="ghost" size="sm" disabled={!offers.can_resume || resumeMutation.isPending} loading={resumeMutation.isPending} onClick={() => resumeMutation.mutate()}>
              Resume
            </Button>
            <Button variant="danger" size="sm" onClick={() => setCancelOpen(true)} disabled={cancelMutation.isPending}>
              Cancel
            </Button>
          </div>
        </Panel>
      )}

      {activeDevices.length > 0 && (
        <DangerZone
          title="Reset configs"
          description="Revoke all device configs. You will need to add devices again from the Devices tab."
          buttonLabel="Reset all configs"
          confirmTitle="Reset all configs?"
          confirmMessage="This will revoke every device config. You can add new devices afterward."
          confirmLabel="Reset"
          cancelLabel="Cancel"
          onConfirm={() => revokeAllMutation.mutate()}
          loading={revokeAllMutation.isPending}
        />
      )}

      <ConfirmModal
        open={cancelOpen}
        onClose={() => !cancelMutation.isPending && setCancelOpen(false)}
        onConfirm={() => cancelMutation.mutate()}
        title="Cancel subscription?"
        message="You can pause instead or renew later with a discount. Are you sure?"
        confirmLabel="Confirm cancel"
        cancelLabel="Keep subscription"
        variant="danger"
        loading={cancelMutation.isPending}
      />
    </div>
  );
}
