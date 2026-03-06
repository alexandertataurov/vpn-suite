"""Control-plane planning and analytics helpers."""

from __future__ import annotations

import math
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from typing import Any

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models import (
    ControlPlaneEvent,
    Device,
    FunnelEvent,
    LatencyProbe,
    Payment,
    Plan,
    PlanBandwidthPolicy,
    Referral,
    Server,
    Subscription,
    User,
)
from app.schemas.control_plane import (
    AnomalyMetricsOut,
    AnomalyUserScoreOut,
    AutomationRunOut,
    AutomationStatusOut,
    BusinessMetricsOut,
    ControlPlaneEventOut,
    FailoverEvaluateOut,
    LatencyProbeIn,
    LatencyProbeOut,
    PlacementCandidateOut,
    PlacementSimulateRequest,
    PlacementSimulationOut,
    PlanBandwidthPolicyOut,
    RebalanceExecutionOut,
    RebalanceMoveOut,
    RebalancePlanOut,
    RebalancePlanRequest,
    SecurityMetricsOut,
    ThrottlingApplyOut,
    ThrottlingNodeApplyOut,
    TopologyGraphEdgeOut,
    TopologyGraphNodeOut,
    TopologyGraphOut,
    TopologySummaryOut,
)
from app.schemas.node import ClusterTopology, NodeMetadata
from app.services.control_plane.server_crud import _node_regions
from app.services.load_balancer import calculate_node_score
from app.services.migrate_service import migrate_peer
from app.services.node_runtime import NodeRuntimeAdapter


def build_topology_summary(
    topo: ClusterTopology, *, overload_threshold: float = 0.85
) -> TopologySummaryOut:
    healthy = 0
    degraded = 0
    unhealthy = 0
    draining = 0
    overloaded = 0
    for node in topo.nodes:
        if node.status == "healthy":
            healthy += 1
        elif node.status == "degraded":
            degraded += 1
        elif node.status == "unhealthy":
            unhealthy += 1
        if node.is_draining:
            draining += 1
        ratio = (node.peer_count / node.max_peers) if node.max_peers > 0 else 0.0
        if ratio >= overload_threshold:
            overloaded += 1
    return TopologySummaryOut(
        timestamp=topo.timestamp,
        nodes_total=len(topo.nodes),
        healthy_nodes=healthy,
        degraded_nodes=degraded,
        unhealthy_nodes=unhealthy,
        draining_nodes=draining,
        overloaded_nodes=overloaded,
        total_capacity=topo.total_capacity,
        current_load=topo.current_load,
        load_factor=topo.load_factor,
        health_score=topo.health_score,
        topology_version=topo.topology_version,
    )


def _graph_rebalance_edges(
    topo: ClusterTopology,
    *,
    high_watermark: float,
    target_watermark: float,
    max_moves_per_node: int,
) -> list[TopologyGraphEdgeOut]:
    overloaded: list[NodeMetadata] = []
    underloaded: list[NodeMetadata] = []
    for node in topo.nodes:
        if node.max_peers <= 0 or node.is_draining:
            continue
        if node.status not in ("healthy", "degraded", "unknown"):
            continue
        load = node.peer_count / node.max_peers
        if load >= high_watermark:
            overloaded.append(node)
        if load < target_watermark:
            underloaded.append(node)
    receiver_slots: dict[str, int] = {}
    for node in underloaded:
        target = int(node.max_peers * target_watermark)
        receiver_slots[node.node_id] = max(target - node.peer_count, 0)
    edges: list[TopologyGraphEdgeOut] = []
    for source in sorted(overloaded, key=lambda n: (n.peer_count / n.max_peers), reverse=True):
        source_target = int(source.max_peers * target_watermark)
        pending = min(max(source.peer_count - source_target, 0), max_moves_per_node)
        while pending > 0:
            receivers = [
                (node_id, free_slots)
                for node_id, free_slots in receiver_slots.items()
                if free_slots > 0 and node_id != source.node_id
            ]
            if not receivers:
                break
            target_id, free_slots = max(receivers, key=lambda item: item[1])
            moved = min(pending, free_slots)
            if moved <= 0:
                break
            edges.append(
                TopologyGraphEdgeOut(
                    source_node_id=source.node_id,
                    target_node_id=target_id,
                    edge_type="rebalance_suggested",
                    weight=float(moved),
                    label=f"{moved} peers",
                )
            )
            pending -= moved
            receiver_slots[target_id] = free_slots - moved
    return edges


async def build_topology_graph(
    db: AsyncSession,
    topo: ClusterTopology,
) -> TopologyGraphOut:
    regions = await _node_regions(db, {node.node_id for node in topo.nodes})
    nodes = sorted(
        topo.nodes, key=lambda node: (regions.get(node.node_id, "unknown"), node.node_id)
    )
    node_rows: list[TopologyGraphNodeOut] = []
    for node in nodes:
        load_ratio = (node.peer_count / node.max_peers) if node.max_peers > 0 else 0.0
        node_rows.append(
            TopologyGraphNodeOut(
                node_id=node.node_id,
                container_name=node.container_name,
                region=regions.get(node.node_id, "unknown"),
                status=node.status,
                health_score=node.health_score,
                peer_count=node.peer_count,
                max_peers=node.max_peers,
                load_ratio=load_ratio,
                is_draining=node.is_draining,
            )
        )

    edges: list[TopologyGraphEdgeOut] = []
    grouped: dict[str, list[TopologyGraphNodeOut]] = defaultdict(list)
    for node in node_rows:
        grouped[node.region].append(node)
    for region_nodes in grouped.values():
        ordered = sorted(region_nodes, key=lambda item: item.node_id)
        for idx in range(len(ordered) - 1):
            src = ordered[idx]
            dst = ordered[idx + 1]
            edges.append(
                TopologyGraphEdgeOut(
                    source_node_id=src.node_id,
                    target_node_id=dst.node_id,
                    edge_type="intra_region",
                    weight=1.0,
                    label="same region",
                )
            )

    failed = [
        node
        for node in topo.nodes
        if node.status == "unhealthy" or (node.health_score or 0.0) < 0.5
    ]
    fallback_candidates = [
        node
        for node in topo.nodes
        if node.status in ("healthy", "degraded")
        and not node.is_draining
        and node.peer_count < node.max_peers
    ]
    for failed_node in failed:
        failed_region = regions.get(failed_node.node_id, "unknown")
        regional = [
            candidate
            for candidate in fallback_candidates
            if regions.get(candidate.node_id, "unknown") == failed_region
        ]
        pool = regional if regional else fallback_candidates
        if not pool:
            continue
        chosen = max(pool, key=calculate_node_score)
        edges.append(
            TopologyGraphEdgeOut(
                source_node_id=failed_node.node_id,
                target_node_id=chosen.node_id,
                edge_type="failover_candidate",
                weight=1.0,
                label="failover",
            )
        )

    edges.extend(
        _graph_rebalance_edges(
            topo,
            high_watermark=settings.control_plane_rebalance_high_watermark,
            target_watermark=settings.control_plane_rebalance_target_watermark,
            max_moves_per_node=settings.control_plane_rebalance_max_moves_per_node,
        )
    )

    return TopologyGraphOut(
        generated_at=datetime.now(timezone.utc),
        nodes=node_rows,
        edges=edges,
        regions=sorted(grouped.keys()),
    )


