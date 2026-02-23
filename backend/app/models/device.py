"""Device model — issued profile; store only public/metadata, not private key."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import BigInteger, DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, uuid4_hex


class Device(Base, TimestampMixin):
    __tablename__ = "devices"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=uuid4_hex)
    user_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    subscription_id: Mapped[str] = mapped_column(
        String(32), ForeignKey("subscriptions.id", ondelete="CASCADE"), nullable=False
    )
    server_id: Mapped[str] = mapped_column(
        String(32), ForeignKey("servers.id", ondelete="RESTRICT"), nullable=False
    )
    device_name: Mapped[str | None] = mapped_column(String(128), nullable=True)
    public_key: Mapped[str] = mapped_column(String(128), nullable=False)
    allowed_ips: Mapped[str | None] = mapped_column(String(64), nullable=True)  # client tunnel address e.g. 10.8.1.2/32
    config_amnezia_hash: Mapped[str | None] = mapped_column(String(64), nullable=True)
    issued_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    issued_by_admin_id: Mapped[str | None] = mapped_column(
        String(32), ForeignKey("admin_users.id", ondelete="SET NULL"), nullable=True
    )
    suspended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    data_limit_bytes: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    outline_key_id: Mapped[str | None] = mapped_column(String(32), nullable=True)

    user: Mapped["User"] = relationship("User", back_populates="devices", foreign_keys=[user_id])
    subscription: Mapped["Subscription"] = relationship(
        "Subscription", back_populates="devices", foreign_keys=[subscription_id]
    )
    server: Mapped["Server"] = relationship(
        "Server", back_populates="devices", foreign_keys=[server_id]
    )
    profile_issues: Mapped[list["ProfileIssue"]] = relationship(
        "ProfileIssue", back_populates="device", cascade="all, delete-orphan"
    )
    issued_configs: Mapped[list["IssuedConfig"]] = relationship(
        "IssuedConfig", back_populates="device", cascade="all, delete-orphan"
    )
