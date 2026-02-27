/**
 * Per-card error: human-readable message + correlation id (X-Request-ID) + retry.
 * Use inside every chart/table card when query fails.
 */
import type { ReactNode } from "react";
import { Button, InlineAlert } from "@vpn-suite/shared/ui";
import { ApiError } from "@vpn-suite/shared/types";

export interface ErrorBannerProps {
  title?: string;
  message?: string;
  /** Error object; requestId extracted if ApiError */
  error?: unknown;
  onRetry?: () => void;
  className?: string;
  actions?: ReactNode;
}

export function ErrorBanner({
  title = "Failed to load data",
  message,
  error,
  onRetry,
  className,
  actions,
}: ErrorBannerProps) {
  const requestId = error instanceof ApiError ? error.requestId : undefined;
  const statusCode = error instanceof ApiError ? error.statusCode : undefined;
  const hint =
    message ??
    (statusCode === 403
      ? "Permission denied."
      : statusCode === 429
        ? "Rate limited. Please wait before retrying."
        : "Check your connection or permissions and retry.");
  const fullMessage = requestId ? `${hint} Request ID: ${requestId}` : hint;
  return (
    <div className={className} role="alert">
      <InlineAlert
        variant="error"
        title={title}
        message={fullMessage}
        actions={
          actions ?? (onRetry ? <Button variant="secondary" size="sm" onClick={onRetry}>Retry</Button> : undefined)
        }
      />
    </div>
  );
}
