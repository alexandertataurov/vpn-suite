import type { ReactNode } from "react";
import { cn } from "@vpn-suite/shared";

export interface PanelGridProps {
  children: ReactNode;
  cols?: 1 | 2 | 3 | 4;
  className?: string;
}

/**
 * Aerospace design system: responsive panel grid (1–4 cols).
 */
export function PanelGrid({ children, cols = 4, className = "" }: PanelGridProps) {
  return (
    <div className={cn("panel-grid", `panel-grid--cols-${cols}`, className)} data-cols={cols}>
      {children}
    </div>
  );
}
