"""App-level settings for admin UI (feature flags + guarded dangerous controls)."""

import os
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.bot_auth import BotPrincipal, WebAppPrincipal, get_admin_or_bot
from app.core.config import settings
from app.core.constants import (
    PERM_SETTINGS_DANGEROUS,
    PERM_SETTINGS_READ,
    PERM_SETTINGS_WRITE,
)
from app.core.database import get_db
from app.core.rbac import require_permission
from app.models import (
    AdminUser,
    Device,
    FunnelEvent,
    IssuedConfig,
    Payment,
    PaymentEvent,
    ProfileIssue,
    PromoRedemption,
    Referral,
    Role,
    Subscription,
    User,
)

router = APIRouter(prefix="/app", tags=["app"])


class AppSettingsCapabilities(BaseModel):
    can_read: bool = False
    can_write: bool = False
    can_manage_dangerous: bool = False
    env_editor_enabled: bool = False
    can_edit_env: bool = False
    can_cleanup_db: bool = False


def _has_permission(perms: set[str], permission: str) -> bool:
    return "*" in perms or permission in perms


async def _load_permissions(db: AsyncSession, role_id: str) -> set[str]:
    result = await db.execute(select(Role).where(Role.id == role_id))
    role = result.scalar_one_or_none()
    if not role:
        return set()
    raw = role.permissions if isinstance(role.permissions, list) else []
    return {str(p) for p in raw if isinstance(p, str)}


async def _build_capabilities(
    principal: AdminUser | BotPrincipal | WebAppPrincipal,
    db: AsyncSession,
) -> AppSettingsCapabilities:
    if not isinstance(principal, AdminUser):
        return AppSettingsCapabilities(env_editor_enabled=settings.app_env_editor_enabled)

    perms = await _load_permissions(db, principal.role_id)
    can_read = _has_permission(perms, PERM_SETTINGS_READ)
    can_write = _has_permission(perms, PERM_SETTINGS_WRITE)
    can_dangerous = _has_permission(perms, PERM_SETTINGS_DANGEROUS)
    return AppSettingsCapabilities(
        can_read=can_read,
        can_write=can_write,
        can_manage_dangerous=can_dangerous,
        env_editor_enabled=settings.app_env_editor_enabled,
        can_edit_env=can_dangerous and settings.app_env_editor_enabled,
        can_cleanup_db=can_dangerous,
    )


def _serialize_app_settings(capabilities: AppSettingsCapabilities) -> dict:
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
        "capabilities": capabilities.model_dump(),
    }


def _get_env_file_path() -> Path:
    """Resolve active env file path (ENV_FILE or .env in current working directory)."""
    env_file_name = os.environ.get("ENV_FILE", ".env")
    env_path = Path(env_file_name)
    if not env_path.is_absolute():
        env_path = Path.cwd() / env_file_name
    return env_path


def _ensure_env_editor_enabled() -> None:
    if not settings.app_env_editor_enabled:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "code": "ENV_EDITOR_DISABLED",
                "message": "Environment editor is disabled by APP_ENV_EDITOR_ENABLED=0",
            },
        )


@router.get("/settings")
async def get_app_settings(
    principal: AdminUser | BotPrincipal | WebAppPrincipal = Depends(get_admin_or_bot),
    db: AsyncSession = Depends(get_db),
):
    """Return safe app settings plus capability flags for critical settings controls."""
    if not isinstance(principal, AdminUser):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    capabilities = await _build_capabilities(principal, db)
    if not (capabilities.can_read or capabilities.can_write or capabilities.can_manage_dangerous):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    return _serialize_app_settings(capabilities)


class AppSettingsUpdateBody(BaseModel):
    """Editable app-level settings (safe subset of .env)."""

    config_regen_daily_cap: int | None = None
    referral_reward_bonus_days: int | None = None
    trial_duration_hours: int | None = None
    retention_discount_percent: int | None = None
    cors_allow_origins: str | None = None


