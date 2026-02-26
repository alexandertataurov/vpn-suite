"""Devices summary cache (Redis)."""

import json
import logging

from app.core.constants import DEVICES_SUMMARY_CACHE_TTL_SECONDS, REDIS_KEY_DEVICES_SUMMARY
from app.core.redis_client import get_redis
from app.schemas.device import DeviceSummaryOut

logger = logging.getLogger(__name__)


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
