"""Reconciliation engine: desired state (DB) vs actual state (node)."""

import asyncio
import logging
import time
from dataclasses import dataclass, field
from datetime import datetime, timezone

from sqlalchemy import select, update

from app.core.database import async_session_factory
from app.core.redaction import redact_for_log
from app.models import Device
from app.services.audit_service import log_audit
from app.services.node_runtime import NodeRuntimeAdapter, PeerConfigLike

try:
    from app.core.metrics import (
        vpn_peer_apply_failures_total,
        vpn_peers_expected,
        vpn_peers_expired_active_count,
        vpn_peers_ghost_count,
        vpn_peers_orphan_count,
        vpn_peers_present,
        vpn_peers_readded_total,
        vpn_reconciliation_drift,
        vpn_reconciliation_duration_seconds,
        vpn_reconciliation_errors_total,
        vpn_reconciliation_runs_total,
    )
except Exception:
    vpn_reconciliation_runs_total = None  # type: ignore[assignment]
    vpn_reconciliation_errors_total = None  # type: ignore[assignment]
    vpn_reconciliation_drift = None  # type: ignore[assignment]
    vpn_reconciliation_duration_seconds = None  # type: ignore[assignment]
    vpn_peers_expected = None  # type: ignore[assignment]
    vpn_peers_present = None  # type: ignore[assignment]
    vpn_peers_readded_total = None  # type: ignore[assignment]
    vpn_peer_apply_failures_total = None  # type: ignore[assignment]
    vpn_peers_orphan_count = None  # type: ignore[assignment]
    vpn_peers_ghost_count = None  # type: ignore[assignment]
    vpn_peers_expired_active_count = None  # type: ignore[assignment]

_log = logging.getLogger(__name__)


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
    peers_added_pubkeys: list[str] = field(
        default_factory=list
    )  # successfully added, for Device update
    errors: list[str] = field(default_factory=list)
    duration_ms: float = 0.0


def _peer_allowed_ips(peer: dict) -> str:
    """Normalize allowed_ips from WG peer dict."""
    a = peer.get("allowed_ips") or peer.get("allowed_ip")
    if a is None:
        return ""
    return str(a).strip()


def _is_valid_server_allowed_ips(allowed: str | None) -> bool:
    """True if allowed_ips is a valid server-side peer value (client /32), not (none) or 0.0.0.0/0."""
    if not allowed or not (a := str(allowed).strip()):
        return False
    if "0.0.0.0/0" in a:
        return False
    return "/32" in a or "/128" in a


async def compute_diff(
    node_id: str,
    db_peers: list[tuple[str, str, str | None]],
    wg_peers: list[dict],
) -> ReconciliationDiff:
    """
    db_peers: list of (public_key, allowed_ips, preshared_key). allowed_ips must be client /32.
    wg_peers: list of dict with public_key, allowed_ips (from list_peers).
    Only add/update peers that have valid allowed_ips (client /32); skip others and log.
    """
    db_map: dict[str, tuple[str, str | None]] = {}
    for pk, allowed, psk in db_peers:
        if not pk:
            continue
        allowed_norm = (allowed or "").strip()
        psk_norm = (psk or "").strip() or None
        db_map[pk] = (allowed_norm, psk_norm)
    wg_map = {p["public_key"]: _peer_allowed_ips(p) for p in wg_peers if p.get("public_key")}

    to_add: list[PeerConfigLike] = []
    for pk, (allowed, psk) in db_map.items():
        if pk not in wg_map:
            if not _is_valid_server_allowed_ips(allowed):
                _log.warning(
                    "Reconciliation skip add peer (no valid allowed_ips): node_id=%s pubkey=%s",
                    node_id,
                    pk[:16] if pk else "",
                )
                continue
            to_add.append(
                PeerConfigLike(
                    public_key=pk,
                    allowed_ips=allowed,
                    preshared_key=psk,
                    persistent_keepalive=25,
                )
            )

    to_remove = [pk for pk in wg_map if pk not in db_map]

    to_update: list[PeerConfigLike] = []
    for pk, (allowed, psk) in db_map.items():
        if not _is_valid_server_allowed_ips(allowed):
            continue
        if pk in wg_map:
            wg_val = wg_map[pk] or ""
            if wg_val != allowed and (not wg_val or "0.0.0.0/0" in wg_val):
                to_update.append(
                    PeerConfigLike(
                        public_key=pk,
                        allowed_ips=allowed,
                        preshared_key=psk,
                        persistent_keepalive=25,
                    )
                )

    diff = ReconciliationDiff(
        peers_to_add=to_add, peers_to_remove=to_remove, peers_to_update=to_update
    )
    if to_add or to_remove or to_update:
        _log.info(
            "reconciliation drift detected",
            extra={
                "event": "drift_detected",
                "node_id": node_id,
                "missing": len(to_add),
                "extra": len(to_remove),
                "mismatch": len(to_update),
            },
        )
    return diff


