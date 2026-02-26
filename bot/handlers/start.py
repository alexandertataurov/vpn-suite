"""Start, language selection, ref_ parsing, pay_ deep link."""

import structlog
from aiogram import F, Router
from aiogram.filters import CommandStart
from aiogram.types import Message, CallbackQuery, LabeledPrice
from aiogram.utils.deep_linking import decode_payload

from i18n import t
from utils.formatting import is_subscription_effectively_active

router = Router()
_log = structlog.get_logger(__name__)

REF_PREFIX = "ref_"
PAY_PREFIX = "pay_"


def _get_payment_id_from_start(text: str | None) -> str | None:
    """Extract payment_id from /start pay_<payment_id>."""
    if not text or not text.strip():
        return None
    parts = text.strip().split(maxsplit=1)
    if len(parts) < 2:
        return None
    payload = parts[1]
    if payload.startswith(PAY_PREFIX):
        return payload[len(PAY_PREFIX) :].strip() or None
    return None


def _get_ref_code_from_start(text: str | None) -> str | None:
    if not text or not text.strip():
        return None
    parts = text.strip().split(maxsplit=1)
    if len(parts) < 2:
        return None
    payload = parts[1]
    if payload.startswith(REF_PREFIX):
        return payload[len(REF_PREFIX) :].strip() or None
    try:
        decoded = decode_payload(payload)
        if decoded and decoded.startswith(REF_PREFIX):
            return decoded[len(REF_PREFIX) :].strip() or None
    except Exception as e:
        _log.debug("decode_payload_failed", payload=payload[:32], error=str(e))
    return None


@router.message(CommandStart())
async def cmd_start(message: Message, state):
    payment_id = _get_payment_id_from_start(message.text)
    if payment_id and message.from_user:
        from api_client import get_payment_invoice
        inv_result = await get_payment_invoice(payment_id, message.from_user.id)
        if inv_result.success and inv_result.data:
            inv = inv_result.data
            if inv.get("free_activation") or int(inv.get("star_count", 1)) == 0:
                await message.answer("Subscription is active. Use the menu to add a device and get your config.")
                return
            title = inv.get("title", "VPN")
            description = inv.get("description", "VPN plan")
            payload = inv.get("payload", inv.get("payment_id", ""))
            star_count = max(1, int(inv.get("star_count", 1)))
            await message.answer_invoice(
                title=title,
                description=description,
                payload=payload,
                provider_token="",
                currency="XTR",
                prices=[LabeledPrice(label=title, amount=star_count)],
            )
            return
    ref_code = _get_ref_code_from_start(message.text)
    data = await state.get_data()
    locale = data.get("locale")
    if locale and message.from_user:
        has_sub = await _user_has_active_sub(message.from_user.id)
        if has_sub:
            await state.set_state(None)
            await state.update_data(
                add_device_sub_id=None,
                add_device_user_id=None,
                add_device_servers=None,
                add_device_name=None,
                add_device_type=None,
                add_device_default_name=None,
                issued_config_awg=None,
                issued_config_wg_obf=None,
                issued_config_wg=None,
                issued_device_name=None,
            )
            welcome = t(locale, "welcome")
            if ref_code:
                welcome += "\n\n" + t(locale, "ref_invited")
                await state.update_data(referral_code=ref_code)
            await message.answer(welcome)
            await _send_main_keyboard(message, locale, is_existing=True)
            if message.from_user:
                from api_client import post_event
                await post_event("start", message.from_user.id, {"ref": ref_code[:32] if ref_code else None})
            return
    await state.clear()
    if ref_code and message.from_user:
        await state.update_data(referral_code=ref_code)
        _log.info("user_action", telegram_id=message.from_user.id, action="start_ref", ref=ref_code[:8])
    if message.from_user:
        from api_client import post_event
        await post_event("start", message.from_user.id, {"ref": ref_code[:32] if ref_code else None})
    await message.answer(
        t("en", "choose_lang"),
        reply_markup=_lang_keyboard(),
    )


def _lang_keyboard():
    from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton

    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="RU", callback_data="lang_ru"), InlineKeyboardButton(text="EN", callback_data="lang_en")],
    ])


