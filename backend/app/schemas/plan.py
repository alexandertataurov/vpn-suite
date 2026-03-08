"""Plan request/response schemas."""

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, field_validator

from app.schemas.base import OrmSchema

UPSELL_METHOD_VALUES = frozenset({"device_limit", "expiry", "trial_end", "referral"})


def _validate_upsell_methods(v: list[str] | None) -> list[str] | None:
    if v is None:
        return None
    invalid = set(v) - UPSELL_METHOD_VALUES
    if invalid:
        raise ValueError(f"Invalid upsell_methods: {invalid}. Allowed: {sorted(UPSELL_METHOD_VALUES)}")
    return list(v) if v else None


class PlanCreate(BaseModel):
    name: str
    duration_days: int
    device_limit: int = 1
    price_currency: str
    price_amount: Decimal
    upsell_methods: list[str] | None = None

    @field_validator("upsell_methods")
    @classmethod
    def check_upsell_methods(cls, v: list[str] | None) -> list[str] | None:
        return _validate_upsell_methods(v)


class PlanUpdate(BaseModel):
    name: str | None = None
    duration_days: int | None = None
    device_limit: int | None = None
    price_currency: str | None = None
    price_amount: Decimal | None = None
    upsell_methods: list[str] | None = None

    @field_validator("upsell_methods")
    @classmethod
    def check_upsell_methods(cls, v: list[str] | None) -> list[str] | None:
        return _validate_upsell_methods(v)


class PlanOut(OrmSchema):
    id: str
    name: str
    duration_days: int
    device_limit: int
    price_currency: str
    price_amount: Decimal
    created_at: datetime
    upsell_methods: list[str] | None = None


class PlanList(BaseModel):
    items: list[PlanOut]
    total: int
