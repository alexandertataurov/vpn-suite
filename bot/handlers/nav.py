"""Inline menu navigation: nav:* callbacks edit a single menu message."""

import time
from typing import Optional

import structlog
from aiogram import F, Router
from aiogram.fsm.context import FSMContext
from aiogram.types import CallbackQuery

from i18n import t
from menus.registry import MENUS
from menus.render import render_menu

router = Router()
_log = structlog.get_logger(__name__)


async def _locale_from_state(state: FSMContext) -> str:
    data = await state.get_data()
    return data.get("locale", "en")


async def _post_menu_events(
    cb_data: str,
    menu_id: str,
    latency_ms: float,
    user_id: Optional[int],
) -> None:
    if not user_id:
        return
    try:
        from api_client import post_event

        payload_base = {
            "menu_id": menu_id,
            "cb": cb_data,
            "latency_ms": int(latency_ms),
        }
        await post_event("menu_open", user_id, {"menu_id": menu_id})
        await post_event("menu_click", user_id, payload_base)
    except Exception as e:  # pragma: no cover - telemetry must not break UX
        _log.debug("menu_telemetry_failed", error=str(e))


def _pay_methods_content(locale: str, plan_slug: str):
    """Dynamic pay methods menu for nav:pay_methods:<plan_slug>."""
    from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup
    title = t(locale, "pay_title")
    body = t(locale, "pay_choose_method")
    text = f"<b>{title}</b>\n\n{body}"
    markup = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="⭐ Telegram Stars", callback_data=f"pay:stars:{plan_slug}")],
        [InlineKeyboardButton(text="⬅️ " + t(locale, "back"), callback_data="nav:subs")],
    ])
    return text, markup


@router.callback_query(F.data.startswith("nav:"))
async def on_nav(callback: CallbackQuery, state: FSMContext):
    started = time.monotonic()
    await callback.answer()
    raw = callback.data or ""
    parts = raw.split(":", 2)
    menu_id = parts[1] if len(parts) >= 2 and parts[1] else "home"
    locale = await _locale_from_state(state)
    if menu_id == "subs":
        from api_client import get_user_by_tg
        from handlers.tariffs import show_cabinet
        from utils.formatting import is_subscription_effectively_active

        user = callback.from_user
        if user:
            result = await get_user_by_tg(user.id)
            if result.success and result.data:
                subs = result.data.get("subscriptions") or []
                active = [s for s in subs if is_subscription_effectively_active(s)]
                if active:
                    msg = callback.message
                    if msg is not None:
                        await show_cabinet(msg, locale, state)
                    latency_ms = (time.monotonic() - started) * 1000.0
                    await _post_menu_events(raw, menu_id, latency_ms, user.id)
                    return
    if menu_id == "buy_plan":
        from handlers.tariffs import show_tariffs

        msg = callback.message
        if msg is not None:
            await show_tariffs(msg, locale)
        latency_ms = (time.monotonic() - started) * 1000.0
        user = callback.from_user
        await _post_menu_events(raw, menu_id, latency_ms, user.id if user else None)
        return
    if menu_id == "pay_methods" and len(parts) >= 3 and parts[2]:
        plan_slug = parts[2]
        text, markup = _pay_methods_content(locale, plan_slug)
    elif menu_id not in MENUS:
        _log.debug("unknown_menu_id", menu_id=menu_id, cb_data=raw)
        menu_id = "home"
        text, markup = render_menu(menu_id, locale)
    else:
        text, markup = render_menu(menu_id, locale)
    msg = callback.message
    if msg is None:
        return
    try:
        await msg.edit_text(text, reply_markup=markup)
    except Exception as e:
        _log.debug("menu_edit_failed", error=str(e))
        await msg.answer(text, reply_markup=markup)
    latency_ms = (time.monotonic() - started) * 1000.0
    user = callback.from_user
    await _post_menu_events(raw, menu_id, latency_ms, user.id if user else None)

