"""Admin user model."""

from __future__ import annotations

from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, uuid4_hex


class AdminUser(Base, TimestampMixin):
    __tablename__ = "admin_users"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=uuid4_hex)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role_id: Mapped[str] = mapped_column(String(32), ForeignKey("roles.id"), nullable=False)
    totp_secret: Mapped[str | None] = mapped_column(String(64), nullable=True)

    role: Mapped["Role"] = relationship(
        "Role", back_populates="admin_users", foreign_keys=[role_id]
    )
