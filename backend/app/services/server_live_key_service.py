"""Live server public key fetch: node = source of truth. Used to gate issue/reissue."""

from __future__ import annotations

import hashlib
import json
import logging
from dataclasses import dataclass
from datetime import datetime, timezone

from app.core.config import settings
from app.core.constants import REDIS_KEY_AGENT_HB_PREFIX
from app.core.redis_client import get_redis
from app.services.node_runtime import NodeRuntimeAdapter

_log = logging.getLogger(__name__)


@dataclass
class LiveKeyResult:
    """Server public key fetched from the node (live)."""

    public_key: str
    node_id: str
    synced_at: datetime
    fingerprint: str  # first 8 chars base64 for logs


def _fingerprint(key_b64: str) -> str:
    return (key_b64 or "").strip()[:12].replace("+", "-").replace("/", "_")


class ServerNotSyncedError(Exception):
    """LiveKeyFetch failed: node not found, no heartbeat, or key missing. Block issue/reissue."""

    def __init__(self, server_id: str, reason: str):
        self.server_id = server_id
        self.reason = reason
        super().__init__(f"Server {server_id!r} key not verified: {reason}")


def _heartbeat_container_id(api_endpoint: str | None, server_id: str) -> str | None:
    """Extract container name from Server.api_endpoint (docker://<name>) for heartbeat fallback."""
    if not api_endpoint or not api_endpoint.strip().lower().startswith("docker://"):
        return None
    name = api_endpoint.strip()[9:].strip()  # after "docker://"
    if not name or name == server_id:
        return None
    return name[:32]


FALLBACK_KEY_MAX_AGE_SECONDS = 3600  # Don't use DB key older than this (node may have new key)


