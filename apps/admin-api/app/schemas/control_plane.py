"""Control-plane API schemas."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.base import OrmSchema


class TopologySummaryOut(BaseModel):
    timestamp: datetime
    nodes_total: int
    healthy_nodes: int
    degraded_nodes: int
    unhealthy_nodes: int
    draining_nodes: int
    overloaded_nodes: int
    total_capacity: int
    current_load: int
    load_factor: float
    health_score: float
    topology_version: int


class TopologyGraphNodeOut(BaseModel):
    node_id: str
    container_name: str
    region: str
    status: str
    health_score: float
    peer_count: int
    max_peers: int
    load_ratio: float
    is_draining: bool


class TopologyGraphEdgeOut(BaseModel):
    source_node_id: str
    target_node_id: str
    edge_type: str
    weight: float = 1.0
    label: str | None = None


class TopologyGraphOut(BaseModel):
    generated_at: datetime
    nodes: list[TopologyGraphNodeOut]
    edges: list[TopologyGraphEdgeOut]
    regions: list[str]


class PlacementSimulateRequest(BaseModel):
    preferred_region: str | None = None
    source_region: str | None = None
    use_latency_probes: bool = True
    required_capabilities: list[str] | None = None
    top_k: int = Field(default=5, ge=1, le=20)


class PlacementCandidateOut(BaseModel):
    node_id: str
    container_name: str
    region: str
    status: str
    health_score: float
    peer_count: int
    max_peers: int
    free_slots: int
    score: float
    effective_latency_ms: float | None = None
    latency_source: str = "runtime"


class LatencyProbeIn(BaseModel):
    agent_id: str = Field(min_length=1, max_length=64)
    source_region: str = Field(min_length=1, max_length=64)
    server_id: str = Field(min_length=1, max_length=32)
    latency_ms: float = Field(ge=0, le=10000)
    jitter_ms: float | None = Field(default=None, ge=0, le=10000)
    packet_loss_pct: float | None = Field(default=None, ge=0, le=100)
    probe_ts: datetime | None = None


class LatencyProbeBatchIn(BaseModel):
    items: list[LatencyProbeIn] = Field(min_length=1, max_length=1000)


class LatencyProbeOut(OrmSchema):
    id: int
    agent_id: str
    source_region: str
    server_id: str
    latency_ms: float
    jitter_ms: float | None
    packet_loss_pct: float | None
    probe_ts: datetime
    created_at: datetime


class LatencyProbeListOut(BaseModel):
    items: list[LatencyProbeOut]
    total: int


class LatencyProbeIngestOut(BaseModel):
    ingested: int
    generated_at: datetime


class PlacementSimulationOut(BaseModel):
    selected_node_id: str | None
    fallback_used: bool
    candidates: list[PlacementCandidateOut]


class RebalancePlanRequest(BaseModel):
    high_watermark: float = Field(default=0.85, ge=0.5, le=0.99)
    target_watermark: float = Field(default=0.65, ge=0.2, le=0.9)
    max_moves_per_node: int = Field(default=200, ge=1, le=5000)


class RebalanceMoveOut(BaseModel):
    source_node_id: str
    target_node_id: str
    peers_to_move: int


class RebalanceExecutionOut(BaseModel):
    source_node_id: str
    target_node_id: str
    requested: int
    attempted: int
    succeeded: int
    failed: int
    rolled_back: int = 0
    rollback_failed: int = 0
    skipped_enterprise: int = 0
    status: str


class RebalancePlanOut(BaseModel):
    generated_at: datetime
    overloaded_nodes: list[str]
    underloaded_nodes: list[str]
    total_peers_to_move: int
    moves: list[RebalanceMoveOut]


class FailoverEvaluateOut(BaseModel):
    generated_at: datetime
    failed_nodes: list[str]
    fallback_nodes: list[str]
    mappings: dict[str, str | None]
    provisioning_paused_nodes: list[str]


class IpPoolCreate(BaseModel):
    server_id: str
    cidr: str
    gateway_ip: str | None = None
    total_ips: int = Field(default=0, ge=0)
    used_ips: int = Field(default=0, ge=0)
    is_active: bool = True
    metadata_json: dict | None = None


class IpPoolUpdate(BaseModel):
    gateway_ip: str | None = None
    total_ips: int | None = Field(default=None, ge=0)
    used_ips: int | None = Field(default=None, ge=0)
    is_active: bool | None = None
    metadata_json: dict | None = None


class IpPoolOut(BaseModel):
    id: str
    server_id: str
    cidr: str
    gateway_ip: str | None
    total_ips: int
    used_ips: int
    is_active: bool
    metadata_json: dict | None
    created_at: datetime


class IpPoolListOut(BaseModel):
    items: list[IpPoolOut]
    total: int


class PortAllocationCreate(BaseModel):
    server_id: str
    port: int = Field(ge=1, le=65535)
    protocol: str = "udp"
    purpose: str = "peer"
    device_id: str | None = None
    is_reserved: bool = True


class PortAllocationUpdate(BaseModel):
    purpose: str | None = None
    device_id: str | None = None
    is_reserved: bool | None = None


class PortAllocationOut(OrmSchema):
    id: str
    server_id: str
    port: int
    protocol: str
    purpose: str
    device_id: str | None
    is_reserved: bool
    created_at: datetime


class PortAllocationListOut(BaseModel):
    items: list[PortAllocationOut]
    total: int


class PlanBandwidthPolicyUpsert(BaseModel):
    rate_mbps: int = Field(ge=1, le=100000)
    ceil_mbps: int | None = Field(default=None, ge=1, le=100000)
    burst_kb: int = Field(default=256, ge=1, le=65535)
    priority: int = Field(default=3, ge=0, le=7)
    enabled: bool = True


class PlanBandwidthPolicyOut(BaseModel):
    id: str
    plan_id: str
    plan_name: str
    rate_mbps: int
    ceil_mbps: int | None
    burst_kb: int
    priority: int
    enabled: bool
    created_at: datetime
    updated_at: datetime


class PlanBandwidthPolicyListOut(BaseModel):
    items: list[PlanBandwidthPolicyOut]
    total: int


class ThrottlingApplyRequest(BaseModel):
    server_id: str | None = None
    dry_run: bool = False


class ThrottlingNodeApplyOut(BaseModel):
    node_id: str
    dry_run: bool
    peers_considered: int
    peers_bound: int
    skipped_no_runtime_peer: int
    skipped_without_host_ip: int
    result: dict


class ThrottlingApplyOut(BaseModel):
    applied_at: datetime
    dry_run: bool
    policies: int
    total_nodes: int
    nodes: list[ThrottlingNodeApplyOut]


class BusinessMetricsOut(BaseModel):
    active_subscriptions: int
    mrr_estimate: float
    trial_to_paid_rate_30d: float
    referral_conversion_rate: float
    retention_d30: float
    revenue_by_region_30d: dict[str, float]


class SecurityMetricsOut(BaseModel):
    key_reuse_count: int
    reconnect_burst_peers: int
    stale_handshake_ratio: float
    user_region_anomalies: int
    suspicious_events_24h: int


class AnomalyUserScoreOut(BaseModel):
    user_id: int
    score: float
    risk_level: str
    features: dict[str, float]
    z_scores: dict[str, float]
    reasons: list[str]


class AnomalyMetricsOut(BaseModel):
    generated_at: datetime
    model_version: str
    users_scored: int
    high_risk_users: int
    medium_risk_users: int
    avg_score: float
    top_users: list[AnomalyUserScoreOut]


class AutomationRunOut(BaseModel):
    generated_at: datetime
    load_factor: float
    health_score: float
    failed_nodes: int
    rebalance_moves: int
    rebalance_peers_to_move: int
    rebalance_execution_enabled: bool = False
    executed_migrations: int = 0
    failed_migrations: int = 0
    rollback_migrations: int = 0
    rollback_failures: int = 0
    stop_reason: str | None = None
    executions: list[RebalanceExecutionOut] = Field(default_factory=list)
    paused_nodes: int
    resumed_nodes: int
    event_id: str | None = None


class AutomationRunRequest(BaseModel):
    execute_rebalance: bool | None = None
    max_executions: int | None = Field(default=None, ge=1, le=2000)
    batch_size: int | None = Field(default=None, ge=1, le=500)


class AutomationStatusOut(BaseModel):
    enabled: bool
    interval_seconds: int
    unhealthy_health_threshold: float
    enterprise_plan_keywords: list[str]
    rebalance_high_watermark: float
    rebalance_target_watermark: float
    rebalance_max_moves_per_node: int
    rebalance_execute_enabled: bool
    rebalance_batch_size: int
    rebalance_max_executions_per_cycle: int
    rebalance_qos_idle_handshake_seconds: int
    rebalance_qos_hot_traffic_bytes: int
    throttling_enabled: bool
    throttling_dry_run: bool
    rebalance_stop_on_error: bool
    rebalance_rollback_on_error: bool
    last_run_at: datetime | None = None
    last_run: AutomationRunOut | None = None


class ControlPlaneEventOut(BaseModel):
    id: str
    event_type: str
    severity: str
    source: str
    server_id: str | None = None
    payload: dict | None = None
    created_at: datetime


class ControlPlaneEventListOut(BaseModel):
    items: list[ControlPlaneEventOut]
    total: int
