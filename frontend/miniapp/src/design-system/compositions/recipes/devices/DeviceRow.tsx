import { IconMonitor } from "@/design-system/icons";
import { Button } from "../../../components";
import { formatDate } from "@/lib/utils/format";
import { useI18n } from "@/hooks";
import { RowItem } from "../../patterns";
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
  className?: string;
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

function formatPlatformLabel(platform?: string | null) {
  if (!platform) return null;

  return platform
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
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
  className,
}: DeviceRowProps) {
  const { t, locale } = useI18n();
  const dateLocale = locale === "ru" ? "ru-RU" : "en-US";
  const status = normalizeDeviceStatus(device.status);
  const metaParts: string[] = [];

  if (device.last_seen_handshake_at) {
    metaParts.push(t("devices.meta_last_activity", { date: formatDate(device.last_seen_handshake_at, dateLocale) }));
  }

  metaParts.push(t("devices.meta_issued", { date: formatIssuedAt(device.issued_at) }));

  const title = device.device_name?.trim() || `Device #${device.id.slice(-6)}`;
  const chipStatus = mapChipStatus(status);
  const platformLabel = formatPlatformLabel(device.platform);
  const showInlineConfirm = status === "idle" || status === "config_pending";

  return (
    <RowItem
      className={["device-row", "row-item--static", "row-item--rich-meta", "row-item--stacked-actions", className].filter(Boolean).join(" ")}
      icon={<IconMonitor size={15} strokeWidth={2} aria-hidden />}
      iconVariant="neutral"
      showChevron={false}
      label={(
        <div className="device-row__topline">
          <span className="device-row__title-text">{title}</span>
          <DeviceStatusChip status={chipStatus} />
        </div>
      )}
      subtitle={(
        <div className="device-row__meta">
          {platformLabel ? <span className="device-platform-pill">{platformLabel}</span> : null}
          <span className="device-meta miniapp-tnum">{metaParts.join(" · ")}</span>
        </div>
      )}
      right={(
        <>
          {showInlineConfirm ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="device-inline-action"
              onClick={() => onConfirm(device.id)}
              status={isConfirmingId === device.id ? "loading" : "idle"}
              statusText={t("devices.menu_confirming")}
              disabled={isConfirmingId === device.id}
            >
              {t("devices.menu_confirm_setup")}
            </Button>
          ) : null}
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
            hideConfirmAction={showInlineConfirm}
          />
        </>
      )}
    />
  );
}
