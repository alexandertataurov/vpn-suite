"""Tariffs from API, plan selection, invoice, add device."""

import asyncio
import uuid
import structlog
from aiogram import Router, F
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.types import (
    Message,
    CallbackQuery,
    PreCheckoutQuery,
    LabeledPrice,
    InlineKeyboardButton,
    InlineKeyboardMarkup,
)

from config import BOT_USERNAME, SUPPORT_LINK, SUPPORT_HANDLE, INSTALL_GUIDE_URL
from keyboards.common import nav_row_buttons, error_nav_markup, connect_nav_markup, instruction_nav_markup
from keyboards.revenue import tunnel_paused_keyboard
from api_client import (
    confirm_telegram_stars_payment,
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
from metrics import record_payment_confirm, record_payment_start, record_payment_success
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
    prefix = t(locale, "contact_support_prefix")
    if SUPPORT_LINK:
        return prefix + SUPPORT_LINK
    handle = (SUPPORT_HANDLE or "").strip()
    if not handle.startswith("@"):
        handle = "@" + handle if handle else "@support"
    return prefix + handle


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
        "invite_friend": {t(locale, "invite_friend"), t(locale, "earn_free_days"), "Invite friend", "Earn Free VPN Days", "Пригласить друга"},
        "promo_code": {t(locale, "promo_code"), "Promo code", "Промокод"},
        "devices": {t(locale, "devices"), "Devices", "Устройства"},
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
                err = t(locale, "promo_invalid")
                await message.answer(err, reply_markup=error_nav_markup())
            else:
                await state.update_data(promo_code=text.strip())
                await message.answer(t(locale, "promo_accepted"), reply_markup=error_nav_markup())
        else:
            await message.answer(get_error_message("error_api", locale), reply_markup=error_nav_markup())
        return
    texts = _menu_texts(locale)
    if text in texts["tariffs"] or text in texts["connect"]:
        await show_tariffs(message, locale)
        return
    if text in texts["profile"]:
        await show_cabinet(message, locale, state)
        return
    if text in texts["support"]:
        await message.answer(_support_message(locale), reply_markup=error_nav_markup())
        return
    if text in texts["add_device"]:
        await add_device_flow(message, locale, state)
        return
    if text in texts["devices"]:
        from handlers.devices import show_devices_list
        await show_devices_list(message, state)
        return
    if text in texts["reset_device"]:
        await reset_device_flow(message, locale, state)
        return
    if text in texts["instruction"]:
        await message.answer(t(locale, "instruction_text"))
        await message.answer("—", reply_markup=instruction_nav_markup(locale))
        return
    if text in texts["invite_friend"]:
        await invite_friend_flow(message, locale)
        return
    if text in texts["promo_code"]:
        await state.update_data(waiting_promo_code=True)
        await message.answer(
            t(locale, "promo_placeholder") + t(locale, "promo_send_hint"),
            reply_markup=error_nav_markup(),
        )
        return


@router.callback_query(F.data == "show_tariffs")
async def on_show_tariffs_callback(callback: CallbackQuery, state: FSMContext):
    """Open plan list from inline [Connect] (no_sub / device_limit)."""
    await callback.answer()
    locale = (await state.get_data()).get("locale", "en")
    await show_tariffs(callback.message, locale)


def _plan_button_label(p: dict, locale: str) -> str:
    """Label with optional Most Popular / Best Value badge."""
    name = p.get("name", "Plan")
    price = p.get("price_amount", 0)
    currency = p.get("price_currency", "XTR")
    days = int(p.get("duration_days", 30))
    if days >= 360:
        badge = f" — {t(locale, 'best_value')}"
    elif 80 <= days <= 100:
        badge = f" — {t(locale, 'most_popular')}"
    else:
        badge = ""
    try:
        per_month = float(price) / (days / 30.0) if days else float(price)
        return f"{name} — {price} {currency} (~{per_month:.1f}/mo){badge}"
    except (TypeError, ValueError):
        return f"{name} — {price} {currency}{badge}"


async def show_tariffs(message: Message, locale: str):
    if message.from_user:
        await post_event("view_tariff", message.from_user.id, {})
    plans_result = await get_plans()
    if not plans_result.success:
        await message.answer(get_error_message(plans_result.error or "error_api", locale), reply_markup=error_nav_markup())
        return
    plans = plans_result.data or []
    if not plans:
        await message.answer(t(locale, "no_plans"), reply_markup=error_nav_markup())
        return
    from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton

    sorted_plans = sorted(plans, key=lambda p: int(p.get("duration_days", 0)), reverse=True)
    buttons = [
        [InlineKeyboardButton(text=_plan_button_label(p, locale), callback_data=f"plan:{p.get('id', '')}")]
        for p in sorted_plans
    ]
    buttons.append(nav_row_buttons(back_callback="nav:home"))
    intro = t(locale, "select_plan") + "\n\n" + t(locale, "average_stay")
    await message.answer(
        intro,
        reply_markup=InlineKeyboardMarkup(inline_keyboard=buttons),
    )


def _slug_to_days(slug: str) -> int | None:
    """Map plan slug to approximate duration_days for matching API plans."""
    m = {"plan_1m": 30, "plan_3m": 90, "plan_12m": 365}
    return m.get(slug)


async def _resolve_plan_id_from_slug(slug: str) -> str | None:
    """Resolve plan_1m / plan_3m / plan_12m to API plan id from get_plans().

    If only one plan exists in API, always use it regardless of slug.
    """
    want_days = _slug_to_days(slug)
    result = await get_plans()
    if not result.success or not result.data:
        return None
    plans = result.data
    if len(plans) == 1:
        return str(plans[0].get("id", ""))
    if want_days is None:
        return None
    for p in plans:
        days = int(p.get("duration_days", 0))
        if abs(days - want_days) <= 15:  # allow small variance
            return str(p.get("id", ""))
    # fallback: closest by duration
    sorted_plans = sorted(plans, key=lambda x: abs(int(x.get("duration_days", 0)) - want_days))
    return str(sorted_plans[0].get("id", "")) if sorted_plans else None


async def _handle_plan_selected(callback: CallbackQuery, state: FSMContext, plan_id: str):
    if not plan_id:
        await callback.answer(t((await state.get_data()).get("locale", "en"), "invalid_plan"), show_alert=True)
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
    free_activation = inv.get("free_activation") or int(inv.get("star_count", 1)) == 0
    if free_activation:
        from menus.render import render_menu
        add_now = t(locale, "add_device_now")
        go_connect = t(locale, "go_to_connect")
        kb = InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text=add_now, callback_data="add_device:from_free")],
            [InlineKeyboardButton(text=go_connect, callback_data="nav:connect")],
            nav_row_buttons(back_callback="nav:home"),
        ])
        await callback.message.answer(
            get_success_message("payment_success", locale)
            + t(locale, "add_device_or_connect"),
            reply_markup=kb,
        )
        home_text, home_markup = render_menu("home", locale)
        await callback.message.answer(home_text, reply_markup=home_markup)
        await callback.answer()
        return
    title = inv.get("title", "VPN")
    description = inv.get("description", "VPN plan")
    payload = inv.get("payload", inv.get("payment_id", ""))
    star_count = max(1, int(inv.get("star_count", 1)))
    try:
        record_payment_start()
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
        await callback.message.answer(get_error_message("error_api", locale), reply_markup=error_nav_markup())
    await callback.answer()