@router.patch("/settings")
def update_app_settings(
    request: Request,
    body: AppSettingsUpdateBody,
    _admin=Depends(require_permission(PERM_SETTINGS_WRITE)),
):
    """Update non-secret app settings at runtime. Changes reset on process restart."""
    changes: dict[str, int | str] = {}

    if body.config_regen_daily_cap is not None:
        if body.config_regen_daily_cap < 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="config_regen_daily_cap must be >= 0",
            )
        settings.config_regen_daily_cap = body.config_regen_daily_cap
        changes["config_regen_daily_cap"] = body.config_regen_daily_cap

    if body.referral_reward_bonus_days is not None:
        if body.referral_reward_bonus_days < 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="referral_reward_bonus_days must be >= 0",
            )
        settings.referral_reward_bonus_days = body.referral_reward_bonus_days
        changes["referral_reward_bonus_days"] = body.referral_reward_bonus_days

    if body.trial_duration_hours is not None:
        if body.trial_duration_hours < 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="trial_duration_hours must be >= 0",
            )
        settings.trial_duration_hours = body.trial_duration_hours
        changes["trial_duration_hours"] = body.trial_duration_hours

    if body.retention_discount_percent is not None:
        if not 0 <= body.retention_discount_percent <= 100:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="retention_discount_percent must be between 0 and 100",
            )
        settings.retention_discount_percent = body.retention_discount_percent
        changes["retention_discount_percent"] = body.retention_discount_percent

    if body.cors_allow_origins is not None:
        settings.cors_allow_origins = body.cors_allow_origins
        changes["cors_allow_origins"] = body.cors_allow_origins

    request.state.audit_resource_type = "app_settings"
    request.state.audit_resource_id = "runtime"
    request.state.audit_old_new = {"updated": changes}

    capabilities = AppSettingsCapabilities(
        can_read=True,
        can_write=True,
        can_manage_dangerous=False,
        env_editor_enabled=settings.app_env_editor_enabled,
        can_edit_env=False,
        can_cleanup_db=False,
    )
    return _serialize_app_settings(capabilities)


class EnvFileOut(BaseModel):
    """Raw env file content for full-screen editor."""

    path: str
    content: str


class EnvFileUpdateBody(BaseModel):
    """Body for updating the env file."""

    content: str


@router.get("/env", response_model=EnvFileOut)
def get_env_file(
    request: Request,
    _admin=Depends(require_permission(PERM_SETTINGS_DANGEROUS)),
) -> EnvFileOut:
    """Return full env file content for admin editing (includes secrets)."""
    _ensure_env_editor_enabled()
    request.state.audit_resource_type = "app_settings"
    request.state.audit_resource_id = "env"
    request.state.audit_old_new = {"action": "env.read"}

    path = _get_env_file_path()
    if not path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f".env file not found at {path}",
        )
    try:
        content = path.read_text(encoding="utf-8")
    except OSError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to read .env file",
        ) from exc
    return EnvFileOut(path=str(path), content=content)


@router.put("/env", response_model=EnvFileOut)
def update_env_file(
    request: Request,
    body: EnvFileUpdateBody,
    _admin=Depends(require_permission(PERM_SETTINGS_DANGEROUS)),
) -> EnvFileOut:
    """Overwrite the env file. Requires settings:dangerous and env-editor feature flag."""
    _ensure_env_editor_enabled()
    path = _get_env_file_path()
    try:
        path.write_text(body.content, encoding="utf-8")
    except OSError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to write .env file",
        ) from exc
    request.state.audit_resource_type = "app_settings"
    request.state.audit_resource_id = "env"
    request.state.audit_old_new = {
        "action": "env.write",
        "bytes": len(body.content.encode("utf-8")),
        "path": str(path),
    }
    return EnvFileOut(path=str(path), content=body.content)


class CleanupDbBody(BaseModel):
    confirm_token: str


@router.post("/settings/cleanup-db")
async def cleanup_db(
    request: Request,
    body: CleanupDbBody,
    _admin=Depends(require_permission(PERM_SETTINGS_DANGEROUS)),
    db: AsyncSession = Depends(get_db),
):
    """Delete end-user data. Requires settings:dangerous and CLEANUP_DB_CONFIRM_TOKEN."""
    if body.confirm_token != settings.cleanup_db_confirm_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid confirmation token",
        )

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
    request.state.audit_resource_type = "app_settings"
    request.state.audit_resource_id = "cleanup-db"
    request.state.audit_old_new = {"action": "cleanup_db", "result": "ok"}
    return {
        "ok": True,
        "message": "Database cleaned: devices, users, subscriptions, payments, and related data removed.",
    }
