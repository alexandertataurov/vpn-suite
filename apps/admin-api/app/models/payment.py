"""Payment model — provider transaction, idempotent by external_id."""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from sqlalchemy import BigInteger, DateTime, ForeignKey, Numeric, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, uuid4_hex


class Payment(Base, TimestampMixin):
    __tablename__ = "payments"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=uuid4_hex)
    user_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    subscription_id: Mapped[str] = mapped_column(
        String(32), ForeignKey("subscriptions.id", ondelete="CASCADE"), nullable=False
    )
    provider: Mapped[str] = mapped_column(String(32), nullable=False)  # telegram_stars, etc.
    status: Mapped[str] = mapped_column(String(32), nullable=False)  # canonical payment state
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(8), nullable=False)
    external_id: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    webhook_payload: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    kind: Mapped[str] = mapped_column(String(32), nullable=False, default="subscription")
    source: Mapped[str] = mapped_column(String(32), nullable=False, default="webhook")
    idempotency_key: Mapped[str | None] = mapped_column(String(255), nullable=True)
    provider_payment_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    provider_status: Mapped[str | None] = mapped_column(String(64), nullable=True)
    invoice_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    expected_amount: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    paid_amount: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    paid_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    subscription_applied_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    failure_code: Mapped[str | None] = mapped_column(String(64), nullable=True)
    failure_message: Mapped[str | None] = mapped_column(String(255), nullable=True)
    telegram_payment_charge_id: Mapped[str | None] = mapped_column(String(255), nullable=True)

    user: Mapped["User"] = relationship("User", back_populates="payments", foreign_keys=[user_id])
    subscription: Mapped["Subscription"] = relationship(
        "Subscription", back_populates="payments", foreign_keys=[subscription_id]
    )
    events: Mapped[list["PaymentEvent"]] = relationship(
        "PaymentEvent", back_populates="payment", cascade="all, delete-orphan"
    )


class PaymentEvent(Base, TimestampMixin):
    __tablename__ = "payment_events"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=uuid4_hex)
    payment_id: Mapped[str] = mapped_column(
        String(32), ForeignKey("payments.id", ondelete="CASCADE"), nullable=False
    )
    event_type: Mapped[str] = mapped_column(String(64), nullable=False)
    payload: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    payment: Mapped["Payment"] = relationship(
        "Payment", back_populates="events", foreign_keys=[payment_id]
    )