@router.callback_query(F.data.startswith("pay:stars:"))
async def on_pay_stars(callback: CallbackQuery, state):
    """Handle pay:stars:plan_slug from pay_methods menu."""
    raw = callback.data or ""
    parts = raw.split(":", 2)
    plan_slug = parts[2] if len(parts) >= 3 else ""
    if not plan_slug:
        await callback.answer(t((await state.get_data()).get("locale", "en"), "invalid_plan"), show_alert=True)
        return
    plan_id = await _resolve_plan_id_from_slug(plan_slug)
    if not plan_id:
        await callback.answer(get_error_message("error_api", (await state.get_data()).get("locale", "en")), show_alert=True)
        return
    await _handle_plan_selected(callback, state, plan_id)


@router.callback_query(F.data.startswith("plan:"))
async def on_plan_selected(callback: CallbackQuery, state):
    plan_id = callback.data.replace("plan:", "", 1)
    await _handle_plan_selected(callback, state, plan_id)


def _after_payment_keyboard(locale: str) -> InlineKeyboardMarkup:
    """Go to Connect + Home (spec: After payment → Activate + Go to Connect)."""
    go_connect = t(locale, "go_to_connect")
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text=go_connect, callback_data="nav:connect")],
        nav_row_buttons(back_callback="nav:home"),
    ])


