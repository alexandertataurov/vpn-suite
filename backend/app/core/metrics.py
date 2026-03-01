"""Prometheus metrics for VPN control-plane (cluster, nodes, reconciliation)."""

from prometheus_client import Counter, Gauge, Histogram

# Build/version info (exposed on /metrics for correlation)
vpn_suite_info = Gauge(
    "vpn_suite_info",
    "Build/version info (value 1); label version from API_VERSION.",
    ["version"],
)

# HTTP errors and auth failures (observability)
http_errors_total = Counter(
    "http_errors_total",
    "Total HTTP errors by path template and error type",
    ["path_template", "error_type"],
)
auth_failures_total = Counter(
    "auth_failures_total",
    "Total auth failures (login, refresh)",
    ["reason"],  # e.g. invalid_credentials, invalid_totp, token_revoked, invalid_refresh
)

health_check_failures_total = Counter(
    "health_check_failures_total",
    "Health check failures per server",
    ["server_id"],
)

# Cluster
vpn_nodes_total = Gauge(
    "vpn_nodes_total",
    "Total number of VPN nodes",
    ["status"],
)
vpn_cluster_capacity = Gauge("vpn_cluster_capacity", "Total peer capacity across all nodes")
vpn_cluster_load = Gauge("vpn_cluster_load", "Current number of active peers")
vpn_cluster_health_score = Gauge("vpn_cluster_health_score", "Cluster health score (0-1)")
vpn_cluster_load_index = Gauge(
    "vpn_cluster_load_index",
    "Cluster load factor (current_load/total_capacity, 0-1)",
)

# Per-node (labels: node_id, container_name)
vpn_node_health = Gauge(
    "vpn_node_health",
    "Node health score",
    ["node_id", "container_name"],
)
vpn_node_peers = Gauge(
    "vpn_node_peers",
    "Active peers on node",
    ["node_id", "container_name"],
)
vpn_node_interface_info = Gauge(
    "vpn_node_interface_info",
    "Node interface metadata (value is always 1)",
    ["node_id", "container_name", "interface_name"],
)
# Per-node traffic from wg show dump (updated by telemetry poll)
vpn_node_traffic_rx_bytes = Gauge(
    "vpn_node_traffic_rx_bytes",
    "Total RX bytes on node (from wg show dump)",
    ["server_id"],
)
vpn_node_traffic_tx_bytes = Gauge(
    "vpn_node_traffic_tx_bytes",
    "Total TX bytes on node (from wg show dump)",
    ["server_id"],
)

# Peers
vpn_peers_total = Gauge(
    "vpn_peers_total",
    "Total number of peers",
    ["status"],
)

# Reconciliation
vpn_reconciliation_runs_total = Counter(
    "vpn_reconciliation_runs_total",
    "Number of reconciliation cycles",
    ["status"],
)
vpn_reconciliation_drift = Gauge(
    "vpn_reconciliation_drift",
    "Number of items requiring correction",
    ["drift_type"],
)
vpn_reconciliation_duration_seconds = Histogram(
    "vpn_reconciliation_duration_seconds",
    "Reconciliation cycle duration",
    buckets=(0.5, 1.0, 2.0, 5.0, 10.0, 30.0),
)
vpn_reconciliation_errors_total = Counter(
    "vpn_reconciliation_errors_total",
    "Reconciliation errors by node and stage",
    ["node_id", "stage"],
)
vpn_peers_expected = Gauge(
    "vpn_peers_expected",
    "Number of peers expected on node (from DB)",
    ["node_id"],
)
vpn_peers_present = Gauge(
    "vpn_peers_present",
    "Number of peers present on node (from wg show)",
    ["node_id"],
)
vpn_peers_readded_total = Counter(
    "vpn_peers_readded_total",
    "Peers re-added during reconciliation (per node)",
    ["node_id"],
)
vpn_peer_apply_failures_total = Counter(
    "vpn_peer_apply_failures_total",
    "Peer apply failures during reconciliation",
    ["node_id", "reason"],
)
vpn_peers_orphan_count = Gauge(
    "vpn_peers_orphan_count",
    "Peers on node not in DB (ORPHAN) when reconciliation_remove_orphans=false",
    ["node_id"],
)
vpn_handshake_latency_seconds = Gauge(
    "vpn_handshake_latency_seconds",
    "Seconds from last_applied_at to first handshake (from telemetry when available).",
    ["device_id", "server_id"],
)
vpn_devices_no_handshake = Gauge(
    "vpn_devices_no_handshake",
    "Number of devices with apply_status=NO_HANDSHAKE (no handshake within gate)",
    [],
)

