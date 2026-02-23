"""Tariffs from API, plan selection, invoice, add device."""

import asyncio
import uuid
import structlog
from aiogram import Router, F
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.types import Message, CallbackQuery, LabeledPrice, InlineKeyboardButton, InlineKeyboardMarkup

from config import BOT_USERNAME, SUPPORT_LINK, SUPPORT_HANDLE, INSTALL_GUIDE_URL
from keyboards.common import nav_row_buttons
from api_client import (
    get_plans,
    create_or_get_subscription,
    create_invoice,
    issue_device,
    get_user_by_tg,
    get_user_devices,
    get_servers,
    post_event,
    get_referral_my_link,
    get_referral_stats,
    promo_validate,
)
from i18n import t
from utils.safe_send import safe_send_message
from utils.messages import get_error_message, get_success_message
from utils.formatting import format_subscription_status, is_subscription_effectively_active

router = Router()
_log = structlog.get_logger(__name__)

# Device type labels and default names
DEVICE_TYPES = [
    ("ios", "🍎 iOS", "iOS Device"),
    ("android", "🤖 Android", "Android Device"),
    ("windows", "🪟 Windows", "Windows Device"),
    ("macos", "🍎 macOS", "macOS Device"),
    ("linux", "🐧 Linux", "Linux Device"),
]


class AddDeviceStates(StatesGroup):
    waiting_device_type = State()
    waiting_device_name = State()
    waiting_server_select = State()


def _support_message(locale: str) -> str:
    if SUPPORT_LINK:
        return ("Support: " if locale == "en" else "Поддержка: ") + SUPPORT_LINK
    handle = SUPPORT_HANDLE.strip()
    if not handle.startswith("@"):
        handle = "@" + handle
    return ("Support: " if locale == "en" else "Поддержка: ") + handle


def _referral_link(payload: str) -> str:
    if not payload:
        return ""
    if not BOT_USERNAME:
        return payload
    return f"https://t.me/{BOT_USERNAME}?start={payload}"


def _menu_texts(locale: str) -> dict[str, set[str]]:
    """Build set of acceptable texts per menu action (i18n + fallbacks)."""
    return {
        "tariffs": {t(locale, "tariffs"), t(locale, "plans"), "Tariffs", "Plans", "Тарифы", "Планы"},
        "profile": {t(locale, "my_cabinet"), t(locale, "profile"), "My cabinet", "Profile", "Мой кабинет", "Профиль"},
        "support": {t(locale, "support"), "Support", "Поддержка"},
        "connect": {t(locale, "connect_cta"), "Connect", "Подключить"},
        "add_device": {t(locale, "add_device"), "Add device", "Добавить устройство"},
        "reset_device": {t(locale, "reset_device"), "Reset device", "Сброс устройства"},
        "instruction": {t(locale, "instruction"), "Instruction", "Инструкция"},
        "invite_friend": {t(locale, "invite_friend"), "Invite friend", "Пригласить друга"},
        "promo_code": {t(locale, "promo_code"), "Promo code", "Промокод"},
    }


async def _wait_for_active_subscription(
    tg_id: int, *, attempts: int = 4, delay_seconds: float = 1.0
) -> bool:
    """Best-effort backend confirmation after Telegram successful_payment event."""
    for attempt in range(attempts):
        result = await get_user_by_tg(tg_id)
        if result.success and result.data:
            for sub in result.data.get("subscriptions") or []:
                if is_subscription_effectively_active(sub):
                    return True
        if attempt < attempts - 1:
            await asyncio.sleep(delay_seconds)
    return False


