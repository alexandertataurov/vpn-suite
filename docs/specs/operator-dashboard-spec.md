# Operator Dashboard Spec — Bloomberg-Style Console

**Mission:** Redesign main dashboard into an operator console driven by real Prometheus metrics. Zero decorative UI. Design for operators managing traffic and infrastructure risk.

---

## 0) DISCOVERY — VPN Metric Inventory

### Access Model
| Aspect | Implementation |
|--------|----------------|
| Prometheus access | Backend `PrometheusQueryService` → direct HTTP to `TELEMETRY_PROMETHEUS_URL` |
| Frontend | No direct Prometheus. All data via backend API. |
| Scrape interval | 15s (prometheus.yml) |
| Time range controls | Dashboard has 1h/6h/24h; backend `query_range` accepts start/end/step |

**Metrics availability:** When the stack runs (e.g. from `/opt/vpn-suite`), metrics are exposed by these services:
- `admin-api:8000/metrics` — control-plane, HTTP, cluster, reconciliation
- `cadvisor:8080/metrics` — container CPU, memory, network (Docker)
- `node-exporter:9100/metrics` — host CPU, memory, disk, load (running servers)
- `node-agent:9105/metrics` — per-node agent (heartbeat, peers, handshake) — when agent profile
- `telegram-vpn-bot:8090/metrics` — bot request counts

### VPN Metric Inventory Table

| Metric Name | Labels | Unit | Aggregation | Scrape/Source | Class |
|-------------|--------|------|-------------|---------------|-------|
| `up` | job, instance | 1/0 | instant | 15s (Prometheus) | Node health |
| `http_requests_total` | method, path_template, status_class | count | rate | admin-api | API health |
| `http_request_duration_seconds_bucket` | method, path_template, le | seconds | histogram | admin-api | API health |
| `http_errors_total` | path_template, error_type | count | rate | admin-api | Error rate |
| `auth_failures_total` | reason | count | rate | admin-api | Error rate |
| `vpn_nodes_total` | status | count | instant | admin-api | Node health |
| `vpn_node_health` | node_id, container_name | 0–100 | instant | admin-api | Node health |
| `vpn_node_peers` | node_id, container_name | count | instant | admin-api | User sessions |
| `vpn_node_traffic_rx_bytes` | server_id | bytes | instant | admin-api | Throughput |
| `vpn_node_traffic_tx_bytes` | server_id | bytes | instant | admin-api | Throughput |
| `vpn_cluster_capacity` | — | count | instant | admin-api | System resources |
| `vpn_cluster_load` | — | count | instant | admin-api | System resources |
| `vpn_cluster_health_score` | — | 0–1 | instant | admin-api | Node health |
| `vpn_cluster_load_index` | — | 0–1 | instant | admin-api | System resources |
| `vpn_peers_total` | status | count | instant | admin-api | User sessions |
| `vpn_reconciliation_runs_total` | status | count | rate | admin-api | System resources |
| `vpn_admin_issue_total` | status | count | rate | admin-api | Error rate |
| `vpn_server_sync_total` | mode, status | count | rate | admin-api | System resources |
| `vpn_server_sync_latency_seconds` | — | seconds | histogram | admin-api | System resources |
| `vpn_server_snapshot_staleness_seconds` | server_id | seconds | instant | admin-api | Node health |
| `vpn_node_last_seen_seconds` | — | seconds | instant | (optional; alert ref) | Node health |
| `container_cpu_usage_seconds_total` | id, name | seconds | rate | cadvisor 15s | System resources |
| `container_memory_working_set_bytes` | id, name | bytes | instant | cadvisor | System resources |
| `container_spec_memory_limit_bytes` | id, name | bytes | instant | cadvisor | System resources |
| `container_network_receive_bytes_total` | id, name | bytes | rate | cadvisor | Throughput |
| `container_network_transmit_bytes_total` | id, name | bytes | rate | cadvisor | Throughput |
| `node_memory_MemAvailable_bytes` | instance, job | bytes | instant | node-exporter | System resources |
| `node_memory_MemTotal_bytes` | instance, job | bytes | instant | node-exporter | System resources |
| `node_filesystem_avail_bytes` | mountpoint, instance | bytes | instant | node-exporter | System resources |
| `agent_last_heartbeat_ok` | — | 0/1 | instant | node-agent 15s | Node health |
| `agent_last_handshake_max_age_seconds` | — | seconds | instant | node-agent | Node health |
| `agent_peers_runtime` | — | count | instant | node-agent | User sessions |
| `agent_peers_active` | — | count | instant | node-agent | User sessions |
| `bot_requests_total` | status_class | count | rate | telegram-vpn-bot | API health |
| `payment_webhook_total` | status | count | rate | admin-api | Error rate |
| `funnel_events_total` | event_type | count | rate | admin-api | User sessions |

