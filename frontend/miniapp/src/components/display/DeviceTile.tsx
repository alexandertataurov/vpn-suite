import type { ReactNode } from "react";
import { ListItem } from "../ui";
import { StatusBadge, type StatusBadgeTone } from "./StatusBadge";

export interface DeviceTileProps {
  title: string;
  subtitle?: string;
  statusLabel?: string;
  statusTone?: StatusBadgeTone;
  icon?: ReactNode;
  action?: ReactNode;
}

export function DeviceTile({
  title,
  subtitle,
  statusLabel = "Active",
  statusTone = "neutral",
  icon,
  action,
}: DeviceTileProps) {
  return (
    <ListItem
      title={title}
      subtitle={subtitle}
      leadingIcon={icon}
      trailing={action ?? <StatusBadge status={statusTone}>{statusLabel}</StatusBadge>}
    />
  );
}
