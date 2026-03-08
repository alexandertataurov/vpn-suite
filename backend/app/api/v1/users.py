"""Users API: search, get, update (ban with confirm), devices list and issue."""

import logging

from fastapi import APIRouter, Body, Depends, Header, HTTPException, Query, Request, status
from sqlalchemy import delete, func, or_, select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.v1.device_cache import invalidate_devices_list_cache, invalidate_devices_summary_cache
from app.core.bot_auth import get_admin_or_bot
from app.core.config import settings
from app.core.constants import (
    ISSUE_DAILY_TTL_SECONDS,
    PERM_USERS_READ,
    PERM_USERS_WRITE,
    REDIS_KEY_IDEMPOTENCY_ISSUE_PREFIX,
    REDIS_KEY_ISSUE_DAILY_PREFIX,
    REDIS_KEY_RATELIMIT_ISSUE_PREFIX,
)
from app.core.database import get_db
from app.core.error_responses import not_found_404
from app.core.exception_handling import raise_http_for_control_plane_exception
from app.core.exceptions import LoadBalancerError, WireGuardCommandError
from app.core.metrics import vpn_config_regen_cap_hits_total
from app.core.rbac import require_permission
from app.core.redis_client import get_redis
from app.models import (
    AbuseSignal,
    ChurnRiskScore,
    ChurnSurvey,
    Device,
    FunnelEvent,
    IssuedConfig,
    Payment,
    PaymentEvent,
    PortAllocation,
    ProfileIssue,
    PromoRedemption,
    Referral,
    Server,
    Subscription,
    User,
)
from app.schemas.base import PaginationParams
from app.schemas.device import DeviceListItemOut, IssueRequest, IssueResponse, UserDeviceList
from app.schemas.subscription import SubscriptionOut
from app.schemas.user import UserCreate, UserDetail, UserDeleteBody, UserList, UserOut, UserUpdate
from app.services.funnel_service import log_funnel_event
from app.services.issue_service import issue_device
from app.services.issued_config_service import persist_issued_configs
from app.services.server_live_key_service import ServerNotSyncedError
from app.services.topology_engine import TopologyEngine

router = APIRouter(prefix="/users", tags=["users"])
logger = logging.getLogger(__name__)

BAN_CONFIRM = settings.ban_confirm_token
DELETE_USER_CONFIRM = settings.delete_user_confirm_token
IDEMPOTENCY_TTL = settings.idempotency_ttl_seconds


@router.post("", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def create_user(
    request: Request,
    body: UserCreate,
    db: AsyncSession = Depends(get_db),
    admin=Depends(require_permission(PERM_USERS_WRITE)),
):
    result = await db.execute(select(User).where(User.tg_id == body.tg_id))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="tg_id already exists")
    user = User(tg_id=body.tg_id, email=body.email, phone=body.phone, meta=body.meta)
    db.add(user)
    await db.flush()
    await log_funnel_event(db, event_type="start", user_id=user.id, payload={"tg_id": user.tg_id})
    request.state.audit_resource_type = "user"
    request.state.audit_resource_id = str(user.id)
    request.state.audit_old_new = {"created": {"tg_id": user.tg_id}}
    await db.commit()
    await db.refresh(user)
    return user


