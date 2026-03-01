import { useEffect, useState } from "react";
import { Modal, Button, Input, Select, Checkbox, Label, useToast } from "@/design-system";
import { getErrorMessage } from "@vpn-suite/shared";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { DeviceOut, DeviceUpdate, UserList, ServerOut } from "@vpn-suite/shared/types";
import { api } from "../../api/client";
import { DEVICES_KEY, DEVICES_SUMMARY_KEY, USERS_KEY } from "../../api/query-keys";
import { useServerListFull } from "../../hooks/useServerList";

export interface EditDeviceModalProps {
  open: boolean;
  onClose: () => void;
  device: DeviceOut | null;
  onSaved?: (updated: DeviceOut) => void;
}

export function EditDeviceModal({ open, onClose, device, onSaved }: EditDeviceModalProps) {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const [device_name, setDeviceName] = useState("");
  const [user_id, setUserId] = useState<number | "">("");
  const [server_id, setServerId] = useState("");
  const [allowed_ips, setAllowedIps] = useState("");
  const [suspended, setSuspended] = useState(false);
  const [revoked, setRevoked] = useState(false);
  const [data_limit_bytes, setDataLimitBytes] = useState<string>("");
  const [expires_at, setExpiresAt] = useState("");

  const { data: fullDevice, isLoading: deviceLoading } = useQuery({
    queryKey: ["device", device?.id],
    queryFn: ({ signal }) => api.get<DeviceOut>(`/devices/${device!.id}`, { signal }),
    enabled: open && !!device?.id,
  });
  const { data: usersData } = useQuery({
    queryKey: [...USERS_KEY, "limit", 500],
    queryFn: ({ signal }) => api.get<UserList>("/users?limit=500&offset=0", { signal }),
    enabled: open,
  });
  const serversFull = useServerListFull();
  const servers = serversFull.data?.items ?? [];

  const formDevice = fullDevice ?? device;

  useEffect(() => {
    if (!formDevice) return;
    setDeviceName(formDevice.device_name ?? "");
    setUserId(formDevice.user_id ?? "");
    setServerId(formDevice.server_id ?? "");
    setAllowedIps(formDevice.allowed_ips ?? "");
    setSuspended(!!formDevice.suspended_at);
    setRevoked(!!formDevice.revoked_at);
    setDataLimitBytes(formDevice.data_limit_bytes != null ? String(formDevice.data_limit_bytes) : "");
    setExpiresAt(formDevice.expires_at ? formDevice.expires_at.slice(0, 16) : "");
  }, [formDevice]);

  const updateMutation = useMutation({
    mutationFn: (body: DeviceUpdate) => api.patch<DeviceOut>(`/devices/${device!.id}`, body),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: DEVICES_KEY });
      queryClient.invalidateQueries({ queryKey: DEVICES_SUMMARY_KEY });
      queryClient.invalidateQueries({ queryKey: ["device", device?.id] });
      addToast("Device updated", "success");
      onSaved?.(updated);
      onClose();
    },
    onError: (err) => addToast(getErrorMessage(err, "Update failed"), "error"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!device || !formDevice) return;
    const body: DeviceUpdate = {};
    if (device_name !== (formDevice.device_name ?? "")) body.device_name = device_name || null;
    if (user_id !== "" && user_id !== formDevice.user_id) body.user_id = Number(user_id);
    if (server_id && server_id !== formDevice.server_id) body.server_id = server_id;
    if (allowed_ips !== (formDevice.allowed_ips ?? "")) body.allowed_ips = allowed_ips.trim() || null;
    if (suspended !== !!formDevice.suspended_at) body.suspended_at = suspended ? new Date().toISOString() : null;
    if (revoked !== !!formDevice.revoked_at) body.revoked_at = revoked ? new Date().toISOString() : null;
    if (data_limit_bytes !== "" && Number(data_limit_bytes) !== (formDevice.data_limit_bytes ?? 0))
      body.data_limit_bytes = data_limit_bytes === "" ? null : Number(data_limit_bytes);
    if (expires_at !== (formDevice.expires_at ? formDevice.expires_at.slice(0, 16) : ""))
      body.expires_at = expires_at ? new Date(expires_at).toISOString() : null;
    if (Object.keys(body).length === 0) {
      onClose();
      return;
    }
    updateMutation.mutate(body);
  };

  const users = usersData?.items ?? [];

  const footer = (
    <>
      <Button type="button" variant="ghost" onClick={onClose} disabled={updateMutation.isPending}>
        Cancel
      </Button>
      <Button type="submit" form="edit-device-form" variant="primary" loading={updateMutation.isPending}>
        Save
      </Button>
    </>
  );

  return (
    <Modal open={open && !!device} onClose={onClose} title="Edit device" footer={footer}>
      {deviceLoading && <p className="text-sm text-neutral-500">Loading device…</p>}
      {device && !deviceLoading && formDevice && (
        <form id="edit-device-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <Label htmlFor="edit-device-name">Device name</Label>
            <Input
              id="edit-device-name"
              value={device_name}
              onChange={(e) => setDeviceName(e.target.value)}
              placeholder="Optional name"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="edit-device-user">User</Label>
            <Select
              id="edit-device-user"
              options={[
                { value: "", label: "—" },
                ...users.map((u) => ({ value: String(u.id), label: u.email ?? `User ${u.id}` })),
              ]}
              value={String(user_id)}
              onChange={(v) => setUserId(v === "" ? "" : Number(v))}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="edit-device-node">Node (server)</Label>
            <Select
              id="edit-device-node"
              options={[
                { value: "", label: "—" },
                ...servers.map((s) => ({ value: s.id, label: (s as ServerOut).name ?? s.id })),
              ]}
              value={server_id}
              onChange={setServerId}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="edit-device-ip">IP (allowed_ips)</Label>
            <Input
              id="edit-device-ip"
              value={allowed_ips}
              onChange={(e) => setAllowedIps(e.target.value)}
              placeholder="10.8.1.7/32"
              className="mt-1"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Status</Label>
            <Checkbox
              label="Suspended"
              checked={suspended}
              onChange={(e) => setSuspended(e.target.checked)}
            />
            <Checkbox
              label="Revoked"
              checked={revoked}
              onChange={(e) => setRevoked(e.target.checked)}
            />
          </div>
          <div>
            <Label htmlFor="edit-device-limit">Data limit (bytes)</Label>
            <Input
              id="edit-device-limit"
              type="number"
              min={0}
              value={data_limit_bytes}
              onChange={(e) => setDataLimitBytes(e.target.value)}
              placeholder="Optional"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="edit-device-expires">Expires at</Label>
            <Input
              id="edit-device-expires"
              type="datetime-local"
              value={expires_at}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="mt-1"
            />
          </div>
          <p className="text-xs text-neutral-500">
            Configs and telemetry are read-only. Change node then use Reconcile or Reissue if needed.
          </p>
        </form>
      )}
    </Modal>
  );
}
