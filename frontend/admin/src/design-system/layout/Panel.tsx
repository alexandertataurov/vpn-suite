import { useState, type ReactNode, forwardRef, type HTMLAttributes } from "react";
import { cn } from "@vpn-suite/shared";
import type { BadgeVariant } from "../primitives/Badge";
import { Badge } from "../primitives/Badge";
import { IconChevronDown } from "../icons";

export interface PanelProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
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

export const Panel = forwardRef<HTMLDivElement, PanelProps>(function Panel(props, ref) {
  const { title, subtitle, action, noPadding, status, collapsible = false, loading, children, className = "", variant = "surface", ...rest } = props;
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div
      ref={ref}
      className={cn(
        "admin-panel",
        variant === "elevated" && "admin-panel--elevated",
        noPadding && "admin-panel--no-padding",
        collapsible && collapsed && "admin-panel--collapsed",
        className
      )}
      {...rest}
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
                <IconChevronDown size={14} strokeWidth={1.5} style={{ transform: collapsed ? "rotate(-90deg)" : undefined }} />
              </button>
            )}
            <div>
              {title != null && <h3 className="admin-panel__title">{title}</h3>}
              {subtitle != null && <p className="admin-panel__subtitle">{subtitle}</p>}
            </div>
          </div>
          <div className="admin-panel__action">
            {status != null ? <Badge variant={status}>{status}</Badge> : null}
            {action != null ? action : null}
          </div>
        </div>
      )}
      {!collapsed && (loading ? <div className="admin-panel__skeleton" aria-hidden /> : children)}
    </div>
  );
});

Panel.displayName = "Panel";
