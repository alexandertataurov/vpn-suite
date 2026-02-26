import { ExternalLink, RefreshCw, Wrench } from "lucide-react";
import { Drawer, Button, useToast } from "@vpn-suite/shared/ui";
import { formatDate, getErrorMessage } from "@vpn-suite/shared";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { DeviceOut } from "@vpn-suite/shared/types";
import { api } from "../../api/client";
import { DEVICES_KEY, DEVICES_SUMMARY_KEY } from "../../api/query-keys";

export interface DeviceDetailDrawerProps {
  deviceId: string | null;
  open: boolean;
  onClose: () => void;
  onReissue?: (device: DeviceOut) => void;
}

export function DeviceDetailDrawer({
  deviceId,
  open,
  onClose,
  onReissue,
}: DeviceDetailDrawerProps) {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const { data: device, isLoading, error } = useQuery<DeviceOut>({
    queryKey: ["device", deviceId],
    queryFn: ({ signal }) => api.get<DeviceOut>(`/devices/${deviceId!}`, { signal }),
    enabled: open && !!deviceId,
  });

  const reconcileMutation = useMutation({
    mutationFn: (id: string) => api.post<{ reconciled: boolean }>(`/devices/${id}/reconcile`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DEVICES_KEY });
      queryClient.invalidateQueries({ queryKey: DEVICES_SUMMARY_KEY });
      queryClient.invalidateQueries({ queryKey: ["device", deviceId] });
      addToast("Peer reconciled on node", "success");
    },
    onError: (err) => addToast(getErrorMessage(err, "Reconcile failed"), "error"),
  });

  const copyDebugBundle = () => {
    if (!device) return;
    const bundle = {
      device_id: device.id,
      device_name: device.device_name,
      user_id: device.user_id,
      user_email: device.user_email,
      server_id: device.server_id,
      allowed_ips: device.allowed_ips,
      revoked_at: device.revoked_at,
      apply_status: device.apply_status,
      last_applied_at: device.last_applied_at,
      last_error: device.last_error,
      telemetry: device.telemetry,
      issued_configs: device.issued_configs?.map((c) => ({
        id: c.id,
        profile_type: c.profile_type,
        consumed_at: c.consumed_at,
        created_at: c.created_at,
      })),
      fetched_at: new Date().toISOString(),
    };
    const text = JSON.stringify(bundle, null, 2);
    navigator.clipboard.writeText(text).then(
      () => addToast("Debug bundle copied to clipboard", "success"),
      () => addToast("Failed to copy", "error")
    );
  };

  return (
    <Drawer open={open} onClose={onClose} title={device ? `${device.device_name ?? "Device"} · ${device.id.slice(0, 8)}` : "Device details"} width={480}>
      {isLoading && <p className="text-sm text-neutral-500">Loading…</p>}
      {error && <p className="text-sm text-red-600">{getErrorMessage(error, "Failed to load device")}</p>}
      {device && !isLoading && !error && (
        <div className="flex flex-col gap-4">
          <section>
            <h3 className="text-xs font-semibold uppercase text-neutral-500 mb-1">Device</h3>
            <p className="text-sm mono">{device.id}</p>
            <p className="text-sm">User: {device.user_id} {device.user_email ? `· ${device.user_email}` : ""}</p>
            <p className="text-sm">IP: {device.allowed_ips ?? "—"} {!device.allowed_ips?.trim() && <span className="text-amber-600">⚠</span>}</p>
            <p className="text-sm">Node: <span className="mono">{device.server_id}</span></p>
          </section>
          {(device.apply_status || device.last_error) && (
            <section>
              <h3 className="text-xs font-semibold uppercase text-neutral-500 mb-1">Apply state</h3>
              <p className="text-sm">Status: {device.apply_status ?? "—"}</p>
              {device.last_applied_at && <p className="text-sm">Last applied: {formatDate(device.last_applied_at)}</p>}
              {device.last_error && <p className="text-sm text-amber-600" title={device.last_error}>Error: {device.last_error}</p>}
            </section>
          )}
          {device.telemetry && (
            <section>
              <h3 className="text-xs font-semibold uppercase text-neutral-500 mb-1">Peer state (data plane)</h3>
              <p className="text-sm">Handshake: {device.telemetry.handshake_age_sec != null ? `${device.telemetry.handshake_age_sec}s ago` : "—"}</p>
              <p className="text-sm">Rx/Tx: {device.telemetry.transfer_rx_bytes ?? "—"} / {device.telemetry.transfer_tx_bytes ?? "—"}</p>
              <p className="text-sm">AllowedIPs on node: {device.telemetry.allowed_ips_on_node ?? "—"}</p>
              <p className="text-sm">Peer present: {device.telemetry.peer_present ? "Yes" : "No"}</p>
              <p className="text-sm">Reconciliation: {device.telemetry.reconciliation_status}</p>
            </section>
          )}
          <section>
            <h3 className="text-xs font-semibold uppercase text-neutral-500 mb-1">Config history</h3>
            {device.issued_configs?.length ? (
              <ul className="text-sm space-y-1">
                {device.issued_configs.map((c) => (
                  <li key={c.id} className="mono text-xs">
                    {c.profile_type} · {c.consumed_at ? "used" : "pending"} · {formatDate(c.created_at)}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-neutral-500">No configs</p>
            )}
          </section>
          <section className="flex flex-wrap gap-2 border-t pt-3">
            {!device.revoked_at && onReissue && (
              <Button variant="secondary" size="sm" onClick={() => { onReissue(device); onClose(); }}>
                <RefreshCw aria-hidden size={14} />
                Reissue config
              </Button>
            )}
            {!device.revoked_at && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => deviceId && reconcileMutation.mutate(deviceId)}
                disabled={reconcileMutation.isPending}
              >
                Reconcile peer now
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={copyDebugBundle}>
              <Wrench aria-hidden size={14} />
              Copy debug bundle
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link to={`/servers/${device.server_id}`} onClick={onClose}>
                <ExternalLink aria-hidden size={14} />
                Open node telemetry
              </Link>
            </Button>
          </section>
        </div>
      )}
    </Drawer>
  );
}
