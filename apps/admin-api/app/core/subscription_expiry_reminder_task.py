"""Subscription expiry reminders: 3d and 1d before valid_until. Sends via Telegram Bot API."""

import asyncio
import logging
from datetime import datetime, timedelta, timezone

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.logging_config import extra_for_event
from app.core.redaction import redact_for_log
from app.models import Subscription, User
from app.services.subscription_state import entitled_active_where

_log = logging.getLogger(__name__)

INTERVAL_SECONDS = 6 * 3600  # every 6h
REMINDER_3D_TEXT_EN = "Your secure tunnel expires soon."
REMINDER_3D_TEXT_RU = "Ваш защищённый туннель скоро истекает."
REMINDER_1D_TEXT_EN = "Don't lose your secure route."
REMINDER_1D_TEXT_RU = "Не теряйте свой защищённый маршрут."


async def _send_telegram_message(tg_id: int, text: str) -> bool:
    token = (getattr(settings, "telegram_bot_token", None) or "").strip()
    if not token:
        return False
    url = f"https://api.telegram.org/bot{token}/sendMessage"
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.post(
                url,
                json={"chat_id": tg_id, "text": text, "parse_mode": "HTML"},
            )
            if r.status_code != 200:
                _log.warning(
                    "Reminder send failed: %s %s",
                    r.status_code,
                    redact_for_log(r.text[:200]),
                    extra=extra_for_event(event="worker.reminder.send_failed"),
                )
                return False
            return True
    except Exception as e:
        _log.warning(
            "Reminder send error: %s",
            redact_for_log(str(e)),
            extra=extra_for_event(event="worker.reminder.send_error"),
        )
        return False


async def run_subscription_reminder_check(session: AsyncSession) -> tuple[int, int]:
    """Find subs due for 3d/1d reminder, send message, set reminder_*_sent_at. Returns (n_3d, n_1d)."""
    now = datetime.now(timezone.utc)
    # 3d: valid_until in [now+72h, now+71h] (1h window)
    window_3d_start = now + timedelta(hours=71)
    window_3d_end = now + timedelta(hours=73)
    # 1d: valid_until in [now+24h, now+23h]
    window_1d_start = now + timedelta(hours=23)
    window_1d_end = now + timedelta(hours=25)

    n_3d, n_1d = 0, 0

    # 3d reminders
    result = await session.execute(
        select(Subscription, User)
        .join(User, Subscription.user_id == User.id)
        .where(
            *entitled_active_where(),
            Subscription.valid_until >= window_3d_start,
            Subscription.valid_until <= window_3d_end,
            Subscription.reminder_3d_sent_at.is_(None),
        )
    )
    for sub, user in result.all():
        text = REMINDER_3D_TEXT_EN
        sent = await _send_telegram_message(user.tg_id, text)
        if sent:
            sub.reminder_3d_sent_at = now
            n_3d += 1
        await session.flush()

    # 1d reminders
    result = await session.execute(
        select(Subscription, User)
        .join(User, Subscription.user_id == User.id)
        .where(
            *entitled_active_where(),
            Subscription.valid_until >= window_1d_start,
            Subscription.valid_until <= window_1d_end,
            Subscription.reminder_1d_sent_at.is_(None),
        )
    )
    for sub, user in result.all():
        text = REMINDER_1D_TEXT_EN
        sent = await _send_telegram_message(user.tg_id, text)
        if sent:
            sub.reminder_1d_sent_at = now
            n_1d += 1
        await session.flush()

    return (n_3d, n_1d)


async def run_subscription_reminder_loop() -> None:
    """Run reminder check every INTERVAL_SECONDS."""
    from app.core.database import async_session_factory

    while True:
        try:
            async with async_session_factory() as session:
                n_3d, n_1d = await run_subscription_reminder_check(session)
                if n_3d or n_1d:
                    await session.commit()
                    _log.info(
                        "Subscription reminders sent: 3d=%d 1d=%d",
                        n_3d,
                        n_1d,
                        extra=extra_for_event(
                            event="worker.reminder.completed",
                            entity_id=f"3d={n_3d},1d={n_1d}",
                        ),
                    )
        except Exception as e:
            _log.exception(
                "Subscription reminder loop error: %s",
                redact_for_log(str(e)),
                extra=extra_for_event(
                    event="worker.loop.failed",
                    error_code="E_INTERNAL",
                    error_kind="internal",
                ),
            )
        await asyncio.sleep(INTERVAL_SECONDS)
