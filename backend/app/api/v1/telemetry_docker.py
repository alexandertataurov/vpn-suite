"""Docker telemetry API (hosts, containers, metrics, logs, alerts)."""

from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response, status
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.constants import (
    PERM_CLUSTER_WRITE,
    PERM_TELEMETRY_LOGS_READ,
    PERM_TELEMETRY_READ,
)
from app.core.database import get_db
from app.core.error_responses import not_found_404
from app.core.rbac import require_permission
from app.schemas.docker_telemetry import (
    AlertItemListOut,
    ContainerLogLineListOut,
    ContainerMetricsTimeseries,
    ContainerSummaryListOut,
    HostSummaryListOut,
)

router = APIRouter(prefix="/telemetry/docker", tags=["telemetry-docker"])


def _parse_since(value: str | None) -> datetime | None:
    if not value:
        return None
    raw = value.strip()
    if not raw:
        return None
    try:
        if raw.isdigit():
            return datetime.fromtimestamp(int(raw), tz=timezone.utc)
        if raw.endswith("Z"):
            raw = raw[:-1] + "+00:00"
        dt = datetime.fromisoformat(raw)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.astimezone(timezone.utc)
    except ValueError:
        return None


@router.get("/hosts", response_model=HostSummaryListOut)
async def docker_hosts(
    request: Request,
    _admin=Depends(require_permission(PERM_TELEMETRY_READ)),
):
    service = getattr(request.app.state, "docker_telemetry_service", None)
    if service is None:
        return HostSummaryListOut(items=[], total=0)
    try:
        items = await service.list_hosts()
        return HostSummaryListOut(items=items, total=len(items))
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"docker telemetry hosts failed: {exc}",
        ) from exc


@router.get("/containers", response_model=ContainerSummaryListOut)
async def docker_containers(
    request: Request,
    host_id: str = Query("local"),
    _admin=Depends(require_permission(PERM_TELEMETRY_READ)),
):
    service = getattr(request.app.state, "docker_telemetry_service", None)
    if service is None:
        return ContainerSummaryListOut(items=[], total=0)
    try:
        items = await service.list_containers(host_id)
        return ContainerSummaryListOut(items=items, total=len(items))
    except KeyError:
        raise not_found_404("host", host_id) from None
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"docker telemetry containers failed: {exc}",
        ) from exc


@router.get("/container/{container_id}/metrics", response_model=ContainerMetricsTimeseries)
async def docker_container_metrics(
    request: Request,
    container_id: str,
    host_id: str = Query("local"),
    range: str | None = Query(default="1h"),
    step: str | None = Query(default="15s"),
    _admin=Depends(require_permission(PERM_TELEMETRY_READ)),
):
    service = getattr(request.app.state, "docker_telemetry_service", None)
    if service is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="docker telemetry service unavailable",
        )
    try:
        return await service.get_container_metrics(
            host_id,
            container_id,
            range_raw=range,
            step_raw=step,
        )
    except KeyError:
        raise not_found_404("host", host_id) from None
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"docker telemetry metrics failed: {exc}",
        ) from exc


@router.get("/container/{container_id}/logs", response_model=ContainerLogLineListOut)
async def docker_container_logs(
    request: Request,
    container_id: str,
    host_id: str = Query("local"),
    tail: int = Query(default=200, ge=1, le=2000),
    since: str | None = Query(default=None),
    _admin=Depends(require_permission(PERM_TELEMETRY_LOGS_READ)),
):
    parsed_since = _parse_since(since)
    if since and parsed_since is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="invalid since")
    service = request.app.state.docker_telemetry_service
    try:
        items = await service.get_container_logs(
            host_id,
            container_id,
            tail=tail,
            since=parsed_since,
        )
    except KeyError:
        raise not_found_404("host", host_id) from None
    except Exception as exc:
        msg = str(exc)
        if "does not support reading" in msg.lower():
            raise HTTPException(
                status_code=status.HTTP_501_NOT_IMPLEMENTED,
                detail="container logs unavailable: logging driver does not support reading",
            ) from exc
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"docker telemetry logs failed: {msg}",
        ) from exc
    return ContainerLogLineListOut(items=items, total=len(items))


@router.post(
    "/container/{container_id}/start",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def docker_container_start(
    request: Request,
    container_id: str,
    host_id: str = Query("local"),
    _admin=Depends(require_permission(PERM_CLUSTER_WRITE)),
) -> Response:
    service = getattr(request.app.state, "docker_telemetry_service", None)
    if service is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="docker telemetry service unavailable",
        )
    try:
        await service.start_container(host_id, container_id)
    except KeyError:
        raise not_found_404("host", host_id) from None
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"docker telemetry start failed: {exc}",
        ) from exc
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post(
    "/container/{container_id}/stop",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def docker_container_stop(
    request: Request,
    container_id: str,
    host_id: str = Query("local"),
    _admin=Depends(require_permission(PERM_CLUSTER_WRITE)),
) -> Response:
    service = getattr(request.app.state, "docker_telemetry_service", None)
    if service is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="docker telemetry service unavailable",
        )
    try:
        await service.stop_container(host_id, container_id)
    except KeyError:
        raise not_found_404("host", host_id) from None
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"docker telemetry stop failed: {exc}",
        ) from exc
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post(
    "/container/{container_id}/restart",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def docker_container_restart(
    request: Request,
    container_id: str,
    host_id: str = Query("local"),
    _admin=Depends(require_permission(PERM_CLUSTER_WRITE)),
) -> Response:
    service = getattr(request.app.state, "docker_telemetry_service", None)
    if service is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="docker telemetry service unavailable",
        )
    try:
        await service.restart_container(host_id, container_id)
    except KeyError:
        raise not_found_404("host", host_id) from None
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"docker telemetry restart failed: {exc}",
        ) from exc
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/alerts", response_model=AlertItemListOut)
async def docker_alerts(
    request: Request,
    db: AsyncSession = Depends(get_db),
    host_id: str | None = Query(default=None),
    _admin=Depends(require_permission(PERM_TELEMETRY_READ)),
):
    service = getattr(request.app.state, "docker_telemetry_service", None)
    if service is None:
        return AlertItemListOut(items=[], total=0)
    try:
        items = await service.list_alerts(host_id, db=db)
        return AlertItemListOut(items=items, total=len(items))
    except SQLAlchemyError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="docker alerts storage unavailable or schema not migrated",
        ) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"docker telemetry alerts failed: {exc}",
        ) from exc
