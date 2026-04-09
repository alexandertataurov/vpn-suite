"""ServerHealthLog — history of health-check results for N consecutive fail logic."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class ServerHealthLog(Base):
    __tablename__ = "server_health_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    server_id: Mapped[str] = mapped_column(
        String(32), ForeignKey("servers.id", ondelete="CASCADE"), nullable=False
    )
    status: Mapped[str] = mapped_column(String(32), nullable=False)  # ok, degraded, unreachable
    latency_ms: Mapped[float | None] = mapped_column(Float, nullable=True)
    handshake_ok: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    ts: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    server: Mapped["Server"] = relationship(
        "Server", back_populates="health_logs", foreign_keys=[server_id]
    )
