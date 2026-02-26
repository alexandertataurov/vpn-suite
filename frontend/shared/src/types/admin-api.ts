/** Admin API types (auth + common list shape). Full types can be generated from OpenAPI later. */

export interface OverviewStats {
  servers_total: number;
  servers_unhealthy: number;
  peers_total: number;
  users_total: number;
  subscriptions_active: number;
  mrr: number;
}

export interface ConnectionNodeOut {
  id: string;
  type: "server";
  label: string;
  region: string | null;
  peer_count: number;
  status: string | null;
  to: string;
}

export interface ConnectionNodesOut {
  nodes: ConnectionNodeOut[];
}

/** One point from GET /overview/dashboard_timeseries (cluster telemetry). */
export interface DashboardTimeseriesPoint {
  ts: number;
  peers: number;
  rx: number;
  tx: number;
}

export interface DashboardTimeseriesOut {
  points: DashboardTimeseriesPoint[];
}

/** Analytics: GET /analytics/telemetry/services. */
export interface ServiceScrapeStatus {
  job: string;
  instance: string;
  health: string;
  last_scrape: string | null;
  last_error: string | null;
}

export interface TelemetryServicesOut {
  services: ServiceScrapeStatus[];
  prometheus_available: boolean;
  message?: string | null;
}

/** Analytics: GET /analytics/metrics/kpis. */
export interface MetricsKpisOut {
  request_rate_5m: number | null;
  error_rate_5m: number | null;
  latency_p95_seconds: number | null;
  prometheus_available: boolean;
  message?: string | null;
}

/** Operator dashboard (GET /dashboard/operator). */
export interface OperatorHealthStrip {
  api_status: "ok" | "degraded" | "down" | "unknown";
  prometheus_status: "ok" | "down";
  total_nodes: number;
  online_nodes: number;
  active_sessions: number;
  peers_active?: number | null;
  handshake_max_age_sec?: number | null;
  total_throughput_bps: number;
  avg_latency_ms: number | null;
  error_rate_pct: number;
  last_updated: string;
  refresh_mode: string;
  freshness: "fresh" | "degraded" | "stale" | "unknown";
}

export interface OperatorClusterRow {
  region: string;
  total_nodes: number;
  online: number;
  cpu_avg: number | null;
  ram_avg: number | null;
  users: number;
  throughput: number;
  error_pct: number | null;
  latency_p95: number | null;
  health: "ok" | "degraded" | "down";
}

export interface OperatorIncident {
  severity: "critical" | "warning";
  entity: string;
  metric: string;
  value: string | number;
  timestamp: string;
  link: string;
  status?: "open" | "ack" | "resolved";
  affected_servers?: number;
  acknowledged_by?: string | null;
}

export interface OperatorServerRow {
  id: string;
  name: string;
  region: string;
  ip: string;
  status: "online" | "degraded" | "offline";
  cpu_pct: number | null;
  ram_pct: number | null;
  users: number;
  throughput_bps: number;
  last_heartbeat: string | null;
  freshness: "fresh" | "degraded" | "stale" | "unknown";
  to: string;
}

export interface OperatorUserSessions {
  active_users: number;
  new_sessions_per_min: number | null;
  peak_concurrency_24h: number | null;
  delta_1h: number | null;
  delta_24h: number | null;
}

export interface OperatorDashboardOut {
  health_strip: OperatorHealthStrip;
  cluster_matrix: OperatorClusterRow[];
  incidents: OperatorIncident[];
  servers: OperatorServerRow[];
  timeseries: DashboardTimeseriesPoint[];
  user_sessions: OperatorUserSessions;
  last_updated: string;
  data_status?: "ok" | "degraded";
  last_successful_sample_ts?: string | null;
}

export interface HealthSnapshotOut {
  telemetry_last_at?: string | null;
  snapshot_last_at?: string | null;
  operator_last_success_at?: string | null;
  sessions_active: number;
  incidents_count: number;
  metrics_freshness: Record<
    string,
    "fresh" | "degraded" | "stale" | "unknown" | "missing"
  >;
  request_id?: string | null;
}

/** GET /telemetry/snapshot — UI-ready aggregated telemetry (cache-only). */
export interface TelemetrySnapshotMetaOut {
  snapshot_ts: number;
  cursor: string;
  freshness: "fresh" | "degraded" | "stale" | "unknown";
  incidents_count: number;
  stale_node_ids: string[];
  partial_failure: boolean;
}

