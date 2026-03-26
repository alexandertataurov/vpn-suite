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
    telegram_user: dict | None = None


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


class CreateDonationInvoiceRequest(BaseModel):
    tg_id: int
    star_count: int
    subscription_id: str | None = None


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


class TelegramStarsConfirmRequest(BaseModel):
    """Payload from bot when Telegram sends successful_payment (Stars)."""

    tg_id: int
    invoice_payload: str  # payment_id from create-invoice
    telegram_payment_charge_id: str | None = None
    total_amount: int | None = None  # Stars


class BotRevokeDeviceRequest(BaseModel):
    tg_id: int


class ReferralAttachRequest(BaseModel):
    tg_id: int
    referral_code: str


class PromoValidateRequest(BaseModel):
    code: str
    plan_id: str
    tg_id: int


class TrialStartRequest(BaseModel):
    tg_id: int


class TrialStartResponse(BaseModel):
    subscription_id: str
    device_id: str
    server_id: str
    server_name: str
    server_region: str
    config_awg: str
    config_wg_obf: str
    config_wg: str
    trial_ends_at: str  # ISO datetime
    peer_created: bool


class ChurnSurveyRequest(BaseModel):
    tg_id: int
    subscription_id: str | None = None
    reason: str  # too_expensive | speed_issue | not_needed | other


class ChurnSurveyResponse(BaseModel):
    recorded: bool
    retention_discount_offered: bool = False
    pause_offered: bool = False
    discount_percent: int | None = None
