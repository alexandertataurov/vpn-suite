import type { ReactNode } from "react";

export interface SidebarProps {
  children: ReactNode;
  className?: string;
  collapsed?: boolean;
  open?: boolean;
}

/**
 * Design system: fixed left nav, 240px expanded / 64px collapsed.
 * Nav groups, icons, active state, collapse toggle.
 */
export function Sidebar({
  children,
  className = "",
  collapsed = false,
  open = false,
}: SidebarProps) {
  const classes = [
    "admin-sidebar",
    open ? "open" : "",
    collapsed ? "collapsed" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <aside className={classes} data-testid="admin-sidebar" data-sidebar>
      {children}
    </aside>
  );
}
