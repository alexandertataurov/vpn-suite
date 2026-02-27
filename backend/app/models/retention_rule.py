"""Retention rule: condition + action for automation engine."""

from __future__ import annotations

from sqlalchemy import Boolean, DateTime, Integer, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, uuid4_hex


class RetentionRule(Base, TimestampMixin):
    __tablename__ = "retention_rules"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=uuid4_hex)
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    condition_json: Mapped[dict] = mapped_column(JSONB, nullable=False)  # expiry_days_lte, lifetime_months_gte, etc.
    action_type: Mapped[str] = mapped_column(String(32), nullable=False)  # reminder, discount_percent, campaign
    action_params: Mapped[dict | None] = mapped_column(JSONB, nullable=True)  # e.g. {"discount": 15}
    priority: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
