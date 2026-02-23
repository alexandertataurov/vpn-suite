"""Slash commands: /status, /devices, /configs, /install, /help, /support."""

from datetime import datetime

import structlog
from aiogram import Router
from aiogram.filters import Command
from aiogram.types import Message, InlineKeyboardButton, InlineKeyboardMarkup

from config import SUPPORT_LINK, SUPPORT_HANDLE
from api_client import get_user_by_tg, get_user_devices
from i18n import t
from utils.safe_send import safe_send_message

router = Router()
_log = structlog.get_logger(__name__)

# Navigation row: Back + Home (both to main menu)
def _nav_row():
    return [
        InlineKeyboardButton(text="⬅️ Back", callback_data="menu:main"),
        InlineKeyboardButton(text="🏠 Home", callback_data="menu:main"),
    ]


def _support_message(locale: str) -> str:
    if SUPPORT_LINK:
        return ("Support: " if locale == "en" else "Поддержка: ") + SUPPORT_LINK
    if SUPPORT_HANDLE:
        return ("Support: " if locale == "en" else "Поддержка: ") + SUPPORT_HANDLE.strip()
    base = "Support: @support" if locale == "en" else "Поддержка: @support"
    return base + ("\n(Set SUPPORT_LINK or SUPPORT_HANDLE in production.)" if locale == "en" else "\n(Задайте SUPPORT_LINK или SUPPORT_HANDLE в production.)")


async def _locale_from_state(state) -> str:
    data = await state.get_data()
    return data.get("locale", "en")


@router.message(Command("status"))
async def cmd_status(message: Message, state):
    locale = await _locale_from_state(state)
    if not message.from_user:
        return
    result = await get_user_by_tg(message.from_user.id)
    if not result.success:
        await message.answer(t(locale, "error_api"))
        return
    user_data = result.data
    if not user_data:
        await message.answer(t(locale, "no_subscription"))
        return
    subs = user_data.get("subscriptions") or []
    active = [s for s in subs if s.get("status") == "active" and s.get("valid_until")]
    if not active:
        await message.answer(t(locale, "no_subscription"))
        return
    lines = []
    for s in active:
        until = s.get("valid_until")
        if until:
            try:
                if isinstance(until, str) and "T" in until:
                    dt = datetime.fromisoformat(until.replace("Z", "+00:00"))
                    until_str = dt.strftime("%Y-%m-%d")
                else:
                    until_str = str(until)
            except Exception as e:
                _log.debug("parse_valid_until_failed", raw=str(until)[:64], error=str(e))
                until_str = str(until)
            lines.append(t(locale, "subscription_until", date=until_str))
        lines.append(t(locale, "devices_count", count=s.get("device_limit", 0)))
    dev_result = await get_user_devices(user_data["id"])
    if dev_result.success and dev_result.data is not None:
        lines.append("Devices: " + str(len(dev_result.data)) if locale == "en" else "Устройств: " + str(len(dev_result.data)))
    await message.answer("\n".join(lines) if lines else t(locale, "no_subscription"))


@router.message(Command("devices"))
async def cmd_devices(message: Message, state):
    locale = await _locale_from_state(state)
    if not message.from_user:
        return
    result = await get_user_by_tg(message.from_user.id)
    if not result.success:
        await message.answer(t(locale, "error_api"))
        return
    user_data = result.data
    if not user_data:
        await message.answer(t(locale, "no_subscription"))
        return
    dev_result = await get_user_devices(user_data["id"])
    if not dev_result.success:
        await message.answer(t(locale, "error_api"))
        return
    devices = dev_result.data or []
    active = [d for d in devices if not d.get("revoked_at")]
    if not active:
        await message.answer("No devices." if locale == "en" else "Нет устройств.")
        return
    buttons = [
        [InlineKeyboardButton(text=d.get("device_name") or d.get("id", "")[:8], callback_data=f"reset_{d.get('id', '')}")]
        for d in active[:10]
    ]
    buttons.append(_nav_row())
    await message.answer(
        "Select device to reset:" if locale == "en" else "Выберите устройство для сброса:",
        reply_markup=InlineKeyboardMarkup(inline_keyboard=buttons),
    )


@router.message(Command("configs"))
async def cmd_configs(message: Message, state):
    locale = await _locale_from_state(state)
    if not message.from_user:
        return
    await message.answer(t(locale, "configs_intro"))
    result = await get_user_by_tg(message.from_user.id)
    if not result.success:
        await message.answer(t(locale, "error_api"))
        return
    user_data = result.data
    if not user_data:
        await message.answer(t(locale, "no_subscription"))
        return
    dev_result = await get_user_devices(user_data["id"])
    if not dev_result.success:
        await message.answer(t(locale, "error_api"))
        return
    devices = dev_result.data or []
    active = [d for d in devices if not d.get("revoked_at")]
    if not active:
        await message.answer("No devices." if locale == "en" else "Нет устройств.")
        return
    buttons = [
        [InlineKeyboardButton(text=d.get("device_name") or d.get("id", "")[:8], callback_data=f"reset_{d.get('id', '')}")]
        for d in active[:10]
    ]
    buttons.append(_nav_row())
    await message.answer(
        "Select device to reset:" if locale == "en" else "Выберите устройство для сброса:",
        reply_markup=InlineKeyboardMarkup(inline_keyboard=buttons),
    )


@router.message(Command("install"))
async def cmd_install(message: Message, state):
    locale = await _locale_from_state(state)
    await safe_send_message(message, t(locale, "instruction_text"))


@router.message(Command("help"))
async def cmd_help(message: Message, state):
    locale = await _locale_from_state(state)
    await safe_send_message(message, t(locale, "help_text"))


@router.message(Command("support"))
async def cmd_support(message: Message, state):
    locale = await _locale_from_state(state)
    await safe_send_message(message, _support_message(locale))
