import type { ReactNode } from "react";
import { MissionOperationLink } from "../mission/Mission";

export interface SupportActionItem {
  to: string;
  title: string;
  description: string;
  tone?: "blue" | "green" | "amber" | "red";
  icon: ReactNode;
}

export interface SupportActionListProps {
  items: SupportActionItem[];
  onItemClick?: () => void;
  className?: string;
}

/**
 * Quick links row for Support page. Restore access, plans, devices.
 */
export function SupportActionList({ items, onItemClick, className = "" }: SupportActionListProps) {
  return (
    <div className={`support-action-list ops ${className}`.trim()} role="list">
      {items.map((item) => (
        <MissionOperationLink
          key={item.to}
          to={item.to}
          tone={item.tone ?? "blue"}
          iconTone={item.tone ?? "blue"}
          icon={item.icon}
          title={item.title}
          description={item.description}
          onClick={onItemClick}
          aria-label={item.title}
        />
      ))}
    </div>
  );
}
