"""Build VPN node card and detail payloads for operator monitoring UI."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.server_utils import get_agent_heartbeat
from app.models import Server, ServerSnapshot
from app.schemas.server import PeerOut
from app.schemas.vpn_node import (
    RttLossPointOut,
    SparkPointOut,
    VpnNodeAlertOut,
    VpnNodeCardOut,
    VpnNodeDetailOut,
    VpnNodeIdentityOut,
    VpnNodeInterfaceOut,
    VpnNodeKpisOut,
    VpnNodePeerRowOut,
    VpnNodeSystemOut,
)

# Alert thresholds (plan §1.2)
RTT_P95_DEGRADED_MS = 150
LOSS_P95_DEGRADED_PCT = 2.0
HANDSHAKE_RATIO_DEGRADED = 0.9
CAPACITY_DEGRADED_PCT = 90.0
CPU_DEGRADED_PCT = 85.0
HEARTBEAT_STALE_SEC = 300


def _health_state(
    hb: dict | None,
    status: str | None,
    active_peers: int,
    peers_max: int | None,
    rtt_p95_ms: float | None,
    loss_p95_pct: float | None,
    handshake_ratio: float | None,
    cpu_pct: float | None,
) -> str:
    """Compute health_state: down | degraded | ok."""
    if not hb:
        return "down"
    if status and status.lower() in ("unhealthy", "down", "error", "offline"):
        return "down"
    # Degraded: thresholds
    if rtt_p95_ms is not None and rtt_p95_ms > RTT_P95_DEGRADED_MS:
        return "degraded"
    if loss_p95_pct is not None and loss_p95_pct > LOSS_P95_DEGRADED_PCT:
        return "degraded"
    if handshake_ratio is not None and handshake_ratio < HANDSHAKE_RATIO_DEGRADED:
        return "degraded"
    if peers_max is not None and peers_max > 0 and active_peers >= (peers_max * CAPACITY_DEGRADED_PCT / 100):
        return "degraded"
    if cpu_pct is not None and cpu_pct > CPU_DEGRADED_PCT:
        return "degraded"
    if status and status.lower() == "degraded":
        return "degraded"
    return "ok"


def _alerts_for_node(
    health_state: str,
    rtt_p95_ms: float | None,
    loss_p95_pct: float | None,
    handshake_ratio: float | None,
    peers_fullness_pct: float | None,
    cpu_pct: float | None,
    hb: dict | None,
) -> list[VpnNodeAlertOut]:
    """Top 1–3 alerts for the node."""
    out: list[VpnNodeAlertOut] = []
    if health_state == "down":
        out.append(
            VpnNodeAlertOut(
                severity="critical",
                metric="heartbeat",
                value="missing" if not hb else "down",
                likely_cause="Node or agent unreachable",
            )
        )
        return out[:3]
    if rtt_p95_ms is not None and rtt_p95_ms > RTT_P95_DEGRADED_MS:
        out.append(
            VpnNodeAlertOut(
                severity="warning",
                metric="rtt_p95_ms",
                value=rtt_p95_ms,
                baseline=RTT_P95_DEGRADED_MS,
                likely_cause="High latency to tunnel",
            )
        )
    if loss_p95_pct is not None and loss_p95_pct > LOSS_P95_DEGRADED_PCT:
        out.append(
            VpnNodeAlertOut(
                severity="warning",
                metric="loss_p95_pct",
                value=loss_p95_pct,
                baseline=LOSS_P95_DEGRADED_PCT,
                likely_cause="Packet loss on path",
            )
        )
    if handshake_ratio is not None and handshake_ratio < HANDSHAKE_RATIO_DEGRADED:
        out.append(
            VpnNodeAlertOut(
                severity="warning",
                metric="handshake_ratio",
                value=handshake_ratio,
                baseline=HANDSHAKE_RATIO_DEGRADED,
                likely_cause="Handshake success drop",
            )
        )
    if peers_fullness_pct is not None and peers_fullness_pct >= CAPACITY_DEGRADED_PCT:
        out.append(
            VpnNodeAlertOut(
                severity="warning",
                metric="peer_capacity_pct",
                value=peers_fullness_pct,
                baseline=CAPACITY_DEGRADED_PCT,
                likely_cause="Peer saturation",
            )
        )
    if cpu_pct is not None and cpu_pct > CPU_DEGRADED_PCT:
        out.append(
            VpnNodeAlertOut(
                severity="warning",
                metric="cpu_pct",
                value=cpu_pct,
                baseline=CPU_DEGRADED_PCT,
                likely_cause="CPU throttling",
            )
        )
    return out[:3]


def _peer_row_from_peer_out(p: PeerOut) -> VpnNodePeerRowOut:
    return VpnNodePeerRowOut(
        public_key=p.public_key,
        peer_id=p.peer_id,
        device_name=p.device_name,
        allowed_ips=p.allowed_ips,
        last_handshake_ts=p.last_handshake_ts,
        rx_bytes=p.rx_bytes,
        tx_bytes=p.tx_bytes,
        status=p.status,
        issues=p.issues,
        rtt_ms=p.rtt_ms,
        loss_pct=p.loss_pct,
    )


async def build_vpn_node_cards(
    db: AsyncSession,
    request: Any,
    region: str | None = None,
    health: str | None = None,
) -> list[VpnNodeCardOut]:
    """Build list of VpnNodeCardOut for grid. Uses DB Server + Redis heartbeat + snapshot."""
    stmt = select(Server).where(Server.is_active.is_(True))
    if region and region.strip():
        stmt = stmt.where(Server.region == region.strip())
    if health and health.strip().lower() in ("ok", "degraded", "down"):
        # Filter by health is applied after we compute health_state
        pass  # we filter in Python below
    stmt = stmt.limit(500)
    result = await db.execute(stmt)
    servers = list(result.scalars().all())

    # Snapshot fallback for CPU/RAM
    snapshot_map: dict[str, dict] = {}
    if servers:
        r = await db.execute(
            select(ServerSnapshot)
            .where(ServerSnapshot.server_id.in_([s.id for s in servers]))
            .where(ServerSnapshot.status == "success")
            .distinct(ServerSnapshot.server_id)
            .order_by(ServerSnapshot.server_id, ServerSnapshot.ts_utc.desc())
        )
        for snap in r.scalars().all():
            res = (snap.payload_json or {}).get("resources") or {}
            snapshot_map[str(snap.server_id)] = {
                "cpu": res.get("cpu_pct"),
                "ram": res.get("ram_pct"),
            }

    now = datetime.now(timezone.utc)
    cards: list[VpnNodeCardOut] = []

    for s in servers:
        hb = await get_agent_heartbeat(s.id)
        snap = snapshot_map.get(s.id, {})
        cpu_pct = snap.get("cpu")
        if cpu_pct is not None:
            try:
                cpu_pct = float(cpu_pct)
            except (TypeError, ValueError):
                cpu_pct = None

        peer_count = int(hb.get("peer_count", 0)) if hb else 0
        rx = int(hb.get("total_rx_bytes", 0)) if hb else 0
        tx = int(hb.get("total_tx_bytes", 0)) if hb else 0
        status = (hb.get("status") or getattr(s, "status", None) or "unknown") if hb else "unknown"
        # Simple rtt/loss from peers if we had them; for list we don't fetch peers per node
        rtt_p95_ms = None
        loss_p95_pct = None
        handshake_ratio = None
        if hb:
            peers_list = hb.get("peers") or []
            if peers_list:
                with_handshake = sum(1 for p in peers_list if (p.get("last_handshake_age_sec") is not None and (p.get("last_handshake_age_sec") or 0) <= 180))
                handshake_ratio = with_handshake / len(peers_list) if peers_list else None
        peers_max = None  # could come from snapshot or config
        peers_fullness_pct = (100.0 * peer_count / peers_max) if peers_max and peers_max > 0 else None

        health_state = _health_state(
            hb, status, peer_count, peers_max, rtt_p95_ms, loss_p95_pct, handshake_ratio, cpu_pct
        )
        if health and health.strip().lower() != health_state:
            continue

        alerts = _alerts_for_node(
            health_state, rtt_p95_ms, loss_p95_pct, handshake_ratio, peers_fullness_pct, cpu_pct, hb
        )

        ts_utc = hb.get("ts_utc") if hb else None
        last_seen = None
        if ts_utc:
            try:
                if isinstance(ts_utc, str):
                    last_seen = ts_utc
                else:
                    last_seen = ts_utc.isoformat() if hasattr(ts_utc, "isoformat") else str(ts_utc)
            except Exception:
                pass

        public_ip = ""
        if getattr(s, "api_endpoint", None):
            public_ip = (s.api_endpoint or "").split("//")[-1].split("/")[0].split(":")[0]

        identity = VpnNodeIdentityOut(
            node_id=s.id,
            name=s.name or s.id,
            region=s.region,
            public_ip=public_ip or None,
            tunnel_cidr_or_interface_ip=None,
            uptime_node=None,
            uptime_tunnel=None,
            health_state=health_state,
        )
        kpis = VpnNodeKpisOut(
            active_peers=peer_count,
            peers_max=peers_max,
            peers_fullness_pct=peers_fullness_pct,
            rx_bps=None,
            tx_bps=None,
            rx_1h=rx,
            tx_1h=tx,
            handshake_health_pct=handshake_ratio * 100 if handshake_ratio is not None else None,
            rtt_p50_ms=None,
            rtt_p95_ms=rtt_p95_ms,
            loss_p50_pct=None,
            loss_p95_pct=loss_p95_pct,
        )
        cards.append(
            VpnNodeCardOut(
                identity=identity,
                kpis=kpis,
                sparkline_peers=[],
                sparkline_rx=[],
                sparkline_tx=[],
                alerts=alerts,
            )
        )

    return cards


async def build_vpn_node_detail(
    server_id: str,
    db: AsyncSession,
    request: Any,
    peers: list[PeerOut],
) -> VpnNodeDetailOut | None:
    """Build VpnNodeDetailOut for drilldown. Caller provides peers from GET /servers/:id/peers."""
    result = await db.execute(select(Server).where(Server.id == server_id))
    server = result.scalar_one_or_none()
    if not server:
        return None

    hb = await get_agent_heartbeat(server_id)
    r = await db.execute(
        select(ServerSnapshot)
        .where(ServerSnapshot.server_id == server_id, ServerSnapshot.status == "success")
        .order_by(ServerSnapshot.ts_utc.desc())
        .limit(1)
    )
    snap_row = r.scalar_one_or_none()
    snap = {}
    if snap_row and snap_row.payload_json:
        res = snap_row.payload_json.get("resources") or {}
        snap = {"cpu": res.get("cpu_pct"), "ram": res.get("ram_pct")}
    cpu_pct = float(snap["cpu"]) if isinstance(snap.get("cpu"), (int, float)) else None

    peer_count = int(hb.get("peer_count", 0)) if hb else 0
    status = (hb.get("status") or server.status or "unknown") if hb else "unknown"
    peers_list = (hb.get("peers") or []) if hb else []
    handshake_ratio = None
    if peers_list:
        with_handshake = sum(1 for p in peers_list if isinstance(p, dict) and (p.get("last_handshake_age_sec") or 0) <= 180)
        handshake_ratio = with_handshake / len(peers_list)

    health_state = _health_state(hb, status, peer_count, None, None, None, handshake_ratio, cpu_pct)
    alerts = _alerts_for_node(health_state, None, None, handshake_ratio, None, cpu_pct, hb)
    public_ip = (server.api_endpoint or "").split("//")[-1].split("/")[0].split(":")[0] if server.api_endpoint else None

    card = VpnNodeCardOut(
        identity=VpnNodeIdentityOut(
            node_id=server.id,
            name=server.name or server.id,
            region=server.region,
            public_ip=public_ip or None,
            health_state=health_state,
        ),
        kpis=VpnNodeKpisOut(
            active_peers=peer_count,
            rx_1h=int(hb.get("total_rx_bytes", 0)) if hb else None,
            tx_1h=int(hb.get("total_tx_bytes", 0)) if hb else None,
            handshake_health_pct=handshake_ratio * 100 if handshake_ratio is not None else None,
        ),
        alerts=alerts,
    )

    peer_rows = [_peer_row_from_peer_out(p) for p in peers]
    interface = VpnNodeInterfaceOut()
    system = VpnNodeSystemOut(cpu_pct=cpu_pct, ram_pct=float(snap["ram"]) if isinstance(snap.get("ram"), (int, float)) else None)

    return VpnNodeDetailOut(
        card=card,
        peers=peer_rows,
        rtt_timeseries_1h=[],
        rtt_timeseries_24h=[],
        loss_timeseries_1h=[],
        interface=interface,
        system=system,
    )