@router.message(F.text)
async def message_handler(message: Message, state):
    data = await state.get_data()
    locale = data.get("locale", "en")
    text = (message.text or "").strip()
    if data.get("waiting_promo_code") and message.from_user and text:
        await state.update_data(waiting_promo_code=False)
        plans_result = await get_plans()
        plans_list = (plans_result.data or []) if plans_result.success else []
        plan_id = data.get("last_selected_plan_id") or (plans_list[0]["id"] if plans_list else "")
        if plan_id:
            promo_result = await promo_validate(code=text, plan_id=plan_id, tg_id=message.from_user.id)
            if not promo_result.success:
                _log.warning("user_action", telegram_id=message.from_user.id, action="promo_validate_failed", error=promo_result.error)
                err = "Invalid or expired code." if locale == "en" else "Неверный или истёкший промокод."
                await message.answer(err)
            else:
                await state.update_data(promo_code=text.strip())
                await message.answer("OK" if locale == "en" else "Промокод принят. Выберите тариф для оплаты.")
        else:
            await message.answer(get_error_message("error_api", locale))
        return
    texts = _menu_texts(locale)
    if text in texts["tariffs"] or text in texts["connect"]:
        await show_tariffs(message, locale)
        return
    if text in texts["profile"]:
        await show_cabinet(message, locale, state)
        return
    if text in texts["support"]:
        await message.answer(_support_message(locale))
        return
    if text in texts["add_device"]:
        await add_device_flow(message, locale, state)
        return
    if text in texts["reset_device"]:
        await reset_device_flow(message, locale, state)
        return
    if text in texts["instruction"]:
        await message.answer(t(locale, "instruction_text"))
        return
    if text in texts["invite_friend"]:
        await invite_friend_flow(message, locale)
        return
    if text in texts["promo_code"]:
        await state.update_data(waiting_promo_code=True)
        await message.answer(t(locale, "promo_placeholder") + "\n(Send code to validate)")
        return


async def show_tariffs(message: Message, locale: str):
    if message.from_user:
        await post_event("view_tariff", message.from_user.id, {})
    plans_result = await get_plans()
    if not plans_result.success:
        await message.answer(get_error_message(plans_result.error or "error_api", locale))
        return
    plans = plans_result.data or []
    if not plans:
        await message.answer("No plans available." if locale == "en" else "Тарифы пока недоступны.")
        return
    from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton

    buttons = [
        [InlineKeyboardButton(text=f"{p.get('name', 'Plan')} — {p.get('price_amount', 0)} {p.get('price_currency', 'XTR')}", callback_data=f"plan:{p.get('id', '')}")]
        for p in plans
    ]
    buttons.append(nav_row_buttons(back_callback="menu:main"))
    await message.answer(
        t(locale, "select_plan"),
        reply_markup=InlineKeyboardMarkup(inline_keyboard=buttons),
    )


@router.callback_query(F.data.startswith("plan:"))
async def on_plan_selected(callback: CallbackQuery, state):
    plan_id = callback.data.replace("plan:", "", 1)
    if not plan_id:
        await callback.answer("Invalid plan", show_alert=True)
        return
    user = callback.from_user
    if not user:
        await callback.answer()
        return
    data = await state.get_data()
    locale = data.get("locale", "en")
    promo_code = data.get("promo_code")
    await state.update_data(last_selected_plan_id=plan_id)
    cog_result = await create_or_get_subscription(user.id, plan_id)
    if not cog_result.success:
        await callback.answer(get_error_message(cog_result.error or "error_api", locale), show_alert=True)
        return
    cog = cog_result.data or {}
    sub_id = cog.get("subscription_id") or (cog.get("subscription") or {}).get("id")
    inv_result = await create_invoice(
        tg_id=user.id,
        plan_id=plan_id,
        subscription_id=sub_id,
        idempotency_key=f"tg_{user.id}_{plan_id}_{uuid.uuid4().hex[:12]}",
        promo_code=promo_code,
    )
    if not inv_result.success:
        await callback.answer(get_error_message(inv_result.error or "error_api", locale), show_alert=True)
        return
    inv = inv_result.data or {}
    if promo_code:
        await state.update_data(promo_code=None)
    title = inv.get("title", "VPN")
    description = inv.get("description", "VPN plan")
    payload = inv.get("payload", inv.get("payment_id", ""))
    star_count = max(1, int(inv.get("star_count", 1)))
    try:
        await callback.message.answer_invoice(
            title=title,
            description=description,
            payload=payload,
            provider_token="",  # Telegram Stars
            currency="XTR",
            prices=[LabeledPrice(label=title, amount=star_count)],
        )
    except Exception as e:
        _log.warning("api_error", action="answer_invoice", error=str(e))
        await callback.message.answer(get_error_message("error_api", locale))
    await callback.answer()


