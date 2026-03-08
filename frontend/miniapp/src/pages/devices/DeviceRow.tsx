import { IconSmartphone } from "@/design-system";
import { MissionOperationArticle } from "@/design-system";
import { DeviceRowActions } from "../DeviceRowActions";

export interface DeviceRowProps {
  device: {
    id: string;
    device_name?: string | null;
    platform?: string | null;
    status?: string | null;
    issued_at: string;
  };
  formatIssuedAt: (value: string) => string;
  onConfirm: (id: string) => void;
  onReplace: (id: string) => void;
  onRevoke: (id: string) => void;
  isConfirmingId: string | null;
  isReplacingId: string | null;
}

/** Reusable device list row: icon, title, description, actions. */
export function DeviceRow({
  device,
  formatIssuedAt,
  onConfirm,
  onReplace,
  onRevoke,
  isConfirmingId,
  isReplacingId,
}: DeviceRowProps) {
  const status = device.status ?? "config_pending";
  const statusLabel = status === "connected" ? "Connected" : status === "idle" ? "Idle" : "Config pending";
  const tone: "green" | "amber" | "blue" = status === "connected" ? "green" : status === "idle" ? "amber" : "blue";
  const desc = [
    statusLabel,
    device.platform ? ` · ${device.platform}` : "",
    ` · Issued ${formatIssuedAt(device.issued_at)}`,
  ].join("");

  return (
    <MissionOperationArticle
      tone={tone}
      iconTone={tone}
      icon={<IconSmartphone size={20} strokeWidth={1.6} />}
      title={device.device_name || device.id.slice(0, 8)}
      description={<span className="miniapp-tnum">{desc}</span>}
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
