"""Payment handlers: successful_payment from Telegram Stars."""

from aiogram import F, Router
from aiogram.enums import ContentType
from aiogram.types import Message, PreCheckoutQuery

from api_client import confirm_telegram_stars_payment
from metrics import record_payment_confirm, record_payment_success
from utils.logging import get_logger
from utils.messages import get_error_message, get_success_message

_log = get_logger(__name__)

router = Router()


def _locale(message: Message) -> str:
    """User locale or default en."""
    if message.from_user and message.from_user.language_code:
        code = (message.from_user.language_code or "").lower()
        if code.startswith("ru"):
            return "ru"
    return "en"


@router.message(F.content_type == ContentType.SUCCESSFUL_PAYMENT)
async def on_successful_payment(message: Message):
    """On Telegram Stars successful_payment: confirm with backend, reply to user."""
    tg_id = message.from_user.id if message.from_user else None
    if not tg_id:
        _log.warning("successful_payment_no_user")
        return
    sp = message.successful_payment
    if not sp or not sp.invoice_payload:
        _log.warning("successful_payment_no_payload", tg_id=tg_id)
        await message.answer(get_error_message("error_server", _locale(message)))
        return
    invoice_payload = sp.invoice_payload
    telegram_payment_charge_id = getattr(sp, "telegram_payment_charge_id", None) or None
    total_amount = getattr(sp, "total_amount", None)

    result = await confirm_telegram_stars_payment(
        tg_id=tg_id,
        invoice_payload=invoice_payload,
        telegram_payment_charge_id=telegram_payment_charge_id,
        total_amount=total_amount,
    )
    success = result.success
    record_payment_confirm(success)

    if success:
        record_payment_success()
        text = get_success_message("payment_success", _locale(message))
        await message.answer(text, parse_mode=None)
    else:
        _log.warning(
            "payment_confirm_failed",
            tg_id=tg_id,
            invoice_payload=invoice_payload[:32] if invoice_payload else None,
            error=result.error,
        )
        err_key = result.error or "error_api"
        text = get_error_message(err_key, _locale(message))
        await message.answer(text, parse_mode=None)


@router.pre_checkout_query()
async def on_pre_checkout_query(query: PreCheckoutQuery) -> None:
    # Telegram requires answering within 10 seconds, otherwise the payment UI may hang.
    await query.answer(ok=True)
