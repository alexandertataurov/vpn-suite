import { useState, type ReactNode } from "react";
import { cn } from "@vpn-suite/shared";
import type { BadgeVariant } from "@/design-system/primitives/Badge";
import { Badge } from "@/design-system/primitives/Badge";
import { IconChevronDown } from "@/design-system/icons";
import { Heading } from "@/design-system";

export interface AdminPanelProps {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  noPadding?: boolean;
  status?: BadgeVariant;
  collapsible?: boolean;
  loading?: boolean;
  children: ReactNode;
  className?: string;
  variant?: "surface" | "elevated";
}

/**
 * Starlink Visual DNA: base panel. Uses --color-surface, --color-border-default. Zero rounded corners.
 */
export function Panel({
  title,
  subtitle,
  action,
  noPadding,
  status,
  collapsible = false,
  loading,
  children,
  className = "",
  variant = "surface",
}: AdminPanelProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      className={cn(
        "admin-panel",
        variant === "elevated" && "admin-panel--elevated",
        noPadding && "admin-panel--no-padding",
        collapsible && collapsed && "admin-panel--collapsed",
        className
      )}
    >
      {(title != null || subtitle != null || action != null || status != null) && (
        <div className="admin-panel__header">
          <div className="admin-panel__header-left">
            {collapsible && (
              <button
                type="button"
                className="admin-panel__collapse"
                onClick={() => setCollapsed((c) => !c)}
                aria-expanded={!collapsed}
                aria-label={collapsed ? "Expand panel" : "Collapse panel"}
              >
                <IconChevronDown size={14} strokeWidth={1.5} className={collapsed ? "admin-panel__chevron admin-panel__chevron--collapsed" : "admin-panel__chevron"} />
              </button>
            )}
            <div>
              {title != null && <Heading level={3} className="admin-panel__title">{title}</Heading>}
              {subtitle != null && <p className="admin-panel__subtitle">{subtitle}</p>}
            </div>
          </div>
          <div className="admin-panel__action">
            {status != null ? <Badge variant={status}>{status}</Badge> : null}
            {action != null ? action : null}
          </div>
        </div>
      )}
      {!collapsed && (
        loading ? (
          <div className="admin-panel__skeleton" aria-hidden />
        ) : (
          children
        )
      )}
    </div>
  );
}