# Per-device handshake diagnostics
vpn_peer_last_handshake_age_seconds = Gauge(
    "vpn_peer_last_handshake_age_seconds",
    "Age of last handshake per device (seconds, from telemetry cache).",
    ["device_id", "server_id"],
)
vpn_peer_unstable_events_total = Counter(
    "vpn_peer_unstable_events_total",
    "Unstable peer events detected by control-plane (e.g. no_handshake).",
    ["reason"],
)

# Bot funnel (spec: bot_conversion_rate; use funnel_events_total + PromQL for rate)
funnel_events_total = Counter(
    "funnel_events_total",
    "Funnel events from bot/webapp (start, plan_selected, payment, issue, etc.)",
    ["event_type"],
)
# Conversion rate = issue/start over window; expose as Gauge for dashboards (optional update in task).
bot_conversion_rate = Gauge(
    "bot_conversion_rate",
    "Conversion rate (issue/start) over last 24h; 0 if no starts.",
)

# Admin operator: issue / rotate / revoke
admin_issue_total = Counter(
    "vpn_admin_issue_total",
    "Admin peer issuance (create on server)",
    ["status"],
)
# Server snapshot sync (auto/manual)
server_sync_total = Counter(
    "vpn_server_sync_total",
    "Server snapshot sync attempts",
    ["mode", "status"],  # mode=auto|manual, status=success|failure
)
server_sync_latency_seconds = Histogram(
    "vpn_server_sync_latency_seconds",
    "Server snapshot sync duration",
    buckets=(0.5, 1.0, 2.0, 5.0, 10.0, 30.0),
)
server_snapshot_staleness_seconds = Gauge(
    "vpn_server_snapshot_staleness_seconds",
    "Seconds since last successful snapshot per server",
    ["server_id"],
)

admin_issue_latency_seconds = Histogram(
    "vpn_admin_issue_latency_seconds",
    "Admin peer issuance latency",
    ["status"],
    buckets=(0.1, 0.25, 0.5, 1.0, 2.0, 5.0),
)
admin_revoke_total = Counter(
    "vpn_admin_revoke_total",
    "Admin peer revocations",
    ["status"],
)
admin_rotate_total = Counter(
    "vpn_admin_rotate_total",
    "Admin peer key rotations",
    ["status"],
)
config_download_total = Counter(
    "vpn_config_download_total",
    "One-time config download by token (download or qr)",
    ["endpoint", "status"],
)
config_gen_success_total = Counter(
    "vpn_config_gen_success_total",
    "Config generation success",
    ["profile"],
)
config_gen_failure_total = Counter(
    "vpn_config_gen_failure_total",
    "Config generation failure",
    ["profile", "reason"],
)

payment_webhook_total = Counter(
    "payment_webhook_total",
    "Payment webhook events",
    ["status"],  # received, processed, failed
)

