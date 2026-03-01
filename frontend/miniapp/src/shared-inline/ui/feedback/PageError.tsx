import { useMemo, useState, type ReactNode } from "react";
import { cn } from "../../utils/cn";
import { Button } from "../buttons/Button";

export interface PageErrorProps {
  title?: string;
  message?: ReactNode;
  requestId?: string;
  correlationId?: string;
  statusCode?: number;
  endpoint?: string;
  onRetry?: () => void;
  className?: string;
}

export function PageError({
  title = "Something went wrong",
  message,
  requestId,
  correlationId,
  statusCode,
  endpoint,
  onRetry,
  className = "",
}: PageErrorProps) {
  const [copyState, setCopyState] = useState<"idle" | "done" | "error">("idle");
  const debugPayload = useMemo(
    () =>
      JSON.stringify(
        {
          endpoint,
          status_code: statusCode,
          request_id: requestId,
          correlation_id: correlationId,
          message: typeof message === "string" ? message : undefined,
        },
        null,
        2
      ),
    [correlationId, endpoint, message, requestId, statusCode]
  );
  const canCopyDebug = Boolean(endpoint || statusCode || requestId || correlationId);
  const copyDebug = async () => {
    if (!canCopyDebug || typeof navigator === "undefined" || !navigator.clipboard?.writeText) return;
    try {
      await navigator.clipboard.writeText(debugPayload);
      setCopyState("done");
      setTimeout(() => setCopyState("idle"), 1500);
    } catch {
      setCopyState("error");
    }
  };

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
      {correlationId != null && correlationId !== "" ? (
        <p className="page-error-request-id" aria-label="Correlation ID for support">
          Correlation ID: <code>{correlationId}</code>
        </p>
      ) : null}
      {canCopyDebug ? (
        <Button variant="secondary" onClick={copyDebug} className="page-error-action">
          {copyState === "done" ? "Debug copied" : copyState === "error" ? "Copy failed" : "Copy debug packet"}
        </Button>
      ) : null}
      {onRetry != null ? (
        <Button variant="primary" onClick={onRetry} className="page-error-action">
          Try again
        </Button>
      ) : null}
    </div>
  );
}
