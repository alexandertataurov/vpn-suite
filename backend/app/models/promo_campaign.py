"""Promo campaign: targeted offer (expiry_soon, win_back, etc.)."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, Integer, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, uuid4_hex


class PromoCampaign(Base, TimestampMixin):
    __tablename__ = "promo_campaigns"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=uuid4_hex)
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    discount_percent: Mapped[int] = mapped_column(Integer, nullable=False)
    valid_from: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    valid_until: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    target_rule: Mapped[str | None] = mapped_column(
        String(64), nullable=True
    )  # expiry_soon, win_back
    max_redemptions: Mapped[int | None] = mapped_column(Integer, nullable=True)
    extra_params: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
