import { IconMonitor } from "@/design-system/icons";
import { formatDate } from "@/lib/utils/format";
import { useI18n } from "@/hooks";
import { DeviceRowActions } from "./DeviceRowActions";
import { DeviceStatusChip, type DeviceStatusVariant } from "./DeviceStatusChip";
import "./DeviceRecipes.css";

export interface DeviceRowProps {
  device: {
    id: string;
    device_name?: string | null;
    platform?: string | null;
    status?: string | null;
    issued_at: string;
    last_seen_handshake_at?: string | null;
  };
  formatIssuedAt: (value: string) => string;
  onConfirm: (id: string) => void;
  onReplace: (id: string) => void;
  onRevoke: (id: string) => void;
  onRename?: (id: string) => void;
  isConfirmingId: string | null;
  isReplacingId: string | null;
}

function normalizeDeviceStatus(status?: string | null): "connected" | "idle" | "config_pending" | "revoked" {
  if (status === "connected" || status === "active") return "connected";
  if (status === "idle") return "idle";
  if (status === "revoked") return "revoked";
  return "config_pending";
}

function mapChipStatus(status: "connected" | "idle" | "config_pending" | "revoked"): DeviceStatusVariant {
  if (status === "connected") return "imported";
  if (status === "revoked") return "inactive";
  return "pending";
}

export function DeviceRow({
  device,
  formatIssuedAt,
  onConfirm,
  onReplace,
  onRevoke,
  onRename,
  isConfirmingId,
  isReplacingId,
}: DeviceRowProps) {
  const { t } = useI18n();
  const status = normalizeDeviceStatus(device.status);
  const metaParts: string[] = [];

  if (device.last_seen_handshake_at) {
    metaParts.push(t("devices.meta_last_activity", { date: formatDate(device.last_seen_handshake_at, "en-US") }));
  }

  metaParts.push(t("devices.meta_issued", { date: formatIssuedAt(device.issued_at) }));

  const title = device.device_name || `Device #${device.id.slice(-6)}`;
  const chipStatus = mapChipStatus(status);

  return (
    <div className="row-item device-row">
      <div className="ri-icon ri-icon--default" aria-hidden>
        <IconMonitor size={15} strokeWidth={2} />
      </div>
      <div className="ri-body">
        <div className="ri-label">{title}</div>
        <DeviceStatusChip status={chipStatus} />
        <div className="ri-sub device-meta miniapp-tnum">{metaParts.join(" · ")}</div>
      </div>
      <div className="ri-right">
        <DeviceRowActions
          deviceId={device.id}
          subjectLabel={title}
          deviceStatus={status}
          onConfirm={onConfirm}
          onReplace={onReplace}
          onRevoke={onRevoke}
          onRename={onRename}
          isConfirmingId={isConfirmingId}
          isReplacingId={isReplacingId}
          className="device-menu-btn"
        />
      </div>
    </div>
  );
}
