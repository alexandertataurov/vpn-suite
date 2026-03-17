"""Promo code validation and redemption. Fixed XTR discount, per-user idempotency, price floor."""

from dataclasses import dataclass
from enum import Enum

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.constants import MIN_PRICE_XTR
from app.models import PromoCode, PromoRedemption


class PromoErrorCode(str, Enum):
    PROMO_NOT_FOUND = "PROMO_NOT_FOUND"
    PROMO_INACTIVE = "PROMO_INACTIVE"
    PROMO_EXPIRED = "PROMO_EXPIRED"
    PROMO_PLAN_INELIGIBLE = "PROMO_PLAN_INELIGIBLE"
    PROMO_ALREADY_USED = "PROMO_ALREADY_USED"
    PROMO_EXHAUSTED = "PROMO_EXHAUSTED"


class PromoCodeError(Exception):
    def __init__(self, code: PromoErrorCode, message: str = "") -> None:
        self.code = code
        self.message = message or str(code)
        super().__init__(self.message)


@dataclass
class PromoValidationResult:
    discount_amount: int
    discounted_price: int
    display_label: str


def _normalize_code(code: str) -> str:
    return (code or "").strip().upper()


def _display_label(discount_xtr: int) -> str:
    return f"{discount_xtr} XTR off"


async def validate_promo_code(
    db: AsyncSession,
    code: str,
    user_id: int,
    plan_id: str,
    original_price_xtr: int,
) -> PromoValidationResult:
    """Validate promo code. Returns discount and display label. Raises PromoCodeError if invalid."""
    norm = _normalize_code(code)
    if not norm:
        raise PromoCodeError(PromoErrorCode.PROMO_NOT_FOUND, "Code required")

    result = await db.execute(
        select(PromoCode).where(func.upper(PromoCode.code) == norm)
    )
    promo = result.scalar_one_or_none()
    if not promo:
        raise PromoCodeError(PromoErrorCode.PROMO_NOT_FOUND, "Code not found")

    if not getattr(promo, "is_active", promo.status == "active"):
        raise PromoCodeError(PromoErrorCode.PROMO_INACTIVE, "Code inactive")

    expires_at = getattr(promo, "expires_at", None) or (promo.constraints or {}).get("expires_at")
    if expires_at:
        from datetime import datetime, timezone

        if callable(expires_at):
            exp = expires_at()
        else:
            try:
                exp = datetime.fromisoformat(
                    str(expires_at).replace("Z", "+00:00")
                )
            except (TypeError, ValueError):
                exp = None
        if exp and exp < datetime.now(timezone.utc):
            raise PromoCodeError(PromoErrorCode.PROMO_EXPIRED, "Code expired")

    applicable = getattr(promo, "applicable_plan_ids", None)
    if applicable is not None and len(applicable) > 0 and plan_id not in applicable:
        raise PromoCodeError(PromoErrorCode.PROMO_PLAN_INELIGIBLE, "Not valid for plan")

    max_per_user = getattr(promo, "max_uses_per_user", 1)
    red_count = await db.execute(
        select(func.count()).select_from(PromoRedemption).where(
            PromoRedemption.promo_code_id == promo.id,
            PromoRedemption.user_id == user_id,
        )
    )
    count = int(red_count.scalar() or 0)
    if count >= max_per_user:
        raise PromoCodeError(PromoErrorCode.PROMO_ALREADY_USED, "Already used")

    global_limit = getattr(promo, "global_use_limit", None)
    if global_limit is not None:
        total_count = await db.execute(
            select(func.count()).select_from(PromoRedemption).where(
                PromoRedemption.promo_code_id == promo.id
            )
        )
        if int(total_count.scalar() or 0) >= global_limit:
            raise PromoCodeError(PromoErrorCode.PROMO_EXHAUSTED, "Code exhausted")

    discount_xtr = getattr(promo, "discount_xtr", 0) or int(promo.value) if promo.value else 0
    discounted_price = max(MIN_PRICE_XTR, original_price_xtr - discount_xtr)

    return PromoValidationResult(
        discount_amount=discount_xtr,
        discounted_price=discounted_price,
        display_label=_display_label(discount_xtr),
    )


async def redeem_promo_code(
    db: AsyncSession,
    code: str,
    user_id: int,
    plan_id: str,
    payment_id: str,
    original_price_xtr: int,
) -> int:
    """Record redemption and return final discounted price. Must be called inside payment transaction.
    Raises PromoCodeError on invalid state or unique constraint violation (race)."""
    result = await validate_promo_code(db, code, user_id, plan_id, original_price_xtr)

    norm = _normalize_code(code)
    promo_result = await db.execute(
        select(PromoCode).where(func.upper(PromoCode.code) == norm)
    )
    promo = promo_result.scalar_one_or_none()
    if not promo:
        raise PromoCodeError(PromoErrorCode.PROMO_NOT_FOUND, "Code not found")

    try:
        red = PromoRedemption(
            promo_code_id=promo.id,
            user_id=user_id,
            payment_id=payment_id,
            discount_applied_xtr=result.discount_amount,
        )
        db.add(red)
        await db.flush()
    except IntegrityError:
        raise PromoCodeError(PromoErrorCode.PROMO_ALREADY_USED, "Already used") from None

    return result.discounted_price
