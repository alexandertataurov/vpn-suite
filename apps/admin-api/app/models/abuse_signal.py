"""Abuse signal: per-user risk signal from detection engine."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import BigInteger, DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, uuid4_hex


class AbuseSignal(Base, TimestampMixin):
    __tablename__ = "abuse_signals"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=uuid4_hex)
    user_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    signal_type: Mapped[str] = mapped_column(
        String(64), nullable=False
    )  # shared_config, excess_devices, ip_anomaly, peer_regen, payment_fraud, referral_fraud
    severity: Mapped[str] = mapped_column(String(32), nullable=False)  # low, medium, high
    payload: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    resolved_by: Mapped[str | None] = mapped_column(String(32), nullable=True)