async def _latest_probe_latency_by_node(
    db: AsyncSession,
    *,
    source_region: str,
    node_ids: set[str],
) -> dict[str, float]:
    if not source_region or not node_ids:
        return {}
    fresh_cutoff = datetime.now(timezone.utc) - timedelta(
        seconds=settings.control_plane_probe_fresh_seconds
    )
    rows = (
        await db.execute(
            select(
                LatencyProbe.server_id,
                LatencyProbe.latency_ms,
                LatencyProbe.probe_ts,
            )
            .where(
                LatencyProbe.source_region == source_region,
                LatencyProbe.server_id.in_(node_ids),
                LatencyProbe.probe_ts >= fresh_cutoff,
            )
            .order_by(LatencyProbe.server_id.asc(), LatencyProbe.probe_ts.desc())
        )
    ).all()
    latest: dict[str, float] = {}
    for server_id, latency_ms, _probe_ts in rows:
        sid = str(server_id)
        if sid in latest:
            continue
        latest[sid] = float(latency_ms)
    return latest


def _enterprise_plan_keywords() -> list[str]:
    raw = settings.control_plane_enterprise_plan_keywords
    return [item.strip().lower() for item in raw.split(",") if item.strip()]


def _is_enterprise_plan_name(plan_name: str | None, keywords: list[str]) -> bool:
    if not plan_name or not keywords:
        return False
    name = plan_name.lower()
    return any(keyword in name for keyword in keywords)


async def _enterprise_pinned_counts(db: AsyncSession, node_ids: set[str]) -> dict[str, int]:
    if not node_ids:
        return {}
    keywords = _enterprise_plan_keywords()
    if not keywords:
        return {}
    predicates = [Plan.name.ilike(f"%{keyword}%") for keyword in keywords]
    rows = await db.execute(
        select(Device.server_id, func.count(Device.id))
        .join(Subscription, Subscription.id == Device.subscription_id)
        .join(Plan, Plan.id == Subscription.plan_id)
        .where(
            Device.revoked_at.is_(None),
            Device.server_id.in_(node_ids),
            Subscription.status == "active",
            or_(*predicates),
        )
        .group_by(Device.server_id)
    )
    return {str(server_id): int(count) for server_id, count in rows.all()}


def _qos_migration_key(
    device: Device,
    peer_stats_by_pub: dict[str, dict[str, Any]],
    now_ts: int,
) -> tuple[int, int, int, float]:
    stats = peer_stats_by_pub.get(device.public_key, {})
    last_handshake = int(stats.get("last_handshake") or 0)
    traffic_total = int(stats.get("transfer_rx") or 0) + int(stats.get("transfer_tx") or 0)
    if last_handshake > 0:
        handshake_age = max(now_ts - last_handshake, 0)
    else:
        handshake_age = settings.control_plane_rebalance_qos_idle_handshake_seconds * 100
    is_hot_peer = (
        handshake_age <= settings.control_plane_rebalance_qos_idle_handshake_seconds
        and traffic_total >= settings.control_plane_rebalance_qos_hot_traffic_bytes
    )
    issued_at_ts = device.issued_at.timestamp() if device.issued_at else 0.0
    return (
        1 if is_hot_peer else 0,
        traffic_total,
        -handshake_age,
        issued_at_ts,
    )


def _eligible_candidates(
    nodes: list[NodeMetadata],
    required_capabilities: list[str] | None,
) -> list[NodeMetadata]:
    out: list[NodeMetadata] = []
    for node in nodes:
        if node.status not in ("healthy", "degraded", "unknown"):
            continue
        if node.is_draining:
            continue
        if node.peer_count >= node.max_peers:
            continue
        if (node.health_score or 0.0) < 0.5:
            continue
        if required_capabilities and not all(
            node.capabilities.get(c) for c in required_capabilities
        ):
            continue
        out.append(node)
    return out


