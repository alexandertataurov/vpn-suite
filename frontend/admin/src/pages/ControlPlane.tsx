import { useEffect, useMemo, useState } from "react";
import { formatDateTime, getErrorMessage } from "@vpn-suite/shared";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Bot } from "lucide-react";
import { getBaseUrl } from "@vpn-suite/shared/api-client";
import { Button, Panel, Input, Checkbox, PageError, Skeleton, Table, useToast } from "@vpn-suite/shared/ui";
import { MetricTile } from "../components/MetricTile";
import { PageHeader } from "../components/PageHeader";
import type {
  AnomalyMetricsOut,
  AutomationRunOut,
  AutomationStatusOut,
  BusinessMetricsOut,
  ControlPlaneEventOut,
  ControlPlaneEventListOut,
  FailoverEvaluateOut,
  PlacementCandidateOut,
  PlacementSimulationOut,
  RebalanceMoveOut,
  RebalancePlanOut,
  SecurityMetricsOut,
  TopologyGraphOut,
  TopologySummaryOut,
} from "@vpn-suite/shared/types";
import {
  CONTROL_PLANE_TOPOLOGY_SUMMARY_KEY,
  CONTROL_PLANE_TOPOLOGY_GRAPH_KEY,
  CONTROL_PLANE_BUSINESS_KEY,
  CONTROL_PLANE_SECURITY_KEY,
  CONTROL_PLANE_ANOMALY_KEY,
  CONTROL_PLANE_AUTOMATION_STATUS_KEY,
  CONTROL_PLANE_EVENTS_KEY,
} from "../api/query-keys";
import { api } from "../api/client";
import { ApiError } from "@vpn-suite/shared/types";
import { useAuthStore } from "../store/authStore";

function asPercent(v: number): string {
  return `${(v * 100).toFixed(1)}%`;
}

