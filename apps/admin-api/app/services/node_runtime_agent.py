"""Agent-based runtime adapter (production).

Control-plane does NOT execute docker/wg on remote nodes.
Nodes run node-agent which:
- pushes heartbeat to control-plane (Redis cache),
- pulls desired peers (DB) and reconciles locally.

This adapter provides discovery/health based on:
- Server rows in Postgres (registry),
- latest heartbeat payload in Redis (fast path).
"""

from __future__ import annotations

import json
import logging
from datetime import datetime

from sqlalchemy import select

from app.core.constants import REDIS_KEY_AGENT_HB_PREFIX
from app.core.database import async_session_factory
from app.core.redis_client import get_redis
from app.models import Server
from app.schemas.node import NodeMetadata
from app.services.node_runtime import NodeRuntimeAdapter, PeerConfigLike

_log = logging.getLogger(__name__)


def _parse_dt(s: str | None) -> datetime | None:
    if not s:
        return None
    try:
        return datetime.fromisoformat(str(s).replace("Z", "+00:00"))
    except Exception:
        return None


async def _get_heartbeat(server_id: str) -> dict | None:
    try:
        r = get_redis()
        raw = await r.get(f"{REDIS_KEY_AGENT_HB_PREFIX}{server_id}")
        if not raw:
            return None
        if isinstance(raw, bytes):
            raw = raw.decode("utf-8", errors="replace")
        data = json.loads(raw)
        return data if isinstance(data, dict) else None
    except Exception:
        return None


class AgentNodeRuntimeAdapter(NodeRuntimeAdapter):
    """Discovery/health from DB + Redis heartbeat. No direct peer ops."""

    async def discover_nodes(self) -> list[NodeMetadata]:
        nodes: list[NodeMetadata] = []
        async with async_session_factory() as session:
            r = await session.execute(select(Server).where(Server.is_active.is_(True)))
            servers = r.scalars().all()
        for s in servers:
            hb = await _get_heartbeat(s.id)
            ts = _parse_dt(hb.get("ts_utc") if hb else None)
            # If heartbeat exists but is stale (should usually be missing due to TTL), treat as offline.
            status = (hb.get("status") if hb else None) or (s.status or "unknown")
            health_score = (
                float(hb.get("health_score"))
                if hb and hb.get("health_score") is not None
                else float(s.health_score or 0.0)
            )
            peer_count = int(hb.get("peer_count") or 0) if hb else 0
            nodes.append(
                NodeMetadata(
                    node_id=s.id,
                    container_name=str(hb.get("container_name") or s.name),
                    kind=getattr(s, "kind", "awg_node") or "awg_node",
                    container_id=str(hb.get("container_id") or ""),
                    host_id=str(hb.get("host_id") or None) if hb else None,
                    classification=hb.get("classification") if hb else None,
                    confidence=hb.get("confidence") if hb else None,
                    evidence=hb.get("evidence") if hb else None,
                    interface_name=str(hb.get("interface_name") or "awg0"),
                    public_key=str(hb.get("public_key") or (s.public_key or "")),
                    listen_port=int(hb.get("listen_port") or 0) if hb else 0,
                    endpoint_ip="",
                    internal_ip="",
                    peer_count=peer_count,
                    total_rx_bytes=int(hb.get("total_rx_bytes") or 0) if hb else 0,
                    total_tx_bytes=int(hb.get("total_tx_bytes") or 0) if hb else 0,
                    status=str(status or "unknown"),
                    last_seen=ts,
                    health_score=health_score,
                    max_peers=int(s.max_connections or 1000),
                    is_draining=bool(s.is_draining),
                )
            )
        return nodes

    async def health_check(self, node_id: str) -> dict:
        hb = await _get_heartbeat(node_id)
        if not hb:
            return {"status": "unreachable", "latency_ms": None, "handshake_ok": False}
        return {"status": "ok", "latency_ms": None, "handshake_ok": True}

    async def add_peer(self, node_id: str, peer_config: PeerConfigLike) -> None:
        raise NotImplementedError("add_peer is not supported in NODE_DISCOVERY=agent")

    async def remove_peer(self, node_id: str, peer_public_key: str) -> None:
        raise NotImplementedError("remove_peer is not supported in NODE_DISCOVERY=agent")

    async def list_peers(self, node_id: str) -> list[dict]:
        """Return empty list; peer counts come from heartbeat in discover_nodes."""
        return []

    async def get_obfuscation_from_node(self, node_id: str) -> dict | None:
        """Return obfuscation (H1–H4, S1, S2, Jc, etc.) from latest agent heartbeat. Node = server_id."""
        hb = await _get_heartbeat(node_id)
        if not hb:
            return None
        obf = hb.get("obfuscation")
        if not isinstance(obf, dict):
            return None
        if not all(obf.get(k) is not None for k in ("H1", "H2", "H3", "H4")):
            return None
        return obf

    async def get_node_for_sync(self, server_id: str) -> NodeMetadata | None:
        """Fetch node metadata for manual sync (includes inactive servers)."""
        async with async_session_factory() as session:
            r = await session.execute(select(Server).where(Server.id == server_id))
            s = r.scalar_one_or_none()
        if not s:
            return None
        hb = await _get_heartbeat(server_id)
        ts = _parse_dt(hb.get("ts_utc") if hb else None)
        status = (hb.get("status") if hb else None) or (s.status or "unknown")
        health_score = (
            float(hb.get("health_score"))
            if hb and hb.get("health_score") is not None
            else float(s.health_score or 0.0)
        )
        peer_count = int(hb.get("peer_count") or 0) if hb else 0
        return NodeMetadata(
            node_id=s.id,
            container_name=str(hb.get("container_name") or s.name) if hb else s.name,
            kind=getattr(s, "kind", "awg_node") or "awg_node",
            container_id=str(hb.get("container_id") or "") if hb else "",
            host_id=str(hb.get("host_id") or None) if hb else None,
            classification=hb.get("classification") if hb else None,
            confidence=hb.get("confidence") if hb else None,
            evidence=hb.get("evidence") if hb else None,
            interface_name=str(hb.get("interface_name") or "awg0") if hb else "awg0",
            public_key=str(hb.get("public_key") or (s.public_key or ""))
            if hb
            else str(s.public_key or ""),
            listen_port=int(hb.get("listen_port") or 0) if hb else 0,
            endpoint_ip="",
            internal_ip="",
            peer_count=peer_count,
            total_rx_bytes=int(hb.get("total_rx_bytes") or 0) if hb else 0,
            total_tx_bytes=int(hb.get("total_tx_bytes") or 0) if hb else 0,
            status=str(status or "unknown"),
            last_seen=ts,
            health_score=health_score,
            max_peers=int(s.max_connections or 1000),
            is_draining=bool(s.is_draining),
        )