@router.pre_checkout_query()
async def on_pre_checkout_query(pre_checkout: PreCheckoutQuery, state: FSMContext):
    """Required for Telegram payments (including Stars): approve checkout."""
    await pre_checkout.answer(ok=True)


@router.message(F.successful_payment)
async def on_successful_payment(message: Message, state):
    record_payment_success()
    data = await state.get_data()
    locale = data.get("locale", "en")
    user = message.from_user
    if not user:
        await message.answer(
            get_success_message("payment_pending_activation", locale),
            reply_markup=_after_payment_keyboard(locale),
        )
        return
    sp = message.successful_payment
    invoice_payload = (sp.invoice_payload if sp else "") or ""
    if invoice_payload:
        confirm_result = await confirm_telegram_stars_payment(
            user.id,
            invoice_payload,
            telegram_payment_charge_id=getattr(sp, "telegram_payment_charge_id", None) or None,
            total_amount=getattr(sp, "total_amount", None) or None,
        )
        record_payment_confirm(confirm_result.success)
        await post_event(
            "payment_completed",
            user.id,
            {
                "payment_id": invoice_payload,
                "total_amount": getattr(sp, "total_amount", None),
                "currency": getattr(sp, "currency", None),
            },
        )
    is_confirmed = await _wait_for_active_subscription(user.id)
    kb = _after_payment_keyboard(locale)
    if is_confirmed:
        await message.answer(
            get_success_message("payment_success", locale),
            reply_markup=kb,
        )
    else:
        await message.answer(
            get_success_message("payment_pending_activation", locale),
            reply_markup=kb,
        )


async def add_device_flow(message: Message, locale: str, state: FSMContext, user=None):
    user = user or message.from_user
    if not user:
        await message.answer(get_error_message("error_api", locale), reply_markup=error_nav_markup())
        return
    result = await get_user_by_tg(user.id)
    if not result.success:
        await message.answer(get_error_message(result.error or "error_api", locale), reply_markup=error_nav_markup())
        return
    user_data = result.data
    if not user_data:
        await message.answer(t(locale, "tunnel_paused"), reply_markup=tunnel_paused_keyboard(locale))
        return
    subs = [s for s in (user_data.get("subscriptions") or []) if is_subscription_effectively_active(s)]
    if not subs:
        await message.answer(t(locale, "tunnel_paused"), reply_markup=tunnel_paused_keyboard(locale))
        return
    sub = subs[0]
    sub_id = sub.get("id")
    servers_result = await get_servers(limit=10, is_active=True)
    servers = servers_result.data if servers_result.success else []
    if not servers:
        await message.answer(t(locale, "no_server_available"), reply_markup=error_nav_markup())
        return
    await state.update_data(
        add_device_sub_id=sub_id,
        add_device_user_id=int(user_data["id"]),
        add_device_servers=servers[:10],
    )
    # Step 1: Choose device type
    buttons = [
        [InlineKeyboardButton(text=label, callback_data=f"device_type:{key}")]
        for key, label, _ in DEVICE_TYPES
    ]
    buttons.append(nav_row_buttons(back_callback="nav:home"))
    await message.answer(
        t(locale, "choose_device_type"),
        reply_markup=InlineKeyboardMarkup(inline_keyboard=buttons),
    )


@router.callback_query(F.data == "add_device:from_free")
async def on_add_device_from_free(callback: CallbackQuery, state: FSMContext):
    await callback.answer()
    locale = (await state.get_data()).get("locale", "en")
    await add_device_flow(callback.message, locale, state, user=callback.from_user)