async def simulate_placement(
    db: AsyncSession,
    topo: ClusterTopology,
    request: PlacementSimulateRequest,
) -> PlacementSimulationOut:
    node_region = await _node_regions(db, {node.node_id for node in topo.nodes})
    probe_latency = (
        await _latest_probe_latency_by_node(
            db,
            source_region=request.source_region or "",
            node_ids={node.node_id for node in topo.nodes},
        )
        if request.use_latency_probes and request.source_region
        else {}
    )
    candidates = _eligible_candidates(topo.nodes, request.required_capabilities)
    regional = candidates
    fallback_used = False
    if request.preferred_region:
        regional = [
            node for node in candidates if node_region.get(node.node_id) == request.preferred_region
        ]
        if not regional and candidates:
            regional = candidates
            fallback_used = True

    ranked: list[PlacementCandidateOut] = []
    for node in regional:
        score = calculate_node_score(node)
        latency_source = "runtime" if node.latency_ms is not None else "none"
        effective_latency = node.latency_ms
        probed = probe_latency.get(node.node_id)
        if probed is not None:
            runtime_penalty = (
                float(node.latency_ms or 0.0) / 1000.0
            ) * settings.load_balancer_weight_latency
            probe_penalty = (float(probed) / 1000.0) * settings.load_balancer_weight_latency
            score += runtime_penalty - probe_penalty
            effective_latency = float(probed)
            latency_source = "probe"
        if request.source_region and node_region.get(node.node_id) == request.source_region:
            score += settings.control_plane_geo_region_affinity_bonus
        ranked.append(
            PlacementCandidateOut(
                node_id=node.node_id,
                container_name=node.container_name,
                region=node_region.get(node.node_id, "unknown"),
                status=node.status,
                health_score=node.health_score,
                peer_count=node.peer_count,
                max_peers=node.max_peers,
                free_slots=max(node.max_peers - node.peer_count, 0),
                score=score,
                effective_latency_ms=effective_latency,
                latency_source=latency_source,
            )
        )
    ranked.sort(key=lambda item: (item.score, item.free_slots, item.node_id), reverse=True)
    top = ranked[: request.top_k]
    selected = top[0].node_id if top else None
    return PlacementSimulationOut(
        selected_node_id=selected,
        fallback_used=fallback_used,
        candidates=top,
    )


async def plan_rebalance(
    db: AsyncSession,
    topo: ClusterTopology,
    request: RebalancePlanRequest,
) -> RebalancePlanOut:
    if request.target_watermark >= request.high_watermark:
        raise ValueError("target_watermark must be lower than high_watermark")

    overloaded = []
    underloaded = []
    for node in topo.nodes:
        if node.max_peers <= 0:
            continue
        load = node.peer_count / node.max_peers
        if (
            load >= request.high_watermark
            and node.status in ("healthy", "degraded", "unknown")
            and not node.is_draining
        ):
            overloaded.append(node)
        if (
            load < request.target_watermark
            and node.status in ("healthy", "degraded", "unknown")
            and not node.is_draining
        ):
            underloaded.append(node)

    receiver_slots: dict[str, int] = {}
    for node in underloaded:
        target = int(node.max_peers * request.target_watermark)
        receiver_slots[node.node_id] = max(target - node.peer_count, 0)

    pinned_counts = await _enterprise_pinned_counts(db, {node.node_id for node in overloaded})
    moves: list[RebalanceMoveOut] = []
    pinned_limited_nodes: list[str] = []
    for source in sorted(overloaded, key=lambda n: (n.peer_count / n.max_peers), reverse=True):
        source_target = int(source.max_peers * request.target_watermark)
        pinned = max(int(pinned_counts.get(source.node_id, 0)), 0)
        movable = max(source.peer_count - pinned - source_target, 0)
        pending = min(movable, request.max_moves_per_node)
        if movable <= 0 and source.peer_count > source_target:
            pinned_limited_nodes.append(source.node_id)
        if pending <= 0:
            continue
        while pending > 0:
            receivers = [
                (node_id, free_slots)
                for node_id, free_slots in receiver_slots.items()
                if free_slots > 0 and node_id != source.node_id
            ]
            if not receivers:
                break
            target_id, free_slots = max(receivers, key=lambda item: item[1])
            moved = min(pending, free_slots)
            if moved <= 0:
                break
            moves.append(
                RebalanceMoveOut(
                    source_node_id=source.node_id,
                    target_node_id=target_id,
                    peers_to_move=moved,
                )
            )
            pending -= moved
            receiver_slots[target_id] = free_slots - moved

    event = ControlPlaneEvent(
        event_type="rebalance.plan.generated",
        severity="info",
        payload={
            "high_watermark": request.high_watermark,
            "target_watermark": request.target_watermark,
            "moves": [m.model_dump() for m in moves],
            "enterprise_pinned_by_node": pinned_counts,
            "pinned_limited_nodes": pinned_limited_nodes,
        },
    )
    db.add(event)
    await db.flush()

    return RebalancePlanOut(
        generated_at=datetime.now(timezone.utc),
        overloaded_nodes=[node.node_id for node in overloaded],
        underloaded_nodes=[node.node_id for node in underloaded],
        total_peers_to_move=sum(move.peers_to_move for move in moves),
        moves=moves,
    )


async def evaluate_failover(
    db: AsyncSession,
    topo: ClusterTopology,
) -> FailoverEvaluateOut:
    regions = await _node_regions(db, {node.node_id for node in topo.nodes})
    failed = [
        node
        for node in topo.nodes
        if node.status == "unhealthy" or (node.health_score or 0.0) < 0.5
    ]
    fallback_candidates = [
        node
        for node in topo.nodes
        if node.status in ("healthy", "degraded")
        and not node.is_draining
        and node.peer_count < node.max_peers
    ]

    mappings: dict[str, str | None] = {}
    for failed_node in failed:
        failed_region = regions.get(failed_node.node_id)
        regional = [
            candidate
            for candidate in fallback_candidates
            if regions.get(candidate.node_id) == failed_region
        ]
        pool = regional if regional else fallback_candidates
        if not pool:
            mappings[failed_node.node_id] = None
            continue
        chosen = max(pool, key=calculate_node_score)
        mappings[failed_node.node_id] = chosen.node_id
        db.add(
            ControlPlaneEvent(
                event_type="failover.candidate.selected",
                severity="warning",
                server_id=failed_node.node_id,
                payload={
                    "failed_node_id": failed_node.node_id,
                    "fallback_node_id": chosen.node_id,
                    "same_region": bool(regional),
                },
            )
        )
    await db.flush()
    return FailoverEvaluateOut(
        generated_at=datetime.now(timezone.utc),
        failed_nodes=[node.node_id for node in failed],
        fallback_nodes=[node.node_id for node in fallback_candidates],
        mappings=mappings,
        provisioning_paused_nodes=[node.node_id for node in failed],
    )


