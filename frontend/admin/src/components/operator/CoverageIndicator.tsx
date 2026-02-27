/**
 * Shows data coverage: e.g. "Nodes reporting: 7/12" or "Nodes: 7 OK / 5 degraded / 0 down".
 * Use in dashboard and telemetry cards where coverage is known.
 */
import type { NodeCoverage } from "../../domain/dashboard";

export interface CoverageIndicatorProps {
  /** Node coverage from operator or snapshot */
  coverage: NodeCoverage | null;
  /** Optional label prefix */
  label?: string;
  /** Compact: "7/12" only. Default: show OK/degraded/down. */
  compact?: boolean;
  className?: string;
}

export function CoverageIndicator({
  coverage,
  label = "Nodes",
  compact = false,
  className,
}: CoverageIndicatorProps) {
  if (!coverage) return null;
  if (compact) {
    return (
      <span className={`operator-health-label ${className ?? ""}`} role="status">
        {label}: {coverage.reportingCount}/{coverage.total}
      </span>
    );
  }
  return (
    <span className={`operator-health-label ${className ?? ""}`} role="status">
      {label}: {coverage.online} OK / {coverage.degraded} degraded / {coverage.down} down
      {coverage.reportingCount < coverage.total && ` · ${coverage.reportingCount} reporting`}
    </span>
  );
}
