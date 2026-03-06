"""Start command: greeting and one "Open app" Web App button."""

from urllib.parse import urlencode

from aiogram import Router
from aiogram.filters import CommandStart
from aiogram.types import (
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    MenuButtonWebApp,
    Message,
    WebAppInfo,
)

from config import MINIAPP_URL
from i18n import t
from utils.logging import get_logger

_log = get_logger(__name__)

router = Router()

REF_PREFIX = "ref_"


def _get_ref_from_start(text: str | None) -> str | None:
    """Extract ref code from /start ref_XXX for passing to miniapp."""
    if not text or not text.strip():
        return None
    parts = text.strip().split(maxsplit=1)
    if len(parts) < 2:
        return None
    payload = parts[1].strip()
    if payload.startswith(REF_PREFIX):
        return payload[len(REF_PREFIX) :].strip() or None
    return None


def _open_app_keyboard(locale: str, ref: str | None) -> InlineKeyboardMarkup | None:
    """Return Web App keyboard only if MINIAPP_URL is HTTPS (Telegram requirement)."""
    if not MINIAPP_URL.startswith("https://"):
        return None
    url = MINIAPP_URL
    if ref:
        url = f"{url}?{urlencode({'ref': ref[:64]})}"
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text=t(locale, "open_app"),
                    web_app=WebAppInfo(url=url),
                )
            ]
        ]
    )


@router.message(CommandStart())
async def cmd_start(message: Message):
    locale = "en"
    ref = _get_ref_from_start(message.text)
    greeting = t(locale, "welcome")
    keyboard = _open_app_keyboard(locale, ref)
    await message.answer(
        greeting,
        reply_markup=keyboard,
        parse_mode=None,
    )
    if MINIAPP_URL.startswith("https://") and message.chat:
        try:
            await message.bot.set_chat_menu_button(
                chat_id=message.chat.id,
                menu_button=MenuButtonWebApp(
                    text="Open App",
                    web_app=WebAppInfo(url=MINIAPP_URL),
                ),
            )
            _log.debug("menu_button_set_chat", chat_id=message.chat.id)
        except Exception as e:
            _log.warning(
                "set_chat_menu_button_failed",
                chat_id=message.chat.id,
                error=str(e),
            )
