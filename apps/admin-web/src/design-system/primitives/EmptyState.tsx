import type { ReactNode } from "react";

interface EmptyStateProps {
  /** Legacy: single message (used as description when title is absent) */
  message?: string;
  /** What was expected (e.g. "No devices") */
  title?: string;
  /** Why empty / way forward (or use message) */
  description?: string;
  /** Optional icon for "not a bug" clarity */
  icon?: ReactNode;
  /** Way forward (e.g. clear filter, create first item) */
  action?: ReactNode;
}

export function EmptyState({
  message,
  title,
  description,
  icon,
  action,
}: EmptyStateProps) {
  const desc = description ?? message;
  const hasStructured = title != null || icon != null;

  return (
    <div className="empty-state">
      {icon != null && <div className="empty-state__icon">{icon}</div>}
      {title != null && <h3 className="empty-state__title">{title}</h3>}
      {desc != null && (
        <p className={hasStructured ? "empty-state__description" : "empty-state__message"}>
          {desc}
        </p>
      )}
      {action != null && <div className="empty-state__action">{action}</div>}
    </div>
  );
}
