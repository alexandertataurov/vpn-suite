import type { ReactNode } from "react";

export interface AppShellProps {
  children: ReactNode;
  className?: string;
}

/**
 * Design system: root shell for admin layout.
 * Structure: AppShell > [TopBar, HealthBar?, Sidebar, main[PageContent]]
 */
export function AppShell({ children, className = "" }: AppShellProps) {
  const classes = ["admin-layout", "mission-control-root", className.trim()].filter(Boolean).join(" ");
  return (
    <div className={classes} data-console="operator" data-app-shell>
      {children}
    </div>
  );
}
