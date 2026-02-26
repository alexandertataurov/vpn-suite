"""Devices summary and list cache (Redis)."""

import hashlib
import json
import logging

from app.core.constants import (
    DEVICES_LIST_CACHE_TTL_SECONDS,
    DEVICES_SUMMARY_CACHE_TTL_SECONDS,
    REDIS_KEY_DEVICES_LIST,
    REDIS_KEY_DEVICES_LIST_PATTERN,
    REDIS_KEY_DEVICES_SUMMARY,
)
from app.core.redis_client import get_redis
from app.schemas.device import DeviceList, DeviceSummaryOut

logger = logging.getLogger(__name__)


def devices_list_cache_key(
    limit: int,
    offset: int,
    user_id: int | None,
    email: str | None,
    status_filter: str | None,
    search: str | None,
    sort: str,
    node_id: str | None,
) -> str:
    """Build Redis key for devices list cache entry."""
    h = hashlib.sha256(
        json.dumps(
            [limit, offset, user_id, email, status_filter, search, sort, node_id],
            sort_keys=False,
        ).encode()
    ).hexdigest()[:16]
    return f"{REDIS_KEY_DEVICES_LIST}{h}"


async def get_devices_list_cached(cache_key: str) -> DeviceList | None:
    """Return cached devices list if present."""
    try:
        redis = get_redis()
        raw = await redis.get(cache_key)
        if raw is None:
            return None
        if isinstance(raw, bytes):
            raw = raw.decode("utf-8")
        data = json.loads(raw)
        return DeviceList.model_validate(data)
    except Exception as e:
        logger.debug("Devices list cache get failed: %s", e)
        return None


async def set_devices_list_cached(cache_key: str, out: DeviceList) -> None:
    """Store devices list in Redis with TTL."""
    try:
        redis = get_redis()
        await redis.set(
            cache_key,
            json.dumps(out.model_dump(mode="json")),
            ex=DEVICES_LIST_CACHE_TTL_SECONDS,
        )
    except Exception as e:
        logger.debug("Devices list cache set failed: %s", e)


async def invalidate_devices_list_cache() -> None:
    """Invalidate all devices list cache entries (call on device create/revoke/block/delete)."""
    try:
        redis = get_redis()
        keys = []
        async for k in redis.scan_iter(REDIS_KEY_DEVICES_LIST_PATTERN):
            keys.append(k)
        if keys:
            await redis.delete(*keys)
            logger.debug("Invalidated %d devices list cache keys", len(keys))
    except Exception as e:
        logger.debug("Devices list cache invalidation skipped: %s", e)


async def get_devices_summary_cached() -> DeviceSummaryOut | None:
    """Return cached devices summary if present."""
    try:
        redis = get_redis()
        raw = await redis.get(REDIS_KEY_DEVICES_SUMMARY)
        if raw is None:
            return None
        if isinstance(raw, bytes):
            raw = raw.decode("utf-8")
        data = json.loads(raw)
        return DeviceSummaryOut.model_validate(data)
    except Exception as e:
        logger.debug("Devices summary cache get failed: %s", e)
        return None


async def set_devices_summary_cached(out: DeviceSummaryOut) -> None:
    """Store devices summary in Redis with TTL."""
    try:
        redis = get_redis()
        await redis.set(
            REDIS_KEY_DEVICES_SUMMARY,
            out.model_dump_json(),
            ex=DEVICES_SUMMARY_CACHE_TTL_SECONDS,
        )
    except Exception as e:
        logger.debug("Devices summary cache set failed: %s", e)


async def invalidate_devices_summary_cache() -> None:
    """Invalidate devices summary cache (call on device create/revoke/block/delete)."""
    try:
        redis = get_redis()
        await redis.delete(REDIS_KEY_DEVICES_SUMMARY)
        logger.debug("Invalidated devices summary cache")
    except Exception as e:
        logger.debug("Devices summary cache invalidation skipped: %s", e)
