import { useCallback } from "react";
import { PrimitiveBadge, RelativeTime } from "@vpn-suite/shared/ui";
import { api } from "../api/client";
import { useResource } from "../hooks/useResource";

/** Matches GET /overview/health-snapshot response */
interface HealthSnapshot {
  telemetry_last_at?: string | null;
  snapshot_last_at?: string | null;
  operator_last_success_at?: string | null;
  sessions_active: number;
  incidents_count: number;
  metrics_freshness: Record<string, "fresh" | "degraded" | "stale" | "unknown" | "missing">;
  request_id?: string | null;
}

function overallStatus(snapshot: HealthSnapshot | undefined, status: string): "fresh" | "stale" | "error" {
  if (status === "error") return "error";
  if (status === "stale") return "stale";
  const freshness = snapshot?.metrics_freshness;
  if (!freshness) return "stale";
  const values = Object.values(freshness);
  if (values.some((v) => v === "stale" || v === "missing")) return "stale";
  if (values.some((v) => v === "unknown" || v === "degraded")) return "stale";
  return "fresh";
}

function isMetricsDegraded(snapshot: HealthSnapshot | undefined): boolean {
  const freshness = snapshot?.metrics_freshness;
  if (!freshness || Object.keys(freshness).length === 0) return true;
  const values = Object.values(freshness);
  return values.some((v) => v === "stale" || v === "missing" || v === "unknown" || v === "degraded");
}

interface GlobalDataIndicatorProps {
  compact?: boolean;
}

export function GlobalDataIndicator({ compact }: GlobalDataIndicatorProps) {
  const fetchHealth = useCallback(
    async ({ signal }: { signal: AbortSignal }) =>
      api.get<HealthSnapshot>("/overview/health-snapshot", { signal }),
    []
  );

  const health = useResource<HealthSnapshot>({
    source: "GET /overview/health-snapshot",
    ttlMs: 30_000,
    fetcher: fetchHealth,
  });

  const status = overallStatus(health.data, health.status);
  const metricsUnavailable = status === "stale" && isMetricsDegraded(health.data);
  const label =
    status === "error"
      ? "Error"
      : metricsUnavailable
        ? "Metrics stale or missing"
        : status === "stale"
          ? "Stale"
          : "Fresh";
  const shortLabel = status === "error" ? "Error" : status === "stale" ? "Stale" : "Fresh";
  const title =
    metricsUnavailable
      ? "Telemetry or snapshot data is stale or missing (check Prometheus scrape and node telemetry)."
      : "Global data freshness";

  if (compact) {
    return (
      <div className="admin-data-indicator admin-data-indicator--compact" title={title}>
        <span className={`admin-data-dot admin-data-dot--${status}`} aria-hidden />
        <span className={`admin-data-label admin-data-label--${status}`}>{shortLabel}</span>
      </div>
    );
  }

  return (
    <div className="admin-data-indicator" title={title}>
      <span className={`admin-data-dot admin-data-dot--${status}`} aria-hidden />
      <PrimitiveBadge size="sm" variant={status === "error" ? "danger" : status === "stale" ? "warning" : "success"}>
        {label}
      </PrimitiveBadge>
      <span className="admin-data-updated">
        {health.updatedAt ? <RelativeTime date={health.updatedAt} updateInterval={5000} /> : "—"}
      </span>
    </div>
  );
}
