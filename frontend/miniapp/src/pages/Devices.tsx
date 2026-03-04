import { useEffect, useRef, useState } from "react";
import {
  Panel,
  Button,
  DeviceCard,
  Skeleton,
  SkeletonList,
  useToast,
  EmptyState,
  ConfirmModal,
  PageScaffold,
  PageHeader,
  PageSection,
  InlineAlert,
  ActionRow,
  Caption,
} from "../ui";
import { getErrorMessage } from "@vpn-suite/shared";
import { useTelegramMainButton } from "../hooks/useTelegramMainButton";
import type { WebAppIssueDeviceResponse } from "@vpn-suite/shared/types";
import { useSession } from "../hooks/useSession";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useWebappToken, webappApi } from "../api/client";
import { useTelegramHaptics } from "../hooks/useTelegramHaptics";
import { useTrackScreen } from "../hooks/useTrackScreen";
import { useTelemetry } from "../hooks/useTelemetry";
import { FallbackScreen, SessionMissing } from "@/components";
import { useOnlineStatus } from "../hooks/useOnlineStatus";

export function DevicesPage() {
  const hasToken = !!useWebappToken();
  const isOnline = useOnlineStatus();
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useSession(hasToken);
  const { addToast } = useToast();
  const [issuedConfig, setIssuedConfig] = useState<WebAppIssueDeviceResponse | null>(null);
  const [revokeId, setRevokeId] = useState<string | null>(null);
  const configSectionRef = useRef<HTMLDivElement | null>(null);
  const { impact, notify } = useTelegramHaptics();
  const activeSub = data?.subscriptions?.find((s) => s.status === "active");
  const activeDevices = data?.devices?.filter((d) => !d.revoked_at) ?? [];
  useTrackScreen("devices", activeSub?.plan_id ?? null);
  const { track } = useTelemetry(activeSub?.plan_id ?? null);

  const issueMutation = useMutation({
    mutationFn: () => webappApi.post<WebAppIssueDeviceResponse>("/webapp/devices/issue", {}),
    onSuccess: (res) => {
      setIssuedConfig(res);
      queryClient.invalidateQueries({ queryKey: ["webapp", "me"] });
      track("config_download", { screen_name: "devices" });
      if (res.peer_created) {
        addToast("Device added and activated", "success");
        notify("success");
      } else {
        addToast("Device created. Server sync pending. If VPN fails, retry later or contact support.", "info");
      }
    },
    onError: (err) => {
      const msg = getErrorMessage(err, "Failed to add device");
      addToast(msg, "error");
      notify("error");
    },
  });

  const deviceLimit = activeSub?.device_limit ?? null;

  const revokeMutation = useMutation({
    mutationFn: async () => {
      if (!revokeId) return;
      await webappApi.post(`/webapp/devices/${revokeId}/revoke`);
    },
    onSuccess: () => {
      addToast("Device revoked", "success");
      notify("success");
      track("device_removal", { screen_name: "devices" });
      setRevokeId(null);
      queryClient.invalidateQueries({ queryKey: ["webapp", "me"] });
    },
    onError: () => {
      addToast("Failed to revoke device", "error");
      setRevokeId(null);
    },
  });

  useTelegramMainButton(null);
  const canAddDevice = activeSub && (deviceLimit == null || activeDevices.length < deviceLimit) && isOnline;

  useEffect(() => {
    if (issuedConfig && configSectionRef.current) {
      configSectionRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [issuedConfig]);

  if (!hasToken) {
    return <SessionMissing />;
  }
  if (error) {
    return (
      <FallbackScreen
        title="Could not load devices"
        message="We could not load your devices. Please try again or contact support."
        onRetry={() => queryClient.invalidateQueries({ queryKey: ["webapp", "me"] })}
      />
    );
  }
  if (isLoading) {
    return (
      <PageScaffold>
        <PageHeader title="My devices" subtitle="Issue and manage VPN profiles" />
        <Skeleton className="skeleton-h-lg" />
        <SkeletonList lines={3} />
      </PageScaffold>
    );
  }

  return (
    <PageScaffold>
      <div className="content-reveal">
        <PageHeader title="My devices" subtitle="Issue and manage VPN profiles" />
      {deviceLimit != null && (
        <Caption tabular>
          Devices: <strong>{activeDevices.length}</strong> / <strong>{deviceLimit}</strong>
        </Caption>
      )}

      {issuedConfig && (
        <div ref={configSectionRef}>
          <PageSection title="Your config" description="Copy and import into AmneziaVPN. This is shown only once.">
            <Panel className="card">
              {!issuedConfig.peer_created && (
                <InlineAlert
                  variant="warning"
                  title="Server sync pending"
                  message="Your device is registered. If connection fails, retry later or contact support."
                />
              )}
              <pre className="config-block">{issuedConfig.config_awg ?? issuedConfig.config ?? issuedConfig.config_wg_obf ?? issuedConfig.config_wg ?? ""}</pre>
            </Panel>
          </PageSection>
        </div>
      )}

      <PageSection title="Devices" description="Add or revoke device profiles.">
        {issueMutation.isError && (
          <InlineAlert
            variant="error"
            title="Could not add device"
            message={getErrorMessage(issueMutation.error, "Try again or contact support.")}
          />
        )}
        {canAddDevice && (
          <ActionRow fullWidth>
            <Button
              variant="primary"
              size="lg"
              onClick={() => {
                impact("medium");
                issueMutation.mutate();
              }}
              loading={issueMutation.isPending}
              disabled={issueMutation.isPending}
            >
              {issueMutation.isPending ? "Adding…" : "Add device"}
            </Button>
          </ActionRow>
        )}

        <ul className="device-card-list">
          {data?.devices?.map((d) => ( // key=
            <li key={d.id}>
              <DeviceCard
                id={d.id}
                name={d.device_name}
                status={d.revoked_at ? "revoked" : "active"}
                issuedAt={d.issued_at}
                shortId={d.id.slice(0, 8)}
                primaryAction={
                  !d.revoked_at ? (
                    <Button variant="ghost" size="sm" onClick={() => setRevokeId(d.id)}>
                      Revoke
                    </Button>
                  ) : null
                }
              />
            </li>
          ))}
        </ul>

        {!data?.devices?.length && (
          <EmptyState
            title="No devices yet"
            description="Tap Add device above to get your VPN config for AmneziaVPN."
          />
        )}
      </PageSection>

      <ConfirmModal
        open={revokeId !== null}
        onClose={() => !revokeMutation.isPending && setRevokeId(null)}
        onConfirm={() => revokeMutation.mutate()}
        title="Revoke device?"
        message="Revoking a device stops its VPN config from working. You can issue a new device later if needed."
        confirmLabel="Revoke device"
        cancelLabel="Cancel"
        variant="danger"
        loading={revokeMutation.isPending}
      />
      </div>
    </PageScaffold>
  );
}
