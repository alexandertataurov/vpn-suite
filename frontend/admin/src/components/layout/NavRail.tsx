import type { ReactNode } from "react";

export interface NavRailProps {
  children: ReactNode;
  className?: string;
  collapsed?: boolean;
  open?: boolean;
}

/**
 * Aerospace design system: vertical nav, 240px expanded / 56px collapsed.
 * Nav groups, icons, active state, collapse toggle. Replaces Sidebar.
 */
export function NavRail({
  children,
  className = "",
  collapsed = false,
  open = false,
}: NavRailProps) {
  const classes = [
    "admin-sidebar",
    "nav-rail",
    open ? "open" : "",
    collapsed ? "collapsed" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <aside className={classes} data-testid="admin-sidebar" data-sidebar data-nav-rail>
      {children}
    </aside>
  );
}
