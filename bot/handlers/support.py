"""Handler for /support - contact from SUPPORT_HANDLE or SUPPORT_LINK."""

from aiogram import Router
from aiogram.filters import Command
from aiogram.types import Message

from config import SUPPORT_HANDLE, SUPPORT_LINK
from i18n import t
from keyboards.common import error_nav_markup
from utils.safe_send import safe_send_message

router = Router()


async def _locale_from_state(state) -> str:
    data = await state.get_data()
    return data.get("locale", "en")


def _support_text(locale: str) -> str:
    handle = (SUPPORT_HANDLE or "").strip()
    if handle and not handle.startswith("@"):
        handle = "@" + handle
    prefix = t(locale, "contact_support_prefix")
    if SUPPORT_LINK:
        return prefix + SUPPORT_LINK
    if handle:
        return prefix + handle
    return prefix + (handle or "@support")


@router.message(Command("support"))
async def cmd_support(message: Message, state):
    locale = await _locale_from_state(state)
    await safe_send_message(message, _support_text(locale), reply_markup=error_nav_markup())
