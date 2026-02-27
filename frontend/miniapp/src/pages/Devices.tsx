import { useState } from "react";
import { Panel, Button, DeviceCard, Skeleton, SkeletonList, useToast, EmptyState, InlineAlert, ConfirmModal } from "@vpn-suite/shared/ui";
import type { WebAppIssueDeviceResponse } from "@vpn-suite/shared/types";
import { useSession } from "../hooks/useSession";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getWebappToken, webappApi } from "../api/client";
import { useTelegramHaptics } from "../hooks/useTelegramHaptics";

export function DevicesPage() {
  const hasToken = !!getWebappToken();
  const { data, isLoading, error } = useSession(hasToken);
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const [issuedConfig, setIssuedConfig] = useState<WebAppIssueDeviceResponse | null>(null);
  const [revokeId, setRevokeId] = useState<string | null>(null);
  const { impact, notify } = useTelegramHaptics();

  const issueMutation = useMutation({
    mutationFn: () => webappApi.post<WebAppIssueDeviceResponse>("/webapp/devices/issue", {}),
    onSuccess: (res) => {
      setIssuedConfig(res);
      queryClient.invalidateQueries({ queryKey: ["webapp", "me"] });
      if (res.peer_created) {
        addToast("Device added and activated", "success");
        notify("success");
      } else {
        addToast("Device created. Server sync pending. If VPN fails, retry later or contact support.", "info");
      }
    },
    onError: () => addToast("Failed to add device", "error"),
  });

  const activeSub = data?.subscriptions?.find((s) => s.status === "active");
  const activeDevices = data?.devices?.filter((d) => !d.revoked_at) ?? [];
  const deviceLimit = activeSub?.device_limit ?? null;

  const revokeMutation = useMutation({
    mutationFn: async () => {
      if (!revokeId) return;
      await webappApi.post(`/webapp/devices/${revokeId}/revoke`);
    },
    onSuccess: () => {
      addToast("Device revoked", "success");
       notify("success");
      setRevokeId(null);
      queryClient.invalidateQueries({ queryKey: ["webapp", "me"] });
    },
    onError: () => {
      addToast("Failed to revoke device", "error");
      setRevokeId(null);
    },
  });

  if (!hasToken) {
    return (
      <div className="page-content">
        <h1 className="miniapp-page-title">My devices</h1>
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
        <h1 className="miniapp-page-title">My devices</h1>
        <InlineAlert
          variant="error"
          title="Could not load devices"
          message="We could not load your devices. Please try again or reopen from Telegram."
        />
      </div>
    );
  }
  if (isLoading) {
    return (
      <div className="page-content">
        <Skeleton height={32} />
        <SkeletonList lines={3} />
      </div>
    );
  }

  return (
    <div className="page-content">
      <div className="miniapp-page-header">
        <div>
          <h1 className="miniapp-page-title">My devices</h1>
          <p className="miniapp-page-subtitle">Issue and manage VPN profiles</p>
        </div>
      </div>
      {deviceLimit != null && (
        <p className="fs-sm text-muted mb-md">
          Devices: <strong>{activeDevices.length}</strong> / <strong>{deviceLimit}</strong>
        </p>
      )}
      {activeSub && (
        <div className="mb-md">
          <Button size="lg" loading={issueMutation.isPending} disabled={issueMutation.isPending} onClick={() => issueMutation.mutate()}>
            Add device
          </Button>
        </div>
      )}
      {issuedConfig && (
        <Panel className="card mb-lg">
          <h2 className="card-title">Your config</h2>
          <p className="empty-state-description">Copy the config and import it in AmneziaVPN. Shown only once.</p>
          {!issuedConfig.peer_created && (
            <p className="text-warning mb-md" role="status">
              Your device is registered here; the VPN server may need a moment to add it. If connection fails, try again later or contact support.
            </p>
          )}
          <pre className="config-block">{issuedConfig.config_awg ?? issuedConfig.config ?? issuedConfig.config_wg_obf ?? issuedConfig.config_wg ?? ""}</pre>
        </Panel>
      )}
      <ul className="device-card-list">
        {data?.devices?.map((d) => (
          <li key={d.id}>
            <DeviceCard
              id={d.id}
              name={d.device_name}
              status={d.revoked_at ? "revoked" : "active"}
              issuedAt={d.issued_at}
              shortId={d.id.slice(0, 8)}
              primaryAction={
                !d.revoked_at ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setRevokeId(d.id)}
                  >
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
          description="Issue a device to get your VPN config for AmneziaVPN."
          actions={
            activeSub ? (
              <Button
                size="md"
                onClick={() => issueMutation.mutate()}
                loading={issueMutation.isPending}
              >
                Add first device
              </Button>
            ) : null
          }
        />
      )}
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
  );
}
