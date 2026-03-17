import type { ReactNode } from "react";

/**
 * Production layer: bottom interaction (primary button, tabs, CTA). 72–96px.
 */
export function ActionZone({ children }: { children: ReactNode }) {
  return (
    <div className="miniapp-bottom-nav-wrap" data-layer="ActionZone">
      {children}
    </div>
  );
}
