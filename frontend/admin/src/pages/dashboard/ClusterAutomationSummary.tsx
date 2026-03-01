import { useQuery } from "@tanstack/react-query";
import { formatDateTime } from "@vpn-suite/shared";
import { IconTelemetry, IconServer } from "@/design-system/icons";
import { Card, Text } from "@/design-system";
import type { AutomationStatusOut } from "@vpn-suite/shared/types";
import { CLUSTER_HEALTH_KEY, CONTROL_PLANE_AUTOMATION_STATUS_KEY } from "../../api/query-keys";
import { api } from "../../api/client";

/** GET /cluster/health response (no formal schema in shared types). */
export interface ClusterHealthOut {
  timestamp: string;
  nodes_total: number;
  status_counts: Record<string, number>;
  health_score?: number;
  load_factor?: number;
}

export function ClusterAutomationSummary() {
  const clusterQuery = useQuery<ClusterHealthOut>({
    queryKey: CLUSTER_HEALTH_KEY,
    queryFn: ({ signal }) => api.get<ClusterHealthOut>("/cluster/health", { signal }),
    staleTime: 60_000,
    retry: false,
  });

  const automationQuery = useQuery<AutomationStatusOut>({
    queryKey: CONTROL_PLANE_AUTOMATION_STATUS_KEY,
    queryFn: ({ signal }) => api.get<AutomationStatusOut>("/control-plane/automation/status", { signal }),
    staleTime: 60_000,
    retry: false,
  });

  const clusterOk = clusterQuery.isSuccess && clusterQuery.data;
  const automationOk = automationQuery.isSuccess && automationQuery.data;
  const anyOk = clusterOk || automationOk;
  const anyError = clusterQuery.isError || automationQuery.isError;

  if (!anyOk && !anyError) {
    return null;
  }

  if (!anyOk && anyError) {
    return (
      <Card as="section" variant="outline" className="ref-cluster-summary" aria-label="Control-plane status" data-testid="dashboard-cluster-summary">
        <Text className="ref-chart-caption" variant="caption">
          Control-plane unavailable
        </Text>
      </Card>
    );
  }

  const healthyCount =
    clusterOk && clusterQuery.data!.status_counts
      ? (clusterQuery.data!.status_counts["healthy"] ?? 0) + (clusterQuery.data!.status_counts["ok"] ?? 0)
      : null;
  const degradedCount =
    clusterOk && clusterQuery.data!.status_counts
      ? (clusterQuery.data!.status_counts["degraded"] ?? 0) + (clusterQuery.data!.status_counts["unhealthy"] ?? 0)
      : null;

  const clusterLine = clusterOk ? (
    <span className="ref-cluster-summary-line">
      <IconServer className="icon-sm" aria-hidden strokeWidth={1.5} />
      {clusterQuery.data!.nodes_total} nodes
      {healthyCount != null || degradedCount != null
        ? ` (${healthyCount ?? 0} healthy${degradedCount ? `, ${degradedCount} degraded` : ""})`
        : ""}
    </span>
  ) : null;

  const automationLine = automationOk ? (
    <span className="ref-cluster-summary-line">
      <IconTelemetry className="icon-sm" aria-hidden strokeWidth={1.5} />
      Automation: {automationQuery.data!.enabled ? "on" : "off"}
      {automationQuery.data!.last_run_at ? ` · last run ${formatDateTime(automationQuery.data!.last_run_at, { dateStyle: "short", timeStyle: "short" })}` : ""}
    </span>
  ) : null;

  return (
    <Card as="section" variant="outline" className="ref-cluster-summary" aria-label="Control-plane status" data-testid="dashboard-cluster-summary">
      <div className="ref-cluster-summary-inner">
        {clusterLine}
        {clusterLine && automationLine ? " · " : null}
        {automationLine}
      </div>
    </Card>
  );
}
