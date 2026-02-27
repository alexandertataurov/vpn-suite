"""Churn survey: reason and discount_offered for retention analytics."""

from __future__ import annotations

from sqlalchemy import BigInteger, Boolean, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, uuid4_hex


class ChurnSurvey(Base, TimestampMixin):
    __tablename__ = "churn_surveys"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=uuid4_hex)
    user_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    subscription_id: Mapped[str | None] = mapped_column(
        String(32),
        ForeignKey("subscriptions.id", ondelete="SET NULL"),
        nullable=True,
    )
    reason: Mapped[str] = mapped_column(String(32), nullable=False)
    discount_offered: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    user: Mapped["User"] = relationship("User", back_populates="churn_surveys")
    subscription: Mapped["Subscription | None"] = relationship(
        "Subscription", back_populates="churn_surveys"
    )
