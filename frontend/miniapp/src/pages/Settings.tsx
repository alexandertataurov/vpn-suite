import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Panel,
  Button,
  ButtonLink,
  Skeleton,
  ConfirmModal,
  useToast,
  PageFrame,
  PageSection,
  ActionRow,
} from "../ui";
import type { WebAppSubscriptionOffersResponse } from "@/lib/types";
import { useSession } from "../hooks/useSession";
import { useWebappToken, webappApi } from "../api/client";
import { DangerZone, FallbackScreen, SessionMissing } from "@/components";
import { useTrackScreen } from "../hooks/useTrackScreen";

export function SettingsPage() {
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
      <PageFrame title="Control Settings" subtitle="Preferences and account operations">
        <Skeleton variant="card" />
      </PageFrame>
    );
  }

  const activeDevices = data?.devices?.filter((d) => !d.revoked_at) ?? [];

  return (
    <PageFrame title="Control Settings" subtitle="Preferences and account operations">

      <PageSection
        title="PREFERENCES"
        description="General miniapp preferences."
        action={<span className="chip cn section-meta-chip">LOCAL</span>}
      >
        <Panel variant="surface" className="card edge et module-card module-card--tight">
          <p className="type-body-sm">Language: System default</p>
          <p className="type-meta">Notifications: Expiry reminders via bot</p>
        </Panel>
      </PageSection>

      <PageSection title="ACCOUNT LINKS">
        <Panel variant="surface" className="card edge et module-card">
          <p className="type-body-sm">Manage devices and referral settings from quick links below.</p>
          <ActionRow fullWidth>
            <ButtonLink to="/devices" variant="secondary" size="md">
              MANAGE DEVICES
            </ButtonLink>
            <ButtonLink to="/referral" variant="secondary" size="md">
              REFERRAL LINK
            </ButtonLink>
          </ActionRow>
        </Panel>
      </PageSection>

      {offersLoading && (
        <Panel variant="surface" className="card edge et module-card">
          <Skeleton className="skeleton-h-md" />
          <Skeleton className="skeleton-h-sm" />
        </Panel>
      )}
      {offersError && (
        <Panel variant="surface" className="card edge et module-card">
          <p className="type-body-sm">Subscription options could not be loaded. Try again later.</p>
          <ActionRow fullWidth>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => queryClient.invalidateQueries({ queryKey: ["webapp", "subscription", "offers"] })}
            >
              TRY AGAIN
            </Button>
          </ActionRow>
        </Panel>
      )}
      {offers && !offersError && (offers.can_pause || offers.can_resume) && (
        <PageSection
          title="SUBSCRIPTION OPERATIONS"
          description={`Loyalty discount: ${offers.discount_percent}%`}
          action={<span className="chip ca section-meta-chip miniapp-tnum">{offers.discount_percent}%</span>}
        >
          <Panel variant="surface" className="card edge et module-card">
            <ActionRow fullWidth>
              <Button
                variant="secondary"
                size="md"
                disabled={!offers.can_pause || pauseMutation.isPending}
                loading={pauseMutation.isPending}
                onClick={() => pauseMutation.mutate()}
              >
                PAUSE
              </Button>
              <Button
                variant="secondary"
                size="md"
                disabled={!offers.can_resume || resumeMutation.isPending}
                loading={resumeMutation.isPending}
                onClick={() => resumeMutation.mutate()}
              >
                RESUME
              </Button>
              <Button
                variant="danger"
                size="md"
                onClick={() => setCancelOpen(true)}
                disabled={cancelMutation.isPending}
              >
                CANCEL SUBSCRIPTION
              </Button>
            </ActionRow>
          </Panel>
        </PageSection>
      )}

      {activeDevices.length > 0 && (
        <DangerZone
          title="RESET CONFIGS"
          description="Revoke all device configs. You will need to add devices again from the Devices tab."
          buttonLabel="RESET ALL CONFIGS"
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