async def business_metrics(db: AsyncSession) -> BusinessMetricsOut:
    now = datetime.now(timezone.utc)
    since_30d = now - timedelta(days=30)

    active_subscriptions = (
        await db.execute(
            select(func.count())
            .select_from(Subscription)
            .where(Subscription.status == "active", Subscription.valid_until > now)
        )
    ).scalar() or 0

    plan_price_map_rows = await db.execute(
        select(
            Subscription.plan_id,
            func.count().label("cnt"),
        )
        .where(Subscription.status == "active", Subscription.valid_until > now)
        .group_by(Subscription.plan_id)
    )
    plan_counts = {plan_id: cnt for plan_id, cnt in plan_price_map_rows.all()}
    mrr_estimate = 0.0
    if plan_counts:
        plans = await db.execute(
            select(Plan.id, Plan.price_amount, Plan.duration_days).where(
                Plan.id.in_(plan_counts.keys())
            )
        )
        for plan_id, price_amount, duration_days in plans.all():
            if not duration_days or duration_days <= 0:
                continue
            count = int(plan_counts.get(plan_id, 0))
            mrr_estimate += float(price_amount) * (30.0 / float(duration_days)) * count

    starts_30d = (
        await db.execute(
            select(func.count(func.distinct(FunnelEvent.user_id))).where(
                FunnelEvent.event_type == "start",
                FunnelEvent.created_at >= since_30d,
                FunnelEvent.user_id.is_not(None),
            )
        )
    ).scalar() or 0
    paid_users_30d = (
        await db.execute(
            select(func.count(func.distinct(Payment.user_id))).where(
                Payment.status == "completed",
                Payment.created_at >= since_30d,
            )
        )
    ).scalar() or 0
    trial_to_paid_rate = (float(paid_users_30d) / float(starts_30d)) if starts_30d else 0.0

    total_referrals = (await db.execute(select(func.count()).select_from(Referral))).scalar() or 0
    rewarded_referrals = (
        await db.execute(
            select(func.count())
            .select_from(Referral)
            .where(Referral.reward_applied_at.is_not(None))
        )
    ).scalar() or 0
    referral_conversion = (
        (float(rewarded_referrals) / float(total_referrals)) if total_referrals else 0.0
    )

    d30_cutoff = now - timedelta(days=30)
    cohort_users = (
        await db.execute(
            select(func.count()).select_from(User).where(User.created_at <= d30_cutoff)
        )
    ).scalar() or 0
    retained_users = (
        await db.execute(
            select(func.count(func.distinct(Subscription.user_id))).where(
                Subscription.status == "active",
                Subscription.valid_until > now,
                Subscription.user_id.in_(select(User.id).where(User.created_at <= d30_cutoff)),
            )
        )
    ).scalar() or 0
    retention_d30 = (float(retained_users) / float(cohort_users)) if cohort_users else 0.0

    payment_rows = (
        await db.execute(
            select(Payment.subscription_id, Payment.amount).where(
                Payment.status == "completed", Payment.created_at >= since_30d
            )
        )
    ).all()
    sub_ids = {sub_id for sub_id, _ in payment_rows}
    subscription_region: dict[str, str] = {}
    if sub_ids:
        device_rows = (
            await db.execute(
                select(Device.subscription_id, Server.region, Device.created_at)
                .join(Server, Server.id == Device.server_id)
                .where(Device.subscription_id.in_(sub_ids))
                .order_by(Device.subscription_id, Device.created_at.desc())
            )
        ).all()
        for subscription_id, region, _created_at in device_rows:
            if subscription_id not in subscription_region:
                subscription_region[subscription_id] = region or "unassigned"
    revenue_by_region: dict[str, float] = defaultdict(float)
    for subscription_id, amount in payment_rows:
        region = subscription_region.get(subscription_id, "unassigned")
        revenue_by_region[region] += float(amount)

    return BusinessMetricsOut(
        active_subscriptions=int(active_subscriptions),
        mrr_estimate=round(mrr_estimate, 2),
        trial_to_paid_rate_30d=round(trial_to_paid_rate, 4),
        referral_conversion_rate=round(referral_conversion, 4),
        retention_d30=round(retention_d30, 4),
        revenue_by_region_30d={k: round(v, 2) for k, v in sorted(revenue_by_region.items())},
    )


async def security_metrics(
    db: AsyncSession,
    topo: ClusterTopology,
    runtime_adapter: NodeRuntimeAdapter,
) -> SecurityMetricsOut:
    now = datetime.now(timezone.utc)

    dup_subq = (
        select(Device.public_key)
        .group_by(Device.public_key)
        .having(func.count(Device.id) > 1)
        .subquery()
    )
    key_reuse_count = (await db.execute(select(func.count()).select_from(dup_subq))).scalar() or 0

    total_peers = 0
    stale_handshakes = 0
    reconnect_bursts = 0
    now_ts = int(now.timestamp())
    for node in topo.nodes:
        if node.status == "unhealthy":
            continue
        peers = await runtime_adapter.list_peers(node.node_id)
        for peer in peers:
            total_peers += 1
            last = int(peer.get("last_handshake") or 0)
            rx = int(peer.get("transfer_rx") or 0)
            tx = int(peer.get("transfer_tx") or 0)
            total_traffic = rx + tx
            age = now_ts - last if last > 0 else 10_000
            if age > 600:
                stale_handshakes += 1
            if age <= 90 and total_traffic < 32_768:
                reconnect_bursts += 1
    stale_ratio = (float(stale_handshakes) / float(total_peers)) if total_peers else 0.0

    user_regions: dict[int, set[str]] = defaultdict(set)
    user_region_rows = (
        await db.execute(
            select(Device.user_id, Server.region)
            .join(Server, Server.id == Device.server_id)
            .where(Device.revoked_at.is_(None))
        )
    ).all()
    for user_id, region in user_region_rows:
        if region:
            user_regions[int(user_id)].add(str(region))
    user_region_anomalies = sum(1 for regions in user_regions.values() if len(regions) > 2)

    suspicious_events_24h = (
        await db.execute(
            select(func.count())
            .select_from(ControlPlaneEvent)
            .where(
                ControlPlaneEvent.created_at >= now - timedelta(hours=24),
                ControlPlaneEvent.severity.in_(["high", "critical", "warning"]),
            )
        )
    ).scalar() or 0

    return SecurityMetricsOut(
        key_reuse_count=int(key_reuse_count),
        reconnect_burst_peers=int(reconnect_bursts),
        stale_handshake_ratio=round(stale_ratio, 4),
        user_region_anomalies=int(user_region_anomalies),
        suspicious_events_24h=int(suspicious_events_24h),
    )