@router.get("", response_model=UserList)
async def list_users(
    db: AsyncSession = Depends(get_db),
    pagination: PaginationParams = Depends(),
    _admin=Depends(require_permission(PERM_USERS_READ)),
    tg_id: int | None = Query(None),
    email: str | None = Query(None),
    phone: str | None = Query(None),
    is_banned: bool | None = Query(None),
    plan_id: str | None = Query(None),
    region: str | None = Query(None),
):
    stmt = select(User)
    count_stmt = select(func.count()).select_from(User)
    if plan_id is not None:
        stmt = stmt.join(User.subscriptions).where(Subscription.plan_id == plan_id).distinct()
        count_stmt = (
            select(func.count(func.distinct(User.id)))
            .select_from(User)
            .join(User.subscriptions)
            .where(Subscription.plan_id == plan_id)
        )
    if is_banned is not None:
        stmt = stmt.where(User.is_banned.is_(is_banned))
        count_stmt = count_stmt.where(User.is_banned.is_(is_banned))
    if tg_id is not None:
        stmt = stmt.where(User.tg_id == tg_id)
        count_stmt = count_stmt.where(User.tg_id == tg_id)
    if email is not None:
        stmt = stmt.where(User.email.ilike(f"%{email}%"))
        count_stmt = count_stmt.where(User.email.ilike(f"%{email}%"))
    if phone is not None:
        stmt = stmt.where(User.phone.ilike(f"%{phone}%"))
        count_stmt = count_stmt.where(User.phone.ilike(f"%{phone}%"))
    if region is not None:
        stmt = stmt.join(User.devices).join(Device.server).where(Server.region == region).distinct()
        count_stmt = (
            select(func.count(func.distinct(User.id)))
            .select_from(User)
            .join(User.devices)
            .join(Device.server)
            .where(Server.region == region)
        )
        if is_banned is not None:
            count_stmt = count_stmt.where(User.is_banned.is_(is_banned))
        if tg_id is not None:
            count_stmt = count_stmt.where(User.tg_id == tg_id)
        if email is not None:
            count_stmt = count_stmt.where(User.email.ilike(f"%{email}%"))
        if phone is not None:
            count_stmt = count_stmt.where(User.phone.ilike(f"%{phone}%"))
        if plan_id is not None:
            count_stmt = count_stmt.join(User.subscriptions).where(Subscription.plan_id == plan_id)
    total = (await db.execute(count_stmt)).scalar() or 0
    limit, offset = pagination.limit, pagination.offset
    result = await db.execute(stmt.order_by(User.id.desc()).limit(limit).offset(offset))
    rows = result.scalars().all()
    return UserList(items=[UserOut.model_validate(r) for r in rows], total=total, limit=limit, offset=offset)


@router.get("/by-tg/{tg_id}", response_model=UserDetail)
async def get_user_by_tg_id(
    tg_id: int,
    db: AsyncSession = Depends(get_db),
    _principal=Depends(get_admin_or_bot),
):
    """Resolve user by Telegram id. Allowed for bot (X-API-Key) or admin (JWT)."""
    result = await db.execute(
        select(User).where(User.tg_id == tg_id).options(selectinload(User.subscriptions))
    )
    user = result.scalar_one_or_none()
    if not user:
        raise not_found_404("User", tg_id)
    subs = [SubscriptionOut.model_validate(s) for s in user.subscriptions]
    return UserDetail(
        **UserOut.model_validate(user).model_dump(),
        subscriptions=subs,
    )


@router.get("/{user_id}", response_model=UserDetail)
async def get_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_permission(PERM_USERS_READ)),
):
    result = await db.execute(
        select(User).where(User.id == user_id).options(selectinload(User.subscriptions))
    )
    user = result.scalar_one_or_none()
    if not user:
        raise not_found_404("User", user_id)
    subs = [SubscriptionOut.model_validate(s) for s in user.subscriptions]
    return UserDetail(
        **UserOut.model_validate(user).model_dump(),
        subscriptions=subs,
    )


async def _delete_user_cascade(db: AsyncSession, user_id: int) -> None:
    """Delete user and all dependent rows in FK-safe order (no reliance on DB CASCADE)."""
    device_ids = select(Device.id).where(Device.user_id == user_id)
    # Devices' children first
    await db.execute(delete(IssuedConfig).where(IssuedConfig.device_id.in_(device_ids)))
    await db.execute(delete(ProfileIssue).where(ProfileIssue.device_id.in_(device_ids)))
    await db.execute(
        update(PortAllocation)
        .where(PortAllocation.device_id.in_(device_ids))
        .values(device_id=None)
    )
    await db.execute(delete(Device).where(Device.user_id == user_id))
    await db.flush()
    # Payments (PaymentEvent references Payment)
    await db.execute(
        delete(PaymentEvent).where(
            PaymentEvent.payment_id.in_(select(Payment.id).where(Payment.user_id == user_id))
        )
    )
    await db.execute(delete(Payment).where(Payment.user_id == user_id))
    await db.flush()
    await db.execute(delete(PromoRedemption).where(PromoRedemption.user_id == user_id))
    await db.execute(
        delete(Referral).where(
            or_(Referral.referrer_user_id == user_id, Referral.referee_user_id == user_id)
        )
    )
    await db.execute(delete(ChurnRiskScore).where(ChurnRiskScore.user_id == user_id))
    await db.execute(delete(ChurnSurvey).where(ChurnSurvey.user_id == user_id))
    await db.execute(delete(AbuseSignal).where(AbuseSignal.user_id == user_id))
    await db.execute(update(FunnelEvent).where(FunnelEvent.user_id == user_id).values(user_id=None))
    await db.flush()
    await db.execute(delete(Subscription).where(Subscription.user_id == user_id))
    await db.flush()
    await db.execute(delete(User).where(User.id == user_id))


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    request: Request,
    user_id: int,
    body: UserDeleteBody = Body(...),
    db: AsyncSession = Depends(get_db),
    admin=Depends(require_permission(PERM_USERS_WRITE)),
):
    if body.confirm_token != DELETE_USER_CONFIRM:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Delete requires valid confirm_token in body",
        )
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise not_found_404("User", user_id)
    request.state.audit_resource_type = "user"
    request.state.audit_resource_id = str(user.id)
    request.state.audit_old_new = {"delete": {"user_id": user.id, "tg_id": user.tg_id}}
    if hasattr(admin, "id"):
        request.state.audit_admin_id = str(admin.id)
    try:
        await _delete_user_cascade(db, user_id)
        await db.commit()
        await invalidate_devices_summary_cache()
        await invalidate_devices_list_cache()
    except IntegrityError as e:
        await db.rollback()
        err_msg = str(e.orig) if e.orig else str(e)
        logger.warning("delete_user integrity error user_id=%s: %s", user_id, err_msg)
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "code": "DELETE_USER_CONSTRAINT",
                "message": "User has related data that could not be removed.",
                "detail": err_msg,
            },
        ) from e
    except Exception as e:
        await db.rollback()
        logger.exception("delete_user failed user_id=%s: %s", user_id, e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"code": "DELETE_USER_FAILED", "message": str(e)},
        ) from e
    return None