@router.message(F.successful_payment)
async def on_successful_payment(message: Message, state):
    data = await state.get_data()
    locale = data.get("locale", "en")
    user = message.from_user
    if not user:
        await message.answer(get_success_message("payment_pending_activation", locale))
        return
    is_confirmed = await _wait_for_active_subscription(user.id)
    if is_confirmed:
        await message.answer(get_success_message("payment_success", locale))
    else:
        await message.answer(get_success_message("payment_pending_activation", locale))


async def add_device_flow(message: Message, locale: str, state: FSMContext):
    user = message.from_user
    if not user:
        await message.answer(get_error_message("error_api", locale))
        return
    result = await get_user_by_tg(user.id)
    if not result.success:
        await message.answer(get_error_message(result.error or "error_api", locale))
        return
    user_data = result.data
    if not user_data:
        await message.answer(t(locale, "no_subscription"))
        return
    subs = [s for s in (user_data.get("subscriptions") or []) if is_subscription_effectively_active(s)]
    if not subs:
        await message.answer(t(locale, "no_subscription"))
        return
    sub = subs[0]
    sub_id = sub.get("id")
    servers_result = await get_servers(limit=10, is_active=True)
    servers = servers_result.data if servers_result.success else []
    if not servers:
        await message.answer("No server available." if locale == "en" else "Нет доступного сервера.")
        return
    await state.update_data(
        add_device_sub_id=sub_id,
        add_device_user_id=user_data["id"],
        add_device_servers=servers[:10],
    )
    # Step 1: Choose device type
    buttons = [
        [InlineKeyboardButton(text=label, callback_data=f"device_type:{key}")]
        for key, label, _ in DEVICE_TYPES
    ]
    buttons.append(nav_row_buttons(back_callback="menu:main"))
    await message.answer(
        "Choose device type:" if locale == "en" else "Выберите тип устройства:",
        reply_markup=InlineKeyboardMarkup(inline_keyboard=buttons),
    )


@router.callback_query(F.data.startswith("device_type:"))
async def on_device_type_selected(callback: CallbackQuery, state: FSMContext):
    device_type = callback.data.replace("device_type:", "", 1)
    if not device_type:
        await callback.answer()
        return
    locale = (await state.get_data()).get("locale", "en")
    default_name = next((d[2] for d in DEVICE_TYPES if d[0] == device_type), "Device")
    await state.update_data(add_device_type=device_type, add_device_default_name=default_name)
    await callback.answer()
    # Step 2: Name (skip or custom)
    buttons = [
        [InlineKeyboardButton(text="Skip — use default" if locale == "en" else "Пропустить — по умолчанию", callback_data="add_device_skip_name")],
        [InlineKeyboardButton(text="Enter custom name" if locale == "en" else "Ввести своё имя", callback_data="add_device_custom_name")],
    ]
    buttons.append(nav_row_buttons(back_callback="add_device_back_to_type"))
    await callback.message.answer(
        "Name your device?" if locale == "en" else "Назвать устройство?",
        reply_markup=InlineKeyboardMarkup(inline_keyboard=buttons),
    )


@router.callback_query(F.data == "add_device_skip_name")
async def on_add_device_skip_name(callback: CallbackQuery, state: FSMContext):
    await callback.answer()
    data = await state.get_data()
    default_name = data.get("add_device_default_name", "Device")
    await state.update_data(add_device_name=default_name)
    tg_id = callback.from_user.id if callback.from_user else 0
    await _add_device_server_step(callback.message, state, tg_id)


@router.callback_query(F.data == "add_device_custom_name")
async def on_add_device_custom_name(callback: CallbackQuery, state: FSMContext):
    await callback.answer()
    await state.set_state(AddDeviceStates.waiting_device_name)
    locale = (await state.get_data()).get("locale", "en")
    await callback.message.answer(
        "Send the device name (e.g. iPhone 14):" if locale == "en" else "Отправьте имя устройства (например iPhone 14):",
        reply_markup=InlineKeyboardMarkup(inline_keyboard=[nav_row_buttons(back_callback="add_device_back_to_type")]),
    )


@router.callback_query(F.data == "add_device_back_to_type")
async def on_add_device_back_to_type(callback: CallbackQuery, state: FSMContext):
    await callback.answer()
    await state.set_state(None)
    data = await state.get_data()
    locale = data.get("locale", "en")
    buttons = [
        [InlineKeyboardButton(text=label, callback_data=f"device_type:{key}")]
        for key, label, _ in DEVICE_TYPES
    ]
    buttons.append(nav_row_buttons(back_callback="menu:main"))
    await callback.message.answer(
        "Choose device type:" if locale == "en" else "Выберите тип устройства:",
        reply_markup=InlineKeyboardMarkup(inline_keyboard=buttons),
    )