### Unsupported / Not Available
- **Avg session duration** — no metric
- **Per-server API latency** — http_request_duration is global; no server_id in path
- **node_load1** — node-exporter scraped but not used in existing queries; available if needed

### Non-Prometheus Sources (Backend Aggregation)
| Source | Data | Used For |
|--------|------|----------|
| Redis `dashboard:timeseries:cluster` | peers, rx, tx, ts | Traffic & load (cluster) |
| Redis `telemetry:server:{id}` | peers, rx, tx, last_updated | Per-server when no Prometheus |
| Redis `agent_hb:{server_id}` | health_score, peer_count, ts_utc | Agent heartbeat fallback |
| DB (overview) | servers_total, peers_total, users_total, subscriptions_active, mrr | Overview KPIs |
| DB (servers) | name, region, status, api_endpoint | Server table |

### Metrics Classification
- **Node health:** up, vpn_nodes_total, vpn_node_health, vpn_server_snapshot_staleness_seconds, agent_last_heartbeat_ok
- **Network throughput:** vpn_node_traffic_*, container_network_*_bytes_total
- **User sessions:** vpn_node_peers, vpn_peers_total, funnel_events_total, agent_peers_*
- **Error rate:** http_requests_total (5xx), auth_failures_total, vpn_admin_issue_total, payment_webhook_total
- **System resources:** container_cpu_*, container_memory_*, node_memory_*, vpn_cluster_*
- **API health:** http_requests_total, http_request_duration_seconds, bot_requests_total

---

## 1) DASHBOARD LAYOUT (OPERATOR GRID)

```
+--------------------------------------------------------------------------------------------------+
| GLOBAL HEALTH STRIP                                                                               |
+--------------------------------------------------------------------------------------------------+
| CLUSTER HEALTH MATRIX              | ACTIVE INCIDENTS                                              |
+------------------------------------+---------------------------------------------------------------+
| TRAFFIC & LOAD                     | USER SESSIONS                                                  |
+------------------------------------+---------------------------------------------------------------+
| SERVER TABLE (LIVE)                                                                               |
+--------------------------------------------------------------------------------------------------+
```

- Strict CSS Grid
- 1px borders, no cards, no shadows
- Dense layout

---

## 2) GLOBAL HEALTH STRIP

| Item | Source | Health Logic |
|------|--------|--------------|
| API Status | `up{job="admin-api"}` | 1=OK, 0=Down |
| Prometheus Status | `up{job="admin-api"}` or query success | success=OK, fail=Down |
| Total Nodes | `sum(vpn_nodes_total)` or DB | — |
| Online Nodes | `sum(vpn_nodes_total{status=~"healthy\|ok\|degraded"})` | — |
| Active Sessions | `vpn_peers_total{status="active"}` or `vpn_cluster_load` | — |
| Total Throughput | `sum(rate(vpn_node_traffic_rx_bytes + vpn_node_traffic_tx_bytes)[5m])` or Redis timeseries | — |
| Avg Latency | `histogram_quantile(0.5, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))` | — |
| Error Rate % | `sum(rate(http_requests_total{status_class="5xx"}[5m])) / sum(rate(http_requests_total[5m])) * 100` | <1% OK, 1–5% Degraded, >5% Down |
| Last Updated | Backend response `X-Response-Time` or `timestamp` | — |
| Refresh Mode | Polling (no streaming today) | — |

Health states: OK, Degraded, Down — derived from thresholds above.

---

## 3) CLUSTER HEALTH MATRIX