def _median(values: list[float]) -> float:
    if not values:
        return 0.0
    ordered = sorted(values)
    n = len(ordered)
    mid = n // 2
    if n % 2 == 1:
        return float(ordered[mid])
    return float((ordered[mid - 1] + ordered[mid]) / 2.0)


def _std(values: list[float], mean: float) -> float:
    if not values:
        return 0.0
    return math.sqrt(sum((v - mean) ** 2 for v in values) / float(len(values)))


def _positive_robust_z(value: float, series: list[float]) -> float:
    if not series:
        return 0.0
    med = _median(series)
    mad = _median([abs(v - med) for v in series])
    scale = 1.4826 * mad
    if scale <= 1e-9:
        mean = sum(series) / float(len(series))
        std = _std(series, mean)
        scale = std if std > 1e-9 else 1.0
        center = mean
    else:
        center = med
    z = (value - center) / scale
    return max(0.0, float(z))


def _anomaly_risk_level(score: float) -> str:
    if score >= 0.8:
        return "high"
    if score >= 0.6:
        return "medium"
    return "low"


def _anomaly_feature_weights() -> dict[str, float]:
    return {
        "active_devices": 0.28,
        "region_spread": 0.26,
        "reconnect_bursts": 0.22,
        "issued_24h": 0.14,
        "key_reuse_exposure": 0.10,
    }


def _anomaly_reason(feature_name: str) -> str:
    labels = {
        "active_devices": "unusually high active device count",
        "region_spread": "unusually broad geo-region spread",
        "reconnect_bursts": "unusually frequent reconnect bursts",
        "issued_24h": "unusually high device issuance velocity",
        "key_reuse_exposure": "public key reuse exposure detected",
    }
    return labels.get(feature_name, feature_name)


async def anomaly_metrics(
    db: AsyncSession,
    topo: ClusterTopology,
    runtime_adapter: NodeRuntimeAdapter,
) -> AnomalyMetricsOut:
    model_version = "robust-z-v1"
    now = datetime.now(timezone.utc)
    since_24h = now - timedelta(hours=24)

    active_rows = (
        await db.execute(
            select(
                Device.user_id,
                Device.public_key,
                Device.issued_at,
                Server.region,
            )
            .join(Server, Server.id == Device.server_id)
            .where(Device.revoked_at.is_(None))
        )
    ).all()
    if not active_rows:
        return AnomalyMetricsOut(
            generated_at=now,
            model_version=model_version,
            users_scored=0,
            high_risk_users=0,
            medium_risk_users=0,
            avg_score=0.0,
            top_users=[],
        )

    user_feature_base: dict[int, dict[str, Any]] = {}
    public_key_users: dict[str, set[int]] = defaultdict(set)
    for user_id, public_key, issued_at, region in active_rows:
        uid = int(user_id)
        item = user_feature_base.setdefault(
            uid,
            {
                "active_devices": 0.0,
                "region_set": set(),
                "issued_24h": 0.0,
            },
        )
        item["active_devices"] += 1.0
        if region:
            item["region_set"].add(str(region))
        if issued_at and issued_at >= since_24h:
            item["issued_24h"] += 1.0
        public_key_users[str(public_key)].add(uid)

    key_reuse_by_user: dict[int, float] = defaultdict(float)
    for users in public_key_users.values():
        if len(users) <= 1:
            continue
        for uid in users:
            key_reuse_by_user[uid] += 1.0

    public_key_to_user: dict[str, int] = {}
    for key, users in public_key_users.items():
        if len(users) == 1:
            public_key_to_user[key] = next(iter(users))

    reconnect_bursts_by_user: dict[int, float] = defaultdict(float)
    now_ts = int(now.timestamp())
    for node in topo.nodes:
        if node.status == "unhealthy":
            continue
        peers = await runtime_adapter.list_peers(node.node_id)
        for peer in peers:
            pub = str(peer.get("public_key") or "")
            uid = public_key_to_user.get(pub)
            if uid is None:
                continue
            last = int(peer.get("last_handshake") or 0)
            rx = int(peer.get("transfer_rx") or 0)
            tx = int(peer.get("transfer_tx") or 0)
            total_traffic = rx + tx
            age = now_ts - last if last > 0 else 10_000
            if age <= 90 and total_traffic < 32_768:
                reconnect_bursts_by_user[uid] += 1.0

    feature_rows: dict[int, dict[str, float]] = {}
    for uid, base in user_feature_base.items():
        feature_rows[uid] = {
            "active_devices": float(base["active_devices"]),
            "region_spread": float(len(base["region_set"])),
            "reconnect_bursts": float(reconnect_bursts_by_user.get(uid, 0.0)),
            "issued_24h": float(base["issued_24h"]),
            "key_reuse_exposure": float(key_reuse_by_user.get(uid, 0.0)),
        }

    feature_names = [
        "active_devices",
        "region_spread",
        "reconnect_bursts",
        "issued_24h",
        "key_reuse_exposure",
    ]
    feature_series = {name: [row[name] for row in feature_rows.values()] for name in feature_names}
    weights = _anomaly_feature_weights()
    scored: list[AnomalyUserScoreOut] = []
    for uid, features in feature_rows.items():
        z_scores = {
            name: _positive_robust_z(features[name], feature_series[name]) for name in feature_names
        }
        raw = sum(z_scores[name] * weights[name] for name in feature_names)
        score = 1.0 - math.exp(-raw / 3.5)
        reasons = [
            _anomaly_reason(name)
            for name in sorted(feature_names, key=lambda item: z_scores[item], reverse=True)
            if z_scores[name] >= 1.0
        ]
        scored.append(
            AnomalyUserScoreOut(
                user_id=uid,
                score=round(min(max(score, 0.0), 1.0), 4),
                risk_level=_anomaly_risk_level(score),
                features={k: round(v, 4) for k, v in features.items()},
                z_scores={k: round(v, 4) for k, v in z_scores.items()},
                reasons=reasons[:3],
            )
        )

    scored.sort(key=lambda item: (item.score, item.user_id), reverse=True)
    high = [row for row in scored if row.risk_level == "high"]
    medium = [row for row in scored if row.risk_level == "medium"]
    avg_score = (sum(row.score for row in scored) / float(len(scored))) if scored else 0.0

    event_severity = "warning" if high else "info"
    db.add(
        ControlPlaneEvent(
            event_type="security.anomaly.scored",
            severity=event_severity,
            payload={
                "model_version": model_version,
                "users_scored": len(scored),
                "high_risk_users": len(high),
                "medium_risk_users": len(medium),
                "top_users": [row.model_dump(mode="json") for row in scored[:10]],
            },
        )
    )
    await db.flush()

    return AnomalyMetricsOut(
        generated_at=now,
        model_version=model_version,
        users_scored=len(scored),
        high_risk_users=len(high),
        medium_risk_users=len(medium),
        avg_score=round(avg_score, 4),
        top_users=scored[:20],
    )


