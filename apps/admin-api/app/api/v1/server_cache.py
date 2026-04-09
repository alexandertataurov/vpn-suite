"""Servers list cache key and invalidation (Redis)."""

import hashlib
import json
import logging

from app.core.constants import REDIS_KEY_SERVERS_LIST, REDIS_KEY_SERVERS_LIST_PATTERN
from app.core.redis_client import get_redis

logger = logging.getLogger(__name__)


def servers_list_cache_key(
    limit: int,
    offset: int,
    is_active: bool | None,
    region: str | None,
    status: str | None,
    search: str | None,
    sort: str,
    page: int | None,
    page_size: int | None,
) -> str:
    """Build Redis key for servers list cache entry."""
    h = hashlib.sha256(
        json.dumps(
            [limit, offset, is_active, region, status, search, sort, page, page_size],
            sort_keys=False,
        ).encode()
    ).hexdigest()[:16]
    return f"{REDIS_KEY_SERVERS_LIST}{h}"


async def invalidate_servers_list_cache() -> None:
    """Delete all servers list cache entries (call on create/update/delete)."""
    try:
        redis = get_redis()
        keys = []
        async for k in redis.scan_iter(REDIS_KEY_SERVERS_LIST_PATTERN):
            keys.append(k)
        if keys:
            await redis.delete(*keys)
            logger.debug("Invalidated %d servers list cache keys", len(keys))
    except Exception as e:
        logger.debug("Servers list cache invalidation skipped: %s", e)
