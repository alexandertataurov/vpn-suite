"""Rate-limit repeated error logs to avoid flooding. Always increment Prometheus; skip log when over limit."""

import hashlib
import logging

from app.core.redis_client import get_redis

KEY_PREFIX = "errlog:"
TTL_SECONDS = 60
MAX_LOGS_PER_WINDOW = 10

_log = logging.getLogger(__name__)


def _fingerprint(msg: str, max_len: int = 100) -> str:
    """Stable fingerprint for grouping similar errors."""
    s = (msg or "")[:max_len]
    return hashlib.sha256(s.encode(errors="replace")).hexdigest()[:16]


async def should_log_error(
    error_code: str,
    route: str | None,
    fingerprint: str | None = None,
    message: str | None = None,
) -> bool:
    """Return True if this error should be logged (under rate limit). Increments Redis counter."""
    fp = fingerprint or _fingerprint(message or "")
    route_safe = (route or "unknown").replace("/", "_")[:64]
    key = f"{KEY_PREFIX}{error_code}:{route_safe}:{fp}"
    try:
        r = get_redis()
        n = await r.incr(key)
        if n == 1:
            await r.expire(key, TTL_SECONDS)
        return n <= MAX_LOGS_PER_WINDOW
    except Exception as e:
        _log.debug("Error log rate limit check failed (Redis): %s", type(e).__name__)
        return True  # fail-open: allow log when Redis unavailable
