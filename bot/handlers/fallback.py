"""Fallback for unknown/expired callbacks — show home menu."""

import structlog
from aiogram import Router
from aiogram.types import CallbackQuery

from menus.render import render_menu

router = Router()
_log = structlog.get_logger(__name__)

# Include this router LAST so it only runs when no other handler matched.


@router.callback_query()
async def on_unknown_callback(callback: CallbackQuery, state):
    """Unknown or expired callback — return to home."""
    await callback.answer()
    data = await state.get_data()
    locale = data.get("locale", "en")
    _log.debug("unknown_callback", cb_data=(callback.data or "")[:64])
    text, markup = render_menu("home", locale)
    msg = callback.message
    if msg:
        try:
            await msg.edit_text(text, reply_markup=markup)
        except Exception:
            await msg.answer(text, reply_markup=markup)
