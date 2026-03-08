"""User model — identification by tg_id, optional email/phone."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import BigInteger, Boolean, DateTime, Integer, String, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    tg_id: Mapped[int] = mapped_column(BigInteger, unique=True, nullable=False, index=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)
    phone: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    meta: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    is_banned: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    onboarding_completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    onboarding_step: Mapped[int | None] = mapped_column(Integer, nullable=True)
    onboarding_version: Mapped[int] = mapped_column(
        Integer, nullable=False, default=1, server_default="1"
    )
    first_connected_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    last_connection_confirmed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    preferred_server_id: Mapped[str | None] = mapped_column(String(32), nullable=True)
    server_auto_select: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    last_active_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    subscriptions: Mapped[list["Subscription"]] = relationship(
        "Subscription", back_populates="user", foreign_keys="Subscription.user_id"
    )
    devices: Mapped[list["Device"]] = relationship(
        "Device", back_populates="user", foreign_keys="Device.user_id"
    )
    payments: Mapped[list["Payment"]] = relationship(
        "Payment", back_populates="user", foreign_keys="Payment.user_id"
    )
    churn_surveys: Mapped[list["ChurnSurvey"]] = relationship(
        "ChurnSurvey", back_populates="user", foreign_keys="ChurnSurvey.user_id"
    )
    entitlement_events: Mapped[list["EntitlementEvent"]] = relationship(
        "EntitlementEvent", back_populates="user", foreign_keys="EntitlementEvent.user_id"
    )
