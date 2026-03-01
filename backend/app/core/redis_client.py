"""Redis connection for health check and future use (cache, queues)."""

import logging

from redis.asyncio import ConnectionPool, Redis

from app.core.config import settings

_log = logging.getLogger(__name__)
_redis: Redis | None = None
_pool: ConnectionPool | None = None

# Pool options to reduce Connection lost / ConnectionError:
# - retry_on_timeout: retry commands on transient timeouts
# - socket_keepalive: TCP keepalive to detect stale connections (Redis has tcp-keepalive 300)
# - socket_connect_timeout: avoid hanging on connect
# - health_check_interval: periodic ping to detect and replace dead connections
REDIS_POOL_KWARGS = {
    "retry_on_timeout": True,
    "socket_keepalive": True,
    "socket_connect_timeout": 5,
    "health_check_interval": 10,
}


def get_redis() -> Redis:
    if _redis is None:
        raise RuntimeError("Redis not initialized")
    return _redis


async def init_redis() -> None:
    global _redis, _pool
    _pool = ConnectionPool.from_url(
        settings.redis_url,
        decode_responses=True,
        max_connections=20,
        **REDIS_POOL_KWARGS,
    )
    _redis = Redis(connection_pool=_pool)


async def close_redis() -> None:
    global _redis, _pool
    if _redis is not None:
        await _redis.aclose()
        _redis = None
    if _pool is not None:
        await _pool.disconnect()
        _pool = None


async def check_redis() -> bool:
    """Return True if Redis is reachable. Logs and returns False on error (no silent fail)."""
    try:
        pool = ConnectionPool.from_url(
            settings.redis_url,
            decode_responses=True,
            **REDIS_POOL_KWARGS,
        )
        r = Redis(connection_pool=pool)
        await r.ping()
        await r.aclose()
        return True
    except Exception as e:
        _log.warning("Redis health check failed: %s", type(e).__name__)
        return False
