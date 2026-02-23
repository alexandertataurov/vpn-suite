import { useState } from "react";
import { Panel, Button, DeviceCard, Skeleton, SkeletonList, useToast } from "@vpn-suite/shared/ui";
import type { WebAppIssueDeviceResponse } from "@vpn-suite/shared/types";
import { useSession } from "../hooks/useSession";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { webappApi } from "../api/client";

export function DevicesPage() {
  const { data, isLoading, error } = useSession(true);
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const [issuedConfig, setIssuedConfig] = useState<WebAppIssueDeviceResponse | null>(null);

  const issueMutation = useMutation({
    mutationFn: () => webappApi.post<WebAppIssueDeviceResponse>("/webapp/devices/issue", {}),
    onSuccess: (res) => {
      setIssuedConfig(res);
      queryClient.invalidateQueries({ queryKey: ["webapp", "me"] });
      if (res.peer_created) {
        addToast("Device added and activated", "success");
      } else {
        addToast("Device created. Server sync pending. If VPN fails, retry later or contact support.", "info");
      }
    },
    onError: () => addToast("Failed to add device", "error"),
  });

  const activeSub = data?.subscriptions?.find((s) => s.status === "active");

  if (error) {
    return (
      <div className="page-content">
        <h1>My devices</h1>
        <p className="text-error">Failed to load. Reopen from Telegram.</p>
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
            />
          </li>
        ))}
      </ul>
      {(!data?.devices?.length) && <p className="table-empty">No devices</p>}
    </div>
  );
}