async def ingest_latency_probes(db: AsyncSession, items: list[LatencyProbeIn]) -> int:
    if not items:
        return 0
    now = datetime.now(timezone.utc)
    count = 0
    for item in items:
        db.add(
            LatencyProbe(
                agent_id=item.agent_id.strip(),
                source_region=item.source_region.strip(),
                server_id=item.server_id,
                latency_ms=float(item.latency_ms),
                jitter_ms=float(item.jitter_ms) if item.jitter_ms is not None else None,
                packet_loss_pct=float(item.packet_loss_pct)
                if item.packet_loss_pct is not None
                else None,
                probe_ts=item.probe_ts or now,
            )
        )
        count += 1
    db.add(
        ControlPlaneEvent(
            event_type="latency.probe.ingested",
            severity="info",
            payload={"count": count},
        )
    )
    await db.flush()
    return count


async def list_latency_probes(
    db: AsyncSession,
    *,
    source_region: str | None = None,
    server_id: str | None = None,
    limit: int = 100,
) -> tuple[list[LatencyProbeOut], int]:
    stmt = select(LatencyProbe)
    count_stmt = select(func.count()).select_from(LatencyProbe)
    if source_region:
        stmt = stmt.where(LatencyProbe.source_region == source_region)
        count_stmt = count_stmt.where(LatencyProbe.source_region == source_region)
    if server_id:
        stmt = stmt.where(LatencyProbe.server_id == server_id)
        count_stmt = count_stmt.where(LatencyProbe.server_id == server_id)
    total = (await db.execute(count_stmt)).scalar() or 0
    rows = (
        (await db.execute(stmt.order_by(LatencyProbe.probe_ts.desc()).limit(limit))).scalars().all()
    )
    items = [LatencyProbeOut.model_validate(row) for row in rows]
    return items, int(total)


def map_plan_bandwidth_policy(row: PlanBandwidthPolicy, plan_name: str) -> PlanBandwidthPolicyOut:
    return PlanBandwidthPolicyOut(
        id=row.id,
        plan_id=row.plan_id,
        plan_name=plan_name,
        rate_mbps=row.rate_mbps,
        ceil_mbps=row.ceil_mbps,
        burst_kb=row.burst_kb,
        priority=row.priority,
        enabled=row.enabled,
        created_at=row.created_at or datetime.now(timezone.utc),
        updated_at=getattr(row, "updated_at", None) or datetime.now(timezone.utc),
    )


async def list_plan_bandwidth_policies(db: AsyncSession) -> list[PlanBandwidthPolicyOut]:
    rows = (
        await db.execute(
            select(PlanBandwidthPolicy, Plan.name)
            .join(Plan, Plan.id == PlanBandwidthPolicy.plan_id)
            .order_by(Plan.name.asc(), PlanBandwidthPolicy.created_at.asc())
        )
    ).all()
    return [
        map_plan_bandwidth_policy(policy, plan_name or policy.plan_id) for policy, plan_name in rows
    ]


