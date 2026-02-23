"""Plan model — tariff (duration, price)."""

from __future__ import annotations

from decimal import Decimal

from sqlalchemy import Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, uuid4_hex


class Plan(Base, TimestampMixin):
    __tablename__ = "plans"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=uuid4_hex)
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    duration_days: Mapped[int] = mapped_column(Integer, nullable=False)
    price_currency: Mapped[str] = mapped_column(String(8), nullable=False)
    price_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)

    subscriptions: Mapped[list["Subscription"]] = relationship(
        "Subscription", back_populates="plan", foreign_keys="Subscription.plan_id"
    )
    bandwidth_policy: Mapped["PlanBandwidthPolicy | None"] = relationship(
        "PlanBandwidthPolicy",
        back_populates="plan",
        foreign_keys="PlanBandwidthPolicy.plan_id",
        uselist=False,
    )
