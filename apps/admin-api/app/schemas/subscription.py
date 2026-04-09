"""Subscription request/response schemas."""

from datetime import datetime, timezone

from pydantic import BaseModel, computed_field

from app.schemas.base import OrmSchema


class SubscriptionCreate(BaseModel):
    user_id: int
    plan_id: str
    valid_from: datetime
    valid_until: datetime
    device_limit: int = 1


class SubscriptionUpdate(BaseModel):
    valid_until: datetime | None = None
    device_limit: int | None = None
    status: str | None = None
    access_status: str | None = None
    grace_until: datetime | None = None
    grace_reason: str | None = None


class SubscriptionOut(OrmSchema):
    id: str
    user_id: int
    plan_id: str
    valid_from: datetime
    valid_until: datetime
    device_limit: int
    status: str
    created_at: datetime
    is_trial: bool = False
    trial_ends_at: datetime | None = None
    paused_at: datetime | None = None
    pause_reason: str | None = None
    subscription_status: str = "active"
    access_status: str = "enabled"
    billing_status: str = "paid"
    renewal_status: str = "auto_renew_on"
    grace_until: datetime | None = None
    grace_reason: str | None = None
    cancel_at_period_end: bool = False

    @computed_field  # type: ignore[prop-decorator]
    @property
    def effective_status(self) -> str:
        """Derived display status from split-state lifecycle, not legacy status alone."""
        now = datetime.now(timezone.utc)
        until = (
            self.valid_until.replace(tzinfo=timezone.utc)
            if self.valid_until.tzinfo is None
            else self.valid_until
        )
        sub_status = (self.subscription_status or self.status or "").strip().lower()
        access_status = (self.access_status or "enabled").strip().lower()

        if sub_status == "pending":
            return "pending"
        if sub_status == "cancelled":
            return "cancelled"
        if access_status == "paused" and sub_status == "active":
            return "paused"
        if access_status == "grace":
            return "grace"
        if sub_status == "expired" or until < now:
            return "expired"
        if access_status == "blocked" and sub_status == "active":
            return "blocked"
        if self.cancel_at_period_end and sub_status == "active" and access_status == "enabled":
            return "cancel_at_period_end"
        return sub_status or (self.status or "")


class SubscriptionList(BaseModel):
    items: list[SubscriptionOut]
    total: int