| Column | Query / Source |
|--------|----------------|
| Region | DB (Server.region) |
| Total Nodes | count by region |
| Online | `sum(vpn_nodes_total{status=~"healthy\|ok\|degraded"})` by region or DB |
| CPU Avg | `avg by (region) (sum by (id,name) (rate(container_cpu_usage_seconds_total[5m])) * 100)` — requires region label; if absent: avg per container by server region mapping |
| RAM Avg | `avg by (region) (container_memory_working_set_bytes / container_spec_memory_limit_bytes * 100)` — same caveat |
| Users | `sum(vpn_node_peers)` by region |
| Throughput | `sum(rate(vpn_node_traffic_rx_bytes + vpn_node_traffic_tx_bytes)[5m])` by region |
| Error % | cluster-level or per-region if labels support |
| Latency p95 | `histogram_quantile(0.95, ...)` per region if path_template has region |
| Health | OK/Degraded/Down from up, CPU>85%, error spike, no heartbeat |

**Note:** Region labels are not in Prometheus; use DB Server.region to join. CPU/RAM per region requires mapping container id → server_id → region via backend.

---

## 4) TRAFFIC & LOAD (Prometheus Trends)

| Chart | PromQL | Fallback |
|-------|--------|----------|
| Total throughput | `sum(rate(vpn_node_traffic_rx_bytes[5m])) + sum(rate(vpn_node_traffic_tx_bytes[5m]))` | Redis dashboard_timeseries (rx+tx) |
| Error rate % | `sum(rate(http_requests_total{status_class="5xx"}[5m])) / (sum(rate(http_requests_total[5m])) + 1e-9) * 100` | — |
| Active sessions | `vpn_cluster_load` or `vpn_peers_total{status="active"}` | Redis peers |
| CPU load avg | `avg(rate(container_cpu_usage_seconds_total[5m])) * 100` or node_exporter `node_load1` if scraped | — |

- Time range: 5m / 15m / 1h / 6h / 24h (sync all panels)
- Thin lines, no animation, no gradients
- Show last sample timestamp; mark stale if last data > threshold (see Freshness)

---

## 5) USER SESSIONS BLOCK

| Metric | Source |
|--------|--------|
| Active users | `vpn_peers_total{status="active"}` or DB Device count |
| New sessions/min | `sum(rate(funnel_events_total{event_type="issue"}[1m])) * 60` or increase over window |
| Avg session duration | Not in current metrics — **unsupported** |
| Peak concurrency 24h | `max_over_time(vpn_cluster_load[24h])` |
| 1h Δ, 24h Δ | Compare current vs 1h/24h ago (query at t-1h, t-24h) |

---

## 6) SERVER TABLE (CONTROL PLANE CORE)

| Column | Source |
|--------|--------|
| Name, Region, IP | DB Server |
| Status | `up{job=~"node-agent|admin-api"}` or vpn_node_health threshold; DB Server.status fallback |
| CPU %, RAM % | `sum by (id,name) (rate(container_cpu_usage_seconds_total[1m]))*100`, `container_memory_working_set_bytes/container_spec_memory_limit_bytes*100` — requires container↔server mapping |
| Users | `vpn_node_peers{node_id=...}` or `/servers/telemetry/summary` |
| Throughput | `rate(vpn_node_traffic_rx_bytes{server_id=...}[5m]) + rate(vpn_node_traffic_tx_bytes{server_id=...}[5m])` |
| Latency | Not per-server in current metrics — use agent_last_handshake_max_age or **unsupported** |
| Last Heartbeat | Redis agent_hb or vpn_server_snapshot_staleness_seconds |
| Freshness | See Freshness Model |
| Actions | Sync (POST /servers/:id/sync), Drain, Restart, Delete — per existing API |

---

## 7) DATA FRESHNESS MODEL

| State | Condition |
|-------|-----------|
| FRESH | last sample ≤ 30s |
| DEGRADED | 30s < last sample ≤ 2m |
| STALE | last sample > 2m |
| UNKNOWN | no timestamp |

- Each widget: Last Updated, Freshness badge, Retry control
- Never present stale data as live; show "Stale" badge

---

## 8) PROMQL QUERY PLAN

