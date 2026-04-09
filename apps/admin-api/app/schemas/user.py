"""User request/response schemas."""

from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from pydantic import BaseModel

from app.schemas.base import OrmSchema

if TYPE_CHECKING:
    from app.schemas.subscription import SubscriptionOut


class UserCreate(BaseModel):
    tg_id: int
    email: str | None = None
    phone: str | None = None
    meta: dict | None = None


class UserUpdate(BaseModel):
    email: str | None = None
    phone: str | None = None
    meta: dict | None = None
    is_banned: bool | None = None
    confirm_token: str | None = None


class UserDeleteBody(BaseModel):
    """Required body for DELETE /users/:id. confirm_token must match settings.delete_user_confirm_token."""

    confirm_token: str


class UserOut(OrmSchema):
    id: int
    tg_id: int
    email: str | None
    phone: str | None
    meta: dict | None
    is_banned: bool
    created_at: datetime
    updated_at: datetime


class UserList(BaseModel):
    items: list[UserOut]
    total: int
    limit: int
    offset: int


class UserDetail(UserOut):
    subscriptions: list[SubscriptionOut] = []


from app.schemas.subscription import SubscriptionOut  # noqa: E402, F401, I001 — runtime ref for model_rebuild()

UserDetail.model_rebuild()
