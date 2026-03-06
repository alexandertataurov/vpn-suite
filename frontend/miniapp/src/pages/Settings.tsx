import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { WebAppSubscriptionOffersResponse } from "@/lib/types";
import { useSession } from "@/hooks/useSession";
import { useWebappToken, webappApi } from "@/api/client";
import {
  FallbackScreen,
  Skeleton,
  ConfirmModal,
  useToast,
  PageFrame,
  PageSection,
  SectionDivider,
  AccountSummaryHero,
  DangerZone,
  MissionAlert,
  MissionCard,
  MissionChip,
  MissionOperationButton,
  MissionPrimaryButton,
  MissionSecondaryButton,
  SessionMissing,
} from "@/design-system";
import { useTrackScreen } from "@/hooks/useTrackScreen";

export function SettingsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const hasToken = !!useWebappToken();
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useSession(hasToken);
  const { addToast } = useToast();
  const [cancelOpen, setCancelOpen] = useState(false);
  const activeSub = data?.subscriptions?.find((s) => s.status === "active");
  useTrackScreen("settings", activeSub?.plan_id ?? null);

  const { data: offers, isLoading: offersLoading, error: offersError } = useQuery<WebAppSubscriptionOffersResponse>({
    queryKey: ["webapp", "subscription", "offers"],
    queryFn: () => webappApi.get<WebAppSubscriptionOffersResponse>("/webapp/subscription/offers"),
    enabled: hasToken,
  });

  const pauseMutation = useMutation({
    mutationFn: () => webappApi.post("/webapp/subscription/pause", { subscription_id: offers?.subscription_id }),
    onSuccess: () => {
      addToast("Subscription paused", "success");
      queryClient.invalidateQueries({ queryKey: ["webapp", "me"] });
    },
    onError: () => addToast("Could not pause subscription", "error"),
  });

  const resumeMutation = useMutation({
    mutationFn: () => webappApi.post("/webapp/subscription/resume", { subscription_id: offers?.subscription_id }),
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
      <PageFrame title="Settings" subtitle="Account and app controls" className="settings-page">
        <Skeleton variant="card" />
      </PageFrame>
    );
  }

  const activeDevices = data?.devices?.filter((d) => !d.revoked_at) ?? [];
  const planLabel = activeSub?.plan_id?.replace(/^plan_/, "") ?? "Free";

  return (
    <PageFrame title="Account" subtitle="Profile and app controls" className="settings-page">
      <AccountSummaryHero
        initial="A"
        name="Account"
        email="—"
        memberSince={undefined}
        badge={<div className="page-hd-badge g">{planLabel}</div>}
        className="stagger-1"
      />
      <SectionDivider label="Preferences" className="stagger-2" />
      <div className="stagger-3">
        <MissionCard tone="blue" className="module-card">
          <div className="data-grid">
            <div className="data-cell">
              <div className="dc-key">Language</div>
              <div className="dc-val teal">System default</div>
            </div>
            <div className="data-cell">
              <div className="dc-key">Notifications</div>
              <div className="dc-val">Expiry reminders via bot</div>
            </div>
          </div>
        </MissionCard>
      </div>
      <SectionDivider label="Account" className="stagger-4" />
      <div className="stagger-5 ops settings-ops">
          <MissionOperationButton
            tone="blue"
            icon={<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><rect x="5" y="2" width="14" height="20" rx="2" /><path d="M9 7h6M9 11h6M9 15h3" /></svg>}
            title="Devices"
            description={activeDevices.length > 0 ? `${activeDevices.length} active` : "No active configs"}
            onClick={() => navigate("/devices")}
          />
          <MissionOperationButton
            tone="green"
            icon={<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /></svg>}
            title="Plans & billing"
            description="Manage subscription and renewals"
            onClick={() => navigate("/plan")}
          />
          <MissionOperationButton
            tone="amber"
            icon={<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M4 12h16" /><path d="M12 4v16" /><circle cx="12" cy="12" r="8" /></svg>}
            title="Change server"
            description="Select route and region"
            onClick={() => navigate("/servers", { state: { from: location.pathname } })}
          />
          <MissionOperationButton
            tone="blue"
            icon={<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M10 14L6.5 17.5a3 3 0 1 1-4.2-4.2L5.8 9.8" /><path d="M14 10l3.5-3.5a3 3 0 1 1 4.2 4.2L18.2 14.2" /><path d="M8 16l8-8" /></svg>}
            title="Referral link"
            description="Invite friends and earn rewards"
            onClick={() => navigate("/referral", { state: { from: location.pathname } })}
          />
          <MissionOperationButton
            tone="red"
            icon={<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="9" /><path d="M12 8v4M12 16v.5" /></svg>}
            title="Support"
            description="Troubleshoot connection issues"
            onClick={() => navigate("/support")}
          />
      </div>

      {offersLoading && (
        <MissionCard tone="blue" className="module-card">
          <Skeleton className="skeleton-h-md" />
          <Skeleton className="skeleton-h-sm" />
        </MissionCard>
      )}
      {offersError && (
        <MissionCard tone="red" className="module-card">
          <MissionAlert
            tone="error"
            title="Subscription options unavailable"
            message="Subscription options could not be loaded. Try again later."
          />
          <div className="btn-row">
            <MissionSecondaryButton onClick={() => queryClient.invalidateQueries({ queryKey: ["webapp", "subscription", "offers"] })}>
              Try again
            </MissionSecondaryButton>
          </div>
        </MissionCard>
      )}
      {offers && !offersError && (offers.can_pause || offers.can_resume) && (
        <PageSection
          className="settings-section settings-section--subscription"
          title="Subscription operations"
          description={`Loyalty discount: ${offers.discount_percent}%`}
          action={<MissionChip tone="amber" className="section-meta-chip miniapp-tnum">{offers.discount_percent}%</MissionChip>}
        >
          <MissionCard tone="amber" className="module-card">
            <div className="btn-row">
              <MissionSecondaryButton
                disabled={!offers.can_pause || pauseMutation.isPending}
                onClick={() => pauseMutation.mutate()}
              >
                {pauseMutation.isPending ? "Pausing…" : "Pause"}
              </MissionSecondaryButton>
              <MissionSecondaryButton
                disabled={!offers.can_resume || resumeMutation.isPending}
                onClick={() => resumeMutation.mutate()}
              >
                {resumeMutation.isPending ? "Resuming…" : "Resume"}
              </MissionSecondaryButton>
            </div>
            <MissionPrimaryButton
              tone="danger"
              onClick={() => setCancelOpen(true)}
              disabled={cancelMutation.isPending}
            >
              Cancel subscription
            </MissionPrimaryButton>
          </MissionCard>
        </PageSection>
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
    </PageFrame>
  );
}