@router.callback_query(F.data.startswith("device_type:"))
async def on_device_type_selected(callback: CallbackQuery, state: FSMContext):
    device_type = callback.data.replace("device_type:", "", 1)
    if not device_type:
        await callback.answer()
        return
    data = await state.get_data()
    locale = data.get("locale", "en")
    default_name = next((d[2] for d in DEVICE_TYPES if d[0] == device_type), "Device")
    await state.update_data(add_device_type=device_type, add_device_default_name=default_name)
    await callback.answer()
    servers = data.get("add_device_servers") or []
    # Step 2: Name (quick add when one server, or skip/custom)
    buttons = []
    if len(servers) == 1:
        buttons.append([InlineKeyboardButton(
            text=t(locale, "quick_add_default"),
            callback_data="add_device_quick",
        )])
    buttons += [
        [InlineKeyboardButton(text=t(locale, "skip_default_name"), callback_data="add_device_skip_name")],
        [InlineKeyboardButton(text=t(locale, "enter_custom_name"), callback_data="add_device_custom_name")],
    ]
    buttons.append(nav_row_buttons(back_callback="add_device_back_to_type"))
    await callback.message.answer(
        t(locale, "name_your_device"),
        reply_markup=InlineKeyboardMarkup(inline_keyboard=buttons),
    )


@router.callback_query(F.data == "add_device_quick")
async def on_add_device_quick(callback: CallbackQuery, state: FSMContext):
    """One-tap issue when single server: default name + that server."""
    await callback.answer()
    data = await state.get_data()
    servers = data.get("add_device_servers") or []
    if len(servers) != 1:
        tg_id = callback.from_user.id if callback.from_user else 0
        await state.update_data(add_device_name=data.get("add_device_default_name", "Device"))
        await _add_device_server_step(callback.message, state, tg_id)
        return
    user_id = data.get("add_device_user_id")
    sub_id = data.get("add_device_sub_id")
    default_name = data.get("add_device_default_name", "Device")
    if not user_id or not sub_id or not callback.from_user:
        locale = data.get("locale", "en")
        await callback.message.answer(get_error_message("error_api", locale), reply_markup=error_nav_markup())
        return
    await _do_issue_device(
        callback.message, state, user_id, sub_id, servers[0]["id"], default_name, callback.from_user.id,
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
        t(locale, "send_device_name"),
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
    buttons.append(nav_row_buttons(back_callback="nav:home"))
    await callback.message.answer(
        t(locale, "choose_device_type"),
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
        await message.answer(get_error_message("error_api", locale), reply_markup=error_nav_markup())
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
        t(locale, "select_server"),
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


CONFIG_KEYS = ("config_awg", "config_wg_obf", "config_wg")
CONFIG_LABELS = {"config_awg": "AmneziaWG", "config_wg_obf": "WG Obfuscated", "config_wg": "WG Standard"}


async def _send_one_config(target: Message, config: str, locale: str, device_name: str | None, label: str):
    from aiogram.types import BufferedInputFile
    await safe_send_message(target, f"<b>{label}</b>\n<pre>{config}</pre>")
    try:
        name = (device_name or "config").replace(" ", "_")[:28] + f"_{label.replace(' ', '-')}.conf"
        await target.answer_document(BufferedInputFile(config.encode("utf-8"), filename=name))
    except Exception:
        pass
    try:
        import io
        import qrcode
        img = qrcode.make(config)
        bio = io.BytesIO()
        img.save(bio, format="PNG")
        bio.seek(0)
        await target.answer_photo(BufferedInputFile(bio.getvalue(), filename="config-qr.png"), caption=t(locale, "qr_caption"))
    except Exception:
        pass


async def _do_issue_device(message: Message, state: FSMContext, user_id: int, sub_id: str, server_id: str, device_name: str | None, tg_id: int):
    locale = (await state.get_data()).get("locale", "en")
    loading_text = t(locale, "loading_moment")
    status_msg = await message.answer(loading_text)
    await state.update_data(add_device_sub_id=None, add_device_user_id=None, add_device_servers=None, add_device_name=None, add_device_type=None, add_device_default_name=None)
    idempotency_key = f"issue_{tg_id}_{sub_id}_{uuid.uuid4().hex[:12]}"
    issue_result = await issue_device(
        user_id=user_id,
        subscription_id=sub_id,
        server_id=server_id,
        device_name=device_name or f"tg_{tg_id}",
        idempotency_key=idempotency_key,
    )
    try:
        await status_msg.delete()
    except Exception:
        pass
    if not issue_result.success:
        markup = connect_nav_markup(locale) if (issue_result.error or "") == "error_device_limit" else error_nav_markup()
        await message.answer(get_error_message(issue_result.error or "error_api", locale), reply_markup=markup)
        return
    data = issue_result.data or {}
    configs = {k: data.get(k) for k in CONFIG_KEYS if data.get(k)}
    if not configs:
        from menus.render import render_menu
        _h_text, _h_markup = render_menu("home", locale)
        await message.answer(get_success_message("device_added", locale), reply_markup=_h_markup)
        return
    if len(configs) == 1:
        (key, config), = configs.items()
        from menus.render import render_menu
        _h_text, _h_markup = render_menu("home", locale)
        await message.answer(get_success_message("device_added", locale), reply_markup=_h_markup)
        await _send_one_config(message, config, locale, device_name, CONFIG_LABELS.get(key, key))
        await message.answer(t(locale, "install_link", url=INSTALL_GUIDE_URL), reply_markup=_h_markup)
        return
    await message.answer(
        get_success_message("device_added", locale),
        reply_markup=InlineKeyboardMarkup(inline_keyboard=[nav_row_buttons(back_callback="nav:home")]),
    )
    await message.answer(t(locale, "choose_config_format"), reply_markup=InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text=t(locale, k), callback_data=f"config_type:{k}")] for k in CONFIG_KEYS if data.get(k)
    ] + [nav_row_buttons(back_callback="nav:home")]))
    await state.update_data(
        issued_config_awg=data.get("config_awg"),
        issued_config_wg_obf=data.get("config_wg_obf"),
        issued_config_wg=data.get("config_wg"),
        issued_device_name=device_name,
    )


