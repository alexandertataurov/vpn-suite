import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Panel,
  Button,
  ButtonLink,
  Skeleton,
  ConfirmModal,
  useToast,
  PageScaffold,
  PageHeader,
  PageSection,
  ActionRow,
  Body,
  Caption,
} from "../ui";
import type { WebAppSubscriptionOffersResponse } from "@vpn-suite/shared/types";
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
      <PageScaffold>
        <PageHeader title="Settings" subtitle="Preferences and account" />
        <Skeleton variant="card" />
      </PageScaffold>
    );
  }

  const activeDevices = data?.devices?.filter((d) => !d.revoked_at) ?? [];

  return (
    <PageScaffold>
      <PageHeader title="Settings" subtitle="Preferences and account" />

      <PageSection title="Preferences" description="General miniapp preferences.">
        <Panel className="card hud-brackets">
          <Body>Language: System default</Body>
          <Caption>Notifications: Expiry reminders via bot</Caption>
        </Panel>
      </PageSection>

      <PageSection title="Account actions">
        <Panel className="card hud-brackets">
          <Body>Manage devices and referral settings from quick links below.</Body>
          <ActionRow fullWidth>
            <ButtonLink to="/devices" variant="secondary" size="md">
              Manage devices
            </ButtonLink>
            <ButtonLink to="/referral" variant="secondary" size="md">
              Referral link
            </ButtonLink>
          </ActionRow>
        </Panel>
      </PageSection>

      {offersLoading && (
        <Panel className="card">
          <Skeleton className="skeleton-h-md" />
          <Skeleton className="skeleton-h-sm" />
        </Panel>
      )}
      {offersError && (
        <Panel className="card">
          <Body>Subscription options could not be loaded. Try again later.</Body>
          <ActionRow fullWidth>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => queryClient.invalidateQueries({ queryKey: ["webapp", "subscription", "offers"] })}
            >
              Try again
            </Button>
          </ActionRow>
        </Panel>
      )}
      {offers && !offersError && (offers.can_pause || offers.can_resume) && (
        <PageSection title="Manage subscription" description={`Loyalty discount: ${offers.discount_percent}%`}>
          <Panel className="card">
            <ActionRow fullWidth>
              <Button
                variant="secondary"
                size="md"
                disabled={!offers.can_pause || pauseMutation.isPending}
                loading={pauseMutation.isPending}
                onClick={() => pauseMutation.mutate()}
              >
                Pause
              </Button>
              <Button
                variant="secondary"
                size="md"
                disabled={!offers.can_resume || resumeMutation.isPending}
                loading={resumeMutation.isPending}
                onClick={() => resumeMutation.mutate()}
              >
                Resume
              </Button>
              <Button
                variant="danger"
                size="md"
                onClick={() => setCancelOpen(true)}
                disabled={cancelMutation.isPending}
              >
                Cancel subscription
              </Button>
            </ActionRow>
          </Panel>
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
    </PageScaffold>
  );
}