@router.callback_query(F.data.startswith("lang_"))
async def set_lang(callback: CallbackQuery, state):
    lang = "ru" if callback.data == "lang_ru" else "en"
    data = await state.get_data()
    ref_code = data.get("referral_code")
    await state.update_data(locale=lang)
    if ref_code and callback.from_user and not data.get("referral_attached"):
        from api_client import referral_attach

        attach_result = await referral_attach(callback.from_user.id, str(ref_code))
        if attach_result.success:
            await state.update_data(referral_attached=True)
            _log.info(
                "user_action",
                telegram_id=callback.from_user.id,
                action="referral_attached",
                ref=str(ref_code)[:8],
            )
        else:
            _log.warning(
                "user_action",
                telegram_id=callback.from_user.id if callback.from_user else None,
                action="referral_attach_failed",
                ref=str(ref_code)[:8],
                error=attach_result.error,
            )
    await callback.answer()
    welcome = t(lang, "welcome")
    if ref_code:
        welcome += "\n\n" + t(lang, "ref_invited")
    try:
        if callback.message and callback.message.text:
            await callback.message.edit_text(welcome)
        else:
            await callback.message.answer(welcome)
    except Exception as e:
        _log.debug("edit_text_failed", error=str(e))
        await callback.message.answer(welcome)
    await _send_main_keyboard(callback.message, lang)


def _main_keyboard(locale: str, is_existing: bool):
    """New clients: Connect, Instruction, Support. Existing: Profile, Add device, Devices, etc."""
    from aiogram.types import ReplyKeyboardMarkup, KeyboardButton

    if is_existing:
        keyboard = [
            [KeyboardButton(text=t(locale, "my_cabinet")), KeyboardButton(text=t(locale, "add_device"))],
            [KeyboardButton(text=t(locale, "devices")), KeyboardButton(text=t(locale, "reset_device"))],
            [KeyboardButton(text=t(locale, "invite_friend")), KeyboardButton(text=t(locale, "promo_code"))],
            [KeyboardButton(text=t(locale, "connect_cta"))],
            [KeyboardButton(text=t(locale, "instruction")), KeyboardButton(text=t(locale, "support"))],
        ]
    else:
        keyboard = [
            [KeyboardButton(text=t(locale, "connect_cta"))],
            [KeyboardButton(text=t(locale, "instruction")), KeyboardButton(text=t(locale, "support"))],
        ]
    return ReplyKeyboardMarkup(keyboard=keyboard, resize_keyboard=True)


async def _user_has_active_sub(tg_id: int) -> bool:
    from api_client import get_user_by_tg
    result = await get_user_by_tg(tg_id)
    if not result.success or not result.data:
        return False
    for sub in result.data.get("subscriptions") or []:
        if is_subscription_effectively_active(sub):
            return True
    return False


async def _send_main_keyboard(message: Message, locale: str, is_existing: bool | None = None, text: str | None = None):
    if is_existing is None and message.from_user:
        is_existing = await _user_has_active_sub(message.from_user.id)
    await message.answer(text or "—", reply_markup=_main_keyboard(locale, is_existing))


def get_main_keyboard(locale: str, is_existing: bool):
    """Return ReplyKeyboardMarkup for new (False) or existing (True) client. For use by other handlers."""
    return _main_keyboard(locale, is_existing)


async def send_main_keyboard_for(message: Message, locale: str, is_existing: bool, text: str | None = None):
    """Send the main menu keyboard. Pass text to attach keyboard to content; else sends minimal placeholder."""
    await message.answer(text or "—", reply_markup=_main_keyboard(locale, is_existing))


@router.callback_query(F.data == "menu:main")
async def menu_main(callback: CallbackQuery, state):
    """Show main ReplyKeyboard (new vs existing based on API). Clear add_device/issued_config state to avoid stuck FSM."""
    await callback.answer()
    await state.set_state(None)
    await state.update_data(
        add_device_sub_id=None,
        add_device_user_id=None,
        add_device_servers=None,
        add_device_name=None,
        add_device_type=None,
        add_device_default_name=None,
        issued_config_awg=None,
        issued_config_wg_obf=None,
        issued_config_wg=None,
        issued_device_name=None,
    )
    data = await state.get_data()
    locale = data.get("locale", "en")
    await _send_main_keyboard(callback.message, locale, is_existing=None)
