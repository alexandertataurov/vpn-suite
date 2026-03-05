import type { ReactNode } from "react";

interface ErrorStateProps {
  /** What failed (e.g. "Node deletion failed") */
  title?: string;
  /** Why + what to do (or full message when no title) */
  message: string;
  onRetry?: () => void;
  action?: ReactNode;
}

export function ErrorState({ title, message, onRetry, action }: ErrorStateProps) {
  return (
    <div className="error-state">
      {title != null && <h3 className="error-state__title">{title}</h3>}
      <p className="error-state__message">{message}</p>
      <div className="error-state__actions">
        {onRetry != null && (
          <button type="button" className="error-state__retry" onClick={onRetry}>
            Retry
          </button>
        )}
        {action}
      </div>
    </div>
  );
}
