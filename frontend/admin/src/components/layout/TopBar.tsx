import type { ReactNode } from "react";

export interface TopBarProps {
  children: ReactNode;
  className?: string;
}

/**
 * Design system: fixed 64px top bar — breadcrumb, actions, search.
 * Contains page title context and global actions.
 */
export function TopBar({ children, className = "" }: TopBarProps) {
  return (
    <div
      className={`admin-top-bar mission-control-hud-header ${className}`.trim()}
      role="banner"
      data-top-bar
    >
      {children}
    </div>
  );
}
