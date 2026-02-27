"""Handler for /status - subscription and device status from API."""

import structlog
from aiogram import Router
from aiogram.filters import Command
from aiogram.types import Message

from api_client import get_user_by_tg, get_user_devices
from i18n import t
from keyboards.common import connect_nav_markup, error_nav_markup
from utils.messages import get_error_message
from utils.formatting import format_subscription_status, is_subscription_effectively_active

router = Router()
_log = structlog.get_logger(__name__)


async def _locale_from_state(state) -> str:
    data = await state.get_data()
    return data.get("locale", "en")


@router.message(Command("status"))
async def cmd_status(message: Message, state, tg_id: int | None = None):
    locale = await _locale_from_state(state)
    uid = tg_id or (message.from_user.id if message.from_user else None)
    if not uid:
        return
    result = await get_user_by_tg(uid)
    if not result.success:
        await message.answer(get_error_message(result.error or "error_api", locale), reply_markup=error_nav_markup())
        return
    user_data = result.data
    if not user_data:
        await message.answer(t(locale, "no_subscription"), reply_markup=error_nav_markup())
        return
    subs = user_data.get("subscriptions") or []
    if not subs:
        await message.answer(t(locale, "no_subscription"), reply_markup=connect_nav_markup(locale))
        return
    active = [s for s in subs if is_subscription_effectively_active(s)]
    if not active:
        dev_result = await get_user_devices(int(user_data["id"]))
        devices_used = len(dev_result.data) if dev_result.success and dev_result.data else 0
        # Show the latest subscription status so user sees "expired/pending/paused" instead of "no subscription".
        latest = sorted(subs, key=lambda s: str(s.get("valid_until") or ""), reverse=True)[0]
        await message.answer(
            format_subscription_status(latest, locale, devices_used=devices_used),
            reply_markup=connect_nav_markup(locale),
        )
        return

    dev_result = await get_user_devices(int(user_data["id"]))
    devices_used = len(dev_result.data) if dev_result.success and dev_result.data else 0
    blocks = []
    for s in active:
        blocks.append(format_subscription_status(s, locale, devices_used=devices_used))
    await message.answer("\n\n".join(blocks), reply_markup=error_nav_markup())
