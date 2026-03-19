import type { ReactNode } from "react";
import { Avatar, PillChip, SettingsButton } from "../../patterns";
import "./ProfileRow.css";

export type ProfileRowStatus = "beta" | "active" | "expiring" | "expired";

export interface ProfileRowProps {
  name: string;
  initials: string;
  status: ProfileRowStatus;
  planName?: string;
  daysLeft?: number;
  /** Override chip (e.g. from ModernHeader); when set, status-based chip is ignored */
  chip?: ReactNode;
  onSettings: () => void;
}

function renderPillChip(status: ProfileRowStatus, planName?: string, daysLeft?: number) {
  switch (status) {
    case "beta":
      return <PillChip variant="beta">Beta</PillChip>;
    case "active":
      return <PillChip variant="active">{planName ?? "PRO"}</PillChip>;
    case "expiring":
      return (
        <PillChip variant="expiring">
          {planName ?? "PRO"} · {daysLeft ?? 0}d left
        </PillChip>
      );
    case "expired":
      return <PillChip variant="expired">Expired</PillChip>;
    default:
      return null;
  }
}

/**
 * Profile row for Home header: Avatar + name + PillChip + SettingsButton.
 * Single horizontal row per amnezia spec §4.1.
 */
export function ProfileRow({
  name,
  initials,
  status,
  planName,
  daysLeft,
  chip: chipOverride,
  onSettings,
}: ProfileRowProps) {
  const chip = chipOverride ?? renderPillChip(status, planName, daysLeft);
  return (
    <div className="profile-row" data-layer="ProfileRow">
      <Avatar initials={initials} size="md" />
      <span className="profile-row-name">{name}</span>
      {chip ? <span className="profile-row-chip">{chip}</span> : null}
      <SettingsButton onClick={onSettings} aria-label="Settings" />
    </div>
  );
}
