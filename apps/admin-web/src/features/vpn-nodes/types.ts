/** VPN node types aligned with backend VpnNodeCardOut / VpnNodeDetailOut. */

export type HealthState = "ok" | "degraded" | "down";

export interface VpnNodeAlert {
  severity: string;
  metric: string;
  value: string | number;
  baseline?: string | number | null;
  since?: string | null;
  likely_cause?: string | null;
}

export interface VpnNodeIdentity {
  node_id: string;
  name?: string | null;
  region?: string | null;
  public_ip?: string | null;
  tunnel_cidr_or_interface_ip?: string | null;
  uptime_node?: string | null;
  uptime_tunnel?: string | null;
  health_state: HealthState;
}

export interface VpnNodeKpis {
  active_peers?: number | null;
  peers_max?: number | null;
  peers_fullness_pct?: number | null;
  rx_bps?: number | null;
  tx_bps?: number | null;
  rx_1h?: number | null;
  tx_1h?: number | null;
  handshake_health_pct?: number | null;
  rtt_p50_ms?: number | null;
  rtt_p95_ms?: number | null;
  loss_p50_pct?: number | null;
  loss_p95_pct?: number | null;
  connects_per_min?: number | null;
  disconnects_per_min?: number | null;
}

export interface SparkPoint {
  x: number;
  y: number;
}

export interface VpnNodeCard {
  identity: VpnNodeIdentity;
  kpis: VpnNodeKpis;
  sparkline_peers: SparkPoint[];
  sparkline_rx: SparkPoint[];
  sparkline_tx: SparkPoint[];
  alerts: VpnNodeAlert[];
}

export interface VpnNodeInterface {
  if_up?: boolean | null;
  mtu?: number | null;
  errors?: number | null;
  drops?: number | null;
}

export interface VpnNodeSystem {
  cpu_pct?: number | null;
  ram_pct?: number | null;
  disk_pct?: number | null;
  nic_errs?: number | null;
  container_health?: string | null;
  ntp_status?: string | null;
}

export interface RttLossPoint {
  ts: number;
  value: number;
}

export interface VpnNodePeerRow {
  public_key: string;
  peer_id?: string | null;
  device_name?: string | null;
  allowed_ips?: string | null;
  last_handshake_ts?: string | null;
  rx_bytes?: number | null;
  tx_bytes?: number | null;
  status: string;
  issues: string[];
  rtt_ms?: number | null;
  loss_pct?: number | null;
}

export interface VpnNodeDetail {
  card: VpnNodeCard;
  peers: VpnNodePeerRow[];
  rtt_timeseries_1h: RttLossPoint[];
  rtt_timeseries_24h: RttLossPoint[];
  loss_timeseries_1h: RttLossPoint[];
  interface?: VpnNodeInterface | null;
  system?: VpnNodeSystem | null;
}
