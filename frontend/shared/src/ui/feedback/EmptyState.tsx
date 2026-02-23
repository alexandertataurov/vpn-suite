import type { ReactNode } from "react";
import { cn } from "../../utils/cn";

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
  /** Optional for tests */
  "data-testid"?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  actions,
  className = "",
  "data-testid": dataTestId,
}: EmptyStateProps) {
  return (
    <div className={cn("empty-state", className)} role="status" data-testid={dataTestId}>
      {icon != null ? (
        <div className="empty-state-icon" aria-hidden>
          {icon}
        </div>
      ) : null}
      <h3 className="empty-state-title">{title}</h3>
      {description != null && description !== "" ? (
        <p className="empty-state-description">{description}</p>
      ) : null}
      {actions != null ? (
        <div className="empty-state-actions">{actions}</div>
      ) : null}
    </div>
  );
}