async def apply_plan_bandwidth_policies(
    db: AsyncSession,
    topo: ClusterTopology,
    *,
    runtime_adapter: NodeRuntimeAdapter,
    server_id: str | None = None,
    dry_run: bool = False,
) -> ThrottlingApplyOut:
    policy_rows = (
        (
            await db.execute(
                select(PlanBandwidthPolicy)
                .where(PlanBandwidthPolicy.enabled.is_(True))
                .order_by(PlanBandwidthPolicy.plan_id.asc())
            )
        )
        .scalars()
        .all()
    )
    policy_payloads = [
        {
            "plan_id": row.plan_id,
            "rate_mbps": row.rate_mbps,
            "ceil_mbps": row.ceil_mbps,
            "burst_kb": row.burst_kb,
            "priority": row.priority,
        }
        for row in policy_rows
    ]
    candidate_nodes = [
        node.node_id for node in topo.nodes if node.status in ("healthy", "degraded", "unknown")
    ]
    if server_id:
        candidate_nodes = [node_id for node_id in candidate_nodes if node_id == server_id]
    outputs: list[ThrottlingNodeApplyOut] = []
    for node_id in candidate_nodes:
        rows = (
            await db.execute(
                select(Device.public_key, PlanBandwidthPolicy.plan_id)
                .join(Subscription, Subscription.id == Device.subscription_id)
                .join(
                    PlanBandwidthPolicy,
                    PlanBandwidthPolicy.plan_id == Subscription.plan_id,
                )
                .where(
                    Device.server_id == node_id,
                    Device.revoked_at.is_(None),
                    Subscription.status == "active",
                    PlanBandwidthPolicy.enabled.is_(True),
                )
            )
        ).all()
        peer_plan_by_key = {public_key: plan_id for public_key, plan_id in rows}
        runtime_peers = await runtime_adapter.list_peers(node_id)
        runtime_allowed_by_key = {
            str(peer.get("public_key") or ""): str(peer.get("allowed_ips") or "")
            for peer in runtime_peers
        }
        peer_bindings: list[dict[str, Any]] = []
        skipped_no_runtime_peer = 0
        for public_key, plan_id in peer_plan_by_key.items():
            allowed_ips = runtime_allowed_by_key.get(public_key)
            if not allowed_ips:
                skipped_no_runtime_peer += 1
                continue
            peer_bindings.append(
                {
                    "public_key": public_key,
                    "plan_id": plan_id,
                    "allowed_ips": allowed_ips,
                }
            )
        result = await runtime_adapter.enforce_bandwidth_policies(
            node_id,
            policies=policy_payloads,
            peer_bindings=peer_bindings,
            dry_run=dry_run,
        )
        outputs.append(
            ThrottlingNodeApplyOut(
                node_id=node_id,
                dry_run=dry_run,
                peers_considered=len(peer_plan_by_key),
                peers_bound=int(result.get("bound_peers") or 0),
                skipped_no_runtime_peer=skipped_no_runtime_peer,
                skipped_without_host_ip=int(result.get("skipped_no_host_ip") or 0),
                result=result,
            )
        )
    event = ControlPlaneEvent(
        event_type="throttling.apply.completed",
        severity="info",
        payload={
            "dry_run": dry_run,
            "server_id": server_id,
            "policies": len(policy_payloads),
            "nodes": [row.model_dump(mode="json") for row in outputs],
        },
    )
    db.add(event)
    await db.flush()
    return ThrottlingApplyOut(
        applied_at=datetime.now(timezone.utc),
        dry_run=dry_run,
        policies=len(policy_payloads),
        total_nodes=len(outputs),
        nodes=outputs,
    )


async def _sync_server_provisioning_state(
    db: AsyncSession,
    topo: ClusterTopology,
    unhealthy_health_threshold: float,
) -> tuple[int, int]:
    node_ids = [node.node_id for node in topo.nodes]
    if not node_ids:
        return (0, 0)
    rows = await db.execute(select(Server).where(Server.id.in_(node_ids)))
    server_map = {server.id: server for server in rows.scalars().all()}
    paused = 0
    resumed = 0
    for node in topo.nodes:
        server = server_map.get(node.node_id)
        if not server:
            continue
        unhealthy = (
            node.status == "unhealthy" or (node.health_score or 0.0) < unhealthy_health_threshold
        )
        if unhealthy and server.is_active:
            server.is_active = False
            paused += 1
        if (
            (not unhealthy)
            and (node.status in ("healthy", "degraded", "unknown"))
            and (not server.is_active)
        ):
            server.is_active = True
            resumed += 1
    return (paused, resumed)


async def execute_rebalance_plan(
    db: AsyncSession,
    *,
    moves: list[RebalanceMoveOut],
    runtime_adapter: NodeRuntimeAdapter,
    batch_size: int,
    max_executions_per_cycle: int,
    stop_on_error: bool,
    rollback_on_error: bool,
) -> tuple[list[RebalanceExecutionOut], str | None]:
    """Execute rebalance moves with safety limits and optional rollback on move failure."""
    remaining_budget = max(0, int(max_executions_per_cycle))
    results: list[RebalanceExecutionOut] = []
    stop_reason: str | None = None
    had_error = False
    enterprise_keywords = _enterprise_plan_keywords()
    now_ts = int(datetime.now(timezone.utc).timestamp())

    for move in moves:
        if remaining_budget <= 0:
            stop_reason = "execution_budget_reached"
            break
        requested = max(int(move.peers_to_move), 0)
        limit = min(requested, int(batch_size), remaining_budget)
        if limit <= 0:
            continue

        rows = await db.execute(
            select(Device, Plan.name)
            .join(Subscription, Subscription.id == Device.subscription_id)
            .join(Plan, Plan.id == Subscription.plan_id)
            .where(
                Device.server_id == move.source_node_id,
                Device.revoked_at.is_(None),
                Subscription.status == "active",
            )
            .order_by(Device.issued_at.asc())
        )
        all_rows = rows.all()
        skipped_enterprise = 0
        candidate_devices: list[Device] = []
        for device, plan_name in all_rows:
            if _is_enterprise_plan_name(plan_name, enterprise_keywords):
                skipped_enterprise += 1
                continue
            candidate_devices.append(device)

        try:
            peer_stats = await runtime_adapter.list_peers(move.source_node_id)
        except Exception:
            peer_stats = []
        peer_stats_by_pub = {str(peer.get("public_key") or ""): peer for peer in peer_stats}
        candidate_devices.sort(
            key=lambda device: _qos_migration_key(device, peer_stats_by_pub, now_ts)
        )
        devices = candidate_devices[:limit]

        attempted = 0
        succeeded = 0
        failed = 0
        rolled_back = 0
        rollback_failed = 0
        migrated_devices: list[Device] = []
        status = "completed"

        for device in devices:
            attempted += 1
            try:
                await migrate_peer(db, device, move.target_node_id, runtime_adapter)
                succeeded += 1
                migrated_devices.append(device)
                remaining_budget -= 1
            except Exception:
                failed += 1
                had_error = True
                status = "failed"
                if rollback_on_error and migrated_devices:
                    for migrated in reversed(migrated_devices):
                        try:
                            await migrate_peer(db, migrated, move.source_node_id, runtime_adapter)
                            rolled_back += 1
                            if succeeded > 0:
                                succeeded -= 1
                        except Exception:
                            rollback_failed += 1
                    migrated_devices.clear()
                    status = "rolled_back" if rollback_failed == 0 else "rollback_failed"
                if stop_on_error:
                    status = "stopped_on_error"
                    stop_reason = "stopped_on_error"
                    break

        if attempted == 0:
            status = "no_candidates"
        elif failed == 0 and attempted < requested:
            status = "partial"
            if remaining_budget <= 0:
                status = "partial_budget"

        results.append(
            RebalanceExecutionOut(
                source_node_id=move.source_node_id,
                target_node_id=move.target_node_id,
                requested=requested,
                attempted=attempted,
                succeeded=succeeded,
                failed=failed,
                rolled_back=rolled_back,
                rollback_failed=rollback_failed,
                skipped_enterprise=skipped_enterprise,
                status=status,
            )
        )

        if stop_on_error and failed > 0:
            break

    if stop_reason is None and had_error and stop_on_error:
        stop_reason = "stopped_on_error"
    elif stop_reason is None and remaining_budget <= 0:
        stop_reason = "execution_budget_reached"
    return results, stop_reason


