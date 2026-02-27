"""Handlers for /devices and /configs — device list with Download / Reissue / Remove."""

import structlog
from aiogram import Router, F
from aiogram.filters import Command
from aiogram.types import Message, CallbackQuery, InlineKeyboardButton, InlineKeyboardMarkup

from api_client import get_user_by_tg, get_user_devices, reset_device
from i18n import t
from keyboards.common import nav_row_buttons, error_nav_markup, connect_nav_markup
from utils.messages import get_error_message, get_success_message
from utils.formatting import format_device_info

router = Router()
_log = structlog.get_logger(__name__)

ERROR_DEVICE_NOT_FOUND = "error_device_not_found"


async def _locale_from_state(state) -> str:
    data = await state.get_data()
    return data.get("locale", "en")


def _device_block(d: dict, locale: str) -> str:
    return format_device_info(d, locale)


def _devices_list_message(devices: list, locale: str) -> str:
    blocks = [_device_block(d, locale) for d in devices]
    return "\n\n".join(blocks)


def _device_list_keyboard(devices: list, locale: str):
    download_text = "📎 " + t(locale, "btn_config")
    reissue_text = "🔁 " + t(locale, "btn_reissue")
    remove_text = "🗑 " + t(locale, "btn_remove")
    buttons = []
    for d in devices[:10]:
        dev_id = str(d.get("id", ""))
        # Spec: dev:<id>:<action> (≤64 bytes; id can be UUID)
        buttons.append([
            InlineKeyboardButton(text=download_text, callback_data=f"dev:{dev_id}:config"),
            InlineKeyboardButton(text=reissue_text, callback_data=f"dev:{dev_id}:reissue"),
            InlineKeyboardButton(text=remove_text, callback_data=f"dev:{dev_id}:remove"),
        ])
    buttons.append(nav_row_buttons(back_callback="nav:home"))
    return InlineKeyboardMarkup(inline_keyboard=buttons)


async def show_devices_list(message: Message, state):
    """Show device list (used by /devices and by menu 'Devices' button)."""
    locale = await _locale_from_state(state)
    if not message.from_user:
        return
    result = await get_user_by_tg(message.from_user.id)
    if not result.success:
        await message.answer(get_error_message(result.error or "error_api", locale), reply_markup=error_nav_markup())
        return
    user_data = result.data
    if not user_data:
        await message.answer(t(locale, "no_subscription"), reply_markup=connect_nav_markup(locale))
        return
    user_id = int(user_data["id"])
    dev_result = await get_user_devices(user_id)
    if not dev_result.success:
        if dev_result.error == ERROR_DEVICE_NOT_FOUND:
            await message.answer(t(locale, "no_devices_yet"), reply_markup=error_nav_markup())
            return
        await message.answer(get_error_message(dev_result.error or "error_api", locale), reply_markup=error_nav_markup())
        return
    devices = dev_result.data or []
    active = [d for d in devices if not d.get("revoked_at")]
    if not active:
        await message.answer(t(locale, "no_devices_yet"), reply_markup=error_nav_markup())
        return
    text = t(locale, "your_devices") + "\n\n" + _devices_list_message(active, locale)
    await message.answer(text, reply_markup=_device_list_keyboard(active, locale))


@router.message(Command("devices"))
async def cmd_devices(message: Message, state):
    await show_devices_list(message, state)


@router.message(Command("configs"))
async def cmd_configs(message: Message, state):
    locale = await _locale_from_state(state)
    if not message.from_user:
        return
    await message.answer(t(locale, "configs_intro"))
    result = await get_user_by_tg(message.from_user.id)
    if not result.success:
        await message.answer(get_error_message(result.error or "error_api", locale), reply_markup=error_nav_markup())
        return
    user_data = result.data
    if not user_data:
        await message.answer(t(locale, "no_subscription"), reply_markup=connect_nav_markup(locale))
        return
    dev_result = await get_user_devices(int(user_data["id"]))
    if not dev_result.success:
        if dev_result.error == ERROR_DEVICE_NOT_FOUND:
            await message.answer(t(locale, "no_devices_yet"), reply_markup=error_nav_markup())
            return
        await message.answer(get_error_message(dev_result.error or "error_api", locale), reply_markup=error_nav_markup())
        return
    devices = dev_result.data or []
    active = [d for d in devices if not d.get("revoked_at")]
    if not active:
        await message.answer(t(locale, "no_devices_yet"), reply_markup=error_nav_markup())
        return
    text = t(locale, "select_device") + "\n\n" + _devices_list_message(active, locale)
    await message.answer(text, reply_markup=_device_list_keyboard(active, locale))