# Revenue engine (trial, conversion, churn, referral)
vpn_revenue_trial_started_total = Counter(
    "vpn_revenue_trial_started_total",
    "Trials started",
)
vpn_revenue_trial_converted_total = Counter(
    "vpn_revenue_trial_converted_total",
    "Trial users who paid",
)
vpn_revenue_subscriptions_active = Gauge(
    "vpn_revenue_subscriptions_active",
    "Current active (non-trial, non-expired) subscriptions",
)
vpn_revenue_mrr = Gauge(
    "vpn_revenue_mrr",
    "MRR from active paid subscriptions",
)
vpn_revenue_churn_total = Counter(
    "vpn_revenue_churn_total",
    "Churn survey submissions",
    ["reason"],
)
vpn_revenue_renewal_total = Counter(
    "vpn_revenue_renewal_total",
    "Renewals (payment extending sub)",
)
vpn_revenue_referral_signup_total = Counter(
    "vpn_revenue_referral_signup_total",
    "Referral signups (referee attached)",
)
vpn_revenue_referral_paid_total = Counter(
    "vpn_revenue_referral_paid_total",
    "Referrals that converted to paid",
)
vpn_revenue_payment_total = Counter(
    "vpn_revenue_payment_total",
    "Payments completed",
    ["plan_id"],
)
# Business gauges (updated by revenue metrics task every 5–15 min)
vpn_revenue_arr = Gauge("vpn_revenue_arr", "ARR from active paid subscriptions")
vpn_revenue_arpu = Gauge("vpn_revenue_arpu", "ARPU (MRR / active subscriptions)")
vpn_revenue_conversion_rate = Gauge(
    "vpn_revenue_conversion_rate",
    "Trial-to-paid conversion rate (0–100)",
)
vpn_revenue_renewal_rate = Gauge(
    "vpn_revenue_renewal_rate",
    "Renewal rate (0–100) over window",
)
vpn_revenue_churn_rate = Gauge(
    "vpn_revenue_churn_rate",
    "Churn rate (0–100) over window",
)
vpn_revenue_expiry_forecast_30d = Gauge(
    "vpn_revenue_expiry_forecast_30d",
    "Subscriptions expiring in next 30 days",
)
vpn_revenue_per_server = Gauge(
    "vpn_revenue_per_server",
    "Revenue (MRR share or count) per server",
    ["server_id"],
)

# Abuse/anomaly (updated by periodic task)
vpn_abuse_high_risk_users = Gauge(
    "vpn_abuse_high_risk_users",
    "Number of users with high abuse risk score",
)
vpn_abuse_medium_risk_users = Gauge(
    "vpn_abuse_medium_risk_users",
    "Number of users with medium abuse risk score",
)
vpn_anomaly_high_risk_users = Gauge(
    "vpn_anomaly_high_risk_users",
    "Number of users with high anomaly risk score",
)
vpn_anomaly_score_max = Gauge(
    "vpn_anomaly_score_max",
    "Max user anomaly score (0–1)",
)
vpn_abuse_signals_total = Counter(
    "vpn_abuse_signals_total",
    "Abuse signals created per run",
    ["severity"],
)
vpn_config_regen_cap_hits_total = Counter(
    "vpn_config_regen_cap_hits_total",
    "Config regeneration daily cap hit (user blocked)",
)

# Peer reconciliation: ghost (on node not in DB) and expired-but-active (in DB expired, still on node)
vpn_peers_ghost_count = Gauge(
    "vpn_peers_ghost_count",
    "Peers on node not in DB (ghost/orphan)",
    ["node_id"],
)
vpn_peers_expired_active_count = Gauge(
    "vpn_peers_expired_active_count",
    "Peers on node that are expired in DB but still present",
    ["node_id"],
)

# Mini App events (dashboard_open, pricing_view, plan_selected)
miniapp_events_total = Counter(
    "miniapp_events_total",
    "Mini App frontend events",
    ["event"],
)
frontend_telemetry_events_total = Counter(
    "frontend_telemetry_events_total",
    "Admin frontend telemetry events ingestion result",
    ["event", "result"],  # result=accepted|dropped
)
frontend_telemetry_batches_total = Counter(
    "frontend_telemetry_batches_total",
    "Admin frontend telemetry batches ingestion result",
    ["result"],  # result=accepted|dropped|disabled
)
frontend_errors_total = Counter(
    "frontend_errors_total",
    "Frontend error reports received",
    ["app"],  # app=admin|miniapp|unknown
)
frontend_web_vital_ms = Histogram(
    "frontend_web_vital_ms",
    "Frontend web vital measurements in milliseconds",
    ["app", "name", "route"],
    buckets=(50, 100, 200, 500, 1000, 2500, 4000, 8000, 15000),
)
frontend_web_vital_score = Histogram(
    "frontend_web_vital_score",
    "Frontend web vital score measurements (CLS)",
    ["app", "name", "route"],
    buckets=(0.01, 0.05, 0.1, 0.25, 0.5, 1, 2, 5),
)

