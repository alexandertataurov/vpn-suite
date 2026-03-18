import type { ReactNode } from "react";
import { Avatar, SettingsButton } from "../patterns";

export interface ProfileRowProps {
  name: string;
  status: ReactNode;
  planName?: string;
  daysLeft?: number;
  onSettings: () => void;
}

/**
 * Profile row for Home header: Avatar + name + PillChip + SettingsButton.
 * Per amnezia spec §4.1.
 */
export function ProfileRow({ name, status, onSettings }: ProfileRowProps) {
  return (
    <div className="profile-row modern-profile-row" data-layer="ProfileRow">
      <Avatar initials={name.slice(0, 2).toUpperCase()} size="md" />
      <div className="modern-profile-info modern-profile-info--row">
        <span className="modern-header-title">{name}</span>
        {status}
      </div>
      <SettingsButton onClick={onSettings} aria-label="Settings" />
    </div>
  );
}
