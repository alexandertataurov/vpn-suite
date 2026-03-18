import type { ReactNode } from "react";
import { MissionOperationAnchor, MissionOperationArticle, MissionOperationLink } from "../mission/Mission";

export interface SupportActionItem {
  /** Internal route (react-router). Use either to or href. */
  to?: string;
  /** External URL. Use either to or href. */
  href?: string;
  title: string;
  description: string;
  tone?: "blue" | "green" | "amber" | "red";
  iconTone?: "blue" | "green" | "amber" | "red";
  icon: ReactNode;
  variant?: "default" | "destructive";
  disabled?: boolean;
}

export interface SupportActionListProps {
  items: SupportActionItem[];
  /** Called when an item is clicked. For href items, call openLink(item.href) here. */
  onItemClick?: (item: SupportActionItem) => void;
  className?: string;
}

/**
 * Quick links row for Support page. Restore access, plans, devices.
 */
export function SupportActionList({ items, onItemClick, className = "" }: SupportActionListProps) {
  return (
    <div className={`support-action-list ops ${className}`.trim()} role="list">
      {items.map((item, index) => {
        const key = item.to ?? item.href ?? index;
        const tone = item.variant === "destructive" ? "red" : (item.tone ?? "blue");
        const iconTone = item.iconTone ?? item.tone ?? "blue";
        const baseProps = {
          tone,
          iconTone,
          icon: item.icon,
          title: item.title,
          description: item.description,
        };

        if (item.disabled) {
          return (
            <MissionOperationArticle
              key={key}
              {...baseProps}
              className="support-action-list-item--disabled"
            />
          );
        }
        if (item.href) {
          return (
            <MissionOperationAnchor
              key={key}
              {...baseProps}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                if (onItemClick) {
                  e.preventDefault();
                  onItemClick(item);
                }
              }}
              aria-label={item.title}
            />
          );
        }
        return (
          <MissionOperationLink
            key={key}
            {...baseProps}
            to={item.to!}
            onClick={() => onItemClick?.(item)}
            aria-label={item.title}
          />
        );
      })}
    </div>
  );
}
