"""Bot-facing API request/response schemas."""

from pydantic import BaseModel

from app.schemas.subscription import SubscriptionOut
from app.schemas.user import UserOut


class BotEventRequest(BaseModel):
    event_type: str
    tg_id: int
    payload: dict | None = None


class CreateOrGetSubscriptionRequest(BaseModel):
    tg_id: int
    plan_id: str


class CreateOrGetSubscriptionResponse(BaseModel):
    user_id: int
    user: UserOut
    subscription_id: str
    subscription: SubscriptionOut


class CreateInvoiceRequest(BaseModel):
    tg_id: int
    plan_id: str
    subscription_id: str | None = None
    promo_code: str | None = None


class CreateInvoiceResponse(BaseModel):
    invoice_id: str
    payment_id: str
    title: str
    description: str
    currency: str = "XTR"
    star_count: int
    payload: str  # payment_id or opaque for Telegram
    server_id: str  # for subsequent issue call
    subscription_id: str
    free_activation: bool = False  # True when plan price is 0; bot should skip invoice


class BotRevokeDeviceRequest(BaseModel):
    tg_id: int


class ReferralAttachRequest(BaseModel):
    tg_id: int
    referral_code: str


class PromoValidateRequest(BaseModel):
    code: str
    plan_id: str
    tg_id: int
