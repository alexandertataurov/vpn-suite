"""Trial: Start Free Trial, connected message, Keep tunnel active."""

import random
import structlog
from aiogram import F, Router
from aiogram.types import CallbackQuery, Message
from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup

from api_client import start_trial, post_event
from i18n import t
from metrics import record_trial_activation
from keyboards.revenue import trial_keep_active_keyboard
from utils.messages import get_error_message
from menus.render import render_menu

router = Router()
_log = structlog.get_logger(__name__)


def _simulated_speed_mbps() -> int:
    """Simulated speed for trial connected message (e.g. 85–98 Mbps)."""
    return random.randint(85, 98)


@router.callback_query(F.data == "revenue:start_trial")
async def on_start_trial(callback: CallbackQuery, state):
    """Start 24h trial: call API, send config + connected message + Keep tunnel active."""
    await callback.answer()
    user = callback.from_user
    if not user:
        return
    data = await state.get_data()
    locale = data.get("locale", "en")
    loading = t(locale, "loading_moment")
    try:
        await callback.message.edit_text(loading)
    except Exception:
        await callback.message.answer(loading)
    result = await start_trial(user.id)
    if result.success:
        record_trial_activation()
    if not result.success:
        err_key = result.error or "error_api"
        if "trial_already_used" in (result.error or "").lower() or "TRIAL_ALREADY_USED" in (result.error or ""):
            err_key = "error_subscription_expired"
        from keyboards.common import error_nav_markup
        await callback.message.answer(
            get_error_message(err_key, locale),
            reply_markup=error_nav_markup(),
        )
        return
    d = result.data or {}
    server_name = d.get("server_name") or d.get("server_region") or "Germany"
    server_region = d.get("server_region") or "DE"
    speed = _simulated_speed_mbps()
    connected_text = t(locale, "trial_connected").format(server=server_name, speed=speed)
    trial_ends_text = t(locale, "trial_ends_in")
    await callback.message.answer(connected_text)
    await callback.message.answer(
        trial_ends_text,
        reply_markup=trial_keep_active_keyboard(locale),
    )
    config_awg = d.get("config_awg")
    config_wg_obf = d.get("config_wg_obf")
    config_wg = d.get("config_wg")
    if config_awg:
        await callback.message.answer(f"<pre>{config_awg}</pre>")
    if config_wg_obf and config_wg_obf != config_awg:
        await callback.message.answer(f"<pre>{config_wg_obf}</pre>")
    if config_wg and config_wg not in (config_awg, config_wg_obf):
        await callback.message.answer(f"<pre>{config_wg}</pre>")
    home_text, home_markup = render_menu("home", locale)
    await callback.message.answer("—", reply_markup=home_markup)
    await post_event("trial_started", user.id, {"subscription_id": d.get("subscription_id")})


@router.callback_query(F.data == "revenue:keep_tunnel")
async def on_keep_tunnel(callback: CallbackQuery, state):
    """Keep tunnel active -> show plans (View Plans)."""
    await callback.answer()
    data = await state.get_data()
    locale = data.get("locale", "en")
    from handlers.tariffs import show_tariffs
    await show_tariffs(callback.message, locale)


@router.callback_query(F.data == "revenue:view_plans")
async def on_view_plans(callback: CallbackQuery, state):
    await callback.answer()
    data = await state.get_data()
    locale = data.get("locale", "en")
    from handlers.tariffs import show_tariffs
    await show_tariffs(callback.message, locale)


@router.callback_query(F.data == "revenue:see_servers")
async def on_see_servers(callback: CallbackQuery, state):
    await callback.answer()
    data = await state.get_data()
    locale = data.get("locale", "en")
    from api_client import get_servers
    from keyboards.common import error_nav_markup, nav_row_buttons
    r = await get_servers(limit=20, is_active=True)
    if not r.success or not r.data:
        await callback.message.answer(t(locale, "no_servers"), reply_markup=error_nav_markup())
        return
    lines = []
    for s in (r.data or [])[:15]:
        name = s.get("name") or s.get("id", "")[:8]
        region = s.get("region", "")
        lines.append(f"• {name} — {region}")
    text = t(locale, "servers_list") + ("\n" + "\n".join(lines) if lines else "—")
    await callback.message.answer(
        text,
        reply_markup=InlineKeyboardMarkup(inline_keyboard=[nav_row_buttons(back_callback="nav:home")]),
    )


@router.callback_query(F.data == "revenue:resume")
@router.callback_query(F.data == "revenue:upgrade")
async def on_resume_or_upgrade(callback: CallbackQuery, state):
    """Resume or Upgrade -> show plans."""
    await callback.answer()
    data = await state.get_data()
    locale = data.get("locale", "en")
    from handlers.tariffs import show_tariffs
    await show_tariffs(callback.message, locale)
