import { IconCircleX, IconDownload, IconMonitor, IconPencil, IconShield } from "@/design-system/icons";
import { Button } from "../../../components";
import { formatDate } from "@/lib/utils/format";
import { useTelegramHaptics } from "@/hooks";
import { useI18n } from "@/hooks/useI18n";
import { OverflowActionMenu, type OverflowActionMenuItem, RowItem } from "../../patterns";
import { DeviceStatusChip, type DeviceStatusVariant } from "./DeviceStatusChip";
import "./DeviceRow.css";

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

function buildMenuItems({
  deviceId,
  deviceStatus,
  onConfirm,
  onReplace,
  onRevoke,
  onRename,
  isConfirmingId,
  isReplacingId,
  hideConfirmAction,
  impact,
  t,
}: {
  deviceId: string;
  deviceStatus: "connected" | "idle" | "config_pending" | "revoked";
  onConfirm: (id: string) => void;
  onReplace: (id: string) => void;
  onRevoke: (id: string) => void;
  onRename?: (id: string) => void;
  isConfirmingId: string | null;
  isReplacingId: string | null;
  hideConfirmAction: boolean;
  impact: ReturnType<typeof useTelegramHaptics>["impact"];
  t: ReturnType<typeof useI18n>["t"];
}) {
  const showConfirm = deviceStatus === "idle" || deviceStatus === "config_pending";
  const statusLabel = deviceStatus === "connected"
    ? t("devices.menu_status_connected")
    : deviceStatus === "idle"
      ? t("devices.menu_status_idle")
      : deviceStatus === "config_pending"
        ? t("devices.menu_status_config_pending")
        : t("devices.menu_status_revoked");

  const menuItems: OverflowActionMenuItem[] = [];

  if (onRename) {
    menuItems.push({
      id: "rename",
      label: t("devices.menu_rename_device"),
      icon: <IconPencil size={15} strokeWidth={1.8} />,
      onSelect: () => {
        onRename(deviceId);
        try {
          impact("light");
        } catch {
          /* haptics may be unavailable */
        }
      },
    });
  }

  if (showConfirm && !hideConfirmAction) {
    menuItems.push({
      id: "confirm",
      label: isConfirmingId === deviceId ? t("devices.menu_confirming") : t("devices.menu_confirm_setup"),
      hint: statusLabel,
      icon: <IconShield size={15} strokeWidth={1.8} />,
      onSelect: () => {
        onConfirm(deviceId);
        try {
          impact("light");
        } catch {
          /* haptics may be unavailable */
        }
      },
      disabled: isConfirmingId === deviceId,
    });
  }

  menuItems.push(
    {
      id: "replace",
      label: isReplacingId === deviceId ? t("devices.menu_reissuing") : t("devices.menu_reissue_config"),
      icon: <IconDownload size={15} strokeWidth={1.8} />,
      onSelect: () => {
        onReplace(deviceId);
        try {
          impact("light");
        } catch {
          /* haptics may be unavailable */
        }
      },
      disabled: isReplacingId === deviceId,
    },
    {
      id: "revoke",
      label: t("devices.menu_revoke_device"),
      icon: <IconCircleX size={15} strokeWidth={1.8} />,
      onSelect: () => {
        onRevoke(deviceId);
        try {
          impact("light");
        } catch {
          /* haptics may be unavailable */
        }
      },
      danger: true,
      dividerBefore: true,
    },
  );

  return {
    menuItems,
    statusLabel,
  };
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
  const { impact } = useTelegramHaptics();
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
  const { menuItems, statusLabel } = buildMenuItems({
    deviceId: device.id,
    deviceStatus: status,
    onConfirm,
    onReplace,
    onRevoke,
    onRename,
    isConfirmingId,
    isReplacingId,
    hideConfirmAction: showInlineConfirm,
    impact,
    t,
  });
  const menuLabel = `${title} · ${statusLabel}`;

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
          <OverflowActionMenu
            ariaLabel={t("devices.menu_trigger_aria")}
            className="device-menu-btn"
            menuLabel={menuLabel}
            onTriggerClick={() => impact("light")}
            items={menuItems}
          />
        </>
      )}
    />
  );
}