| Widget | Query |
|--------|-------|
| API up | `up{job="admin-api"}` |
| Error rate % | `sum(rate(http_requests_total{job="admin-api",status_class="5xx"}[5m])) / (sum(rate(http_requests_total{job="admin-api"}[5m])) + 1e-9) * 100` |
| Latency p50 | `histogram_quantile(0.5, sum(rate(http_request_duration_seconds_bucket{job="admin-api"}[5m])) by (le))` |
| Latency p95 | `histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket{job="admin-api"}[5m])) by (le))` |
| Total nodes | `sum(vpn_nodes_total)` |
| Online nodes | `sum(vpn_nodes_total{status=~"healthy\|ok\|degraded"})` |
| Cluster load | `vpn_cluster_load` |
| Cluster capacity | `vpn_cluster_capacity` |
| Cluster health | `vpn_cluster_health_score` |
| Throughput (rate) | `sum(rate(vpn_node_traffic_rx_bytes[5m])) + sum(rate(vpn_node_traffic_tx_bytes[5m]))` |
| Per-server peers | `vpn_node_peers{node_id="<id>"}` |
| Per-server traffic | `vpn_node_traffic_rx_bytes{server_id="<id>"}` (instant) or rate over 5m |
| Container CPU | `sum by (id, name) (rate(container_cpu_usage_seconds_total[1m])) * 100` |
| Container RAM | `sum by (id, name) (container_memory_working_set_bytes) / clamp_min(sum by (id, name) (container_spec_memory_limit_bytes), 1) * 100` |

**Constraints:** Rate limits on backend; max time range 7d; prefer server-side aggregation.

---

## 9) INCIDENT DETECTION LOGIC

| Incident | Detection | Severity |
|----------|-----------|----------|
| Nodes down | `up{job=~"node-agent|admin-api"}` == 0 | critical |
| Nodes stale | `vpn_server_snapshot_staleness_seconds > 120` | warning |
| High CPU nodes | `sum by (id,name)(rate(container_cpu_usage_seconds_total[5m]))*100 > 85` | warning |
| High error cluster | Error rate % > 5 | warning |
| Telemetry gap | Last scrape/sample > 2m | warning |

Each entry: Severity, Node/Region, Metric value, Timestamp, Link to server detail.

---

## 10) OBSERVABILITY INTEGRATION

- Request duration logging: existing `PrometheusMiddleware`, `http_request_duration_seconds`
- Failed query logging: `external.call.failed` in backend
- Correlation ID: `X-Request-ID` propagated
- Add Prometheus query timing metric (optional): `prometheus_query_duration_seconds`

---

## 11) PR ROADMAP (3–4 PRs)

| PR | Scope |
|----|-------|
| **PR1** | Backend: `/api/v1/dashboard/operator` aggregate endpoint — Prometheus queries + DB/Redis fallbacks; returns health strip, cluster matrix, incident list, server table snapshot. Add freshness timestamps. |
| **PR2** | Frontend: Bloomberg layout (grid, 1px borders, no cards). HealthStrip, MetricRow, IncidentPanel components. |
| **PR3** | Frontend: Traffic & Load charts (query_range), User Sessions block, Server Table with virtualization. Time range sync (5m/15m/1h/6h/24h). |
| **PR4** | Freshness badges, retry controls, debounce, exponential backoff, virtualized server table (>200 rows). |

---

## 12) CODE EXAMPLES

### HealthStrip (conceptual)

```tsx
interface HealthStripProps {
  apiStatus: 'ok' | 'degraded' | 'down';
  prometheusStatus: 'ok' | 'down';
  totalNodes: number;
  onlineNodes: number;
  activeSessions: number;
  totalThroughputBps: number;
  avgLatencyMs: number;
  errorRatePct: number;
  lastUpdated: string;
  refreshMode: 'polling';
}

function HealthStrip(props: HealthStripProps) {
  return (
    <div className="operator-health-strip" role="region" aria-label="Global health">
      <MetricCell label="API" value={props.apiStatus} state={props.apiStatus} />
      <MetricCell label="Prom" value={props.prometheusStatus} state={props.prometheusStatus} />
      <MetricCell label="Nodes" value={`${props.onlineNodes}/${props.totalNodes}`} />
      <MetricCell label="Sessions" value={props.activeSessions} />
      <MetricCell label="Throughput" value={formatBps(props.totalThroughputBps)} />
      <MetricCell label="Latency" value={`${props.avgLatencyMs}ms`} />
      <MetricCell label="Error %" value={`${props.errorRatePct.toFixed(2)}%`} state={errorState(props.errorRatePct)} />
      <MetricCell label="Updated" value={props.lastUpdated} />
      <MetricCell label="Mode" value={props.refreshMode} />
    </div>
  );
}
```

