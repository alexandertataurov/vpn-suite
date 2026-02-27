"""Churn risk score: batch-computed per user/subscription."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import BigInteger, DateTime, Float, ForeignKey, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, uuid4_hex


class ChurnRiskScore(Base, TimestampMixin):
    __tablename__ = "churn_risk_scores"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=uuid4_hex)
    user_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    subscription_id: Mapped[str | None] = mapped_column(
        String(32), ForeignKey("subscriptions.id", ondelete="CASCADE"), nullable=True
    )
    score: Mapped[float] = mapped_column(Float, nullable=False)  # 0-1
    factors: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    computed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