async def apply_diff(
    adapter: NodeRuntimeAdapter,
    node_id: str,
    diff: ReconciliationDiff,
) -> ReconciliationResult:
    """Apply diff idempotently: add, remove, update (remove+add)."""
    from app.core.config import settings

    result = ReconciliationResult()
    start = time.perf_counter()

    if settings.reconciliation_read_only:
        for p in diff.peers_to_add:
            _log.warning(
                "Safe Reconcile (Read-Only): Peer found in DB but missing in runtime (Ghost): node_id=%s pubkey=%s",
                node_id,
                p.public_key[:16],
            )
        for p in diff.peers_to_remove:
            pub = p[:16] if isinstance(p, str) else getattr(p, "public_key", str(p))[:16]
            _log.warning(
                "Safe Reconcile (Read-Only): ORPHAN peer found in runtime but not in DB: node_id=%s pubkey=%s",
                node_id,
                pub,
            )
        for p in diff.peers_to_update:
            _log.warning(
                "Safe Reconcile (Read-Only): Peer drift detected (params mismatch): node_id=%s pubkey=%s",
                node_id,
                p.public_key[:16],
            )

        if diff.peers_to_add or diff.peers_to_remove or diff.peers_to_update:
            return result

    # Remove orphans first when enabled, so add_peer won't hit allowed_ips conflict
    if settings.reconciliation_remove_orphans and diff.peers_to_remove:
        for pubkey in diff.peers_to_remove:
            _log.info(
                "unknown peer on server, removing",
                extra={"event": "reconcile_quarantine", "node_id": node_id, "pubkey": pubkey[:32]},
            )
            try:
                await adapter.remove_peer(node_id, pubkey)
                result.peers_removed += 1
            except Exception as e:
                if vpn_peer_apply_failures_total is not None:
                    try:
                        vpn_peer_apply_failures_total.labels(node_id=node_id, reason="remove").inc()
                        if vpn_reconciliation_errors_total is not None:
                            vpn_reconciliation_errors_total.labels(
                                node_id=node_id, stage="remove"
                            ).inc()
                    except Exception:
                        pass
                _log.exception("Reconciliation remove_peer failed node_id=%s", node_id)
                result.errors.append(f"remove {pubkey[:16]}: {e!s}")

    for peer in diff.peers_to_add:
        try:
            await adapter.add_peer(node_id, peer)
            result.peers_added += 1
            result.peers_added_pubkeys.append(peer.public_key)
            if vpn_peers_readded_total is not None:
                try:
                    vpn_peers_readded_total.labels(node_id=node_id).inc()
                except Exception:
                    pass
            _log.info(
                "peer added during reconciliation",
                extra={
                    "event": "reconcile_add",
                    "node_id": node_id,
                    "pubkey": peer.public_key[:32],
                    "allowed_ips": peer.allowed_ips,
                },
            )
        except Exception as e:
            if vpn_peer_apply_failures_total is not None:
                try:
                    vpn_peer_apply_failures_total.labels(node_id=node_id, reason="add").inc()
                    if vpn_reconciliation_errors_total is not None:
                        vpn_reconciliation_errors_total.labels(node_id=node_id, stage="add").inc()
                except Exception:
                    pass
            _log.exception(
                "Reconciliation add_peer failed node_id=%s pubkey=%s", node_id, peer.public_key[:16]
            )
            result.errors.append(f"add {peer.public_key[:16]}: {e!s}")

    if vpn_peers_orphan_count is not None:
        try:
            vpn_peers_orphan_count.labels(node_id=node_id).set(len(diff.peers_to_remove))
        except Exception:
            pass

    if not settings.reconciliation_remove_orphans:
        for pubkey in diff.peers_to_remove:
            _log.warning(
                "ORPHAN peer on server (not in DB); not removing (reconciliation_remove_orphans=false)",
                extra={"event": "reconcile_orphan", "node_id": node_id, "pubkey": pubkey[:32]},
            )

    for peer in diff.peers_to_update:
        try:
            await adapter.remove_peer(node_id, peer.public_key)
            await adapter.add_peer(node_id, peer)
            result.peers_updated += 1
            _log.info(
                "peer reapplied during reconciliation",
                extra={
                    "event": "reconcile_fix",
                    "node_id": node_id,
                    "pubkey": peer.public_key[:32],
                    "allowed_ips": peer.allowed_ips,
                    "reason": "mismatch",
                },
            )
        except Exception as e:
            if vpn_peer_apply_failures_total is not None:
                try:
                    vpn_peer_apply_failures_total.labels(node_id=node_id, reason="update").inc()
                    if vpn_reconciliation_errors_total is not None:
                        vpn_reconciliation_errors_total.labels(
                            node_id=node_id, stage="update"
                        ).inc()
                except Exception:
                    pass
            _log.exception("Reconciliation update peer failed node_id=%s", node_id)
            result.errors.append(f"update {peer.public_key[:16]}: {e!s}")

    result.duration_ms = (time.perf_counter() - start) * 1000
    if not result.errors:
        _log.info(
            "reconciliation success",
            extra={
                "event": "reconcile_success",
                "node_id": node_id,
                "peers_added": result.peers_added,
                "peers_removed": result.peers_removed,
                "peers_updated": result.peers_updated,
                "duration_ms": result.duration_ms,
            },
        )
    else:
        _log.warning(
            "reconciliation completed with errors",
            extra={
                "event": "reconcile_failed",
                "node_id": node_id,
                "peers_added": result.peers_added,
                "peers_removed": result.peers_removed,
                "peers_updated": result.peers_updated,
                "errors": result.errors[:5],
                "duration_ms": result.duration_ms,
            },
        )
    if vpn_reconciliation_duration_seconds is not None:
        vpn_reconciliation_duration_seconds.observe(result.duration_ms / 1000.0)
    return result


