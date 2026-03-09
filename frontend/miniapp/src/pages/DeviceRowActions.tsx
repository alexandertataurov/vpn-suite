import { useState } from "react";
import { Link } from "react-router-dom";
import { Popover, IconMoreVertical } from "@/design-system";
import { useTelegramHaptics } from "@/hooks/useTelegramHaptics";

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
  const { impact } = useTelegramHaptics();
  const showConfirm = deviceStatus === "idle" || deviceStatus === "config_pending";

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
      renderTrigger={(triggerProps) => (
        <button
          type="button"
          className="device-menu-trigger"
          onClick={() => {
            impact("light");
            setOpen((o) => !o);
          }}
          aria-label="Device actions"
          {...triggerProps}
        >
          <IconMoreVertical size={18} strokeWidth={2} />
        </button>
      )}
    >
      <ul className="device-menu-list" role="menu" aria-label="Device actions">
        {showConfirm && (
          <li role="none">
            <button
              type="button"
              role="menuitem"
              className="device-menu-item"
              onClick={handleConfirm}
              disabled={isConfirmingId === deviceId}
            >
              {isConfirmingId === deviceId ? "…" : "Confirm device installation"}
            </button>
          </li>
        )}
        <li role="none">
          <button
            type="button"
            role="menuitem"
            className="device-menu-item"
            onClick={handleReplace}
            disabled={isReplacingId === deviceId}
          >
            {isReplacingId === deviceId ? "…" : "Generate new config"}
          </button>
        </li>
        <li role="none">
          <Link to="/servers" role="menuitem" className="device-menu-item" onClick={handleServer}>
            Change server location
          </Link>
        </li>
        <li role="separator" className="device-menu-divider" aria-hidden />
        <li role="none">
          <button
            type="button"
            role="menuitem"
            className="device-menu-item device-menu-item--danger"
            onClick={handleRevoke}
          >
            Revoke device
          </button>
        </li>
      </ul>
    </Popover>
  );
}
