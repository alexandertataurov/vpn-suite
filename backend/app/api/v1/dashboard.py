"""Operator dashboard API."""

from fastapi import APIRouter, Depends, Query

from app.core.constants import PERM_CLUSTER_READ
from app.core.rbac import require_permission
from app.services.operator_dashboard_service import fetch_operator_dashboard

router = APIRouter(tags=["dashboard"])


@router.get("/dashboard/operator")
async def get_operator_dashboard(
    time_range: str = Query("1h", pattern="^(5m|15m|1h|6h|24h)$"),
    _admin=Depends(require_permission(PERM_CLUSTER_READ)),
):
    """Aggregated operator console data: health strip, cluster matrix, incidents, servers, timeseries."""
    return await fetch_operator_dashboard(time_range=time_range)
