import type { ReactNode } from "react";
import { cn } from "@vpn-suite/shared";
import { PrimitiveBadge, Panel, PanelHeader, PanelBody, Skeleton, EmptyState, ErrorState } from "@vpn-suite/shared/ui";

export type TimeSeriesPanelStatus = "live" | "stale" | "partial" | "loading" | "error" | "empty";

export interface TimeSeriesPanelProps {
  title: string;
  subtitle?: ReactNode;
  /** Data status badge */
  status?: TimeSeriesPanelStatus;
  /** Optional range selector (e.g. 1h / 24h / 7d) */
  rangeSelector?: ReactNode;
  /** Optional actions in header */
  actions?: ReactNode;
  /** Show loading skeleton in body */
  loading?: boolean;
  /** Error message; when set, body shows error state */
  error?: string | null;
  /** Retry callback for error state */
  onRetry?: () => void;
  /** When true and not loading/error, body shows empty state */
  empty?: boolean;
  emptyMessage?: string;
  /** Skeleton height when loading */
  loadingHeight?: number | string;
  children?: ReactNode;
  className?: string;
}

function statusToBadge(s: TimeSeriesPanelStatus): { variant: "success" | "warning" | "danger" | "info"; label: string } {
  if (s === "live") return { variant: "success", label: "Live" };
  if (s === "stale" || s === "partial") return { variant: "warning", label: s === "stale" ? "Stale" : "Partial" };
  if (s === "error") return { variant: "danger", label: "Error" };
  if (s === "empty") return { variant: "info", label: "No data" };
  return { variant: "info", label: "Loading" };
}

/**
 * Panel for time-series charts: Section header (title, subtitle, status badge, range) + body
 * that shows loading (Skeleton), error, empty (EmptyState), or children.
 */
export function TimeSeriesPanel({
  title,
  subtitle,
  status = "live",
  rangeSelector,
  actions,
  loading = false,
  error,
  onRetry,
  empty = false,
  emptyMessage = "No data for the selected range.",
  loadingHeight = "var(--chart-frame-height)",
  children,
  className = "",
}: TimeSeriesPanelProps) {
  const badge = statusToBadge(status);

  const headerActions = (
    <>
      {actions}
      {rangeSelector != null ? <div className="ref-chart-meta">{rangeSelector}</div> : null}
      <PrimitiveBadge variant={badge.variant}>{badge.label}</PrimitiveBadge>
    </>
  );

  let body: ReactNode = children;
  if (loading) {
    body = <Skeleton height={loadingHeight} />;
  } else if (error != null && error !== "") {
    body = (
      <div className="ref-chart-frame ref-chart-frame-state ref-chart-frame-minsize">
        <ErrorState title="Failed to load" message={error} retry={onRetry} />
      </div>
    );
  } else if (empty) {
    body = (
      <div className="ref-chart-frame ref-chart-frame-state ref-chart-frame-minsize">
        <EmptyState title="No data" description={emptyMessage} />
      </div>
    );
  }

  return (
    <Panel as="section" variant="outline" className={cn("ref-timeseries-panel", className)} aria-label={title}>
      <PanelHeader
        title={
          <>
            <h3 className="ref-settings-title">{title}</h3>
            {subtitle != null ? <p className="ref-chart-subtitle">{subtitle}</p> : null}
          </>
        }
        actions={headerActions}
      />
      <PanelBody>{body}</PanelBody>
    </Panel>
  );
}