@router.message(AddDeviceStates.waiting_device_name, F.text)
async def on_add_device_name_entered(message: Message, state: FSMContext):
    name = (message.text or "").strip()[:64] or None
    if not name:
        return
    await state.update_data(add_device_name=name)
    await state.set_state(None)
    locale = (await state.get_data()).get("locale", "en")
    await _add_device_server_step(message, state, message.from_user.id if message.from_user else 0)


async def _add_device_server_step(message: Message, state: FSMContext, tg_id: int):
    data = await state.get_data()
    locale = data.get("locale", "en")
    servers = data.get("add_device_servers") or []
    sub_id = data.get("add_device_sub_id")
    user_id = data.get("add_device_user_id")
    if not sub_id or not user_id:
        await message.answer(get_error_message("error_api", locale))
        return
    if len(servers) == 1:
        await _do_issue_device(message, state, user_id, sub_id, servers[0]["id"], data.get("add_device_name"), tg_id)
        return
    buttons = [
        [InlineKeyboardButton(text=s.get("name") or s.get("id", "")[:8], callback_data=f"server_select:{s.get('id', '')}")]
        for s in servers[:10]
    ]
    buttons.append(nav_row_buttons(back_callback="add_device_back_to_type"))
    await message.answer(
        "Select server:" if locale == "en" else "Выберите сервер:",
        reply_markup=InlineKeyboardMarkup(inline_keyboard=buttons),
    )


@router.callback_query(F.data.startswith("server_select:"))
async def on_server_select_add_device(callback: CallbackQuery, state: FSMContext):
    server_id = callback.data.replace("server_select:", "", 1)
    if not server_id:
        await callback.answer()
        return
    data = await state.get_data()
    user_id = data.get("add_device_user_id")
    sub_id = data.get("add_device_sub_id")
    locale = data.get("locale", "en")
    if not sub_id or not user_id or not callback.from_user:
        await callback.answer(get_error_message("error_api", locale), show_alert=True)
        return
    await _do_issue_device(
        callback.message, state, user_id, sub_id, server_id,
        data.get("add_device_name"), callback.from_user.id,
    )
    await callback.answer()


async def _do_issue_device(message: Message, state: FSMContext, user_id: int, sub_id: str, server_id: str, device_name: str | None, tg_id: int):
    locale = (await state.get_data()).get("locale", "en")
    await state.update_data(add_device_sub_id=None, add_device_user_id=None, add_device_servers=None, add_device_name=None, add_device_type=None, add_device_default_name=None)
    idempotency_key = f"issue_{tg_id}_{sub_id}_{uuid.uuid4().hex[:12]}"
    issue_result = await issue_device(
        user_id=user_id,
        subscription_id=sub_id,
        server_id=server_id,
        device_name=device_name or f"tg_{tg_id}",
        idempotency_key=idempotency_key,
    )
    if not issue_result.success:
        await message.answer(get_error_message(issue_result.error or "error_api", locale))
        return
    data = issue_result.data or {}
    config = data.get("config_awg") or data.get("config") or data.get("config_wg_obf")
    if config:
        await message.answer(get_success_message("device_added", locale))
        await safe_send_message(message, f"<pre>{config}</pre>")
        await message.answer("Install: " + INSTALL_GUIDE_URL if locale == "en" else "Установка: " + INSTALL_GUIDE_URL)
    else:
        await message.answer(get_success_message("device_added", locale))


