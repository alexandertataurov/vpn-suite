"""Reconciliation engine: desired state (DB) vs actual state (node)."""

import asyncio
import logging
import time
from dataclasses import dataclass, field

from sqlalchemy import select

from app.core.database import async_session_factory
from app.core.redaction import redact_for_log
from app.models import Device
from app.services.audit_service import log_audit
from app.services.node_runtime import NodeRuntimeAdapter, PeerConfigLike

try:
    from app.core.metrics import (
        vpn_reconciliation_drift,
        vpn_reconciliation_duration_seconds,
        vpn_reconciliation_runs_total,
    )
except Exception:
    vpn_reconciliation_runs_total = None  # type: ignore[assignment]
    vpn_reconciliation_drift = None  # type: ignore[assignment]
    vpn_reconciliation_duration_seconds = None  # type: ignore[assignment]

_log = logging.getLogger(__name__)

# Default allowed_ips when not stored on device (issue_service uses 0.0.0.0/0, ::/0)
DEFAULT_ALLOWED_IPS = "0.0.0.0/0, ::/0"


@dataclass
class ReconciliationDiff:
    peers_to_add: list[PeerConfigLike] = field(default_factory=list)
    peers_to_remove: list[str] = field(default_factory=list)
    peers_to_update: list[PeerConfigLike] = field(default_factory=list)


@dataclass
class ReconciliationResult:
    peers_added: int = 0
    peers_removed: int = 0
    peers_updated: int = 0
    errors: list[str] = field(default_factory=list)
    duration_ms: float = 0.0


def _peer_allowed_ips(peer: dict) -> str:
    """Normalize allowed_ips from WG peer dict."""
    a = peer.get("allowed_ips") or peer.get("allowed_ip")
    if a is None:
        return ""
    return str(a).strip()


async def compute_diff(
    node_id: str,
    db_public_keys: list[tuple[str, str]],
    wg_peers: list[dict],
) -> ReconciliationDiff:
    """
    db_public_keys: list of (public_key, allowed_ips).
    wg_peers: list of dict with public_key, allowed_ips (from list_peers / get_peers_with_details).
    """
    db_map = {pk: allowed for pk, allowed in db_public_keys}
    wg_map = {p["public_key"]: _peer_allowed_ips(p) for p in wg_peers if p.get("public_key")}

    to_add: list[PeerConfigLike] = []
    for pk, allowed in db_map.items():
        if pk not in wg_map:
            to_add.append(PeerConfigLike(public_key=pk, allowed_ips=allowed or DEFAULT_ALLOWED_IPS))

    to_remove = [pk for pk in wg_map if pk not in db_map]

    to_update: list[PeerConfigLike] = []
    for pk in db_map:
        if pk in wg_map and (db_map[pk] or DEFAULT_ALLOWED_IPS) != (wg_map[pk] or ""):
            to_update.append(
                PeerConfigLike(public_key=pk, allowed_ips=db_map[pk] or DEFAULT_ALLOWED_IPS)
            )

    return ReconciliationDiff(
        peers_to_add=to_add, peers_to_remove=to_remove, peers_to_update=to_update
    )


async def apply_diff(
    adapter: NodeRuntimeAdapter,
    node_id: str,
    diff: ReconciliationDiff,
) -> ReconciliationResult:
    """Apply diff idempotently: add, remove, update (remove+add)."""
    result = ReconciliationResult()
    start = time.perf_counter()

    for peer in diff.peers_to_add:
        try:
            await adapter.add_peer(node_id, peer)
            result.peers_added += 1
        except Exception as e:
            _log.exception(
                "Reconciliation add_peer failed node_id=%s pubkey=%s", node_id, peer.public_key[:16]
            )
            result.errors.append(f"add {peer.public_key[:16]}: {e!s}")

    for pubkey in diff.peers_to_remove:
        try:
            await adapter.remove_peer(node_id, pubkey)
            result.peers_removed += 1
        except Exception as e:
            _log.exception("Reconciliation remove_peer failed node_id=%s", node_id)
            result.errors.append(f"remove {pubkey[:16]}: {e!s}")

    for peer in diff.peers_to_update:
        try:
            await adapter.remove_peer(node_id, peer.public_key)
            await adapter.add_peer(node_id, peer)
            result.peers_updated += 1
        except Exception as e:
            _log.exception("Reconciliation update peer failed node_id=%s", node_id)
            result.errors.append(f"update {peer.public_key[:16]}: {e!s}")

    result.duration_ms = (time.perf_counter() - start) * 1000
    if vpn_reconciliation_duration_seconds is not None:
        vpn_reconciliation_duration_seconds.observe(result.duration_ms / 1000.0)
    return result


