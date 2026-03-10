from __future__ import annotations

import pytest
from fastapi import HTTPException

from app.core import rate_limit


class _FakeRedis:
    def __init__(self) -> None:
        self._counts: dict[str, int] = {}

    async def incr(self, key: str) -> int:
        self._counts[key] = self._counts.get(key, 0) + 1
        return self._counts[key]

    async def expire(self, key: str, ttl: int) -> None:  # noqa: ARG002
        return None


@pytest.mark.asyncio
async def test_rate_limit_webapp_me_patch_raises_after_limit(monkeypatch: pytest.MonkeyPatch):
    """rate_limit_webapp_me_patch should raise HTTPException after WEBAPP_ME_PATCH_LIMIT is exceeded."""
    fake = _FakeRedis()
    monkeypatch.setattr(rate_limit, "get_redis", lambda: fake)
    monkeypatch.setattr(rate_limit, "WEBAPP_ME_PATCH_LIMIT", 2)

    # First two calls succeed.
    await rate_limit.rate_limit_webapp_me_patch(tg_id=123)
    await rate_limit.rate_limit_webapp_me_patch(tg_id=123)

    # Third call should raise 429 with structured error body.
    with pytest.raises(HTTPException) as exc_info:
        await rate_limit.rate_limit_webapp_me_patch(tg_id=123)
    assert exc_info.value.status_code == 429
    detail = exc_info.value.detail
    assert isinstance(detail, dict)
    assert detail.get("code") == "RATE_LIMIT"


@pytest.mark.asyncio
async def test_rate_limit_login_failure_raises_after_limit(monkeypatch: pytest.MonkeyPatch):
    """rate_limit_login_failure should raise HTTPException after MAX_LOGIN_ATTEMPTS is exceeded."""
    fake = _FakeRedis()

    # login failure path uses get_redis() directly (sync), returning an async client.
    monkeypatch.setattr(rate_limit, "get_redis", lambda: fake)
    monkeypatch.setattr(rate_limit, "MAX_LOGIN_ATTEMPTS", 2)

    class _Req:
        def __init__(self) -> None:
            self.client = type("C", (), {"host": "127.0.0.1"})()
            self.url = type("U", (), {"path": "/api/v1/auth/login"})()

    request = _Req()

    await rate_limit.rate_limit_login_failure(request)
    await rate_limit.rate_limit_login_failure(request)

    with pytest.raises(HTTPException) as exc_info:
        await rate_limit.rate_limit_login_failure(request)
    assert exc_info.value.status_code == 429

