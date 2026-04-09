"""Fallback Docker telemetry alerts (used when Prometheus alerts are unavailable)."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, uuid4_hex


class DockerAlert(Base, TimestampMixin):
    __tablename__ = "docker_alerts"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=uuid4_hex)
    fingerprint: Mapped[str] = mapped_column(String(128), index=True, nullable=False)
    rule: Mapped[str] = mapped_column(String(128), nullable=False)
    severity: Mapped[str] = mapped_column(String(16), nullable=False, default="warning")
    host_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    container_id: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    container_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    context: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    first_seen_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    last_seen_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    resolved_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True, index=True
    )
    status_note: Mapped[str | None] = mapped_column(Text, nullable=True)

    server_id: Mapped[str | None] = mapped_column(
        String(32), ForeignKey("servers.id", ondelete="SET NULL"), nullable=True
    )
    server: Mapped["Server | None"] = relationship("Server")