async def reset_device_flow(message: Message, locale: str, state):
    user = message.from_user
    if not user:
        await message.answer(get_error_message("error_api", locale), reply_markup=error_nav_markup())
        return
    result = await get_user_by_tg(user.id)
    if not result.success:
        await message.answer(get_error_message(result.error or "error_api", locale), reply_markup=error_nav_markup())
        return
    user_data = result.data
    if not user_data:
        await message.answer(t(locale, "tunnel_paused"), reply_markup=tunnel_paused_keyboard(locale))
        return
    dev_result = await get_user_devices(int(user_data["id"]))
    if not dev_result.success:
        from handlers.devices import ERROR_DEVICE_NOT_FOUND
        if dev_result.error == ERROR_DEVICE_NOT_FOUND:
            await message.answer(t(locale, "no_devices_to_reset"), reply_markup=error_nav_markup())
            return
        await message.answer(get_error_message(dev_result.error or "error_api", locale), reply_markup=error_nav_markup())
        return
    devices = dev_result.data or []
    active = [d for d in devices if not d.get("revoked_at")]
    if not active:
        await message.answer(t(locale, "no_devices_to_reset"), reply_markup=error_nav_markup())
        return
    from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton

    buttons = [
        [InlineKeyboardButton(text=d.get("device_name") or d.get("id", "")[:8], callback_data=f"device_reset:{d.get('id', '')}")]
        for d in active[:10]
    ]
    buttons.append(nav_row_buttons(back_callback="menu:devices", back_text="⬅️ Back to Devices"))
    await message.answer(
        t(locale, "select_device_reset"),
        reply_markup=InlineKeyboardMarkup(inline_keyboard=buttons),
    )


