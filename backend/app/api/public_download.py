from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.rate_limit import rate_limit_config_download
from app.core.security import decrypt_config
from app.core.one_time_download import verify_and_consume_one_time_token
from app.core.amnezia_vpn_key import sanitize_awg_conf
from app.models import Device, IssuedConfig


router = APIRouter(tags=["public-download"])


@router.get("/d/{token}")
async def download_awg_config_via_token(
    request: Request,
    token: str,
    db: AsyncSession = Depends(get_db),
):
    """Public endpoint: single-use AWG config download by opaque token."""
    await rate_limit_config_download(request, token)

    payload = await verify_and_consume_one_time_token(db, token=token)
    if not payload or payload.get("kind") != "awg_conf":
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail={"code": "TOKEN_INVALID_OR_EXPIRED", "message": "Download link invalid or expired."},
        )

    device_id = payload["device_id"]
    dev_result = await db.execute(select(Device).where(Device.id == device_id))
    device = dev_result.scalar_one_or_none()
    if not device or device.revoked_at is not None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Device not found")

    cfg_result = await db.execute(
        select(IssuedConfig)
        .where(IssuedConfig.device_id == device_id, IssuedConfig.profile_type == "awg")
        .order_by(IssuedConfig.created_at.desc())
        .limit(1)
    )
    issued = cfg_result.scalar_one_or_none()
    if not issued or not issued.config_encrypted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Config not found. It may have been rotated or revoked.",
        )
    try:
        config_text = decrypt_config(issued.config_encrypted)
        config_text = sanitize_awg_conf(config_text)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to decrypt or sanitize config.",
        )

    short_id = device_id[:8]
    filename = f"amneziawg_{short_id}.conf"

    headers = {
        "Content-Type": "application/x-wireguard-profile; charset=utf-8",
        "Content-Disposition": f'attachment; filename="{filename}"',
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "Pragma": "no-cache",
        "Referrer-Policy": "no-referrer",
    }
    return Response(content=config_text, media_type=headers["Content-Type"], headers=headers)
