"""Telemetry snapshot cache: Redis keys, TTL, and read/write for fan-in aggregator and snapshot API."""

import json
import logging
from typing import Any

from app.core.constants import REDIS_KEY_TELEMETRY_SNAPSHOT_PREFIX
from app.core.redis_client import get_redis

_log = logging.getLogger(__name__)

SNAPSHOT_TTL_SECONDS = 60
# Snapshot cache layer: stale after 90s. Operator dashboard uses 30s/120s for request-time freshness.
SNAPSHOT_STALE_THRESHOLD_SECONDS = 90
DEFAULT_ENV = "default"


def _key(scope: str, env: str = DEFAULT_ENV) -> str:
    return f"{REDIS_KEY_TELEMETRY_SNAPSHOT_PREFIX}{scope}:{env}"


def snapshot_nodes_key(env: str = DEFAULT_ENV) -> str:
    return _key("nodes", env)


def snapshot_devices_key(env: str = DEFAULT_ENV) -> str:
    return _key("devices", env)


def snapshot_sessions_key(env: str = DEFAULT_ENV) -> str:
    return _key("sessions", env)


def snapshot_meta_key(env: str = DEFAULT_ENV) -> str:
    return _key("meta", env)


async def get_snapshot_nodes(env: str = DEFAULT_ENV) -> dict[str, Any] | None:
    """Return cached nodes snapshot (summary + list) or None."""
    try:
        redis = get_redis()
        raw = await redis.get(snapshot_nodes_key(env))
        if raw:
            return json.loads(raw)
    except Exception as e:
        _log.debug("Snapshot nodes read failed: %s", e)
    return None


async def set_snapshot_nodes(payload: dict[str, Any], env: str = DEFAULT_ENV) -> None:
    """Write nodes snapshot (summary + list)."""
    try:
        redis = get_redis()
        await redis.set(
            snapshot_nodes_key(env),
            json.dumps(payload),
            ex=SNAPSHOT_TTL_SECONDS,
        )
    except Exception as e:
        _log.debug("Snapshot nodes write failed: %s", e)


async def get_snapshot_devices(env: str = DEFAULT_ENV) -> dict[str, Any] | None:
    """Return cached devices snapshot (summary + list) or None."""
    try:
        redis = get_redis()
        raw = await redis.get(snapshot_devices_key(env))
        if raw:
            return json.loads(raw)
    except Exception as e:
        _log.debug("Snapshot devices read failed: %s", e)
    return None


async def set_snapshot_devices(payload: dict[str, Any], env: str = DEFAULT_ENV) -> None:
    """Write devices snapshot (summary + list)."""
    try:
        redis = get_redis()
        await redis.set(
            snapshot_devices_key(env),
            json.dumps(payload),
            ex=SNAPSHOT_TTL_SECONDS,
        )
    except Exception as e:
        _log.debug("Snapshot devices write failed: %s", e)


async def get_snapshot_sessions(env: str = DEFAULT_ENV) -> dict[str, Any] | None:
    """Return cached sessions snapshot or None."""
    try:
        redis = get_redis()
        raw = await redis.get(snapshot_sessions_key(env))
        if raw:
            return json.loads(raw)
    except Exception as e:
        _log.debug("Snapshot sessions read failed: %s", e)
    return None


async def set_snapshot_sessions(payload: dict[str, Any], env: str = DEFAULT_ENV) -> None:
    """Write sessions snapshot."""
    try:
        redis = get_redis()
        await redis.set(
            snapshot_sessions_key(env),
            json.dumps(payload),
            ex=SNAPSHOT_TTL_SECONDS,
        )
    except Exception as e:
        _log.debug("Snapshot sessions write failed: %s", e)


async def get_snapshot_meta(env: str = DEFAULT_ENV) -> dict[str, Any] | None:
    """Return cached meta (snapshot_ts, cursor, freshness, stale_node_ids, partial_failure) or None."""
    try:
        redis = get_redis()
        raw = await redis.get(snapshot_meta_key(env))
        if raw:
            return json.loads(raw)
    except Exception as e:
        _log.debug("Snapshot meta read failed: %s", e)
    return None


async def set_snapshot_meta(payload: dict[str, Any], env: str = DEFAULT_ENV) -> None:
    """Write meta snapshot."""
    try:
        redis = get_redis()
        await redis.set(
            snapshot_meta_key(env),
            json.dumps(payload),
            ex=SNAPSHOT_TTL_SECONDS,
        )
    except Exception as e:
        _log.debug("Snapshot meta write failed: %s", e)


async def get_all_snapshots(
    env: str = DEFAULT_ENV,
) -> tuple[dict | None, dict | None, dict | None, dict | None]:
    """Return (nodes, devices, sessions, meta) from cache. Any may be None if missing."""
    nodes = await get_snapshot_nodes(env)
    devices = await get_snapshot_devices(env)
    sessions = await get_snapshot_sessions(env)
    meta = await get_snapshot_meta(env)
    return (nodes, devices, sessions, meta)