async def reconcile_node(
    node_id: str, adapter: NodeRuntimeAdapter, server_ids: list[str] | None = None
) -> ReconciliationResult:
    """Reconcile one runtime node by node_id (desired from DB devices, actual from wg runtime).
    Not allowed in production (only node-agent mutates peers).

    server_ids: optional list of server_id values to match devices against (e.g. node_id and
    container_name). When not provided, defaults to [node_id].
    """
    from app.core.config import settings

    if settings.environment == "production":
        raise ValueError(
            "Reconciliation must not run in production; only node-agent mutates peers. Set NODE_DISCOVERY=agent."
        )
    async with async_session_factory() as session:
        ids = [node_id]
        if server_ids:
            ids = [s for s in server_ids if s] or ids
        r = await session.execute(
            select(
                Device.id,
                Device.public_key,
                Device.allowed_ips,
                Device.preshared_key,
            ).where(
                Device.server_id.in_(ids),
                Device.revoked_at.is_(None),
                Device.suspended_at.is_(None),
            )
        )
        db_rows = r.all()
        db_peers: list[tuple[str, str, str | None]] = []
        pubkey_to_device_id: dict[str, str] = {}
        for row in db_rows:
            if not row or not row[1]:
                continue
            device_id, pk, allowed, psk = row[0], row[1], row[2], row[3]
            allowed = (allowed or "").strip()
            psk = (psk or "").strip() or None
            db_peers.append((pk, allowed, psk))
            pubkey_to_device_id[pk] = device_id

        wg_peers = await adapter.list_peers(node_id)
        if vpn_peers_expected is not None:
            vpn_peers_expected.labels(node_id=node_id).set(len(db_peers))
        if vpn_peers_present is not None:
            vpn_peers_present.labels(node_id=node_id).set(len(wg_peers))

        # Expired-but-active: revoked devices in DB still present on node
        revoked_pubkeys = set()
        rev = await session.execute(
            select(Device.public_key).where(
                Device.server_id.in_(ids),
                Device.revoked_at.isnot(None),
                Device.public_key.isnot(None),
            )
        )
        for row in rev.all():
            if row and row[0]:
                revoked_pubkeys.add(str(row[0]).strip())
        wg_pubkeys = {str(p.get("public_key", "")).strip() for p in wg_peers if p.get("public_key")}
        expired_active = len(revoked_pubkeys & wg_pubkeys)
        if vpn_peers_expired_active_count is not None:
            try:
                vpn_peers_expired_active_count.labels(node_id=node_id).set(expired_active)
            except Exception:
                pass

        diff = await compute_diff(node_id, db_peers, wg_peers)

        if vpn_peers_ghost_count is not None:
            try:
                vpn_peers_ghost_count.labels(node_id=node_id).set(len(diff.peers_to_remove))
            except Exception:
                pass

        ensure_routes = getattr(adapter, "ensure_reply_routes", None)
        if callable(ensure_routes):
            await ensure_routes(node_id)

        if not diff.peers_to_add and not diff.peers_to_remove and not diff.peers_to_update:
            return ReconciliationResult(duration_ms=0.0)

        result = await apply_diff(adapter, node_id, diff)

        # Update Device for peers we re-added: apply_status=APPLIED, last_applied_at, clear last_error
        if result.peers_added_pubkeys:
            now_applied = datetime.now(timezone.utc)
            device_ids_to_update = [
                pubkey_to_device_id[pk]
                for pk in result.peers_added_pubkeys
                if pk in pubkey_to_device_id
            ]
            if device_ids_to_update:
                await session.execute(
                    update(Device)
                    .where(Device.id.in_(device_ids_to_update))
                    .values(
                        apply_status="APPLIED",
                        last_applied_at=now_applied,
                        last_error=None,
                    )
                )

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
    """Reconcile every discovered healthy/degraded AWG node. Not allowed in production (node-agent only)."""
    from app.core.config import settings

    if settings.environment == "production":
        raise ValueError(
            "Reconciliation must not run in production; only node-agent mutates peers. Set NODE_DISCOVERY=agent."
        )
    results: list[tuple[str, ReconciliationResult]] = []
    nodes = await adapter.discover_nodes()
    for node in nodes:
        # Attempt reconciliation for all discovered nodes to ensure self-healing
        # even if a node was briefly unreachable or is reporting as unhealthy.
        node_id = node.node_id
        candidate_ids = [node_id]
        container_name = getattr(node, "container_name", None)
        if container_name and container_name not in candidate_ids:
            candidate_ids.append(container_name)
        try:
            result = await reconcile_node(node_id, adapter, server_ids=candidate_ids)
            results.append((node_id, result))
        except Exception as e:
            _log.exception("Reconciliation failed for node %s: %s", node_id, redact_for_log(str(e)))
            results.append((node_id, ReconciliationResult(errors=[redact_for_log(str(e))])))
    return results


async def run_reconciliation_loop(get_adapter) -> None:
    """Background loop: reconcile all nodes every reconciliation_interval_seconds. Backoff on errors.
    No-op when NODE_DISCOVERY=agent (node-agent applies desired state)."""
    from app.core.config import settings

    if settings.node_discovery == "agent":
        _log.info(
            "Reconciliation loop skipped: NODE_DISCOVERY=agent (node-agent applies desired state)"
        )
        while True:
            await asyncio.sleep(3600)

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
