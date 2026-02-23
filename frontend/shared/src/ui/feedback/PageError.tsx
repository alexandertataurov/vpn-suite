import type { ReactNode } from "react";
import { cn } from "../../utils/cn";
import { Button } from "../buttons/Button";

export interface PageErrorProps {
  title?: string;
  message?: ReactNode;
  requestId?: string;
  statusCode?: number;
  endpoint?: string;
  onRetry?: () => void;
  className?: string;
}

export function PageError({
  title = "Something went wrong",
  message,
  requestId,
  statusCode,
  endpoint,
  onRetry,
  className = "",
}: PageErrorProps) {
  const statusEndpoint =
    statusCode != null && endpoint ? `Status ${statusCode} · ${endpoint}` : null;
  return (
    <div className={cn("page-error", className)} role="alert">
      <h2 className="page-error-title">{title}</h2>
      {statusEndpoint != null ? (
        <p className="page-error-status-endpoint" aria-label="Error context">
          {statusEndpoint}
        </p>
      ) : null}
      {message != null ? <p className="page-error-message">{message}</p> : null}
      {requestId != null && requestId !== "" ? (
        <p className="page-error-request-id" aria-label="Request ID for support">
          Request ID: <code>{requestId}</code>
        </p>
      ) : null}
      {onRetry != null ? (
        <Button variant="primary" onClick={onRetry} className="page-error-action">
          Try again
        </Button>
      ) : null}
    </div>
  );
}
