import {
  MissionPrimaryButton,
  MissionSecondaryButton,
  MissionSecondaryLink,
  ButtonRow,
} from "@/design-system";

export interface DeviceRowActionsProps {
  deviceId: string;
  deviceStatus: "connected" | "idle" | "config_pending" | "revoked";
  onConfirm: (id: string) => void;
  onReplace: (id: string) => void;
  onRevoke: (id: string) => void;
  isConfirmingId: string | null;
  isReplacingId: string | null;
}

/** Device row actions: Confirm (primary) + secondary row (Reissue, Server, Revoke). */
export function DeviceRowActions({
  deviceId,
  deviceStatus,
  onConfirm,
  onReplace,
  onRevoke,
  isConfirmingId,
  isReplacingId,
}: DeviceRowActionsProps) {
  const showConfirm = deviceStatus === "idle" || deviceStatus === "config_pending";
  const secondaryActions = (
    <ButtonRow className="device-row-actions-secondary">
      <MissionSecondaryButton
        className="device-row-action"
        onClick={() => onReplace(deviceId)}
        disabled={isReplacingId === deviceId}
      >
        {isReplacingId === deviceId ? "…" : "Reissue"}
      </MissionSecondaryButton>
      <MissionSecondaryLink to="/servers" className="device-row-action">
        Server
      </MissionSecondaryLink>
      <MissionSecondaryButton
        className="device-row-action device-row-action--revoke"
        onClick={() => onRevoke(deviceId)}
      >
        Revoke
      </MissionSecondaryButton>
    </ButtonRow>
  );

  if (showConfirm) {
    return (
      <div className="device-row-actions device-row-actions--stacked">
        <MissionPrimaryButton
          className="device-row-action device-row-action--confirm"
          onClick={() => onConfirm(deviceId)}
          disabled={isConfirmingId === deviceId}
        >
          {isConfirmingId === deviceId ? "…" : "Confirm"}
        </MissionPrimaryButton>
        {secondaryActions}
      </div>
    );
  }

  return (
    <div className="device-row-actions">
      {secondaryActions}
    </div>
  );
}