async def reconcile_node(node_id: str, adapter: NodeRuntimeAdapter) -> ReconciliationResult:
    """Reconcile one runtime node by node_id (desired from DB devices, actual from wg runtime)."""
    async with async_session_factory() as session:
        r = await session.execute(
            select(Device).where(Device.server_id == node_id, Device.revoked_at.is_(None))
        )
        devices = r.scalars().all()
        db_peers = [(d.public_key, DEFAULT_ALLOWED_IPS) for d in devices]

        wg_peers = await adapter.list_peers(node_id)
        diff = await compute_diff(node_id, db_peers, wg_peers)

        if not diff.peers_to_add and not diff.peers_to_remove and not diff.peers_to_update:
            return ReconciliationResult(duration_ms=0.0)

        result = await apply_diff(adapter, node_id, diff)
        await log_audit(
            session,
            admin_id=None,
            action="reconciliation.completed",
            resource_type="cluster",
            resource_id=node_id,
            old_new={
                "peers_added": result.peers_added,
                "peers_removed": result.peers_removed,
                "peers_updated": result.peers_updated,
                "errors": result.errors[:5],
                "duration_ms": result.duration_ms,
            },
        )
        if vpn_reconciliation_drift is not None:
            if result.peers_added:
                vpn_reconciliation_drift.labels(drift_type="add").inc(result.peers_added)
            if result.peers_removed:
                vpn_reconciliation_drift.labels(drift_type="remove").inc(result.peers_removed)
            if result.peers_updated:
                vpn_reconciliation_drift.labels(drift_type="update").inc(result.peers_updated)
        await session.commit()
        return result


async def reconcile_all_nodes(
    adapter: NodeRuntimeAdapter,
) -> list[tuple[str, ReconciliationResult]]:
    """Reconcile every discovered healthy/degraded AWG node."""
    results: list[tuple[str, ReconciliationResult]] = []
    nodes = await adapter.discover_nodes()
    node_ids = [node.node_id for node in nodes if node.status in ("healthy", "degraded")]
    for node_id in node_ids:
        try:
            result = await reconcile_node(node_id, adapter)
            results.append((node_id, result))
        except Exception as e:
            _log.exception("Reconciliation failed for node %s: %s", node_id, redact_for_log(str(e)))
            results.append((node_id, ReconciliationResult(errors=[redact_for_log(str(e))])))
    return results


async def run_reconciliation_loop(get_adapter) -> None:
    """Background loop: reconcile all nodes every reconciliation_interval_seconds. Backoff on errors."""
    from app.core.config import settings

    interval = settings.reconciliation_interval_seconds
    consecutive_failures = 0
    max_backoff = 3600
    while True:
        try:
            adapter = get_adapter()
            await reconcile_all_nodes(adapter)
            consecutive_failures = 0
            if vpn_reconciliation_runs_total is not None:
                vpn_reconciliation_runs_total.labels(status="success").inc()
        except Exception as e:
            consecutive_failures += 1
            if vpn_reconciliation_runs_total is not None:
                vpn_reconciliation_runs_total.labels(status="failure").inc()
            _log.exception("Reconciliation loop error (run %s): %s", consecutive_failures, e)
            delay = min(interval * (2**consecutive_failures), max_backoff)
            await asyncio.sleep(delay)
            continue
        await asyncio.sleep(interval)