export function ControlPlanePage() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const [preferredRegion, setPreferredRegion] = useState("");
  const [sourceRegion, setSourceRegion] = useState("");
  const [useLatencyProbes, setUseLatencyProbes] = useState(true);
  const [executeRebalanceNow, setExecuteRebalanceNow] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [liveEvents, setLiveEvents] = useState<ControlPlaneEventOut[]>([]);

  const refetchWhenVisible = (ms: number) => () => (document.hidden ? false : ms);
  const summaryQuery = useQuery<TopologySummaryOut>({
    queryKey: CONTROL_PLANE_TOPOLOGY_SUMMARY_KEY,
    queryFn: ({ signal }) => api.get<TopologySummaryOut>("/control-plane/topology/summary", { signal }),
    refetchInterval: refetchWhenVisible(15000),
  });
  const graphQuery = useQuery<TopologyGraphOut>({
    queryKey: CONTROL_PLANE_TOPOLOGY_GRAPH_KEY,
    queryFn: ({ signal }) => api.get<TopologyGraphOut>("/control-plane/topology/graph", { signal }),
    refetchInterval: refetchWhenVisible(20000),
  });
  const businessQuery = useQuery<BusinessMetricsOut>({
    queryKey: CONTROL_PLANE_BUSINESS_KEY,
    queryFn: ({ signal }) => api.get<BusinessMetricsOut>("/control-plane/metrics/business", { signal }),
    refetchInterval: refetchWhenVisible(30000),
  });
  const securityQuery = useQuery<SecurityMetricsOut>({
    queryKey: CONTROL_PLANE_SECURITY_KEY,
    queryFn: ({ signal }) => api.get<SecurityMetricsOut>("/control-plane/metrics/security", { signal }),
    refetchInterval: (q) => (q.state.error instanceof ApiError && q.state.error.statusCode === 409 ? false : refetchWhenVisible(30000)()),
    retry: (_, err) => !(err instanceof ApiError && err.statusCode === 409),
  });
  const anomalyQuery = useQuery<AnomalyMetricsOut>({
    queryKey: CONTROL_PLANE_ANOMALY_KEY,
    queryFn: ({ signal }) => api.get<AnomalyMetricsOut>("/control-plane/metrics/anomaly", { signal }),
    refetchInterval: (q) => (q.state.error instanceof ApiError && q.state.error.statusCode === 409 ? false : refetchWhenVisible(45000)()),
    retry: (_, err) => !(err instanceof ApiError && err.statusCode === 409),
  });
  const automationStatusQuery = useQuery<AutomationStatusOut>({
    queryKey: CONTROL_PLANE_AUTOMATION_STATUS_KEY,
    queryFn: ({ signal }) => api.get<AutomationStatusOut>("/control-plane/automation/status", { signal }),
    refetchInterval: refetchWhenVisible(15000),
  });
  const eventsQuery = useQuery<ControlPlaneEventListOut>({
    queryKey: CONTROL_PLANE_EVENTS_KEY,
    queryFn: ({ signal }) => api.get<ControlPlaneEventListOut>("/control-plane/events?limit=12", { signal }),
    refetchInterval: refetchWhenVisible(60000),
  });

  useEffect(() => {
    if (!accessToken) return undefined;
    const apiBase = new URL(getBaseUrl(), window.location.origin);
    apiBase.protocol = apiBase.protocol === "https:" ? "wss:" : "ws:";
    apiBase.pathname = `${apiBase.pathname.replace(/\/$/, "")}/control-plane/events/ws`;
    apiBase.searchParams.set("token", accessToken);
    const ws = new WebSocket(apiBase.toString());
    ws.onopen = () => setWsConnected(true);
    ws.onclose = () => setWsConnected(false);
    ws.onerror = () => setWsConnected(false);
    ws.onmessage = (message) => {
      try {
        const parsed = JSON.parse(String(message.data)) as {
          type?: string;
          event?: ControlPlaneEventOut;
        };
        if (parsed.type !== "control_plane_event" || !parsed.event) return;
        const ev = parsed.event;
        setLiveEvents((prev) => {
          const next = [ev, ...prev.filter((item) => item.id !== ev.id)].filter(
            (x): x is ControlPlaneEventOut => x != null
          );
          next.sort(
            (a, b) =>
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
          return next.slice(0, 30);
        });
      } catch {
        /* ignore malformed ws payloads */
      }
    };
    return () => {
      ws.close();
      setWsConnected(false);
    };
  }, [accessToken]);

  const mergedEvents = useMemo(() => {
    const unique = new Map<string, ControlPlaneEventOut>();
    for (const event of liveEvents) unique.set(event.id, event);
    for (const event of eventsQuery.data?.items ?? []) {
      if (!unique.has(event.id)) unique.set(event.id, event);
    }
    return Array.from(unique.values())
      .sort(
        (a, b) =>
          new Date((b?.created_at) ?? 0).getTime() -
          new Date((a?.created_at) ?? 0).getTime()
      )
      .slice(0, 20);
  }, [eventsQuery.data?.items, liveEvents]);

  const graphLayout = useMemo(() => {
    if (!graphQuery.data) return null;
    const width = 960;
    const height = 360;
    const regions = graphQuery.data.regions.length
      ? graphQuery.data.regions
      : ["unknown"];
    const groups = new Map<string, string[]>();
    for (const region of regions) groups.set(region, []);
    for (const node of graphQuery.data.nodes) {
      const region = groups.has(node.region ?? "") ? (node.region ?? regions[0]) : regions[0]!;
      groups.get(region)?.push(node.node_id);
    }
    const positions = new Map<string, { x: number; y: number }>();
    const regionCount = Math.max(regions.length, 1);
    regions.forEach((region, index) => {
      const ids = groups.get(region) ?? [];
      const x = ((index + 1) * width) / (regionCount + 1);
      const rowCount = Math.max(ids.length, 1);
      ids.forEach((nodeId, row) => {
        const y = ((row + 1) * height) / (rowCount + 1);
        positions.set(nodeId, { x, y });
      });
    });
    return {
      width,
      height,
      positions,
    };
  }, [graphQuery.data]);

  const { addToast } = useToast();
  const placementMutation = useMutation({
    mutationFn: () =>
      api.post<PlacementSimulationOut>("/control-plane/placement/simulate", {
        preferred_region: preferredRegion || null,
        source_region: sourceRegion || null,
        use_latency_probes: useLatencyProbes,
        top_k: 5,
      }),
    onError: (err) => addToast(getErrorMessage(err, "Placement simulation failed"), "error"),
  });
  const rebalanceMutation = useMutation({
    mutationFn: () =>
      api.post<RebalancePlanOut>("/control-plane/rebalance/plan", {
        high_watermark: 0.85,
        target_watermark: 0.65,
        max_moves_per_node: 250,
      }),
    onError: (err) => addToast(getErrorMessage(err, "Rebalance plan failed"), "error"),
  });
  const failoverMutation = useMutation({
    mutationFn: () => api.post<FailoverEvaluateOut>("/control-plane/failover/evaluate", {}),
    onError: (err) => addToast(getErrorMessage(err, "Failover evaluation failed"), "error"),
  });
  const runAutomationMutation = useMutation({
    mutationFn: () =>
      api.post<AutomationRunOut>("/control-plane/automation/run", {
        execute_rebalance: executeRebalanceNow,
      }),
    onSuccess: async () => {
      await Promise.all([
        automationStatusQuery.refetch(),
        eventsQuery.refetch(),
        summaryQuery.refetch(),
      ]);
    },
    onError: (err) => addToast(getErrorMessage(err, "Automation run failed"), "error"),
  });

  const placementColumns = useMemo(
    () => [
      {
        key: "node",
        header: "Node",
        truncate: true,
        render: (r: PlacementCandidateOut) => r.container_name,
      },
      {
        key: "region",
        header: "Region",
        truncate: true,
        render: (r: PlacementCandidateOut) => r.region,
      },
      {
        key: "status",
        header: "Status",
        render: (r: PlacementCandidateOut) => r.status,
      },
      {
        key: "health",
        header: "Health",
        numeric: true,
        align: "right" as const,
        render: (r: PlacementCandidateOut) => asPercent(r.health_score),
      },
      {
        key: "free",
        header: "Free slots",
        numeric: true,
        align: "right" as const,
        render: (r: PlacementCandidateOut) => String(r.free_slots),
      },
      {
        key: "score",
        header: "Score",
        numeric: true,
        align: "right" as const,
        render: (r: PlacementCandidateOut) => r.score.toFixed(2),
      },
      {
        key: "latency",
        header: "Latency",
        numeric: true,
        align: "right" as const,
        render: (r: PlacementCandidateOut) =>
          r.effective_latency_ms != null
            ? `${r.effective_latency_ms.toFixed(1)} ms (${r.latency_source ?? "n/a"})`
            : "n/a",
      },
    ],
    []
  );
  const rebalanceColumns = useMemo(
    () => [
      {
        key: "source",
        header: "Source",
        truncate: true,
        mono: true,
        render: (r: RebalanceMoveOut) => r.source_node_id.slice(0, 8),
      },
      {
        key: "target",
        header: "Target",
        truncate: true,
        mono: true,
        render: (r: RebalanceMoveOut) => r.target_node_id.slice(0, 8),
      },
      {
        key: "count",
        header: "Peers",
        numeric: true,
        align: "right" as const,
        render: (r: RebalanceMoveOut) => String(r.peers_to_move),
      },
    ],
    []
  );

  if (summaryQuery.error) {
    return (
      <div className="ref-page" data-testid="automation-page">
        <PageHeader icon={Bot} title="Automation" description="Control-plane orchestration and health">
          <Button variant="secondary" size="sm" onClick={() => summaryQuery.refetch()} aria-label="Retry">
            Retry
          </Button>
        </PageHeader>
        <PageError
          message={
            summaryQuery.error instanceof Error
              ? summaryQuery.error.message
              : "Failed to load control-plane"
          }
          requestId={summaryQuery.error instanceof ApiError ? summaryQuery.error.requestId : undefined}
          statusCode={summaryQuery.error instanceof ApiError ? summaryQuery.error.statusCode : undefined}
          endpoint="GET /control-plane/topology/summary"
          onRetry={() => summaryQuery.refetch()}
        />
      </div>
    );
  }

  return (
    <div className="ref-page" data-testid="automation-page">
      <PageHeader icon={Bot} title="Automation" description="Control-plane orchestration and health" />

      <div className="ref-stats-grid">
        <MetricTile
          label="Nodes"
          value={summaryQuery.isLoading || !summaryQuery.data ? "…" : summaryQuery.data.nodes_total}
          subtitle={summaryQuery.data ? `healthy ${summaryQuery.data.healthy_nodes ?? 0} / degraded ${summaryQuery.data.degraded_nodes ?? 0}` : undefined}
        />
        <MetricTile
          label="Cluster Load"
          value={summaryQuery.isLoading || !summaryQuery.data ? "…" : asPercent(summaryQuery.data!.load_factor)}
          subtitle={summaryQuery.data ? `${summaryQuery.data.current_load ?? 0} / ${summaryQuery.data.total_capacity ?? 0}` : undefined}
        />
        <MetricTile
          label="MRR Estimate"
          value={businessQuery.isLoading || !businessQuery.data ? "…" : businessQuery.data!.mrr_estimate.toFixed(2)}
          subtitle={businessQuery.data ? `active subs ${businessQuery.data.active_subscriptions ?? 0}` : undefined}
        />
        <MetricTile
          label="Security Drift"
          value={
            securityQuery.isLoading ? "…" :
            securityQuery.error instanceof ApiError && securityQuery.error.statusCode === 409 ? "N/A" :
            securityQuery.data ? String(securityQuery.data.suspicious_events_24h) : "…"
          }
          subtitle={securityQuery.error instanceof ApiError && securityQuery.error.statusCode === 409 ? "agent mode" : "events in 24h"}
        />
        <MetricTile
          label="ML Risk (High)"
          value={
            anomalyQuery.isLoading ? "…" :
            anomalyQuery.error instanceof ApiError && anomalyQuery.error.statusCode === 409 ? "N/A" :
            anomalyQuery.data ? String(anomalyQuery.data.high_risk_users) : "…"
          }
          subtitle={
            anomalyQuery.error instanceof ApiError && anomalyQuery.error.statusCode === 409
              ? "agent mode"
              : anomalyQuery.data ? `scored ${anomalyQuery.data.users_scored ?? 0} users` : undefined
          }
        />
      </div>

      <div className="ref-page-sections">
        <Panel as="section" variant="outline" aria-label="Automation Engine">
          <div className="ref-section-head">
            <h3 className="ref-settings-title">Automation Engine</h3>
          </div>
          <p className="text-muted">
            Mode: <strong>{automationStatusQuery.data?.enabled ? "enabled" : "disabled"}</strong> | interval {automationStatusQuery.data?.interval_seconds ?? 0}s | execute rebalance{" "}
            <strong>{automationStatusQuery.data?.rebalance_execute_enabled ? "on" : "off"}</strong> | enterprise pinning{" "}
            <strong>{(automationStatusQuery.data?.enterprise_plan_keywords ?? []).join(", ") || "off"}</strong> | throttling{" "}
            <strong>{automationStatusQuery.data?.throttling_enabled ? (automationStatusQuery.data?.throttling_dry_run ? "dry-run" : "enforced") : "off"}</strong>
          </p>
          {automationStatusQuery.data?.last_run ? (
            <p className="text-muted">
              Last run: {formatDateTime(automationStatusQuery.data.last_run.generated_at)} | failed nodes <strong>{automationStatusQuery.data.last_run.failed_nodes}</strong> | planned moves <strong>{automationStatusQuery.data.last_run.rebalance_moves}</strong> | executed <strong>{automationStatusQuery.data.last_run.executed_migrations}</strong>
            </p>
          ) : null}
          <div className="actions-row">
            <Input
              placeholder="Preferred region (optional)"
              value={preferredRegion}
              onChange={(e) => setPreferredRegion(e.target.value)}
              aria-label="Preferred region"
            />
            <Input
              placeholder="Client/source region (optional)"
              value={sourceRegion}
              onChange={(e) => setSourceRegion(e.target.value)}
              aria-label="Source region"
            />
            <Checkbox
              label="Use latency probes"
              checked={useLatencyProbes}
              onChange={(e) => setUseLatencyProbes(e.target.checked)}
              aria-label="Use latency probes for placement"
            />
            <Button variant="secondary" size="sm" onClick={() => placementMutation.mutate()} disabled={placementMutation.isPending}>
              Simulate Placement
            </Button>
            <Button variant="secondary" size="sm" onClick={() => rebalanceMutation.mutate()} disabled={rebalanceMutation.isPending}>
              Build Rebalance Plan
            </Button>
            <Button variant="secondary" size="sm" onClick={() => failoverMutation.mutate()} disabled={failoverMutation.isPending}>
              Evaluate Failover
            </Button>
            <Checkbox
              label="Run with execution"
              checked={executeRebalanceNow}
              onChange={(e) => setExecuteRebalanceNow(e.target.checked)}
              aria-label="Execute rebalance on manual automation run"
            />
            <Button variant="primary" size="sm" onClick={() => runAutomationMutation.mutate()} disabled={runAutomationMutation.isPending}>
              Run Automation Now
            </Button>
          </div>
          {placementMutation.data ? (
            <div className="dashboard-section">
              <p className="text-muted">
                Selected node: <code>{placementMutation.data.selected_node_id ?? "none"}</code>
              </p>
              <Table<PlacementCandidateOut>
                columns={placementColumns}
                data={placementMutation.data.candidates}
                keyFn={(row) => row.node_id}
                emptyMessage="No placement candidates"
              />
            </div>
          ) : null}
          {rebalanceMutation.data ? (
            <div className="dashboard-section">
              <p className="text-muted">
                Planned peer moves: <strong>{rebalanceMutation.data.total_peers_to_move}</strong>
              </p>
              <Table<RebalanceMoveOut>
                columns={rebalanceColumns}
                data={rebalanceMutation.data.moves}
                keyFn={(row) => `${row.source_node_id}-${row.target_node_id}`}
                emptyMessage="No rebalance required"
              />
            </div>
          ) : null}
          {failoverMutation.data ? (
            <div className="dashboard-section">
              <p className="text-muted">
                Failed nodes: <strong>{failoverMutation.data.failed_nodes.length}</strong> | fallback pool{" "}
                <strong>{failoverMutation.data.fallback_nodes.length}</strong>
              </p>
            </div>
          ) : null}
          {runAutomationMutation.data ? (
            <div className="dashboard-section">
              <p className="text-muted">
                Manual run result: executed <strong>{runAutomationMutation.data.executed_migrations}</strong>, failed{" "}
                <strong>{runAutomationMutation.data.failed_migrations}</strong>, rollbacks{" "}
                <strong>{runAutomationMutation.data.rollback_migrations}</strong>
                {runAutomationMutation.data.executions?.length ? (
                  <>
                    {" "}
                    | enterprise skipped{" "}
                    <strong>
                      {runAutomationMutation.data.executions.reduce(
                        (acc, item) => acc + (item.skipped_enterprise ?? 0),
                        0
                      )}
                    </strong>
                  </>
                ) : null}
                {runAutomationMutation.data.stop_reason ? (
                  <>
                    {" "}
                    | stop reason <strong>{runAutomationMutation.data.stop_reason}</strong>
                  </>
                ) : null}
              </p>
            </div>
          ) : null}
        </Panel>

        <Panel as="section" variant="outline" aria-label="Topology Graph">
          <div className="ref-section-head">
            <h3 className="ref-settings-title">Topology Graph</h3>
          </div>
          {graphQuery.isLoading || !graphQuery.data || !graphLayout ? (
            <Skeleton height={180} />
          ) : (
            <div className="topology-graph-wrap">
              <svg
                className="topology-graph"
                viewBox={`0 0 ${graphLayout.width} ${graphLayout.height}`}
                role="img"
                aria-label="Topology graph"
              >
                {graphQuery.data.edges.map((edge, idx) => {
                  const from = graphLayout.positions.get(edge.source_node_id);
                  const to = graphLayout.positions.get(edge.target_node_id);
                  if (!from || !to) return null;
                  return (
                    <g key={`${edge.source_node_id}-${edge.target_node_id}-${edge.edge_type}-${idx}`}>
                      <line
                        x1={from.x}
                        y1={from.y}
                        x2={to.x}
                        y2={to.y}
                        className={`topology-edge topology-edge-${edge.edge_type}`}
                      />
                    </g>
                  );
                })}
                {graphQuery.data.nodes.map((node) => {
                  const p = graphLayout.positions.get(node.node_id);
                  if (!p) return null;
                  const loadPct = Math.round(node.load_ratio * 100);
                  return (
                    <g key={node.node_id}>
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r={18}
                        className={`topology-node topology-node-${node.status}`}
                      />
                      <text x={p.x} y={p.y - 26} textAnchor="middle" className="topology-node-label">
                        {node.container_name}
                      </text>
                      <text x={p.x} y={p.y + 5} textAnchor="middle" className="topology-node-load">
                        {loadPct}%
                      </text>
                    </g>
                  );
                })}
              </svg>
              <p className="text-muted">
                Edge legend: <code>intra_region</code> solid, <code>failover_candidate</code> dashed,{" "}
                <code>rebalance_suggested</code> highlighted
              </p>
            </div>
          )}
        </Panel>

        <Panel as="section" variant="outline" aria-label="Recent Control-Plane Events">
          <div className="ref-section-head">
            <h3 className="ref-settings-title">Recent Control-Plane Events</h3>
          </div>
          <p className="text-muted">
            Live stream: <strong>{wsConnected ? "connected" : "polling fallback"}</strong>
          </p>
          {eventsQuery.isLoading ? (
            <Skeleton height={80} />
          ) : mergedEvents.length ? (
            <ul className="dashboard-audit-list">
              {mergedEvents.map((event) => (
                <li key={event.id}>
                  <span className="text-muted">{formatDateTime(event.created_at)}</span>{" "}
                  <strong>{event.severity}</strong> <span>{event.event_type}</span>
                  {event.server_id ? (
                    <span className="text-muted"> ({event.server_id.slice(0, 8)})</span>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted">No events yet</p>
          )}
        </Panel>

        <Panel as="section" variant="outline" aria-label="Business Metrics (30d)">
          <div className="ref-section-head">
            <h3 className="ref-settings-title">Business Metrics (30d)</h3>
          </div>
          {businessQuery.isLoading || !businessQuery.data ? (
            <Skeleton height={80} />
          ) : (
            <dl className="telemetry-grid">
              <dt>Trial to paid</dt>
              <dd>{asPercent(businessQuery.data.trial_to_paid_rate_30d)}</dd>
              <dt>Referral conversion</dt>
              <dd>{asPercent(businessQuery.data.referral_conversion_rate)}</dd>
              <dt>Retention D30</dt>
              <dd>{asPercent(businessQuery.data.retention_d30)}</dd>
            </dl>
          )}
        </Panel>

        <Panel as="section" variant="outline" aria-label="Security Metrics">
          <div className="ref-section-head">
            <h3 className="ref-settings-title">Security Metrics</h3>
          </div>
          {securityQuery.isLoading ? (
            <Skeleton height={80} />
          ) : securityQuery.error instanceof ApiError && securityQuery.error.statusCode === 409 ? (
            <p className="text-muted">Not available in agent mode (direct runtime access required)</p>
          ) : securityQuery.data ? (
            <dl className="telemetry-grid">
              <dt>Key reuse</dt>
              <dd>{securityQuery.data.key_reuse_count}</dd>
              <dt>Reconnect bursts</dt>
              <dd>{securityQuery.data.reconnect_burst_peers}</dd>
              <dt>Stale handshake ratio</dt>
              <dd>{asPercent(securityQuery.data.stale_handshake_ratio)}</dd>
              <dt>Region anomalies</dt>
              <dd>{securityQuery.data.user_region_anomalies}</dd>
            </dl>
          ) : (
            <Skeleton height={80} />
          )}
        </Panel>

        <Panel as="section" variant="outline" aria-label="Anomaly Scoring (ML)">
          <div className="ref-section-head">
            <h3 className="ref-settings-title">Anomaly Scoring (ML)</h3>
          </div>
          {anomalyQuery.isLoading ? (
            <Skeleton height={120} />
          ) : anomalyQuery.error instanceof ApiError && anomalyQuery.error.statusCode === 409 ? (
            <p className="text-muted">Not available in agent mode (direct runtime access required)</p>
          ) : anomalyQuery.data?.top_users.length ? (
            <div>
              <p className="text-muted">
                Model <code>{anomalyQuery.data.model_version}</code> | avg score{" "}
                <strong>{anomalyQuery.data.avg_score.toFixed(3)}</strong> | high{" "}
                <strong>{anomalyQuery.data.high_risk_users}</strong> | medium{" "}
                <strong>{anomalyQuery.data.medium_risk_users}</strong>
              </p>
              <ul className="dashboard-audit-list">
                {anomalyQuery.data.top_users.slice(0, 8).map((user) => (
                  <li key={user.user_id}>
                    <span>
                      user <strong>{user.user_id}</strong> | risk <strong>{user.risk_level}</strong> | score{" "}
                      <strong>{user.score.toFixed(3)}</strong>
                    </span>
                    <span className="text-muted">{user.reasons.join("; ") || "no dominant signals"}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-muted">No anomalies scored yet</p>
          )}
        </Panel>
      </div>
    </div>
  );
}
