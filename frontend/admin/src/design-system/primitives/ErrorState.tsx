import type { ReactNode } from "react";

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
  action?: ReactNode;
}

export function ErrorState({ message, onRetry, action }: ErrorStateProps) {
  return (
    <div className="error-state">
      <p className="error-state__message">{message}</p>
      <div className="error-state__actions">
        {onRetry && (
          <button type="button" className="error-state__retry" onClick={onRetry}>
            Retry
          </button>
        )}
        {action}
      </div>
    </div>
  );
}
