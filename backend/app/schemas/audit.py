"""Audit log schemas."""

from datetime import datetime

from pydantic import BaseModel

from app.schemas.base import OrmSchema


class AuditLogOut(OrmSchema):
    id: int
    admin_id: str | None
    action: str
    resource_type: str
    resource_id: str | None
    old_new: dict | None
    request_id: str | None = None
    created_at: datetime


class AuditLogList(BaseModel):
    items: list[AuditLogOut]
    total: int