export interface TelemetrySnapshotNodesSummaryOut {
  total: number;
  online: number;
  degraded: number;
  down: number;
}

export interface TelemetrySnapshotOut {
  nodes?: { summary: TelemetrySnapshotNodesSummaryOut; list: unknown[] } | null;
  devices?: { summary: unknown; list: unknown[] } | null;
  sessions?: { active_sessions: number; incidents_count: number } | null;
  meta: TelemetrySnapshotMetaOut;
}

/** GET /app/settings — Reconcile only when node_mode=real and node_discovery=docker. */
export interface AppSettingsOut {
  node_mode: string;
  node_discovery?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface ListMeta {
  limit: number;
  offset: number;
  total: number;
}

export type ServerStatus = "online" | "offline" | "degraded" | "unknown";

export interface ServerOut {
  id: string;
  name?: string;
  region: string | null;
  api_endpoint: string;
  vpn_endpoint?: string | null;
  public_key?: string | null;
  preshared_key?: string | null;
  is_active: boolean;
  status: ServerStatus;
  health_score?: number | null;
  is_draining?: boolean;
  max_connections?: number | null;
  last_seen_at?: string | null;
  last_snapshot_at?: string | null;
  created_at: string;
  updated_at?: string | null;
  provider?: string | null;
  tags?: string[] | null;
  auto_sync_enabled?: boolean;
  auto_sync_interval_sec?: number;
  request_id?: string | null;
  ops_notes?: string | null;
  ops_notes_updated_at?: string | null;
  ops_notes_updated_by?: string | null;
  cert_fingerprint?: string | null;
  cert_expires_at?: string | null;
}

/** Response of POST /servers/:id/sync. When agent mode, action_id is set and job_id may be empty; frontend can poll GET /actions/:id for progress. */
export interface ServerSyncResponse {
  request_id: string;
  job_id: string;
  action_id?: string | null;
}

/** Response of POST /api/v1/servers/:id/actions */
export interface ActionCreateOut {
  action_id: string;
  correlation_id?: string | null;
}

/** Log entry from GET /api/v1/actions/:id */
export interface AgentActionLogOut {
  ts: string;
  level: string;
  message: string;
  meta?: Record<string, unknown> | null;
}

/** Response of GET /api/v1/actions/:id */
export interface ActionOut {
  id: string;
  server_id: string;
  type: string;
  status: string;
  requested_by?: string | null;
  requested_at: string;
  started_at?: string | null;
  finished_at?: string | null;
  error?: string | null;
  correlation_id?: string | null;
  logs: AgentActionLogOut[];
}

/** Response of GET /api/v1/servers/:id/actions */
export interface ActionListOut {
  items: ActionOut[];
  total: number;
}

/** Per-server entry from GET /servers/snapshots/summary (authoritative from snapshot). */
export interface ServerSnapshotSummaryEntry {
  cpu_pct?: number | null;
  ram_pct?: number | null;
  ram_used_bytes?: number | null;
  ram_total_bytes?: number | null;
  active_peers?: number | null;
  total_peers?: number | null;
  used_ips?: number | null;
  total_ips?: number | null;
  free_ips?: number | null;
  health_score?: number | null;
  last_snapshot_at?: string | null;
  source?: string;
}

export interface ServersSnapshotSummaryOut {
  servers: Record<string, ServerSnapshotSummaryEntry>;
}

/** Admin issue peer on server: POST /servers/:id/peers */
export interface AdminIssuePeerRequest {
  user_id?: number | null;
  subscription_id?: string | null;
  label?: string | null;
  device_limit?: number | null;
  expires_in_days?: number | null;
  client_request_id?: string | null;
  /** host:port override when server.vpn_endpoint unset */
  client_endpoint?: string | null;
}

export interface ConfigEntryOut {
  download_url: string;
  qr_payload: string;
}

export interface AdminIssuePeerPeerOut {
  id: string;
  server_id: string;
  device_name: string | null;
  public_key: string;
  issued_at: string;
}

export interface AdminIssuePeerResponse {
  peer: AdminIssuePeerPeerOut;
  config_awg: ConfigEntryOut;
  config_wg_obf: ConfigEntryOut;
  config_wg: ConfigEntryOut;
  request_id: string;
  peer_created: boolean;
}

export interface AdminRotatePeerResponse {
  config_awg: ConfigEntryOut;
  config_wg_obf: ConfigEntryOut;
  config_wg: ConfigEntryOut;
  request_id: string;
}

export interface AdminRevokePeerResponse {
  request_id: string;
  message?: string;
}

export interface ServerCapabilitiesOut {
  profile_types: string[];
  supports_rotate: boolean;
  max_connections: number | null;
  is_draining: boolean;
}

/** GET /peers response (peer_id = device id, node_id = server id) */
export interface PeerListItem {
  peer_id: string;
  node_id: string;
  user_id: number;
  subscription_id: string;
  public_key: string;
  client_name: string | null;
  status: "active" | "revoked";
  issued_at: string;
  revoked_at: string | null;
}

export interface PeerListOut {
  peers: PeerListItem[];
  total: number;
}

export interface ServerList {
  items: ServerOut[];
  total: number;
  /** True when agent mode and no Redis heartbeats; list empty until node-agent sends heartbeat with SERVER_ID */
  agent_mode_no_heartbeat?: boolean;
}

/** Per-server IP (GET /servers/:id/ips). */
export interface ServerIpOut {
  id: string;
  server_id: string;
  ip: string;
  role: string;
  state: string;
  last_checked_at?: string | null;
  created_at: string;
}

export interface ServerIpListOut {
  items: ServerIpOut[];
  total: number;
}

export interface ServerDeviceCountsOut {
  counts: Record<string, number>;
}

export interface PeerOut {
  public_key: string;
  peer_id?: string | null;
  device_name?: string | null;
  allowed_ips?: string | null;
  last_handshake_ts?: string | null;
  rx_bytes?: number | null;
  tx_bytes?: number | null;
  traffic_bytes?: number | null;
  status: string;
  /** no_handshake | no_traffic | wrong_allowed_ips */
  issues?: string[];
}

export interface ServerPeersOut {
  peers: PeerOut[];
  total: number;
  node_reachable?: boolean;
}

export interface ServerTelemetryOut {
  peers_count: number;
  online_count: number;
  total_rx_bytes?: number | null;
  total_tx_bytes?: number | null;
  last_updated?: string | null;
  source: string;
  node_reachable?: boolean;
  /** From agent heartbeat when source=agent */
  container_name?: string | null;
  agent_version?: string | null;
  reported_status?: string | null;
}

export interface HostSummary {
  host_id: string;
  name: string;
  endpoint_kind: "unix" | "tcp" | "ssh";
  is_reachable: boolean;
  containers_total: number;
  running: number;
  stopped: number;
  unhealthy: number;
  restart_loops: number;
  last_seen_at?: string | null;
}

export interface HostSummaryListOut {
  items: HostSummary[];
  total: number;
}

export interface ContainerPort {
  ip: string;
  private_port: number;
  public_port?: number | null;
  protocol: "tcp" | "udp";
}

export interface ContainerSummary {
  host_id: string;
  container_id: string;
  name: string;
  compose_service?: string | null;
  compose_project?: string | null;
  image: string;
  image_tag?: string | null;
  state: "running" | "exited" | "paused" | "restarting" | "dead" | "created" | string;
  health_status: "healthy" | "unhealthy" | "starting" | "none";
  restart_count: number;
  is_restart_loop: boolean;
  uptime_seconds?: number | null;
  cpu_pct?: number | null;
  mem_bytes?: number | null;
  mem_limit_bytes?: number | null;
  mem_pct?: number | null;
  net_rx_bytes?: number | null;
  net_tx_bytes?: number | null;
  blk_read_bytes?: number | null;
  blk_write_bytes?: number | null;
  ports: ContainerPort[];
  image_version?: string | null;
  env_hash: string;
  error_rate_5m?: number | null;
  created_at?: string | null;
  started_at?: string | null;
}

export interface ContainerSummaryListOut {
  items: ContainerSummary[];
  total: number;
}

export interface ContainerMetricsPoint {
  ts: string;
  cpu_pct?: number | null;
  mem_bytes?: number | null;
  mem_pct?: number | null;
  net_rx_bps?: number | null;
  net_tx_bps?: number | null;
  blk_read_bps?: number | null;
  blk_write_bps?: number | null;
}

export interface ContainerMetricsTimeseries {
  host_id: string;
  container_id: string;
  from: string;
  to: string;
  step_seconds: number;
  points: ContainerMetricsPoint[];
}

export interface ContainerLogLine {
  ts: string;
  stream: "stdout" | "stderr";
  severity: "error" | "warn" | "info";
  message: string;
}

export interface ContainerLogLineListOut {
  items: ContainerLogLine[];
  total: number;
}

export interface AlertItem {
  id: string;
  severity: "critical" | "warning" | "info";
  rule: string;
  host_id: string;
  container_id?: string | null;
  container_name?: string | null;
  created_at: string;
  status: "firing" | "resolved";
  context: Record<string, unknown>;
}

export interface AlertItemListOut {
  items: AlertItem[];
  total: number;
}

export interface UserOut {
  id: number;
  tg_id: number | null;
  email: string | null;
  phone: string | null;
  is_banned: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserList {
  items: UserOut[];
  total: number;
}

export interface UserDetail extends UserOut {
  subscriptions: SubscriptionOut[];
}

export interface SubscriptionOut {
  id: string;
  user_id: number;
  plan_id: string;
  status: string;
  valid_from: string;
  valid_until: string;
  device_limit: number;
  created_at: string;
  updated_at: string;
  /** Derived: "expired" when valid_until < now, else status. Use for display. */
  effective_status?: string;
}

export interface SubscriptionList {
  items: SubscriptionOut[];
  total: number;
}

export interface IssuedConfigOut {
  id: string;
  server_id: string;
  profile_type: string;
  expires_at: string | null;
  consumed_at: string | null;
  created_at: string;
}

export type ReconciliationStatus = "ok" | "needs_reconcile" | "broken";
export type NodeHealthStatus = "online" | "offline" | "unknown";
export type ConfigStateStatus = "issued" | "used" | "pending";

export interface DeviceTelemetryOut {
  device_id: string;
  handshake_latest_at?: string | null;
  handshake_age_sec?: number | null;
  transfer_rx_bytes?: number | null;
  transfer_tx_bytes?: number | null;
  endpoint?: string | null;
  allowed_ips_on_node?: string | null;
  peer_present: boolean;
  node_health: NodeHealthStatus;
  config_state: ConfigStateStatus;
  reconciliation_status: ReconciliationStatus;
  telemetry_reason?: string | null;
  last_updated?: string | null;
}

export interface DeviceOut {
  id: string;
  user_id: number;
  subscription_id: string;
  server_id: string;
  device_name: string | null;
  public_key: string;
  allowed_ips?: string | null;
  issued_at: string;
  revoked_at: string | null;
  suspended_at?: string | null;
  data_limit_bytes?: number | null;
  expires_at?: string | null;
  created_at: string;
  issued_configs?: IssuedConfigOut[];
  user_email?: string | null;
  telemetry?: DeviceTelemetryOut | null;
}

export interface DeviceList {
  items: DeviceOut[];
  total: number;
}

export interface DeviceSummaryOut {
  total: number;
  active: number;
  revoked: number;
  unused_configs: number;
  no_allowed_ips: number;
  handshake_ok_count?: number;
  no_handshake_count?: number;
  traffic_zero_count?: number;
  telemetry_last_updated?: string | null;
}

export interface IssueRequest {
  subscription_id: string;
  server_id: string;
  device_name?: string | null;
}

export interface IssueResponse {
  device_id: string;
  issued_at: string;
  config: string | null;
  config_awg?: string | null;
  config_wg_obf?: string | null;
  config_wg?: string | null;
  server_id: string;
  subscription_id: string;
  /** "mock" | "real"; when mock, peer not created on VPN node */
  node_mode: string;
  /** True when peer was created on VPN node (NODE_MODE=real) */
  peer_created: boolean;
}

/** WebApp POST /webapp/devices/issue response. */
export interface WebAppIssueDeviceResponse {
  device_id: string;
  config: string | null;
  config_awg?: string | null;
  config_wg_obf?: string | null;
  config_wg?: string | null;
  issued_at: string;
  node_mode: string;
  peer_created: boolean;
}

export interface PaymentOut {
  id: string;
  user_id: number;
  subscription_id: string;
  provider: string;
  status: string;
  amount: number;
  currency: string;
  external_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentList {
  items: PaymentOut[];
  total: number;
}

export interface AuditLogOut {
  id: number;
  admin_id: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  old_new: Record<string, unknown> | null;
  request_id: string | null;
  created_at: string;
}

export interface AuditLogList {
  items: AuditLogOut[];
  total: number;
}

export interface PlanOut {
  id: string;
  name: string | null;
  duration_days: number;
  price_amount: number;
  price_currency: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PlanList {
  items: PlanOut[];
  total: number;
}

export interface TopologySummaryOut {
  timestamp: string;
  nodes_total: number;
  healthy_nodes: number;
  degraded_nodes: number;
  unhealthy_nodes: number;
  draining_nodes: number;
  overloaded_nodes: number;
  total_capacity: number;
  current_load: number;
  load_factor: number;
  health_score: number;
  topology_version: number;
}

export interface TopologyGraphNodeOut {
  node_id: string;
  container_name: string;
  region: string;
  status: string;
  health_score: number;
  peer_count: number;
  max_peers: number;
  load_ratio: number;
  is_draining: boolean;
}

export interface TopologyGraphEdgeOut {
  source_node_id: string;
  target_node_id: string;
  edge_type: string;
  weight: number;
  label?: string | null;
}

export interface TopologyGraphOut {
  generated_at: string;
  nodes: TopologyGraphNodeOut[];
  edges: TopologyGraphEdgeOut[];
  regions: string[];
}

export interface PlacementCandidateOut {
  node_id: string;
  container_name: string;
  region: string;
  status: string;
  health_score: number;
  peer_count: number;
  max_peers: number;
  free_slots: number;
  score: number;
  effective_latency_ms?: number | null;
  latency_source?: string;
}

export interface PlacementSimulationOut {
  selected_node_id: string | null;
  fallback_used: boolean;
  candidates: PlacementCandidateOut[];
}

export interface RebalanceMoveOut {
  source_node_id: string;
  target_node_id: string;
  peers_to_move: number;
}

export interface RebalancePlanOut {
  generated_at: string;
  overloaded_nodes: string[];
  underloaded_nodes: string[];
  total_peers_to_move: number;
  moves: RebalanceMoveOut[];
}

export interface FailoverEvaluateOut {
  generated_at: string;
  failed_nodes: string[];
  fallback_nodes: string[];
  mappings: Record<string, string | null>;
  provisioning_paused_nodes: string[];
}

export interface BusinessMetricsOut {
  active_subscriptions: number;
  mrr_estimate: number;
  trial_to_paid_rate_30d: number;
  referral_conversion_rate: number;
  retention_d30: number;
  revenue_by_region_30d: Record<string, number>;
}

export interface SecurityMetricsOut {
  key_reuse_count: number;
  reconnect_burst_peers: number;
  stale_handshake_ratio: number;
  user_region_anomalies: number;
  suspicious_events_24h: number;
}

export interface AnomalyUserScoreOut {
  user_id: number;
  score: number;
  risk_level: string;
  features: Record<string, number>;
  z_scores: Record<string, number>;
  reasons: string[];
}

export interface AnomalyMetricsOut {
  generated_at: string;
  model_version: string;
  users_scored: number;
  high_risk_users: number;
  medium_risk_users: number;
  avg_score: number;
  top_users: AnomalyUserScoreOut[];
}

export interface AutomationRunOut {
  generated_at: string;
  load_factor: number;
  health_score: number;
  failed_nodes: number;
  rebalance_moves: number;
  rebalance_peers_to_move: number;
  rebalance_execution_enabled: boolean;
  executed_migrations: number;
  failed_migrations: number;
  rollback_migrations: number;
  rollback_failures: number;
  stop_reason?: string | null;
  executions?: Array<{
    source_node_id: string;
    target_node_id: string;
    requested: number;
    attempted: number;
    succeeded: number;
    failed: number;
    rolled_back: number;
    rollback_failed: number;
    skipped_enterprise: number;
    status: string;
  }>;
  paused_nodes: number;
  resumed_nodes: number;
  event_id?: string | null;
}

export interface AutomationStatusOut {
  enabled: boolean;
  interval_seconds: number;
  unhealthy_health_threshold: number;
  enterprise_plan_keywords: string[];
  rebalance_high_watermark: number;
  rebalance_target_watermark: number;
  rebalance_max_moves_per_node: number;
  rebalance_execute_enabled: boolean;
  rebalance_batch_size: number;
  rebalance_max_executions_per_cycle: number;
  rebalance_qos_idle_handshake_seconds: number;
  rebalance_qos_hot_traffic_bytes: number;
  throttling_enabled: boolean;
  throttling_dry_run: boolean;
  rebalance_stop_on_error: boolean;
  rebalance_rollback_on_error: boolean;
  last_run_at?: string | null;
  last_run?: AutomationRunOut | null;
}

export interface ControlPlaneEventOut {
  id: string;
  event_type: string;
  severity: string;
  source: string;
  server_id?: string | null;
  payload?: Record<string, unknown> | null;
  created_at: string;
}

export interface ControlPlaneEventListOut {
  items: ControlPlaneEventOut[];
  total: number;
}
