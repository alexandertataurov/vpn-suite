import type { ReactNode } from "react";

export interface MissionBarProps {
  children: ReactNode;
  className?: string;
}

/**
 * Aerospace design system: system-wide status strip, 40px.
 * Shows status badge, env tag, UTC clock, user. Replaces TopBar.
 */
export function MissionBar({ children, className = "" }: MissionBarProps) {
  return (
    <header
      className={`mission-bar admin-top-bar mission-control-hud-header ${className}`.trim()}
      role="banner"
      data-mission-bar
    >
      {children}
    </header>
  );
}
