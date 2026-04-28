"""Payment request/response schemas."""

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel

from app.schemas.base import OrmSchema


class TelegramStarsWebhookBody(BaseModel):
    """Body from Telegram Stars (or our mock): idempotent key + subscription context."""

    external_id: str
    user_id: int
    subscription_id: str
    amount: str | float  # parsed to Decimal
    status: str  # completed, pending, failed


class PaymentOut(OrmSchema):
    id: str
    user_id: int
    subscription_id: str
    provider: str
    status: str
    amount: Decimal
    currency: str
    external_id: str
    kind: str | None = None
    source: str | None = None
    idempotency_key: str | None = None
    provider_payment_id: str | None = None
    provider_status: str | None = None
    invoice_url: str | None = None
    expected_amount: Decimal | None = None
    paid_amount: Decimal | None = None
    paid_at: datetime | None = None
    expires_at: datetime | None = None
    subscription_applied_at: datetime | None = None
    failure_code: str | None = None
    failure_message: str | None = None
    created_at: datetime


class PaymentList(BaseModel):
    items: list[PaymentOut]
    total: int
