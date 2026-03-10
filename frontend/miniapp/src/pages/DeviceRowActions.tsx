import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Popover, IconAlertTriangle, IconGlobe, IconMoreVertical, IconShield, IconSmartphone, Button } from "@/design-system";
import { useTelegramHaptics } from "@/hooks/useTelegramHaptics";
import { useI18n } from "@/hooks/useI18n";

export interface DeviceRowActionsProps {
  deviceId: string;
  deviceStatus: "connected" | "idle" | "config_pending" | "revoked";
  onConfirm: (id: string) => void;
  onReplace: (id: string) => void;
  onRevoke: (id: string) => void;
  isConfirmingId: string | null;
  isReplacingId: string | null;
}

/** Device row actions: popup menu (Confirm · Reissue · Server · Revoke). */
export function DeviceRowActions({
  deviceId,
  deviceStatus,
  onConfirm,
  onReplace,
  onRevoke,
  isConfirmingId,
  isReplacingId,
}: DeviceRowActionsProps) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
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

  const close = () => setOpen(false);

  const handleConfirm = () => {
    impact("light");
    onConfirm(deviceId);
    close();
  };
  const handleReplace = () => {
    impact("light");
    onReplace(deviceId);
    close();
  };
  const handleServer = () => {
    impact("light");
    navigate("/servers", { state: { from: "/devices" } });
    close();
  };
  const handleRevoke = () => {
    impact("light");
    onRevoke(deviceId);
    close();
  };

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      id={`device-menu-${deviceId}`}
      panelClassName="miniapp-popover-panel--menu"
      panelAriaLabel={t("devices.menu_trigger_aria")}
      renderTrigger={(triggerProps) => (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="device-menu-trigger"
          onClick={() => {
            impact("light");
            setOpen((o) => !o);
          }}
          aria-label={t("devices.menu_trigger_aria")}
          {...triggerProps}
        >
          <IconMoreVertical size={18} strokeWidth={2} />
        </Button>
      )}
    >
      <ul className="miniapp-menu-list" role="menu" aria-label={t("devices.menu_trigger_aria")}>
        <li role="presentation" className="miniapp-menu-label">
          {statusLabel}
        </li>
        {showConfirm && (
          <li role="none">
            <Button
              type="button"
              role="menuitem"
              variant="ghost"
              size="sm"
            className="miniapp-menu-item"
            onClick={handleConfirm}
            disabled={isConfirmingId === deviceId}
          >
            <span className="miniapp-menu-item-icon" aria-hidden>
              <IconShield size={15} strokeWidth={1.8} />
            </span>
            <span className="miniapp-menu-item-text">
              <span className="miniapp-menu-item-title">
                {isConfirmingId === deviceId ? "…" : t("devices.menu_confirm_setup")}
              </span>
              <span className="miniapp-menu-item-hint">{statusLabel}</span>
            </span>
            </Button>
          </li>
        )}
        <li role="none">
          <Button
            type="button"
            role="menuitem"
            variant="ghost"
            size="sm"
            className="miniapp-menu-item"
            onClick={handleReplace}
            disabled={isReplacingId === deviceId}
          >
            <span className="miniapp-menu-item-icon" aria-hidden>
              <IconSmartphone size={15} strokeWidth={1.8} />
            </span>
            <span className="miniapp-menu-item-text">
              <span className="miniapp-menu-item-title">
                {isReplacingId === deviceId ? "…" : t("devices.menu_reissue_config")}
              </span>
            </span>
          </Button>
        </li>
        <li role="none">
          <Button
            type="button"
            role="menuitem"
            variant="ghost"
            size="sm"
            className="miniapp-menu-item"
            onClick={handleServer}
          >
            <span className="miniapp-menu-item-icon" aria-hidden>
              <IconGlobe size={15} strokeWidth={1.8} />
            </span>
            <span className="miniapp-menu-item-text">
              <span className="miniapp-menu-item-title">{t("devices.menu_server_location")}</span>
            </span>
          </Button>
        </li>
        <li role="separator" className="miniapp-menu-divider" aria-hidden />
        <li role="none">
          <Button
            type="button"
            role="menuitem"
            variant="ghost"
            size="sm"
            className="miniapp-menu-item miniapp-menu-item--danger"
            onClick={handleRevoke}
          >
            <span className="miniapp-menu-item-icon" aria-hidden>
              <IconAlertTriangle size={15} strokeWidth={1.8} />
            </span>
            <span className="miniapp-menu-item-text">
              <span className="miniapp-menu-item-title">{t("devices.menu_revoke_device")}</span>
            </span>
          </Button>
        </li>
      </ul>
    </Popover>
  );
}
