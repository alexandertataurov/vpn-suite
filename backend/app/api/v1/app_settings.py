"""App-level settings for admin UI (e.g. node_mode for feature flags)."""

import os
from pathlib import Path

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


def _serialize_app_settings() -> dict:
    """Return a safe, UI-friendly view of app settings (no secrets)."""
    return {
        "environment": settings.environment,
        "node_mode": settings.node_mode,
        "node_discovery": settings.node_discovery,
        "vpn_default_host": settings.vpn_default_host,
        "telemetry_prometheus_url": settings.telemetry_prometheus_url,
        "telemetry_loki_url": settings.telemetry_loki_url,
        "otel_traces_endpoint": settings.otel_traces_endpoint,
        "docker_telemetry_hosts_json": settings.docker_telemetry_hosts_json,
        "docker_telemetry_enabled": bool(settings.docker_telemetry_hosts_json),
        "live_obs_enabled": settings.live_obs_enabled,
        "config_regen_daily_cap": settings.config_regen_daily_cap,
        "referral_reward_bonus_days": settings.referral_reward_bonus_days,
        "trial_duration_hours": settings.trial_duration_hours,
        "retention_discount_percent": settings.retention_discount_percent,
        "cors_allow_origins": settings.cors_allow_origins,
    }


def _get_env_file_path() -> Path:
    """Resolve the active .env file path (ENV_FILE or .env in current working directory)."""
    env_file_name = os.environ.get("ENV_FILE", ".env")
    env_path = Path(env_file_name)
    if not env_path.is_absolute():
        env_path = Path.cwd() / env_file_name
    return env_path


@router.get("/settings")
def get_app_settings(_principal=Depends(get_admin_or_bot)):
    """Return app settings used by the admin UI (e.g. to disable Reconcile when NODE_MODE=agent or NODE_DISCOVERY=agent). Any authenticated admin or bot."""
    return _serialize_app_settings()


class AppSettingsUpdateBody(BaseModel):
    """Editable app-level settings (safe subset of .env)."""

    config_regen_daily_cap: int | None = None
    referral_reward_bonus_days: int | None = None
    trial_duration_hours: int | None = None
    retention_discount_percent: int | None = None
    cors_allow_origins: str | None = None


@router.patch("/settings")
def update_app_settings(
    body: AppSettingsUpdateBody,
    _admin=Depends(require_admin),
):
    """Update non-secret app settings at runtime. Admin only.

    Changes apply immediately for new requests but are not written back to the .env file;
    they will be reset on process restart.
    """
    if body.config_regen_daily_cap is not None:
        if body.config_regen_daily_cap < 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="config_regen_daily_cap must be >= 0",
            )
        settings.config_regen_daily_cap = body.config_regen_daily_cap

    if body.referral_reward_bonus_days is not None:
        if body.referral_reward_bonus_days < 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="referral_reward_bonus_days must be >= 0",
            )
        settings.referral_reward_bonus_days = body.referral_reward_bonus_days

    if body.trial_duration_hours is not None:
        if body.trial_duration_hours < 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="trial_duration_hours must be >= 0",
            )
        settings.trial_duration_hours = body.trial_duration_hours

    if body.retention_discount_percent is not None:
        if not 0 <= body.retention_discount_percent <= 100:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="retention_discount_percent must be between 0 and 100",
            )
        settings.retention_discount_percent = body.retention_discount_percent

    if body.cors_allow_origins is not None:
        # Allow empty string to effectively disable CORS allowlist.
        settings.cors_allow_origins = body.cors_allow_origins

    return _serialize_app_settings()


class EnvFileOut(BaseModel):
    """Raw .env file content for full-screen editor."""

    path: str
    content: str


class EnvFileUpdateBody(BaseModel):
    """Body for updating the .env file."""

    content: str


@router.get("/env", response_model=EnvFileOut)
def get_env_file(_admin=Depends(require_admin)) -> EnvFileOut:
    """Return the full .env file content for admin editing (includes secrets)."""
    path = _get_env_file_path()
    if not path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f".env file not found at {path}",
        )
    try:
        content = path.read_text(encoding="utf-8")
    except OSError:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to read .env file",
        )
    return EnvFileOut(path=str(path), content=content)


@router.put("/env", response_model=EnvFileOut)
def update_env_file(body: EnvFileUpdateBody, _admin=Depends(require_admin)) -> EnvFileOut:
    """Overwrite the .env file with new content. Admin only.

    Changes are written to disk but take effect only after services are restarted.
    """
    path = _get_env_file_path()
    try:
        path.write_text(body.content, encoding="utf-8")
    except OSError:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to write .env file",
        )
    return EnvFileOut(path=str(path), content=body.content)


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
