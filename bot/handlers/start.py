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

from api_client import get_referral_my_link, post_event
from config import BOT_USERNAME, MINIAPP_URL
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


def _referral_link(payload: str) -> str:
    """Build t.me start link with ref payload."""
    return f"https://t.me/{BOT_USERNAME}?start={payload}"


def _locale(message: Message) -> str:
    """Best-effort user locale based on Telegram language_code."""
    if message.from_user and message.from_user.language_code:
        code = (message.from_user.language_code or "").lower()
        if code.startswith("ru"):
            return "ru"
    return "en"


@router.message(CommandStart())
async def cmd_start(message: Message):
    locale = _locale(message)
    ref = _get_ref_from_start(message.text)
    greeting = t(locale, "welcome")
    tg_id = message.from_user.id if message.from_user else None
    if tg_id:
        try:
            await post_event("user_started", tg_id, {"ref": ref} if ref else {})
        except Exception as e:
            _log.debug("telemetry_skip", tg_id=tg_id, error=str(e))
    if tg_id:
        try:
            result = await get_referral_my_link(tg_id)
            if result.success and result.data:
                payload = (result.data.get("payload") or "").strip()
                if payload:
                    link = _referral_link(payload)
                    greeting = f"{greeting}\n\n{t(locale, 'welcome_referral_line', link=link)}"
        except Exception as e:
            _log.debug("referral_link_skip", tg_id=tg_id, error=str(e))
    keyboard = _open_app_keyboard(locale, ref)
    await message.answer(
        greeting,
        reply_markup=keyboard,
        parse_mode=None,
    )
    if MINIAPP_URL.startswith("https://") and message.chat:
        try:
            menu_url = MINIAPP_URL
            if ref:
                menu_url = f"{menu_url}?{urlencode({'ref': ref[:64]})}"
            await message.bot.set_chat_menu_button(
                chat_id=message.chat.id,
                menu_button=MenuButtonWebApp(
                    text=t(locale, "open_app"),
                    web_app=WebAppInfo(url=menu_url),
                ),
            )
            _log.debug("menu_button_set_chat", chat_id=message.chat.id, has_ref=bool(ref))
        except Exception as e:
            _log.warning(
                "set_chat_menu_button_failed",
                chat_id=message.chat.id,
                error=str(e),
            )
