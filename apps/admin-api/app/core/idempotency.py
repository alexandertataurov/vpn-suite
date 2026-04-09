"""Redis-backed idempotency helpers for mutating admin endpoints."""

from __future__ import annotations

import hashlib
import json
import logging
from typing import Any

from app.core.config import settings
from app.core.constants import REDIS_KEY_IDEMPOTENCY_ACTION_PREFIX
from app.core.redis_client import get_redis

_log = logging.getLogger(__name__)


def _normalize_key(raw: str | None) -> str | None:
    if raw is None:
        return None
    key = raw.strip()
    if not key:
        return None
    if len(key) > 256:
        key = key[:256]
    return key


def _cache_key(scope: str, resource_id: str, idempotency_key: str) -> str:
    digest = hashlib.sha256(f"{scope}:{resource_id}:{idempotency_key}".encode()).hexdigest()
    return f"{REDIS_KEY_IDEMPOTENCY_ACTION_PREFIX}{digest}"


async def get_cached_idempotency_response(
    scope: str,
    resource_id: str,
    idempotency_key: str | None,
) -> dict[str, Any] | None:
    key = _normalize_key(idempotency_key)
    if not key:
        return None
    try:
        cached = await get_redis().get(_cache_key(scope, resource_id, key))
    except Exception:
        _log.debug("Idempotency read failed for scope=%s", scope, exc_info=True)
        return None
    if not cached:
        return None
    try:
        parsed = json.loads(cached)
        if isinstance(parsed, dict) and isinstance(parsed.get("body"), dict):
            return parsed
    except Exception:
        _log.debug("Idempotency payload decode failed for scope=%s", scope, exc_info=True)
    return None


async def store_idempotency_response(
    scope: str,
    resource_id: str,
    idempotency_key: str | None,
    body: dict[str, Any],
    status_code: int = 200,
    ttl_seconds: int | None = None,
) -> None:
    key = _normalize_key(idempotency_key)
    if not key:
        return
    payload = {"status_code": status_code, "body": body}
    ttl = int(ttl_seconds or settings.idempotency_ttl_seconds or 86400)
    try:
        await get_redis().setex(
            _cache_key(scope, resource_id, key),
            max(1, ttl),
            json.dumps(payload),
        )
    except Exception:
        _log.debug("Idempotency write failed for scope=%s", scope, exc_info=True)
