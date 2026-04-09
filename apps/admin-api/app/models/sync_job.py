"""SyncJob — manual/auto sync run per server."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class SyncJob(Base):
    __tablename__ = "sync_jobs"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    server_id: Mapped[str] = mapped_column(
        String(32), ForeignKey("servers.id", ondelete="CASCADE"), nullable=False
    )
    mode: Mapped[str] = mapped_column(String(16), nullable=False)  # manual | auto
    job_type: Mapped[str] = mapped_column(
        String(32), nullable=False, server_default="sync"
    )  # sync | verify | rotate | restart | healthcheck
    status: Mapped[str] = mapped_column(
        String(32), nullable=False
    )  # pending | running | completed | failed
    progress_pct: Mapped[int | None] = mapped_column(Integer, nullable=True)  # 0..100
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    request_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    error: Mapped[str | None] = mapped_column(Text, nullable=True)
    logs_tail: Mapped[list | None] = mapped_column(JSONB, nullable=True)  # last N log lines
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    server: Mapped["Server"] = relationship(
        "Server", back_populates="sync_jobs", foreign_keys=[server_id]
    )
