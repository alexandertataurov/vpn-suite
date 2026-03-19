import type { OverflowActionMenuItem } from "../../patterns";
import { OverflowActionMenu } from "../../patterns";
import { IconCircleX, IconDownload, IconPencil, IconShield } from "@/design-system/icons";
import { useTelegramHaptics } from "@/hooks";
import { useI18n } from "@/hooks";

export interface DeviceRowActionsProps {
  deviceId: string;
  deviceStatus: "connected" | "idle" | "config_pending" | "revoked";
  onConfirm: (id: string) => void;
  onReplace: (id: string) => void;
  onRevoke: (id: string) => void;
  onRename?: (id: string) => void;
  isConfirmingId: string | null;
  isReplacingId: string | null;
  className?: string;
}

export function DeviceRowActions({
  deviceId,
  deviceStatus,
  onConfirm,
  onReplace,
  onRevoke,
  onRename,
  isConfirmingId,
  isReplacingId,
  className,
}: DeviceRowActionsProps) {
  const { impact } = useTelegramHaptics();
  const { t } = useI18n();
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

  if (showConfirm) {
    menuItems.push({
      id: "confirm",
      label: isConfirmingId === deviceId ? "Confirming…" : t("devices.menu_confirm_setup"),
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
      label: isReplacingId === deviceId ? "Reissuing…" : t("devices.menu_reissue_config"),
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

  return (
    <OverflowActionMenu
      ariaLabel={t("devices.menu_trigger_aria")}
      className={className}
      menuLabel={statusLabel}
      onTriggerClick={() => impact("light")}
      items={menuItems}
    />
  );
}