async def reset_device_flow(message: Message, locale: str, state):
    user = message.from_user
    if not user:
        await message.answer(get_error_message("error_api", locale))
        return
    result = await get_user_by_tg(user.id)
    if not result.success:
        await message.answer(get_error_message(result.error or "error_api", locale))
        return
    user_data = result.data
    if not user_data:
        await message.answer(t(locale, "no_subscription"))
        return
    dev_result = await get_user_devices(user_data["id"])
    if not dev_result.success:
        await message.answer(get_error_message(dev_result.error or "error_api", locale))
        return
    devices = dev_result.data or []
    active = [d for d in devices if not d.get("revoked_at")]
    if not active:
        await message.answer("No devices to reset." if locale == "en" else "Нет устройств для сброса.")
        return
    from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton

    buttons = [
        [InlineKeyboardButton(text=d.get("device_name") or d.get("id", "")[:8], callback_data=f"device_reset:{d.get('id', '')}")]
        for d in active[:10]
    ]
    buttons.append(nav_row_buttons(back_callback="menu:devices", back_text="⬅️ Back to Devices"))
    await message.answer(
        "Select device to reset:" if locale == "en" else "Выберите устройство для сброса:",
        reply_markup=InlineKeyboardMarkup(inline_keyboard=buttons),
    )


async def invite_friend_flow(message: Message, locale: str):
    user = message.from_user
    if not user:
        return
    data_result = await get_referral_my_link(user.id)
    if not data_result.success:
        await message.answer(get_error_message(data_result.error or "error_api", locale))
        return
    data = data_result.data or {}
    payload = data.get("payload", "ref_")
    link = _referral_link(payload)
    if not BOT_USERNAME and payload:
        link = link + (" (set BOT_USERNAME for full link)" if locale == "en" else " (задайте BOT_USERNAME для ссылки)")
    await message.answer(
        ("Your referral link: " if locale == "en" else "Ваша реферальная ссылка: ") + link + "\n\nShare with friends."
    )
    stats_result = await get_referral_stats(user.id)
    if stats_result.success and stats_result.data:
        total = stats_result.data.get("total_referrals", 0)
        await message.answer(f"Referrals: {total}" if locale == "en" else f"Приглашено: {total}")


@router.callback_query(F.data.startswith("server:"))
async def on_server_selected(callback: CallbackQuery, state):
    server_id = callback.data.replace("server:", "", 1)
    if not server_id:
        await callback.answer()
        return
    data = await state.get_data()
    sub_id = data.get("add_device_sub_id")
    user_id = data.get("add_device_user_id")
    locale = data.get("locale", "en")
    if not sub_id or not user_id or not callback.from_user:
        await callback.answer(get_error_message("error_api", locale), show_alert=True)
        return
    idempotency_key = f"issue_{callback.from_user.id}_{sub_id}_{uuid.uuid4().hex[:12]}"
    issue_result = await issue_device(
        user_id=user_id,
        subscription_id=sub_id,
        server_id=server_id,
        device_name=f"tg_{callback.from_user.id}",
        idempotency_key=idempotency_key,
    )
    if not issue_result.success:
        await callback.answer(get_error_message(issue_result.error or "error_api", locale), show_alert=True)
        return
    await state.update_data(add_device_sub_id=None, add_device_user_id=None)
    data = issue_result.data or {}
    config = data.get("config_awg") or data.get("config") or data.get("config_wg_obf")
    if config:
        await callback.message.answer(get_success_message("device_added", locale))
        await safe_send_message(callback.message, f"<pre>{config}</pre>")
        await callback.message.answer("Install: " + INSTALL_GUIDE_URL if locale == "en" else "Установка: " + INSTALL_GUIDE_URL)
    else:
        await callback.message.answer(get_success_message("device_added", locale))
    await callback.answer()


# reset_* callbacks handled in handlers.devices


async def show_cabinet(message: Message, locale: str, state):
    user = message.from_user
    if not user:
        await message.answer(get_error_message("error_api", locale))
        return
    tg_id = user.id
    from api_client import get_user_by_tg, get_user_devices

    result = await get_user_by_tg(tg_id)
    if not result.success:
        await message.answer(get_error_message(result.error or "error_api", locale))
        return
    user_data = result.data
    if not user_data:
        await message.answer(t(locale, "no_subscription"))
        return
    subs = user_data.get("subscriptions") or []
    active = [s for s in subs if is_subscription_effectively_active(s)]
    if not active:
        await message.answer(t(locale, "no_subscription"))
        return
    dev_result = await get_user_devices(user_data["id"])
    devices_used = len(dev_result.data) if dev_result.success and dev_result.data else 0
    blocks = [format_subscription_status(s, locale, devices_used=devices_used) for s in active]
    await message.answer("\n\n".join(blocks) if blocks else t(locale, "no_subscription"))
