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
    download_text = "ℹ️ Config help" if locale == "en" else "ℹ️ Как получить конфиг"
    reissue_text = "♻️ Replace config" if locale == "en" else "♻️ Пересоздать конфиг"
    remove_text = "🗑 Remove" if locale == "en" else "🗑 Удалить"
    buttons = []
    for d in devices[:10]:
        dev_id = d.get("id", "")
        buttons.append([
            InlineKeyboardButton(text=download_text, callback_data=f"config_download:{dev_id}"),
            InlineKeyboardButton(text=reissue_text, callback_data=f"device_reissue:{dev_id}"),
            InlineKeyboardButton(text=remove_text, callback_data=f"device_remove:{dev_id}"),
        ])
    buttons.append(nav_row_buttons(back_callback="menu:main"))
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
            await message.answer("No devices yet. Add one from the menu." if locale == "en" else "Пока нет устройств. Добавьте в меню.", reply_markup=error_nav_markup())
            return
        await message.answer(get_error_message(dev_result.error or "error_api", locale), reply_markup=error_nav_markup())
        return
    devices = dev_result.data or []
    active = [d for d in devices if not d.get("revoked_at")]
    if not active:
        await message.answer("No devices yet. Add one from the menu." if locale == "en" else "Пока нет устройств. Добавьте в меню.", reply_markup=error_nav_markup())
        return
    text = ("Your devices:" if locale == "en" else "Ваши устройства:") + "\n\n" + _devices_list_message(active, locale)
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
            await message.answer("No devices yet. Add one from the menu." if locale == "en" else "Пока нет устройств. Добавьте в меню.", reply_markup=error_nav_markup())
            return
        await message.answer(get_error_message(dev_result.error or "error_api", locale), reply_markup=error_nav_markup())
        return
    devices = dev_result.data or []
    active = [d for d in devices if not d.get("revoked_at")]
    if not active:
        await message.answer("No devices yet. Add one from the menu." if locale == "en" else "Пока нет устройств. Добавьте в меню.", reply_markup=error_nav_markup())
        return
    text = ("Select device:" if locale == "en" else "Выберите устройство:") + "\n\n" + _devices_list_message(active, locale)
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
            await callback.message.answer("No devices yet. Add one from the menu." if locale == "en" else "Пока нет устройств. Добавьте в меню.", reply_markup=error_nav_markup())
            return
        await callback.message.answer(get_error_message(dev_result.error or "error_api", locale), reply_markup=error_nav_markup())
        return
    devices = dev_result.data or []
    active = [d for d in devices if not d.get("revoked_at")]
    if not active:
        await callback.message.answer("No devices yet. Add one from the menu." if locale == "en" else "Пока нет устройств. Добавьте в меню.", reply_markup=error_nav_markup())
        return
    text = ("Your devices:" if locale == "en" else "Ваши устройства:") + "\n\n" + _devices_list_message(active, locale)
    await callback.message.answer(text, reply_markup=_device_list_keyboard(active, locale))


@router.callback_query(F.data.startswith("config_download:") | F.data.startswith("device_config:"))
async def on_device_config(callback: CallbackQuery, state):
    """Show config guidance — config is issued on add device; no API to re-fetch by device."""
    locale = await _locale_from_state(state)
    await callback.answer()
    from utils.safe_send import safe_send_message
    hint = (
        "Config is shown when you add a device. To get a new one, use main menu -> Add device."
        if locale == "en"
        else "Конфиг показывается при добавлении устройства. Для нового: меню -> Добавить устройство."
    )
    await safe_send_message(callback.message, t(locale, "instruction_text"))
    await callback.message.answer(hint)


@router.callback_query(F.data.startswith("device_reissue:"))
async def on_device_reissue(callback: CallbackQuery, state):
    await callback.answer()
    locale = await _locale_from_state(state)
    hint = (
        "Config is issued once. Replace flow: Remove this device, then Add device again."
        if locale == "en"
        else "Конфиг выдаётся один раз. Переиздать: удалите устройство, затем снова Добавить устройство."
    )
    await callback.message.answer(hint)


@router.callback_query(F.data.startswith("device_remove:"))
@router.callback_query(F.data.startswith("reset_"))
@router.callback_query(F.data.startswith("device_reset:"))
async def on_reset_device(callback: CallbackQuery, state):
    device_id = (
        callback.data.replace("device_remove:", "")
        .replace("device_reset:", "")
        .replace("reset_", "", 1)
    )
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
                    [InlineKeyboardButton(text="🔄 Refresh list" if locale == "en" else "🔄 Обновить", callback_data="menu:devices")],
                    nav_row_buttons(back_callback="menu:main"),
                ]),
            )
        else:
            await callback.message.answer(get_error_message(result.error or "error_api", locale), reply_markup=error_nav_markup())
        return
    await callback.answer("Done" if locale == "en" else "Готово")
    await callback.message.answer(get_success_message("device_removed", locale))


# menu:main is handled in start.py