async def run_automation_cycle(
    db: AsyncSession,
    topo: ClusterTopology,
    *,
    high_watermark: float,
    target_watermark: float,
    max_moves_per_node: int,
    unhealthy_health_threshold: float,
    execute_rebalance: bool,
    rebalance_batch_size: int,
    rebalance_max_executions_per_cycle: int,
    rebalance_stop_on_error: bool,
    rebalance_rollback_on_error: bool,
    runtime_adapter: NodeRuntimeAdapter | None = None,
    sync_server_state: bool = True,
) -> AutomationRunOut:
    rebalance_plan = await plan_rebalance(
        db,
        topo,
        RebalancePlanRequest(
            high_watermark=high_watermark,
            target_watermark=target_watermark,
            max_moves_per_node=max_moves_per_node,
        ),
    )
    failover_eval = await evaluate_failover(db, topo)
    executions: list[RebalanceExecutionOut] = []
    execution_stop_reason = None
    if execute_rebalance and rebalance_plan.moves:
        if runtime_adapter is None:
            raise ValueError("runtime_adapter is required when execute_rebalance=true")
        executions, execution_stop_reason = await execute_rebalance_plan(
            db,
            moves=rebalance_plan.moves,
            runtime_adapter=runtime_adapter,
            batch_size=rebalance_batch_size,
            max_executions_per_cycle=rebalance_max_executions_per_cycle,
            stop_on_error=rebalance_stop_on_error,
            rollback_on_error=rebalance_rollback_on_error,
        )
    paused_nodes = 0
    resumed_nodes = 0
    if sync_server_state:
        paused_nodes, resumed_nodes = await _sync_server_provisioning_state(
            db,
            topo,
            unhealthy_health_threshold=unhealthy_health_threshold,
        )
    cycle = AutomationRunOut(
        generated_at=datetime.now(timezone.utc),
        load_factor=topo.load_factor,
        health_score=topo.health_score,
        failed_nodes=len(failover_eval.failed_nodes),
        rebalance_moves=len(rebalance_plan.moves),
        rebalance_peers_to_move=rebalance_plan.total_peers_to_move,
        rebalance_execution_enabled=execute_rebalance,
        executed_migrations=sum(item.succeeded for item in executions),
        failed_migrations=sum(item.failed for item in executions),
        rollback_migrations=sum(item.rolled_back for item in executions),
        rollback_failures=sum(item.rollback_failed for item in executions),
        stop_reason=execution_stop_reason,
        executions=executions,
        paused_nodes=paused_nodes,
        resumed_nodes=resumed_nodes,
    )
    event = ControlPlaneEvent(
        event_type="automation.cycle.completed",
        severity="warning" if cycle.failed_nodes > 0 else "info",
        payload=cycle.model_dump(mode="json"),
    )
    db.add(event)
    await db.flush()
    cycle.event_id = event.id
    return cycle


async def automation_status(db: AsyncSession) -> AutomationStatusOut:
    row = await db.execute(
        select(ControlPlaneEvent)
        .where(ControlPlaneEvent.event_type == "automation.cycle.completed")
        .order_by(ControlPlaneEvent.created_at.desc())
        .limit(1)
    )
    event = row.scalar_one_or_none()
    last_run = None
    last_run_at = None
    if event:
        payload = event.payload or {}
        payload["event_id"] = event.id
        try:
            last_run = AutomationRunOut.model_validate(payload)
            last_run_at = event.created_at
        except Exception:
            last_run = None
            last_run_at = event.created_at
    enterprise_plan_keywords = _enterprise_plan_keywords()
    return AutomationStatusOut(
        enabled=settings.control_plane_automation_enabled,
        interval_seconds=settings.control_plane_automation_interval_seconds,
        unhealthy_health_threshold=settings.control_plane_unhealthy_health_threshold,
        enterprise_plan_keywords=enterprise_plan_keywords,
        rebalance_high_watermark=settings.control_plane_rebalance_high_watermark,
        rebalance_target_watermark=settings.control_plane_rebalance_target_watermark,
        rebalance_max_moves_per_node=settings.control_plane_rebalance_max_moves_per_node,
        rebalance_execute_enabled=settings.control_plane_rebalance_execute_enabled,
        rebalance_batch_size=settings.control_plane_rebalance_batch_size,
        rebalance_max_executions_per_cycle=settings.control_plane_rebalance_max_executions_per_cycle,
        rebalance_qos_idle_handshake_seconds=settings.control_plane_rebalance_qos_idle_handshake_seconds,
        rebalance_qos_hot_traffic_bytes=settings.control_plane_rebalance_qos_hot_traffic_bytes,
        throttling_enabled=settings.control_plane_throttling_enabled,
        throttling_dry_run=settings.control_plane_throttling_dry_run,
        rebalance_stop_on_error=settings.control_plane_rebalance_stop_on_error,
        rebalance_rollback_on_error=settings.control_plane_rebalance_rollback_on_error,
        last_run_at=last_run_at,
        last_run=last_run,
    )


def map_event(row: ControlPlaneEvent) -> ControlPlaneEventOut:
    return ControlPlaneEventOut(
        id=row.id,
        event_type=row.event_type,
        severity=row.severity,
        source=row.source,
        server_id=row.server_id,
        payload=row.payload,
        created_at=row.created_at or datetime.now(timezone.utc),
    )
