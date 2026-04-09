"""Synthetic latency probe results used for geo-aware placement."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class LatencyProbe(Base, TimestampMixin):
    __tablename__ = "latency_probes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    agent_id: Mapped[str] = mapped_column(String(64), nullable=False)
    source_region: Mapped[str] = mapped_column(String(64), nullable=False)
    server_id: Mapped[str] = mapped_column(
        String(32), ForeignKey("servers.id", ondelete="CASCADE"), nullable=False
    )
    latency_ms: Mapped[float] = mapped_column(Float, nullable=False)
    jitter_ms: Mapped[float | None] = mapped_column(Float, nullable=True)
    packet_loss_pct: Mapped[float | None] = mapped_column(Float, nullable=True)
    probe_ts: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    server: Mapped["Server"] = relationship("Server", foreign_keys=[server_id])