async def live_key_fetch(
    server_id: str,
    adapter: NodeRuntimeAdapter | None,
    *,
    heartbeat_fallback_ids: list[str] | None = None,
    fallback_public_key: str | None = None,
    fallback_public_key_synced_at: datetime | None = None,
) -> LiveKeyResult:
    """
    Fetch current server public key from the node. Node = source of truth.
    Raises ServerNotSyncedError if key cannot be obtained (block issue/reissue).
    In agent mode, heartbeat is keyed by server_id; agent may send server_id=container_name.
    Pass heartbeat_fallback_ids (e.g. container name from api_endpoint) to try alternate keys.
    In agent mode, if no heartbeat has public_key, fallback_public_key (e.g. Server.public_key from DB) is used when set, so issue/reissue can succeed before agent sends key; run sync so agent updates key.
    """
    if not server_id:
        raise ServerNotSyncedError("", "missing server_id")

    # Agent mode: key from heartbeat (Redis). Try server_id then fallbacks (e.g. container name).
    if settings.node_discovery == "agent" or settings.node_mode == "agent":
        try:
            r = get_redis()
            # Prefer heartbeat keyed by container name (api_endpoint) when present — matches actual node.
            ids_to_try = []
            if heartbeat_fallback_ids:
                for fid in heartbeat_fallback_ids:
                    if fid and fid not in ids_to_try:
                        ids_to_try.append(fid)
            if server_id not in ids_to_try:
                ids_to_try.append(server_id)
            pk = ""
            used_id = ""
            for hb_id in ids_to_try:
                raw = await r.get(f"{REDIS_KEY_AGENT_HB_PREFIX}{hb_id}")
                if not raw:
                    continue
                if isinstance(raw, bytes):
                    raw = raw.decode("utf-8", errors="replace")
                data = json.loads(raw) if isinstance(raw, str) else None
                if not isinstance(data, dict):
                    continue
                candidate = (data.get("public_key") or "").strip()
                if candidate:
                    pk = candidate
                    used_id = hb_id
                    break
            if not pk:
                db_key = (fallback_public_key or "").strip()
                use_db_fallback = db_key and len(db_key) >= 43
                if use_db_fallback and fallback_public_key_synced_at:
                    ts = fallback_public_key_synced_at
                    if ts.tzinfo is None:
                        ts = ts.replace(tzinfo=timezone.utc)
                    age_sec = (datetime.now(timezone.utc) - ts).total_seconds()
                    if age_sec > FALLBACK_KEY_MAX_AGE_SECONDS:
                        use_db_fallback = False
                        _log.info(
                            "LiveKeyFetch agent: skipping stale DB key for server_id=%s (synced %.0fs ago)",
                            server_id,
                            age_sec,
                        )
                if use_db_fallback:
                    _log.warning(
                        "LiveKeyFetch agent: no heartbeat with public_key for server_id=%s; using DB fallback (run sync so agent sends key)",
                        server_id,
                    )
                    now = datetime.now(timezone.utc)
                    return LiveKeyResult(
                        public_key=db_key,
                        node_id=server_id,
                        synced_at=now,
                        fingerprint=_fingerprint(db_key),
                    )
                # Last resort: scan all heartbeats; use one that matches server_id/fallbacks, else use single if exactly one
                try:
                    candidates = []
                    async for key in r.scan_iter(match=f"{REDIS_KEY_AGENT_HB_PREFIX}*", count=100):
                        raw = await r.get(key)
                        if not raw:
                            continue
                        if isinstance(raw, bytes):
                            raw = raw.decode("utf-8", errors="replace")
                        data = json.loads(raw) if isinstance(raw, str) else None
                        if not isinstance(data, dict):
                            continue
                        candidate = (data.get("public_key") or "").strip()
                        if candidate and len(candidate) >= 43:
                            hb_id = (key.decode("utf-8") if isinstance(key, bytes) else str(key)).replace(REDIS_KEY_AGENT_HB_PREFIX, "", 1)
                            candidates.append((hb_id, candidate))
                    # Prefer candidate matching server_id or fallback
                    for hb_id, candidate in candidates:
                        if hb_id in ids_to_try:
                            pk = candidate
                            used_id = hb_id
                            _log.info(
                                "LiveKeyFetch agent: matched heartbeat %s for server_id=%s",
                                hb_id,
                                server_id,
                            )
                            now = datetime.now(timezone.utc)
                            return LiveKeyResult(
                                public_key=pk,
                                node_id=used_id,
                                synced_at=now,
                                fingerprint=_fingerprint(pk),
                            )
                    if len(candidates) == 1:
                        used_id, pk = candidates[0]
                        _log.info(
                            "LiveKeyFetch agent: single heartbeat with key for server_id=%s (used %s)",
                            server_id,
                            used_id,
                        )
                        now = datetime.now(timezone.utc)
                        return LiveKeyResult(
                            public_key=pk,
                            node_id=used_id,
                            synced_at=now,
                            fingerprint=_fingerprint(pk),
                        )
                except Exception as scan_err:
                    _log.debug("LiveKeyFetch agent scan fallback failed: %s", scan_err)
                raise ServerNotSyncedError(
                    server_id,
                    "no heartbeat with public_key (try sync or check agent sends key for this server/container)",
                )
            now = datetime.now(timezone.utc)
            if used_id != server_id:
                _log.info(
                    "LiveKeyFetch used heartbeat fallback server_id=%s heartbeat_key=%s",
                    server_id,
                    used_id,
                )
            return LiveKeyResult(
                public_key=pk,
                node_id=used_id or server_id,
                synced_at=now,
                fingerprint=_fingerprint(pk),
            )
        except ServerNotSyncedError:
            raise
        except Exception as e:
            _log.warning("LiveKeyFetch agent server_id=%s error=%s", server_id, e)
            raise ServerNotSyncedError(server_id, f"heartbeat read failed: {e!s}") from e

    # Docker mode: key from node via adapter; fallback to DB key when node unreachable
    if not adapter:
        raise ServerNotSyncedError(server_id, "runtime adapter required for live key fetch")
    has_get = hasattr(adapter, "get_node_for_sync")
    if has_get:
        node = await adapter.get_node_for_sync(server_id)
    else:
        node = None
    if not node:
        nodes = await adapter.discover_nodes()
        node = next((n for n in nodes if n.node_id == server_id), None)
    pk = ""
    used_id = server_id
    if node:
        pk = (getattr(node, "public_key", None) or "").strip()
        if pk:
            used_id = getattr(node, "node_id", server_id) or server_id
    if not pk and fallback_public_key and len((fallback_public_key or "").strip()) >= 43:
        pk = (fallback_public_key or "").strip()
        _log.warning(
            "LiveKeyFetch docker: node not found or no key for server_id=%s; using DB fallback",
            server_id,
        )
    if not pk:
        raise ServerNotSyncedError(
            server_id,
            "node not found in discovery or node has no public_key (run sync or fix discovery)",
        )
    now = datetime.now(timezone.utc)
    return LiveKeyResult(
        public_key=pk,
        node_id=used_id,
        synced_at=now,
        fingerprint=_fingerprint(pk),
    )


def public_key_fingerprint(key_b64: str) -> str:
    """Stable short fingerprint for audit (e.g. first 16 chars of base64)."""
    k = (key_b64 or "").strip()
    if not k:
        return ""
    return hashlib.sha256(k.encode()).hexdigest()[:16]
