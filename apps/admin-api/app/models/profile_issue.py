"""ProfileIssue model — version of issued config for audit/rotation."""

from __future__ import annotations

from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, uuid4_hex


class ProfileIssue(Base, TimestampMixin):
    __tablename__ = "profile_issues"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=uuid4_hex)
    device_id: Mapped[str] = mapped_column(
        String(32), ForeignKey("devices.id", ondelete="CASCADE"), nullable=False
    )
    config_version: Mapped[str] = mapped_column(String(64), nullable=False)

    device: Mapped["Device"] = relationship(
        "Device", back_populates="profile_issues", foreign_keys=[device_id]
    )
