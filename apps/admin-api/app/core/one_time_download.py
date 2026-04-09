from __future__ import annotations

import base64
import hashlib
import os
from datetime import datetime, timedelta, timezone
from typing import Literal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Device, OneTimeDownloadToken


Kind = Literal["awg_conf"]


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _token_bytes(n: int = 32) -> bytes:
    return os.urandom(n)


def _token_str(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).decode("ascii").rstrip("=")


def _token_hash(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


async def create_one_time_token(
    session: AsyncSession,
    *,
    device_id: str,
    kind: Kind,
    ttl_seconds: int = 600,
) -> str:
    """Create a single-use download token for a device and kind. Returns raw token string."""
    # Ensure device exists (and avoid creating orphan tokens)
    result = await session.execute(select(Device.id).where(Device.id == device_id))
    if result.scalar_one_or_none() is None:
        raise ValueError("device_not_found")

    raw = _token_bytes()
    token = _token_str(raw)
    token_hash = _token_hash(token)

    expires_at = _now() + timedelta(seconds=max(ttl_seconds, 1))

    item = OneTimeDownloadToken(
        token_hash=token_hash,
        device_id=device_id,
        kind=kind,
        expires_at=expires_at,
    )
    session.add(item)
    await session.commit()
    return token


async def verify_and_consume_one_time_token(
    session: AsyncSession,
    *,
    token: str,
) -> dict | None:
    """Verify token exists, not expired or consumed, then mark consumed and return payload.

    Returns {"device_id": str, "kind": str} or None.
    """
    if not token:
        return None
    token_hash = _token_hash(token)
    result = await session.execute(
        select(OneTimeDownloadToken).where(OneTimeDownloadToken.token_hash == token_hash)
    )
    item = result.scalar_one_or_none()
    if not item:
        return None
    now = _now()
    if item.consumed_at is not None or item.expires_at < now:
        return None
    item.consumed_at = now
    await session.commit()
    return {"device_id": item.device_id, "kind": item.kind}
