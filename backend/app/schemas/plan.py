"""Plan request/response schemas."""

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel

from app.schemas.base import OrmSchema


class PlanCreate(BaseModel):
    name: str
    duration_days: int
    price_currency: str
    price_amount: Decimal


class PlanUpdate(BaseModel):
    name: str | None = None
    duration_days: int | None = None
    price_currency: str | None = None
    price_amount: Decimal | None = None


class PlanOut(OrmSchema):
    id: str
    name: str
    duration_days: int
    price_currency: str
    price_amount: Decimal
    created_at: datetime


class PlanList(BaseModel):
    items: list[PlanOut]
    total: int
