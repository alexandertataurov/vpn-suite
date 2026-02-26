"""App-level settings for admin UI (e.g. node_mode for feature flags)."""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.core.config import settings
from app.core.bot_auth import get_admin_or_bot, require_admin
from app.core.database import get_db
from app.models import (
    Device,
    FunnelEvent,
    IssuedConfig,
    Payment,
    PaymentEvent,
    ProfileIssue,
    PromoRedemption,
    Referral,
    Subscription,
    User,
)
from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/app", tags=["app"])


@router.get("/settings")
def get_app_settings(_principal=Depends(get_admin_or_bot)):
    """Return app settings used by the admin UI (e.g. to disable Reconcile when NODE_MODE=agent or NODE_DISCOVERY=agent). Any authenticated admin or bot."""
    return {"node_mode": settings.node_mode, "node_discovery": settings.node_discovery}


class CleanupDbBody(BaseModel):
    confirm_token: str


@router.post("/settings/cleanup-db")
async def cleanup_db(
    body: CleanupDbBody,
    _admin=Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Delete all end-user data: devices, users, subscriptions, payments, funnel events, etc. Admin only; requires CLEANUP_DB_CONFIRM_TOKEN."""
    if body.confirm_token != settings.cleanup_db_confirm_token:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid confirmation token")
    # FK-safe order: child tables first
    for model in (
        ProfileIssue,
        IssuedConfig,
        Device,
        PaymentEvent,
        Payment,
        PromoRedemption,
        Referral,
        Subscription,
        FunnelEvent,
        User,
    ):
        await db.execute(delete(model))
    await db.commit()
    return {"ok": True, "message": "Database cleaned: devices, users, subscriptions, payments, and related data removed."}
