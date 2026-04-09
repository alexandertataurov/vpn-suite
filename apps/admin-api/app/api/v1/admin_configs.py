"""One-time config download and QR by token (no JWT; token is secret)."""

import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.constants import PERM_CLUSTER_READ
from app.core.database import get_db
from app.core.error_responses import not_found_404
from app.core.logging_config import extra_for_event
from app.core.metrics import config_download_total
from app.core.rate_limit import rate_limit_config_download
from app.core.rbac import require_permission
from app.core.security import decrypt_config
from app.models import Device, IssuedConfig

# Config may only be delivered when peer is applied on server (no-drift invariant).
APPLIED_OR_VERIFIED = ("APPLIED", "VERIFIED")
# In agent mode: block only explicit failures (ERROR, FAILED_APPLY); allow all else.
BLOCKED_IN_AGENT = ("ERROR", "FAILED_APPLY")


def _peer_applied_ok(device: Device | None) -> bool:
    """True if device is applied (or acceptable in agent mode)."""
    if not device:
        return False
    st = (device.apply_status or "").strip()
    if st in APPLIED_OR_VERIFIED:
        return True
    if settings.node_mode == "agent" or settings.node_discovery == "agent":
        return st not in BLOCKED_IN_AGENT
    return False


router = APIRouter(prefix="/admin/configs", tags=["admin-configs"])
_log = logging.getLogger(__name__)


@router.get("/issued/{issued_config_id}/content")
async def get_issued_config_content(
    issued_config_id: str,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_permission(PERM_CLUSTER_READ)),
):
    """Return decrypted config content for an issued config. Admin JWT required. Does not consume token."""
    result = await db.execute(select(IssuedConfig).where(IssuedConfig.id == issued_config_id))
    issued = result.scalar_one_or_none()
    if not issued:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "code": "NOT_FOUND",
                "message": "Config not found. It may have been reissued or removed. Refresh the device page and use the latest config link, or reissue the config.",
            },
        )
    dev_result = await db.execute(select(Device).where(Device.id == issued.device_id))
    device = dev_result.scalar_one_or_none()
    if not _peer_applied_ok(device):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "code": "PEER_NOT_APPLIED",
                "message": "Peer not yet applied on server; try again shortly.",
            },
        )
    if not issued.config_encrypted:
        raise not_found_404("Config", issued_config_id)
    try:
        content = decrypt_config(issued.config_encrypted)
    except Exception as e:
        _log.warning(
            "Config decryption failed for issued_config_id=%s: %s",
            issued_config_id,
            type(e).__name__,
            exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "DECRYPT_FAILED",
                "message": "Config was encrypted with a different key (e.g. after SECRET_KEY rotation). Reissue this device's config in Admin (Devices → device → Reissue) and use the new download link.",
            },
        )
    return {"content": content}


def _token_hash(token: str) -> str:
    import hashlib

    return hashlib.sha256(token.encode()).hexdigest()


async def _resolve_config(token: str, db: AsyncSession) -> IssuedConfig | None:
    token_hash = _token_hash(token)
    result = await db.execute(
        select(IssuedConfig).where(IssuedConfig.download_token_hash == token_hash)
    )
    return result.scalar_one_or_none()


async def _require_peer_applied(issued: IssuedConfig, db: AsyncSession, endpoint: str) -> None:
    """Raise 503 PEER_NOT_APPLIED if device not applied (agent mode: PENDING_APPLY allowed)."""
    dev_result = await db.execute(select(Device).where(Device.id == issued.device_id))
    device = dev_result.scalar_one_or_none()
    if not _peer_applied_ok(device):
        config_download_total.labels(endpoint=endpoint, status="peer_not_applied").inc()
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "code": "PEER_NOT_APPLIED",
                "message": "Peer not yet applied on server; try again shortly.",
            },
        )


@router.get("/{token}/download")
async def download_config(
    request: Request,
    token: str,
    db: AsyncSession = Depends(get_db),
):
    """Return .conf as attachment; mark token consumed. One-time use."""
    await rate_limit_config_download(request, token)
    issued = await _resolve_config(token, db)
    if not issued:
        config_download_total.labels(endpoint="download", status="not_found").inc()
        raise not_found_404("Token", token)
    if issued.consumed_at:
        config_download_total.labels(endpoint="download", status="already_used").inc()
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="Token already used",
        )
    if issued.expires_at and issued.expires_at < datetime.now(timezone.utc):
        config_download_total.labels(endpoint="download", status="expired").inc()
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="Token expired",
        )
    await _require_peer_applied(issued, db, "download")
    if not issued.config_encrypted:
        config_download_total.labels(endpoint="download", status="not_found").inc()
        raise not_found_404("Config", None)
    try:
        config_text = decrypt_config(issued.config_encrypted)
    except Exception as e:
        config_download_total.labels(endpoint="download", status="decrypt_error").inc()
        _log.warning(
            "Config decryption failed on download issued=%s: %s",
            issued.id,
            type(e).__name__,
            exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "DECRYPT_FAILED",
                "message": "Config was encrypted with a different key (e.g. after SECRET_KEY rotation). Reissue this device's config in Admin and use the new download link.",
            },
        )
    # Mark consumed
    issued.consumed_at = datetime.now(timezone.utc)
    await db.commit()
    config_download_total.labels(endpoint="download", status="success").inc()
    _log.info(
        "provision config downloaded",
        extra=extra_for_event(
            event="provision.config.downloaded",
            entity_id=issued.id,
        ),
    )
    return Response(
        content=config_text,
        media_type="text/plain; charset=utf-8",
        headers={
            "Content-Disposition": 'attachment; filename="client.conf"',
        },
    )


@router.get("/{token}/qr")
async def get_config_qr(
    request: Request,
    token: str,
    db: AsyncSession = Depends(get_db),
):
    """Return JSON with qr_payload (config text for frontend to render QR). Optionally mark consumed."""
    await rate_limit_config_download(request, token)
    issued = await _resolve_config(token, db)
    if not issued:
        config_download_total.labels(endpoint="qr", status="not_found").inc()
        raise not_found_404("Token", token)
    if issued.expires_at and issued.expires_at < datetime.now(timezone.utc):
        config_download_total.labels(endpoint="qr", status="expired").inc()
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="Token expired",
        )
    await _require_peer_applied(issued, db, "qr")
    if not issued.config_encrypted:
        config_download_total.labels(endpoint="qr", status="not_found").inc()
        raise not_found_404("Config", None)
    try:
        qr_payload = decrypt_config(issued.config_encrypted)
    except Exception as e:
        config_download_total.labels(endpoint="qr", status="decrypt_error").inc()
        _log.warning(
            "Config decryption failed on qr issued=%s: %s",
            issued.id,
            type(e).__name__,
            exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "DECRYPT_FAILED",
                "message": "Config was encrypted with a different key (e.g. after SECRET_KEY rotation). Reissue this device's config in Admin and use the new download link.",
            },
        )
    config_download_total.labels(endpoint="qr", status="success").inc()
    return {"qr_payload": qr_payload}
