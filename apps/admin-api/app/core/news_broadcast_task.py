"""News broadcast worker: send an admin message to all users via Telegram Bot API.

Design:
- Uses Redis as a lightweight queue + status store (no DB migrations).
- Runs in admin-worker process (see worker_main.py).
- Rate-limited to avoid Telegram flood limits.
"""

from __future__ import annotations

import asyncio
import json
import logging
import time
import uuid
from datetime import datetime, timezone

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.logging_config import extra_for_event
from app.core.redis_client import get_redis
from app.models import User

_log = logging.getLogger(__name__)

REDIS_QUEUE_KEY = "news:broadcast:queue"
REDIS_STATUS_KEY_PREFIX = "news:broadcast:status:"

# Conservative: keep well under typical Telegram limits.
DEFAULT_SEND_QPS = 20.0


def _status_key(broadcast_id: str) -> str:
    return f"{REDIS_STATUS_KEY_PREFIX}{broadcast_id}"


async def enqueue_news_broadcast(
    *,
    text: str,
    parse_mode: str | None,
    include_banned: bool,
    created_by: str,
) -> str:
    """Create a broadcast job in Redis and enqueue it. Returns broadcast_id."""
    broadcast_id = uuid.uuid4().hex
    now = datetime.now(timezone.utc).isoformat()
    r = get_redis()
    await r.hset(
        _status_key(broadcast_id),
        mapping={
            "id": broadcast_id,
            "status": "queued",
            "text": text,
            "parse_mode": parse_mode or "",
            "include_banned": "1" if include_banned else "0",
            "created_by": created_by,
            "created_at": now,
            "started_at": "",
            "finished_at": "",
            "total": "0",
            "sent": "0",
            "failed": "0",
            "last_error": "",
        },
    )
    await r.rpush(REDIS_QUEUE_KEY, broadcast_id)
    return broadcast_id


async def get_news_broadcast_status(broadcast_id: str) -> dict[str, str] | None:
    r = get_redis()
    data = await r.hgetall(_status_key(broadcast_id))
    return data or None


async def _send_telegram_message(
    client: httpx.AsyncClient,
    *,
    token: str,
    tg_id: int,
    text: str,
    parse_mode: str | None,
) -> tuple[bool, str | None]:
    url = f"https://api.telegram.org/bot{token}/sendMessage"
    payload: dict[str, object] = {"chat_id": tg_id, "text": text}
    if parse_mode:
        payload["parse_mode"] = parse_mode
    try:
        resp = await client.post(url, json=payload)
        if resp.status_code == 200:
            return True, None
        # Keep small; never log full payload.
        return False, f"telegram_http_{resp.status_code}"
    except Exception as e:
        return False, f"telegram_exc_{type(e).__name__}"


async def _run_one_broadcast(session: AsyncSession, broadcast_id: str) -> None:
    r = get_redis()
    status_key = _status_key(broadcast_id)
    raw = await r.hgetall(status_key)
    if not raw:
        return
    text = raw.get("text", "")
    parse_mode = (raw.get("parse_mode") or "").strip() or None
    include_banned = raw.get("include_banned", "0") == "1"
    token = (getattr(settings, "telegram_bot_token", None) or "").strip()
    if not token:
        await r.hset(status_key, mapping={"status": "failed", "last_error": "no_bot_token"})
        return
    if not text.strip():
        await r.hset(status_key, mapping={"status": "failed", "last_error": "empty_text"})
        return

    await r.hset(
        status_key,
        mapping={"status": "sending", "started_at": datetime.now(timezone.utc).isoformat()},
    )

    qps = float(getattr(settings, "news_broadcast_qps", 0) or 0) or DEFAULT_SEND_QPS
    delay_s = 1.0 / max(1.0, qps)

    query = select(User.tg_id).where(User.tg_id.isnot(None))
    if not include_banned:
        query = query.where(User.is_banned.is_(False))
    result = await session.stream(query)

    sent = failed = total = 0
    last_error: str | None = None

    async with httpx.AsyncClient(timeout=10.0) as client:
        async for row in result:
            (tg_id,) = row
            total += 1
            ok, err = await _send_telegram_message(
                client,
                token=token,
                tg_id=int(tg_id),
                text=text,
                parse_mode=parse_mode,
            )
            if ok:
                sent += 1
            else:
                failed += 1
                last_error = err
            if total % 50 == 0:
                await r.hset(
                    status_key,
                    mapping={
                        "total": str(total),
                        "sent": str(sent),
                        "failed": str(failed),
                        "last_error": last_error or "",
                    },
                )
            await asyncio.sleep(delay_s)

    await r.hset(
        status_key,
        mapping={
            "status": "completed",
            "finished_at": datetime.now(timezone.utc).isoformat(),
            "total": str(total),
            "sent": str(sent),
            "failed": str(failed),
            "last_error": last_error or "",
        },
    )


async def run_news_broadcast_loop() -> None:
    """Worker loop: blocks on Redis queue, processes broadcasts sequentially."""
    from app.core.database import async_session_factory

    while True:
        try:
            try:
                r = get_redis()
            except Exception:
                # Redis may not be initialized yet during startup sequencing.
                await asyncio.sleep(1.0)
                continue
            if not getattr(run_news_broadcast_loop, "_started", False):
                run_news_broadcast_loop._started = True  # type: ignore[attr-defined]
                _log.info(
                    "news broadcast loop started",
                    extra=extra_for_event(event="worker.news_broadcast.startup"),
                )
            item = await r.blpop(REDIS_QUEUE_KEY, timeout=5)
            if not item:
                await asyncio.sleep(0.2)
                continue
            _, broadcast_id = item
            start = time.monotonic()
            async with async_session_factory() as session:
                await _run_one_broadcast(session, broadcast_id)
            _log.info(
                "news broadcast processed id=%s in_ms=%d",
                broadcast_id,
                int((time.monotonic() - start) * 1000),
                extra=extra_for_event(event="worker.news_broadcast.done", entity_id=broadcast_id[:16]),
            )
        except Exception as e:  # pragma: no cover
            _log.warning(
                "news broadcast loop error: %s",
                str(e),
                extra=extra_for_event(event="worker.news_broadcast.error"),
                exc_info=True,
            )
            await asyncio.sleep(1.0)

