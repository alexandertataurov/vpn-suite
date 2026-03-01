import type { ReactNode } from "react";
import { cn } from "@vpn-suite/shared";

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  className?: string;
  "data-testid"?: string;
}

export function EmptyState(p: EmptyStateProps) {
  return (
    <div className={cn("ds-empty-state", p.className)} role="status" data-testid={p["data-testid"]}>
      {p.icon != null && <div className="ds-empty-state__icon" aria-hidden>{p.icon}</div>}
      <h3 className="ds-empty-state__title">{p.title}</h3>
      {p.description != null && p.description !== "" && <p className="ds-empty-state__description">{p.description}</p>}
      {p.actions != null && <div className="ds-empty-state__actions">{p.actions}</div>}
    </div>
  );
}

EmptyState.displayName = "EmptyState";