# Redis latency (optional; updated by periodic ping)
redis_latency_seconds = Histogram(
    "redis_latency_seconds",
    "Redis ping latency",
    buckets=(0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0),
)

provision_failures_total = Counter(
    "provision_failures_total",
    "Provisioning failures (issue, rotate, revoke)",
    ["server_id", "reason"],
)
config_issue_blocked_total = Counter(
    "vpn_config_issue_blocked_total",
    "Issue/reissue blocked (e.g. server key not verified)",
    ["reason"],
)
server_key_sync_success_total = Counter(
    "vpn_server_key_sync_success_total",
    "Server public key fetched from node (live)",
    ["server_id"],
)
server_key_sync_fail_total = Counter(
    "vpn_server_key_sync_fail_total",
    "Server key fetch/sync failure",
    ["server_id", "reason"],
)
server_key_mismatch_total = Counter(
    "vpn_server_key_mismatch_total",
    "DB key differed from live key (corrected)",
    ["server_id"],
)
discovery_not_found_total = Counter(
    "vpn_discovery_not_found_total",
    "Server not found in discovery",
    ["server_id"],
)
node_agent_unreachable_total = Counter(
    "vpn_node_agent_unreachable_total",
    "Server in DB but no recent agent heartbeat (agent mode)",
    ["server_id"],
)

# Docker telemetry internals
docker_telemetry_cache_hits_total = Counter(
    "docker_telemetry_cache_hits_total",
    "Docker telemetry cache hits",
    ["scope"],
)
docker_telemetry_cache_misses_total = Counter(
    "docker_telemetry_cache_misses_total",
    "Docker telemetry cache misses",
    ["scope"],
)
docker_telemetry_upstream_failures_total = Counter(
    "docker_telemetry_upstream_failures_total",
    "Docker telemetry upstream failures",
    ["upstream", "endpoint"],
)
docker_telemetry_upstream_latency_seconds = Histogram(
    "docker_telemetry_upstream_latency_seconds",
    "Docker telemetry upstream request latency",
    ["upstream", "endpoint"],
    buckets=(0.01, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0),
)

# Operator dashboard endpoint health
overview_operator_requests_total = Counter(
    "overview_operator_requests_total",
    "Operator dashboard requests by response mode",
    ["status"],  # ok|degraded|error
)
overview_operator_latency_seconds = Histogram(
    "overview_operator_latency_seconds",
    "Latency of operator dashboard aggregation",
    buckets=(0.05, 0.1, 0.25, 0.5, 1.0, 2.0, 5.0),
)
prometheus_query_failures_total = Counter(
    "prometheus_query_failures_total",
    "Prometheus query failures from operator dashboard aggregation",
    ["query_name"],
)

# Telemetry polling loop health
telemetry_poll_runs_total = Counter(
    "telemetry_poll_runs_total",
    "Telemetry poll loop runs",
    ["status"],  # ok|error|skipped
)
telemetry_poll_duration_seconds = Histogram(
    "telemetry_poll_duration_seconds",
    "Telemetry poll loop duration",
    buckets=(0.1, 0.25, 0.5, 1.0, 2.0, 5.0, 10.0, 30.0),
)
telemetry_poll_server_failures_total = Counter(
    "telemetry_poll_server_failures_total",
    "Telemetry poll failures per server",
    ["server_id", "reason"],
)
telemetry_poll_server_success_total = Counter(
    "telemetry_poll_server_success_total",
    "Telemetry poll successes per server",
    ["server_id"],
)
telemetry_poll_last_success_timestamp = Gauge(
    "telemetry_poll_last_success_timestamp",
    "Unix timestamp of last successful telemetry poll per server",
    ["server_id"],
)

