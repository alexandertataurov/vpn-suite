"""Subscription model — user + plan, valid_from/valid_until, device_limit, trial, pause."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import BigInteger, Boolean, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, uuid4_hex


class Subscription(Base, TimestampMixin):
    __tablename__ = "subscriptions"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=uuid4_hex)
    user_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    plan_id: Mapped[str] = mapped_column(
        String(32), ForeignKey("plans.id", ondelete="RESTRICT"), nullable=False
    )
    valid_from: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    valid_until: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    device_limit: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="active", nullable=False)
    is_trial: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    trial_ends_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    paused_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    pause_reason: Mapped[str | None] = mapped_column(String(64), nullable=True)
    reminder_3d_sent_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    reminder_1d_sent_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    user: Mapped["User"] = relationship(
        "User", back_populates="subscriptions", foreign_keys=[user_id]
    )
    plan: Mapped["Plan"] = relationship(
        "Plan", back_populates="subscriptions", foreign_keys=[plan_id]
    )
    devices: Mapped[list["Device"]] = relationship(
        "Device", back_populates="subscription", foreign_keys="Device.subscription_id"
    )
    payments: Mapped[list["Payment"]] = relationship(
        "Payment", back_populates="subscription", foreign_keys="Payment.subscription_id"
    )
    churn_surveys: Mapped[list["ChurnSurvey"]] = relationship(
        "ChurnSurvey",
        back_populates="subscription",
        foreign_keys="ChurnSurvey.subscription_id",
    )
