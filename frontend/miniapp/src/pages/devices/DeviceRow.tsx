import { IconSmartphone, MissionOperationArticle, StatusChip } from "@/design-system";
import { useI18n } from "@/hooks/useI18n";
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
  onRename?: (id: string) => void;
  isConfirmingId: string | null;
  isReplacingId: string | null;
}

/** Reusable device list row: icon, title, description, actions. */
function normalizeDeviceStatus(status?: string | null): "connected" | "idle" | "config_pending" | "revoked" {
  if (status === "connected" || status === "active") return "connected";
  if (status === "idle") return "idle";
  if (status === "revoked") return "revoked";
  return "config_pending";
}

function toIntlLocale(locale: "en" | "ru"): string {
  return locale === "ru" ? "ru-RU" : "en-US";
}

function formatLastSeenDefault(
  value: string,
  locale: "en" | "ru",
  formatAbsoluteDate: (value: string) => string,
): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  const diff = Date.now() - date.getTime();
  const mins = Math.max(0, Math.floor(diff / 60_000));
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  const formatter = new Intl.RelativeTimeFormat(toIntlLocale(locale), { numeric: "auto", style: "short" });
  if (mins < 1) return formatter.format(0, "minute");
  if (mins < 60) return formatter.format(-mins, "minute");
  if (hours < 24) return formatter.format(-hours, "hour");
  if (days < 7) return formatter.format(-days, "day");
  return formatAbsoluteDate(value);
}

export function DeviceRow({
  device,
  formatIssuedAt,
  formatLastSeen,
  onConfirm,
  onReplace,
  onRevoke,
  onRename,
  isConfirmingId,
  isReplacingId,
}: DeviceRowProps) {
  const { t, locale } = useI18n();
  const status = normalizeDeviceStatus(device.status);
  const resolvedFormatLastSeen =
    formatLastSeen ?? ((value: string) => formatLastSeenDefault(value, locale, formatIssuedAt));
  const statusLabel =
    status === "connected"
      ? t("devices.menu_status_connected")
      : status === "idle"
        ? t("devices.menu_status_idle")
        : status === "config_pending"
          ? t("devices.menu_status_config_pending")
          : t("devices.menu_status_revoked");
  const tone: "green" | "amber" | "red" = status === "idle" ? "amber" : status === "revoked" ? "red" : "green";
  const metaParts: string[] = [];
  if (device.last_seen_handshake_at) {
    metaParts.push(`${t("devices.row_last_sync_prefix")} ${resolvedFormatLastSeen(device.last_seen_handshake_at)}`);
  }
  metaParts.push(`${t("devices.row_issued_prefix")} ${formatIssuedAt(device.issued_at)}`);
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
                  ? "pending"
                  : status === "config_pending"
                    ? "active"
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
          deviceStatus={status}
          onConfirm={onConfirm}
          onReplace={onReplace}
          onRevoke={onRevoke}
          onRename={onRename}
          isConfirmingId={isConfirmingId}
          isReplacingId={isReplacingId}
        />
      )}
    />
  );
}
