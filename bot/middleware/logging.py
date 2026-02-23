"""Middleware: log every user action with telegram_id, event_type, latency. No secrets."""

import time
import uuid
from typing import Any, Awaitable, Callable, Dict

from aiogram import BaseMiddleware
from aiogram.types import TelegramObject

from utils.context import correlation_id_ctx
from utils.logging import get_logger

logger = get_logger(__name__)

SECRET_PREFIXES = ("token=", "key=", "secret=", "password=")


def _safe_truncate(s: str | None, max_len: int = 50) -> str | None:
    if not s:
        return None
    for prefix in SECRET_PREFIXES:
        if prefix in s.lower():
            return "[redacted]"
    return s[:max_len] if len(s) > max_len else s


def _user_from_event(event: TelegramObject) -> tuple[int | None, str | None]:
    user = getattr(event, "from_user", None)
    if not user:
        return None, None
    return getattr(user, "id", None), getattr(user, "username", None)


class LoggingMiddleware(BaseMiddleware):
    """Log user_action, action_completed, action_failed. No tokens or keys in logs."""

    async def __call__(
        self,
        handler: Callable[[TelegramObject, Dict[str, Any]], Awaitable[Any]],
        event: TelegramObject,
        data: Dict[str, Any],
    ) -> Any:
        correlation_id = str(uuid.uuid4())
        token = correlation_id_ctx.set(correlation_id)
        try:
            start = time.monotonic()
            telegram_id, username = _user_from_event(event)
            event_type = type(event).__name__
            text = _safe_truncate(getattr(event, "text", None))
            callback_data = _safe_truncate(getattr(event, "data", None))

            logger.debug(
                "bot.user_action",
                event_type=event_type,
                telegram_id=telegram_id,
                username=username,
                text=text,
                callback_data=callback_data,
            )

            try:
                result = await handler(event, data)
                latency_ms = int((time.monotonic() - start) * 1000)
                logger.debug(
                    "bot.action.completed",
                    event_type=event_type,
                    telegram_id=telegram_id,
                    latency_ms=latency_ms,
                    success=True,
                )
                return result
            except Exception as e:
                latency_ms = int((time.monotonic() - start) * 1000)
                logger.error(
                    "bot.action.failed",
                    event_type=event_type,
                    telegram_id=telegram_id,
                    error=str(e),
                    latency_ms=latency_ms,
                    exc_info=True,
                )
                raise
        finally:
            correlation_id_ctx.reset(token)