async def invite_friend_flow(message: Message, locale: str):
    """Earn Free VPN Days: link + +7 days per paid referral + days earned this month."""
    user = message.from_user
    if not user:
        return
    data_result = await get_referral_my_link(user.id)
    if not data_result.success:
        await message.answer(get_error_message(data_result.error or "error_api", locale), reply_markup=error_nav_markup())
        return
    data = data_result.data or {}
    payload = data.get("payload", "ref_")
    link = _referral_link(payload)
    if not BOT_USERNAME and payload:
        link = link + (" (set BOT_USERNAME for full link)" if locale == "en" else " (задайте BOT_USERNAME для ссылки)")
    reward_text = t(locale, "referral_reward")
    _nav = InlineKeyboardMarkup(inline_keyboard=[nav_row_buttons(back_callback="nav:home")])
    await message.answer(
        t(locale, "earn_free_days") + "\n\n" + link + "\n\n" + reward_text,
        reply_markup=_nav,
    )
    stats_result = await get_referral_stats(user.id)
    if stats_result.success and stats_result.data:
        total = stats_result.data.get("total_referrals", 0)
        days_earned = stats_result.data.get("days_earned_this_month", 0)
        await message.answer(
            t(locale, "referrals_count", total=total) + "\n"
            + t(locale, "days_earned_month", days=days_earned),
            reply_markup=_nav,
        )


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
    configs = {k: data.get(k) for k in CONFIG_KEYS if data.get(k)}
    device_name = data.get("device_name")
    if not configs:
        from menus.render import render_menu
        _h_text, _h_markup = render_menu("home", locale)
        await callback.message.answer(get_success_message("device_added", locale), reply_markup=_h_markup)
    elif len(configs) == 1:
        (key, config), = configs.items()
        from menus.render import render_menu
        _h_text, _h_markup = render_menu("home", locale)
        await callback.message.answer(get_success_message("device_added", locale), reply_markup=_h_markup)
        await _send_one_config(callback.message, config, locale, device_name, CONFIG_LABELS.get(key, key))
        await callback.message.answer(t(locale, "install_link", url=INSTALL_GUIDE_URL), reply_markup=_h_markup)
    else:
        await callback.message.answer(
            get_success_message("device_added", locale),
            reply_markup=InlineKeyboardMarkup(inline_keyboard=[nav_row_buttons(back_callback="nav:home")]),
        )
        await callback.message.answer(t(locale, "choose_config_format"), reply_markup=InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text=t(locale, k), callback_data=f"config_type:{k}")] for k in CONFIG_KEYS if data.get(k)
        ] + [nav_row_buttons(back_callback="nav:home")]))
        await state.update_data(
            issued_config_awg=data.get("config_awg"),
            issued_config_wg_obf=data.get("config_wg_obf"),
            issued_config_wg=data.get("config_wg"),
            issued_device_name=device_name,
        )
    await callback.answer()


@router.callback_query(F.data.startswith("config_type:"))
async def on_config_type_chosen(callback: CallbackQuery, state: FSMContext):
    key = callback.data.replace("config_type:", "", 1)
    if key not in CONFIG_KEYS:
        await callback.answer()
        return
    data = await state.get_data()
    locale = data.get("locale", "en")
    state_key = f"issued_{key}"
    config = data.get(state_key)
    await callback.answer()
    if not config:
        await callback.message.answer(get_error_message("error_api", locale), reply_markup=error_nav_markup())
        return
    device_name = data.get("issued_device_name")
    label = CONFIG_LABELS.get(key, key)
    await _send_one_config(callback.message, config, locale, device_name, label)
    from menus.render import render_menu
    _h_text, _h_markup = render_menu("home", locale)
    await callback.message.answer(t(locale, "install_link", url=INSTALL_GUIDE_URL), reply_markup=_h_markup)
    await state.update_data(issued_config_awg=None, issued_config_wg_obf=None, issued_config_wg=None, issued_device_name=None)


# reset_* callbacks handled in handlers.devices


async def show_cabinet(message: Message, locale: str, state):
    user = message.from_user
    if not user:
        await message.answer(get_error_message("error_api", locale), reply_markup=error_nav_markup())
        return
    tg_id = user.id
    from api_client import get_user_by_tg, get_user_devices

    result = await get_user_by_tg(tg_id)
    if not result.success:
        await message.answer(get_error_message(result.error or "error_api", locale), reply_markup=error_nav_markup())
        return
    user_data = result.data
    if not user_data:
        await message.answer(t(locale, "tunnel_paused"), reply_markup=tunnel_paused_keyboard(locale))
        return
    subs = user_data.get("subscriptions") or []
    active = [s for s in subs if is_subscription_effectively_active(s)]
    if not active:
        await message.answer(t(locale, "tunnel_paused"), reply_markup=tunnel_paused_keyboard(locale))
        return
    dev_result = await get_user_devices(int(user_data["id"]))
    devices_used = len(dev_result.data) if dev_result.success and dev_result.data is not None else 0
    blocks = [format_subscription_status(s, locale, devices_used=devices_used) for s in active]
    cancel_text = t(locale, "cancel_subscription_btn")
    _cabinet_markup = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text=cancel_text, callback_data=f"churn:start:{active[0].get('id', '')}")],
        nav_row_buttons(back_callback="nav:home"),
    ])
    await message.answer(
        "\n\n".join(blocks) if blocks else t(locale, "no_subscription"),
        reply_markup=_cabinet_markup,
    )