@router.patch("/{user_id}", response_model=UserOut)
async def update_user(
    request: Request,
    user_id: int,
    body: UserUpdate,
    db: AsyncSession = Depends(get_db),
    admin=Depends(require_permission(PERM_USERS_WRITE)),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise not_found_404("User", user_id)
    if body.is_banned is True and body.confirm_token != BAN_CONFIRM:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ban requires confirm_token in body",
        )
    old_snapshot = {"email": user.email, "phone": user.phone, "is_banned": user.is_banned}
    data = body.model_dump(exclude_unset=True, exclude={"confirm_token"})
    for k, v in data.items():
        setattr(user, k, v)
    await db.flush()
    request.state.audit_resource_type = "user"
    request.state.audit_resource_id = str(user.id)
    request.state.audit_old_new = {"old": old_snapshot, "new": {**old_snapshot, **data}}
    await db.commit()
    await db.refresh(user)
    return user


@router.get("/{user_id}/devices", response_model=UserDeviceList)
async def list_user_devices(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    _principal=Depends(get_admin_or_bot),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    """List user devices. Allowed for bot (X-API-Key) or admin (JWT). Uses DeviceListItemOut to avoid loading issued_configs."""
    result = await db.execute(select(User).where(User.id == user_id))
    if result.scalar_one_or_none() is None:
        raise not_found_404("User", user_id)
    count_stmt = select(func.count()).select_from(Device).where(Device.user_id == user_id)
    total = (await db.execute(count_stmt)).scalar() or 0
    result = await db.execute(
        select(Device)
        .where(Device.user_id == user_id)
        .order_by(Device.issued_at.desc())
        .limit(limit)
        .offset(offset)
    )
    rows = result.scalars().all()
    return UserDeviceList(items=[DeviceListItemOut.model_validate(r) for r in rows], total=total)


@router.post(
    "/{user_id}/devices/issue", response_model=IssueResponse, status_code=status.HTTP_201_CREATED
)
async def issue_user_device(
    request: Request,
    user_id: int,
    body: IssueRequest,
    db: AsyncSession = Depends(get_db),
    principal=Depends(get_admin_or_bot),
    idempotency_key: str | None = Header(None, alias="Idempotency-Key"),
):
    request.state.audit_admin_id = str(principal.id) if hasattr(principal, "id") else "bot"
    request.state.audit_action = f"{request.method} {request.url.path}"
    if settings.issue_rate_limit_per_minute > 0:
        try:
            r = get_redis()
            key = f"{REDIS_KEY_RATELIMIT_ISSUE_PREFIX}{user_id}"
            n = await r.incr(key)
            if n == 1:
                await r.expire(key, settings.issue_rate_window_seconds)
            if n > settings.issue_rate_limit_per_minute:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail={
                        "code": "RATE_LIMIT_EXCEEDED",
                        "message": "Too many device issue requests. Try again later.",
                    },
                )
        except HTTPException:
            raise
        except Exception:
            logger.debug("Issue device rate limit check failed", exc_info=True)
    if getattr(settings, "config_regen_daily_cap", 0) > 0:
        try:
            r = get_redis()
            daily_key = f"{REDIS_KEY_ISSUE_DAILY_PREFIX}{user_id}"
            n = await r.get(daily_key)
            n = int(n) if n else 0
            if n >= settings.config_regen_daily_cap:
                vpn_config_regen_cap_hits_total.inc()
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail={
                        "code": "DAILY_ISSUE_CAP_EXCEEDED",
                        "message": "Daily config limit reached. Try again tomorrow or contact support.",
                    },
                )
        except HTTPException:
            raise
        except Exception:
            logger.debug("Issue daily cap check failed", exc_info=True)
    if idempotency_key:
        try:
            r = get_redis()
            cached = await r.get(f"{REDIS_KEY_IDEMPOTENCY_ISSUE_PREFIX}{idempotency_key}")
            if cached:
                device_id = cached.decode() if isinstance(cached, bytes) else cached
                result = await db.execute(
                    select(Device).where(Device.id == device_id, Device.user_id == user_id)
                )
                dev = result.scalar_one_or_none()
                if dev:
                    return IssueResponse(
                        device_id=dev.id,
                        issued_at=dev.issued_at,
                        config=None,
                        config_awg=None,
                        config_wg_obf=None,
                        config_wg=None,
                        server_id=dev.server_id,
                        subscription_id=dev.subscription_id,
                        node_mode=settings.node_mode,
                        peer_created=False,
                    )
        except Exception:
            logger.debug("Issue device idempotency cache get failed", exc_info=True)
    get_topology = None
    if body.server_id is None:
        adapter = request.app.state.node_runtime_adapter
        engine = TopologyEngine(adapter)
        get_topology = engine.get_topology
    try:
        runtime_adapter = request.app.state.node_runtime_adapter
        out = await issue_device(
            db,
            user_id=user_id,
            subscription_id=body.subscription_id,
            server_id=body.server_id,
            device_name=body.device_name,
            get_topology=get_topology,
            runtime_adapter=runtime_adapter,
        )
    except ServerNotSyncedError as e:
        from app.core.metrics import config_issue_blocked_total, discovery_not_found_total

        config_issue_blocked_total.labels(reason="server_not_synced").inc()
        if e.server_id and "not found" in (e.reason or "").lower():
            discovery_not_found_total.labels(server_id=e.server_id).inc()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "code": "SERVER_NOT_SYNCED",
                "message": "Server key not verified; run sync or fix discovery.",
                "details": {"server_id": e.server_id, "reason": e.reason},
            },
        ) from e
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e).replace("_", " "),
        )
    except (LoadBalancerError, WireGuardCommandError) as e:
        raise_http_for_control_plane_exception(e)
    await persist_issued_configs(
        db,
        device_id=out.device.id,
        server_id=out.device.server_id,
        config_awg=out.config_awg,
        config_wg_obf=out.config_wg_obf,
        config_wg=out.config_wg,
    )
    await db.commit()
    await invalidate_devices_summary_cache()
    await invalidate_devices_list_cache()
    await db.refresh(out.device)
    if idempotency_key:
        try:
            await get_redis().setex(
                f"{REDIS_KEY_IDEMPOTENCY_ISSUE_PREFIX}{idempotency_key}",
                IDEMPOTENCY_TTL,
                out.device.id,
            )
        except Exception:
            logger.debug("Issue device idempotency cache set failed", exc_info=True)
    if getattr(settings, "config_regen_daily_cap", 0) > 0:
        try:
            r = get_redis()
            daily_key = f"{REDIS_KEY_ISSUE_DAILY_PREFIX}{user_id}"
            await r.incr(daily_key)
            await r.expire(daily_key, ISSUE_DAILY_TTL_SECONDS)
        except Exception:
            logger.debug("Issue daily cap increment failed", exc_info=True)
    request.state.audit_resource_type = "device"
    request.state.audit_resource_id = out.device.id
    request.state.audit_old_new = {
        "created": {"user_id": user_id, "subscription_id": body.subscription_id}
    }
    await log_funnel_event(
        db,
        event_type="issue",
        user_id=user_id,
        payload={"device_id": out.device.id, "subscription_id": body.subscription_id},
    )
    return IssueResponse(
        device_id=out.device.id,
        issued_at=out.device.issued_at,
        config=out.config_awg,
        config_awg=out.config_awg,
        config_wg_obf=out.config_wg_obf,
        config_wg=out.config_wg,
        server_id=out.device.server_id,
        subscription_id=out.device.subscription_id,
        node_mode=settings.node_mode,
        peer_created=out.peer_created,
    )
