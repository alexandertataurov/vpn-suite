"""Admin cohort analytics: retention by month, LTV by plan, export CSV."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Query
from fastapi.responses import PlainTextResponse, StreamingResponse
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.constants import PERM_CLUSTER_READ
from app.core.database import get_db
from app.core.rbac import require_permission
from app.models import Subscription, User

router = APIRouter(prefix="/admin/cohorts", tags=["admin-cohorts"])


class CohortRetentionOut(BaseModel):
    cohort_month: str
    signups: int
    retained_30d: int
    retention_pct: float


async def _cohort_retention_data(db: AsyncSession, months: int) -> list[CohortRetentionOut]:
    now = datetime.now(timezone.utc)
    items: list[CohortRetentionOut] = []
    for i in range(months):
        start = (now.replace(day=1) - timedelta(days=30 * i)).replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        end = start + timedelta(days=31)
        cohort_month = start.strftime("%Y-%m")
        signups = (
            await db.execute(
                select(func.count())
                .select_from(User)
                .where(
                    User.created_at >= start,
                    User.created_at < end,
                )
            )
        ).scalar() or 0
        retained = (
            await db.execute(
                select(func.count(func.distinct(Subscription.user_id)))
                .select_from(Subscription)
                .join(User, User.id == Subscription.user_id)
                .where(
                    User.created_at >= start,
                    User.created_at < end,
                    Subscription.status == "active",
                    Subscription.valid_until > now,
                )
            )
        ).scalar() or 0
        retention_pct = round(100.0 * retained / signups, 2) if signups else 0.0
        items.append(
            CohortRetentionOut(
                cohort_month=cohort_month,
                signups=signups,
                retained_30d=retained,
                retention_pct=retention_pct,
            )
        )
    return items


class CohortListOut(BaseModel):
    items: list[CohortRetentionOut]


@router.get("/retention", response_model=CohortListOut)
async def get_cohort_retention(
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_permission(PERM_CLUSTER_READ)),
    months: int = Query(6, ge=1, le=24),
):
    """Cohort retention: signups per month, retained (active sub) after 30d."""
    items = await _cohort_retention_data(db, months)
    return CohortListOut(items=items)


@router.get("/export/csv")
async def export_cohorts_csv(
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_permission(PERM_CLUSTER_READ)),
):
    """Export cohort retention as CSV."""
    items = await _cohort_retention_data(db, 12)
    import io

    buf = io.StringIO()
    buf.write("cohort_month,signups,retained_30d,retention_pct\n")
    for row in items:
        buf.write(f"{row.cohort_month},{row.signups},{row.retained_30d},{row.retention_pct}\n")
    buf.seek(0)
    return StreamingResponse(
        iter([buf.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=cohort_retention.csv"},
    )


@router.get("/export/prometheus", response_class=PlainTextResponse)
async def export_cohorts_prometheus(
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_permission(PERM_CLUSTER_READ)),
    months: int = Query(12, ge=1, le=24),
):
    """Export cohort retention in Prometheus exposition format for Grafana scraping."""
    items = await _cohort_retention_data(db, months)
    lines = [
        "# TYPE cohort_retention_signups gauge",
        "# TYPE cohort_retention_retained gauge",
        "# TYPE cohort_retention_pct gauge",
    ]
    for row in items:
        lines.append(f'cohort_retention_signups{{cohort="{row.cohort_month}"}} {row.signups}')
        lines.append(f'cohort_retention_retained{{cohort="{row.cohort_month}"}} {row.retained_30d}')
        lines.append(f'cohort_retention_pct{{cohort="{row.cohort_month}"}} {row.retention_pct}')
    return "\n".join(lines) + "\n"
