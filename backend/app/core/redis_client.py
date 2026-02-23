"""Redis connection for health check and future use (cache, queues)."""

from redis.asyncio import Redis

from app.core.config import settings

_redis: Redis | None = None


def get_redis() -> Redis:
    if _redis is None:
        raise RuntimeError("Redis not initialized")
    return _redis


async def init_redis() -> None:
    global _redis
    _redis = Redis.from_url(settings.redis_url, decode_responses=True)


async def close_redis() -> None:
    global _redis
    if _redis is not None:
        await _redis.aclose()
        _redis = None


async def check_redis() -> bool:
    """Return True if Redis is reachable. Logs and returns False on error (no silent fail)."""
    import logging

    try:
        r = Redis.from_url(settings.redis_url)
        await r.ping()
        await r.aclose()
        return True
    except Exception as e:
        logging.getLogger(__name__).warning("Redis health check failed: %s", type(e).__name__)
        return False
