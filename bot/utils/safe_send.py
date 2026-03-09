"""Safe message sending: truncate if too long, drop keyboard if invalid URL."""

from typing import Any

import structlog
from aiogram.types import Message

_log = structlog.get_logger(__name__)

MAX_LENGTH = 4096


async def safe_send_message(
    message: Message,
    text: str,
    reply_markup: Any = None,
) -> bool:
    """
    Send message with error handling.
    Truncates if too long; sends without keyboard if button URL invalid.
    Returns True if sent successfully, False otherwise.
    """
    try:
        await message.answer(text, reply_markup=reply_markup)
        return True
    except Exception as e:
        err_str = str(e).lower()
        if "too long" in err_str or "entities_too_long" in err_str or "4096" in err_str:
            try:
                truncated = text[: MAX_LENGTH - 20] + "\n\n[Message truncated]"
                await message.answer(truncated, reply_markup=reply_markup)
                return True
            except Exception:
                await message.answer(text[: MAX_LENGTH - 20] + "\n\n[Truncated]")
                return True
        if reply_markup and ("button" in err_str or "url" in err_str or "invalid" in err_str):
            _log.warning("safe_send_message", error=str(e), fallback="no_keyboard")
            try:
                await message.answer(text)
                return True
            except Exception as e2:
                _log.warning("safe_send_message_fallback_failed", error=str(e2))
                return False
        _log.warning("safe_send_message_failed", error=str(e))
        raise
