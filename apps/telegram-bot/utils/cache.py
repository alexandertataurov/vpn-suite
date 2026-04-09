"""Simple async TTL cache for get_plans, get_servers. In-memory, no invalidation."""

import time
from typing import Any, Callable, TypeVar

T = TypeVar("T")

_cache: dict[tuple, tuple[Any, float]] = {}  # key -> (value, expires_at)


async def cached(ttl_seconds: float, key: tuple, fn: Callable[..., Any], *args: Any, **kwargs: Any) -> T:
    """Call fn(*args, **kwargs) or return cached result if not expired."""
    now = time.monotonic()
    entry = _cache.get(key)
    if entry is not None:
        val, expires = entry
        if now < expires:
            return val
    result = await fn(*args, **kwargs)
    _cache[key] = (result, now + ttl_seconds)
    return result
