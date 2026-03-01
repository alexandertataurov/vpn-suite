import type { ReactNode } from "react";
import { cn } from "@vpn-suite/shared";

export interface PanelGridProps {
  children: ReactNode;
  cols?: 1 | 2 | 3 | 4;
  className?: string;
}

export function PanelGrid(p: PanelGridProps) {
  const { children, cols = 4, className } = p;
  return <div className={cn("ds-panel-grid", `ds-panel-grid--cols-${cols}`, className)} data-cols={cols}>{children}</div>;
}

PanelGrid.displayName = "PanelGrid";