@router.callback_query(F.data == "menu:devices")
async def on_menu_devices(callback: CallbackQuery, state):
    """Show device list (e.g. from Back to Devices in reset flow)."""
    await callback.answer()
    if not callback.from_user:
        return
    locale = await _locale_from_state(state)
    result = await get_user_by_tg(callback.from_user.id)
    if not result.success:
        await callback.message.answer(get_error_message(result.error or "error_api", locale), reply_markup=error_nav_markup())
        return
    user_data = result.data
    if not user_data:
        await callback.message.answer(t(locale, "no_subscription"), reply_markup=connect_nav_markup(locale))
        return
    dev_result = await get_user_devices(int(user_data["id"]))
    if not dev_result.success:
        if dev_result.error == ERROR_DEVICE_NOT_FOUND:
            await callback.message.answer(t(locale, "no_devices_yet"), reply_markup=error_nav_markup())
            return
        await callback.message.answer(get_error_message(dev_result.error or "error_api", locale), reply_markup=error_nav_markup())
        return
    devices = dev_result.data or []
    active = [d for d in devices if not d.get("revoked_at")]
    if not active:
        await callback.message.answer(t(locale, "no_devices_yet"), reply_markup=error_nav_markup())
        return
    text = t(locale, "your_devices") + "\n\n" + _devices_list_message(active, locale)
    await callback.message.answer(text, reply_markup=_device_list_keyboard(active, locale))


def _device_id_from_callback(data: str) -> str | None:
    """Extract device id from config_download:id, device_reissue:id, device_remove:id, or dev:id:action."""
    if data.startswith("dev:"):
        parts = data.split(":", 2)
        return parts[1] if len(parts) >= 2 else None
    for prefix in ("config_download:", "device_reissue:", "device_remove:", "device_reset:"):
        if data.startswith(prefix):
            return data[len(prefix):].strip() or None
    if data.startswith("reset_"):
        return data[6:].strip() or None
    return None


@router.callback_query(F.data.startswith("dev:"))
async def on_dev_callback(callback: CallbackQuery, state):
    """Handle dev:id:config, dev:id:reissue, dev:id:remove."""
    data = callback.data or ""
    parts = data.split(":", 2)
    if len(parts) < 3:
        await callback.answer()
        return
    _prefix, dev_id, action = parts[0], parts[1], parts[2]
    if action == "config":
        await on_device_config_impl(callback, state, dev_id)
    elif action == "reissue":
        await on_device_reissue_impl(callback, state, dev_id)
    elif action == "remove":
        await on_reset_device_impl(callback, state, dev_id)
    else:
        await callback.answer()


async def on_device_config_impl(callback: CallbackQuery, state, _dev_id: str):
    locale = await _locale_from_state(state)
    await callback.answer()
    from utils.safe_send import safe_send_message
    await safe_send_message(callback.message, t(locale, "instruction_text"))
    await callback.message.answer(t(locale, "config_hint_add"), reply_markup=error_nav_markup())


async def on_device_reissue_impl(callback: CallbackQuery, state, _dev_id: str):
    await callback.answer()
    locale = await _locale_from_state(state)
    await callback.message.answer(t(locale, "config_hint_reissue"), reply_markup=error_nav_markup())


@router.callback_query(F.data.startswith("config_download:") | F.data.startswith("device_config:"))
async def on_device_config(callback: CallbackQuery, state):
    dev_id = _device_id_from_callback(callback.data or "")
    await on_device_config_impl(callback, state, dev_id or "")


@router.callback_query(F.data.startswith("device_reissue:"))
async def on_device_reissue(callback: CallbackQuery, state):
    dev_id = _device_id_from_callback(callback.data or "")
    await on_device_reissue_impl(callback, state, dev_id or "")


async def on_reset_device_impl(callback: CallbackQuery, state, device_id: str):
    if not device_id:
        await callback.answer()
        return
    locale = (await state.get_data()).get("locale", "en")
    result = await reset_device(device_id)
    if not result.success:
        await callback.answer(get_error_message(result.error or "error_api", locale), show_alert=True)
        if result.error == ERROR_DEVICE_NOT_FOUND:
            await callback.message.answer(
                get_error_message(ERROR_DEVICE_NOT_FOUND, locale),
                reply_markup=InlineKeyboardMarkup(inline_keyboard=[
                    [InlineKeyboardButton(text="🔄 " + t(locale, "btn_refresh_list"), callback_data="menu:devices")],
                    nav_row_buttons(back_callback="nav:home"),
                ]),
            )
        else:
            await callback.message.answer(get_error_message(result.error or "error_api", locale), reply_markup=error_nav_markup())
        return
    await callback.answer(t(locale, "done_btn"))
    await callback.message.answer(get_success_message("device_removed", locale), reply_markup=error_nav_markup())


@router.callback_query(F.data.startswith("device_remove:"))
@router.callback_query(F.data.startswith("reset_"))
@router.callback_query(F.data.startswith("device_reset:"))
async def on_reset_device(callback: CallbackQuery, state):
    device_id = _device_id_from_callback(callback.data or "")
    await on_reset_device_impl(callback, state, device_id)


# menu:main handled in start.py; menu:devices shows device list (handled above)
