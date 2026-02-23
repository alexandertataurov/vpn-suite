"""Per-plan bandwidth throttling policy (policy-as-code for tc enforcement)."""

from __future__ import annotations

from sqlalchemy import Boolean, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, uuid4_hex


class PlanBandwidthPolicy(Base, TimestampMixin):
    __tablename__ = "plan_bandwidth_policies"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=uuid4_hex)
    plan_id: Mapped[str] = mapped_column(
        String(32), ForeignKey("plans.id", ondelete="CASCADE"), nullable=False, unique=True
    )
    rate_mbps: Mapped[int] = mapped_column(Integer, nullable=False)
    ceil_mbps: Mapped[int | None] = mapped_column(Integer, nullable=True)
    burst_kb: Mapped[int] = mapped_column(Integer, nullable=False, default=256)
    priority: Mapped[int] = mapped_column(Integer, nullable=False, default=3)
    enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    plan: Mapped["Plan"] = relationship(
        "Plan", foreign_keys=[plan_id], back_populates="bandwidth_policy"
    )
