import { IconSmartphone, MissionOperationArticle, StatusChip } from "@/design-system";
import { DeviceRowActions } from "../DeviceRowActions";

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
  formatLastSeen?: (value: string) => string;
  onConfirm: (id: string) => void;
  onReplace: (id: string) => void;
  onRevoke: (id: string) => void;
  isConfirmingId: string | null;
  isReplacingId: string | null;
}

/** Reusable device list row: icon, title, description, actions. */
function formatLastSeenDefault(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60_000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function DeviceRow({
  device,
  formatIssuedAt,
  formatLastSeen = formatLastSeenDefault,
  onConfirm,
  onReplace,
  onRevoke,
  isConfirmingId,
  isReplacingId,
}: DeviceRowProps) {
  const status = device.status ?? "config_pending";
  const statusLabel = status === "connected" ? "Setup confirmed" : status === "idle" ? "Setup incomplete" : status === "config_pending" ? "Config ready" : "Revoked";
  const tone: "green" | "amber" | "blue" = status === "connected" ? "green" : status === "idle" ? "amber" : "blue";
  const metaParts: string[] = [];
  if (device.last_seen_handshake_at) {
    metaParts.push(`Last sync ${formatLastSeen(device.last_seen_handshake_at)}`);
  }
  metaParts.push(`Issued ${formatIssuedAt(device.issued_at)}`);
  const metaLine = metaParts.join(" · ");

  return (
    <MissionOperationArticle
      tone={tone}
      iconTone={tone}
      icon={<IconSmartphone size={20} strokeWidth={1.6} />}
      title={device.device_name || `Device #${device.id.slice(-6)}`}
      description={(
        <span className="device-row-meta miniapp-tnum">
          <StatusChip
            variant={
              status === "connected"
                ? "active"
                : status === "idle"
                  ? "info"
                  : status === "config_pending"
                    ? "pend"
                    : "offline"
            }
          >
            {statusLabel}
          </StatusChip>
          <span className="device-row-meta-text">{metaLine}</span>
        </span>
      )}
      trailing={(
        <DeviceRowActions
          deviceId={device.id}
          deviceStatus={status as "connected" | "idle" | "config_pending" | "revoked"}
          onConfirm={onConfirm}
          onReplace={onReplace}
          onRevoke={onRevoke}
          isConfirmingId={isConfirmingId}
          isReplacingId={isReplacingId}
        />
      )}
    />
  );
}
