"""Entitlement event model — immutable log of access/subscription changes."""

from __future__ import annotations

from sqlalchemy import BigInteger, ForeignKey, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, uuid4_hex


class EntitlementEvent(Base, TimestampMixin):
    __tablename__ = "entitlement_events"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=uuid4_hex)
    subscription_id: Mapped[str | None] = mapped_column(
        String(32), ForeignKey("subscriptions.id", ondelete="SET NULL"), nullable=True
    )
    user_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    event_type: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    payload: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    subscription: Mapped["Subscription | None"] = relationship(
        "Subscription", back_populates="entitlement_events", foreign_keys=[subscription_id]
    )
    user: Mapped["User"] = relationship("User", back_populates="entitlement_events", foreign_keys=[user_id])