### MetricRow (numeric, right-aligned)

```tsx
interface MetricRowProps {
  label: string;
  value: string | number;
  align?: 'left' | 'right';
}

function MetricRow({ label, value, align = 'right' }: MetricRowProps) {
  return (
    <div className="operator-metric-row">
      <span className="operator-metric-label">{label}</span>
      <span className={`operator-metric-value operator-metric-value--${align}`}>{value}</span>
    </div>
  );
}
```

### PrometheusQueryHook (backend — Python)

```python
# Backend: app/api/v1/dashboard.py
@router.get("/operator", response_model=OperatorDashboardOut)
async def get_operator_dashboard(
    time_range: str = Query("1h", regex="^(5m|15m|1h|6h|24h)$"),
    _admin=Depends(require_permission(PERM_CLUSTER_READ)),
):
    prom = PrometheusQueryService()
    now = datetime.now(timezone.utc)
    start = now - timedelta(seconds=TIME_RANGE_SECONDS[time_range])
    data = {}
    if prom.enabled:
        data["api_up"] = await _query_scalar(prom, 'up{job="admin-api"}')
        data["error_rate"] = await _query_scalar(prom, ERROR_RATE_EXPR)
        # ... more queries with asyncio.gather, timeout, fallback
    return OperatorDashboardOut(
        health_strip=_build_health_strip(data),
        cluster_matrix=await _build_cluster_matrix(prom, db),
        incidents=await _detect_incidents(prom),
        servers=await _build_server_table(prom, db),
        last_updated=now.isoformat(),
        freshness=compute_freshness(data),
    )
```

### ServerRow (with Freshness, Actions)

```tsx
interface ServerRowProps {
  name: string;
  region: string;
  ip: string;
  status: 'online' | 'degraded' | 'offline' | 'unknown';
  cpuPct: number | null;
  ramPct: number | null;
  users: number;
  throughputBps: number;
  lastHeartbeat: string | null;
  freshness: 'fresh' | 'degraded' | 'stale' | 'unknown';
  onSync: () => void;
  onDrain?: () => void;
  onRestart?: () => void;
}

function ServerRow(props: ServerRowProps) {
  return (
    <tr className="operator-server-row">
      <td>{props.name}</td>
      <td>{props.region}</td>
      <td>{props.ip}</td>
      <td><StatusBadge status={props.status} /></td>
      <td className="text-right">{props.cpuPct != null ? `${props.cpuPct.toFixed(1)}%` : '—'}</td>
      <td className="text-right">{props.ramPct != null ? `${props.ramPct.toFixed(1)}%` : '—'}</td>
      <td className="text-right">{props.users}</td>
      <td className="text-right">{formatBps(props.throughputBps)}</td>
      <td>{props.lastHeartbeat ?? '—'}</td>
      <td><FreshnessBadge state={props.freshness} /></td>
      <td>
        <button onClick={props.onSync}>Sync</button>
        {props.onDrain && <button onClick={props.onDrain}>Drain</button>}
      </td>
    </tr>
  );
}
```

---

## 13) PERFORMANCE & RISK

| Risk | Mitigation |
|------|------------|
| Duplicate polling | Single dashboard query; backend aggregates; debounce time range changes |
| Outdated queries | AbortController on unmount; cancel in-flight on range change |
| Re-render storms | Memoize chart options; virtualize server table if >200 rows |
| Prometheus overload | Limit concurrency; 0.6s budget for snapshot (existing); max step 300s |
| Stale presented as live | Freshness badge; never hide staleness |
| High-cardinality | Avoid per-user metrics in dashboard; aggregate by server_id/node_id |
