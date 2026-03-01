import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Button, Skeleton } from "@/design-system";
import { ApiError } from "@vpn-suite/shared/types";

type Props = {
  height?: number;
  isLoading?: boolean;
  error?: unknown;
  empty?: boolean;
  stale?: boolean;
  partial?: boolean;
  statusMessage?: ReactNode;
  ariaLabel?: string;
  emptyMessage?: ReactNode;
  onRetry?: () => void;
  children?: ReactNode;
};

export function ChartFrame({
  height,
  isLoading,
  error,
  empty,
  stale,
  partial,
  statusMessage,
  ariaLabel,
  emptyMessage = "No data for the selected range.",
  onRetry,
  children,
}: Props) {
  const frameStyle = {
    "--chart-frame-height": height != null ? `${height}px` : "var(--chart-frame-default-height)",
  } as CSSProperties;
  const frameRef = useRef<HTMLDivElement | null>(null);
  const [tooSmall, setTooSmall] = useState(false);
  const isDev = Boolean((import.meta as { env?: { DEV?: boolean } }).env?.DEV);
  useEffect(() => {
    if (!isDev) return;
    if (!frameRef.current) return;
    const heightPx = frameRef.current.getBoundingClientRect().height;
    if (heightPx > 0 && heightPx < 80) {
      setTooSmall(true);
      console.warn("ChartFrame: container height too small", { heightPx, ariaLabel });
    } else {
      setTooSmall(false);
    }
  }, [height, ariaLabel, isDev]);

  if (isDev && tooSmall) {
    return (
      <div
        className="ref-chart-frame ref-chart-frame-state ref-chart-frame-size"
        style={frameStyle}
        role="alert"
        aria-label={ariaLabel}
        ref={frameRef}
      >
        <div className="ref-chart-state">
          <div className="ref-chart-state-title">Chart container too small</div>
          <div className="ref-chart-state-body">Increase the panel height to render this chart.</div>
        </div>
      </div>
    );
  }
  if (isLoading) return <Skeleton height={height} />;

  if (error) {
    const reqId = error instanceof ApiError ? error.requestId : undefined;
    const statusCode = error instanceof ApiError ? error.statusCode : undefined;
    const hint =
      statusCode === 403
        ? "Permission denied. Requires telemetry:read."
        : statusCode === 429
          ? "Rate limited. Please wait before retrying."
          : "Check your connection or permissions and retry.";
    return (
      <div className="ref-chart-frame ref-chart-frame-state ref-chart-frame-size" style={frameStyle} role="alert" aria-label={ariaLabel} ref={frameRef}>
        <div className="ref-chart-state">
          <div className="ref-chart-state-title">Failed to load telemetry.</div>
          <div className="ref-chart-state-body">{hint}</div>
          {reqId ? (
            <div className="ref-chart-state-meta">
              Request ID: <code>{reqId}</code>
            </div>
          ) : null}
          {onRetry ? (
            <Button variant="secondary" size="sm" onClick={onRetry} className="mt-2">
              Retry
            </Button>
          ) : null}
        </div>
      </div>
    );
  }

  if (empty) {
    return (
      <div className="ref-chart-frame ref-chart-frame-state ref-chart-frame-size" style={frameStyle} aria-label={ariaLabel} ref={frameRef}>
        <div className="ref-chart-state">
          <div className="ref-chart-state-body">{emptyMessage}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="ref-chart-frame ref-chart-frame-size" style={frameStyle} aria-label={ariaLabel} tabIndex={0} ref={frameRef}>
      {stale || partial ? (
        <div className={`ref-chart-banner ${stale ? "is-stale" : ""} ${partial ? "is-partial" : ""}`}>
          <div className="ref-chart-banner-title">
            {stale && partial ? "Stale + partial data" : stale ? "Stale data" : "Partial data"}
          </div>
          <div className="ref-chart-banner-body">
            {statusMessage ?? (stale ? "Latest samples are delayed." : "Samples are missing for part of the range.")}
          </div>
        </div>
      ) : null}
      {/* Root cause fix: CSS expects .ref-chart-frame-content to enforce height/overflow. */}
      <div className="ref-chart-frame-content">{children}</div>
    </div>
  );
}