# DB per request (optional; set by db_metrics middleware when enabled)
db_queries_per_request = Histogram(
    "db_queries_per_request",
    "Number of DB queries per HTTP request",
    ["method", "path_template"],
    buckets=(1, 2, 3, 5, 10, 20, 50),
)
db_time_per_request_seconds = Histogram(
    "db_time_per_request_seconds",
    "Total DB time per HTTP request in seconds",
    ["method", "path_template"],
    buckets=(0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0),
)
# Node runtime call duration (list_peers, add_peer, remove_peer)
node_runtime_call_duration_seconds = Histogram(
    "node_runtime_call_duration_seconds",
    "Node runtime adapter call duration in seconds",
    ["operation", "adapter"],
    buckets=(0.01, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0),
)

# Telemetry snapshot API (cache-only fast path)
telemetry_snapshot_request_duration_seconds = Histogram(
    "telemetry_snapshot_request_duration_seconds",
    "Latency of GET /telemetry/snapshot (cache read)",
    ["scope", "fields_filter"],
    buckets=(0.01, 0.025, 0.05, 0.1, 0.2, 0.5, 1.0),
)

# Live observability pipeline (SSE + Redis hot state)
live_connections = Gauge(
    "live_connections",
    "Current number of active live metrics SSE connections",
)
live_events_in_total = Counter(
    "live_events_in_total",
    "Total number of live snapshot updates written to Redis hot state",
)
live_events_out_total = Counter(
    "live_events_out_total",
    "Total number of live events emitted to SSE clients",
)
live_fanout_latency_seconds = Histogram(
    "live_fanout_latency_seconds",
    "Latency from reading hot-state snapshot to writing SSE event (seconds)",
    buckets=(0.01, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5),
)
live_dropped_updates_total = Counter(
    "live_dropped_updates_total",
    "Number of live updates dropped due to backpressure, payload caps, or degraded mode",
)
live_redis_write_latency_seconds = Histogram(
    "live_redis_write_latency_seconds",
    "Latency of writes to Redis hot-state keys used by the live pipeline (seconds)",
    buckets=(0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5),
)
live_reconnect_rate = Counter(
    "live_reconnect_rate",
    "Count of SSE reconnect attempts (client reconnects to /api/v1/live/metrics)",
)
live_queue_depth = Gauge(
    "live_queue_depth",
    "Approximate internal queue depth / coalesced update backlog for live metrics fanout",
)
live_node_staleness_seconds = Histogram(
    "live_node_staleness_seconds",
    "Distribution of node staleness (seconds) between snapshot_ts and last_success_ts in live view",
    buckets=(1.0, 5.0, 10.0, 30.0, 60.0, 120.0, 300.0, 900.0),
)


def update_topology_metrics(topo) -> None:
    """Update gauges from ClusterTopology."""
    vpn_cluster_capacity.set(topo.total_capacity)
    vpn_cluster_load.set(topo.current_load)
    vpn_cluster_health_score.set(topo.health_score)
    vpn_cluster_load_index.set(topo.load_factor)
    # Label-based gauges can retain stale series between updates; clear before re-populating.
    vpn_nodes_total.clear()
    vpn_node_health.clear()
    vpn_node_peers.clear()
    vpn_node_interface_info.clear()
    vpn_node_traffic_rx_bytes.clear()
    vpn_node_traffic_tx_bytes.clear()
    status_counts: dict[str, int] = {}
    for n in topo.nodes:
        st = n.status or "unknown"
        status_counts[st] = status_counts.get(st, 0) + 1
        vpn_node_health.labels(node_id=n.node_id, container_name=n.container_name).set(
            n.health_score or 0
        )
        vpn_node_peers.labels(node_id=n.node_id, container_name=n.container_name).set(n.peer_count)
        vpn_node_interface_info.labels(
            node_id=n.node_id,
            container_name=n.container_name,
            interface_name=n.interface_name or "unknown",
        ).set(1)
        vpn_node_traffic_rx_bytes.labels(server_id=n.node_id).set(int(n.total_rx_bytes or 0))
        vpn_node_traffic_tx_bytes.labels(server_id=n.node_id).set(int(n.total_tx_bytes or 0))
    for st, count in status_counts.items():
        vpn_nodes_total.labels(status=st).set(count)
    total_peers = sum(n.peer_count for n in topo.nodes)
    vpn_peers_total.labels(status="active").set(total_peers)
